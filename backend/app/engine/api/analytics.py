from fastapi import APIRouter, Depends, HTTPException, Body, Request
from sqlalchemy.orm import Session
from sqlalchemy import func, cast, String, Integer, Float, text
from app.shared import database
from app.engine.metadata import models as meta_models
from app.engine.metadata import data_models
from typing import List, Dict, Any, Optional
from pydantic import BaseModel

router = APIRouter()

class AggregateRequest(BaseModel):
    metric: str = "count" # count, sum, avg, min, max
    field: Optional[str] = None # Field to apply metric on (e.g. amount). Ignored for count (uses id) unless distinct.
    group_by: Optional[str] = None # Field to group by (e.g. status)
    filters: Optional[Dict[str, Any]] = None # Simple filters { status: "open" }

@router.post("/aggregate/{entity_slug}")
def aggregate_data(
    entity_slug: str,
    payload: AggregateRequest,
    request: Request,
    db: Session = Depends(database.get_db)
):
    tenant_id = request.state.tenant_id
    
    # 1. Lookup Entity
    entity = db.query(meta_models.MetaEntity).filter(
        meta_models.MetaEntity.slug == entity_slug,
        meta_models.MetaEntity.tenant_id == tenant_id
    ).first()
    
    if not entity:
        raise HTTPException(status_code=404, detail=f"Entity '{entity_slug}' not found.")

    # 2. Base Query
    query = db.query(data_models.EntityRecord).filter(
        data_models.EntityRecord.entity_id == entity.id,
        data_models.EntityRecord.tenant_id == tenant_id
    )

    # 3. Apply Filters
    if payload.filters:
        for key, value in payload.filters.items():
            if value is not None:
                # Basic exact match on JSON field
                query = query.filter(data_models.EntityRecord.data[key].astext == str(value))

    # 4. Aggregation Logic
    if payload.group_by:
        # Group By Logic
        # Grouping by a JSON field
        group_col = data_models.EntityRecord.data[payload.group_by].astext
        
        if payload.metric == 'count':
            # Count records per group
            stmt = db.query(group_col.label('label'), func.count().label('value')) \
                .filter(
                    data_models.EntityRecord.entity_id == entity.id,
                    data_models.EntityRecord.tenant_id == tenant_id
                )
            
            # Apply filters to statement
            if payload.filters:
                for key, value in payload.filters.items():
                    stmt = stmt.filter(data_models.EntityRecord.data[key].astext == str(value))

            results = stmt.group_by(group_col).all()
            
        elif payload.metric in ['sum', 'avg', 'min', 'max'] and payload.field:
            # Aggregate numeric field per group
            # Need to cast JSON value to number
            val_col = cast(data_models.EntityRecord.data[payload.field].astext, Float)
             
            if payload.metric == 'sum':
                agg_func = func.sum(val_col)
            elif payload.metric == 'avg':
                agg_func = func.avg(val_col)
            elif payload.metric == 'min':
                agg_func = func.min(val_col)
            elif payload.metric == 'max':
                agg_func = func.max(val_col)
            
            stmt = db.query(group_col.label('label'), agg_func.label('value')) \
                .filter(
                    data_models.EntityRecord.entity_id == entity.id,
                    data_models.EntityRecord.tenant_id == tenant_id
                )
            # Apply filters
            if payload.filters:
                for key, value in payload.filters.items():
                    stmt = stmt.filter(data_models.EntityRecord.data[key].astext == str(value))
                    
            results = stmt.group_by(group_col).all()
        else:
             raise HTTPException(status_code=400, detail="Invalid metric configuration for grouping.")

        # Format results
        return {
            "labels": [r.label or "N/A" for r in results],
            "values": [r.value for r in results]
        }
        
    else:
        # Single Value Aggregation (Card)
        if payload.metric == 'count':
            val = query.count()
        elif payload.field:
            val_col = cast(data_models.EntityRecord.data[payload.field].astext, Float)
            if payload.metric == 'sum':
                val = query.with_entities(func.sum(val_col)).scalar()
            elif payload.metric == 'avg':
                 val = query.with_entities(func.avg(val_col)).scalar()
            elif payload.metric == 'min':
                 val = query.with_entities(func.min(val_col)).scalar()
            elif payload.metric == 'max':
                 val = query.with_entities(func.max(val_col)).scalar()
            else:
                 val = 0
        else:
            val = query.count() # default
            
        return {"value": val or 0}

