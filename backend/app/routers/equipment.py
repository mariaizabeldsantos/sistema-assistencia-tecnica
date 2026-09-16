from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import require_admin
from ..utils import log_action

router = APIRouter(prefix="/equipment", tags=["equipment"])


def _to_out(e: models.Equipment) -> dict:
    return {
        "id": e.id, "clientId": e.client_id, "tipo": e.tipo, "marca": e.marca,
        "modelo": e.modelo, "numeroSerie": e.numero_serie, "acessorios": e.acessorios,
        "observacoes": e.observacoes, "senha": e.senha,
        "createdAt": e.created_at, "updatedAt": e.updated_at,
    }


@router.get("", response_model=list[schemas.EquipmentOut])
def list_equipment(q: Optional[str] = None, clientId: Optional[str] = None,
                    db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(models.Equipment)
    if clientId:
        query = query.filter(models.Equipment.client_id == clientId)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (models.Equipment.marca.ilike(like)) |
            (models.Equipment.modelo.ilike(like)) |
            (models.Equipment.numero_serie.ilike(like))
        )
    items = query.order_by(models.Equipment.created_at.desc()).all()
    return [_to_out(e) for e in items]


@router.post("", response_model=schemas.EquipmentOut)
def create_equipment(payload: schemas.EquipmentIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    if not db.query(models.Client).filter(models.Client.id == payload.clientId).first():
        raise HTTPException(400, "Selecione o cliente dono do equipamento.")
    if not payload.marca.strip() or len(payload.marca) > 50:
        raise HTTPException(400, "Marca obrigatória (máx. 50 caracteres).")
    if payload.numeroSerie:
        dup = db.query(models.Equipment).filter(
            models.Equipment.numero_serie.ilike(payload.numeroSerie)
        ).first()
        if dup:
            raise HTTPException(400, "Já existe um equipamento com este número de série.")

    eq = models.Equipment(
        client_id=payload.clientId, tipo=payload.tipo, marca=payload.marca.strip(),
        modelo=(payload.modelo or "").strip(), numero_serie=(payload.numeroSerie or "").strip() or None,
        acessorios=payload.acessorios or "", observacoes=payload.observacoes or "",
        senha=payload.senha or "",
    )
    db.add(eq)
    db.commit()
    db.refresh(eq)
    log_action(db, "Equipamento cadastrado", f"{eq.marca} {eq.modelo}")
    return _to_out(eq)


@router.get("/{equipment_id}", response_model=schemas.EquipmentOut)
def get_equipment(equipment_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(404, "Equipamento não encontrado.")
    return _to_out(eq)


@router.put("/{equipment_id}", response_model=schemas.EquipmentOut)
def update_equipment(equipment_id: str, payload: schemas.EquipmentIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    eq = db.query(models.Equipment).filter(models.Equipment.id == equipment_id).first()
    if not eq:
        raise HTTPException(404, "Equipamento não encontrado.")
    if payload.numeroSerie:
        dup = db.query(models.Equipment).filter(
            models.Equipment.numero_serie.ilike(payload.numeroSerie),
            models.Equipment.id != equipment_id,
        ).first()
        if dup:
            raise HTTPException(400, "Já existe um equipamento com este número de série.")
    eq.tipo = payload.tipo
    eq.marca = payload.marca.strip()
    eq.modelo = (payload.modelo or "").strip()
    eq.numero_serie = (payload.numeroSerie or "").strip() or None
    eq.acessorios = payload.acessorios or ""
    eq.observacoes = payload.observacoes or ""
    if payload.senha is not None:
        eq.senha = payload.senha
    db.commit()
    db.refresh(eq)
    log_action(db, "Equipamento atualizado", f"{eq.marca} {eq.modelo}")
    return _to_out(eq)
