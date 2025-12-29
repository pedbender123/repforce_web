from fastapi import APIRouter, Depends, Request
from sqlalchemy.orm import Session
from ..db import session, models, schemas

router = APIRouter()

@router.post("", status_code=201)
def create_visit_route(
    route_in: schemas.VisitRouteCreate,
    request: Request,
    db: Session = Depends(session.get_db)
):
    tenant_id = request.state.tenant_id
    user_id = request.state.user_id

    db_route = models.VisitRoute(
        name=route_in.name,
        date=route_in.date,
        stops=[stop.dict() for stop in route_in.stops], # Salva como JSON
        tenant_id=tenant_id,
        user_id=user_id
    )
    
    db.add(db_route)
    db.commit()
    db.refresh(db_route)
    
    return db_route