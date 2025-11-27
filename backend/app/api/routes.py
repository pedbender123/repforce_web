from fastapi import APIRouter, Depends, Request, HTTPException
from sqlalchemy.orm import Session, joinedload
from ..db import database, models, schemas
from typing import List

router = APIRouter()

@router.post("/routes", response_model=schemas.Route, status_code=201)
def create_route(
    route_data: schemas.RouteCreate,
    request: Request,
    db: Session = Depends(database.get_db)
):
    representative_id = request.state.user_id
    
    db_route = models.Route(
        representative_id=representative_id,
        date=route_data.date,
        name=route_data.name,
        status="planned"
    )
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    
    for stop in route_data.stops:
        db_stop = models.RouteStop(
            route_id=db_route.id,
            client_id=stop.client_id,
            sequence=stop.sequence,
            notes=stop.notes,
            status="pending"
        )
        db.add(db_stop)
    
    db.commit()
    db.refresh(db_route)
    return db_route

@router.get("/routes", response_model=List[schemas.Route])
def get_routes(request: Request, db: Session = Depends(database.get_db)):
    user_id = request.state.user_id
    routes = db.query(models.Route).options(
        joinedload(models.Route.stops).joinedload(models.RouteStop.client)
    ).filter(
        models.Route.representative_id == user_id
    ).order_by(models.Route.date.desc()).all()
    
    return routes