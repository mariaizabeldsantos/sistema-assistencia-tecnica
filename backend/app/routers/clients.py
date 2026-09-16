from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import or_

from .. import models, schemas
from ..database import get_db
from ..utils import only_digits, validate_cpf, log_action
from ..security import hash_password, require_admin, get_current_user

router = APIRouter(prefix="/clients", tags=["clients"])


def _to_out(c: models.Client) -> dict:
    return {
        "id": c.id, "nome": c.nome, "cpf": c.cpf, "telefone": c.telefone,
        "whatsapp": c.whatsapp, "email": c.email, "endereco": c.endereco,
        "observacoes": c.observacoes, "status": c.status,
        "createdAt": c.created_at, "updatedAt": c.updated_at,
    }


@router.get("", response_model=list[schemas.ClientOut])
def list_clients(q: Optional[str] = None, db: Session = Depends(get_db), user=Depends(require_admin)):
    query = db.query(models.Client)
    if q:
        qd = only_digits(q)
        conds = [models.Client.nome.ilike(f"%{q}%")]
        if qd:
            conds.append(models.Client.telefone.like(f"%{qd}%"))
            conds.append(models.Client.cpf.like(f"%{qd}%"))
        query = query.filter(or_(*conds))
    clients = query.order_by(models.Client.nome).all()
    return [_to_out(c) for c in clients]


@router.post("", response_model=schemas.ClientOut)
def create_client(payload: schemas.ClientIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    nome = payload.nome.strip()
    if len(nome) < 3 or len(nome) > 150:
        raise HTTPException(400, "Nome deve ter entre 3 e 150 caracteres.")
    cpf = only_digits(payload.cpf or "")
    if cpf and not validate_cpf(cpf):
        raise HTTPException(400, "O CPF informado é inválido.")
    if cpf and db.query(models.Client).filter(models.Client.cpf == cpf).first():
        raise HTTPException(400, "Já existe um cliente cadastrado com este CPF.")
    telefone = only_digits(payload.telefone)
    if len(telefone) not in (10, 11):
        raise HTTPException(400, "Informe um telefone válido.")

    client = models.Client(
        nome=nome, cpf=cpf or None, telefone=telefone,
        whatsapp=only_digits(payload.whatsapp or telefone),
        email=(payload.email or "").strip() or None,
        endereco=payload.endereco or "", observacoes=payload.observacoes or "",
        status="ativo",
    )
    db.add(client)
    db.commit()
    db.refresh(client)
    log_action(db, "Cliente cadastrado", client.nome)
    return _to_out(client)


@router.get("/{client_id}", response_model=schemas.ClientOut)
def get_client(client_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Cliente não encontrado.")
    return _to_out(client)


@router.put("/{client_id}", response_model=schemas.ClientOut)
def update_client(client_id: str, payload: schemas.ClientIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Cliente não encontrado.")
    nome = payload.nome.strip()
    if len(nome) < 3 or len(nome) > 150:
        raise HTTPException(400, "Nome deve ter entre 3 e 150 caracteres.")
    cpf = only_digits(payload.cpf or "")
    if cpf and not validate_cpf(cpf):
        raise HTTPException(400, "O CPF informado é inválido.")
    if cpf:
        dup = db.query(models.Client).filter(models.Client.cpf == cpf, models.Client.id != client_id).first()
        if dup:
            raise HTTPException(400, "Já existe um cliente cadastrado com este CPF.")
    telefone = only_digits(payload.telefone)
    if len(telefone) not in (10, 11):
        raise HTTPException(400, "Informe um telefone válido.")

    client.nome = nome
    client.cpf = cpf or None
    client.telefone = telefone
    client.whatsapp = only_digits(payload.whatsapp or telefone)
    client.email = (payload.email or "").strip() or None
    client.endereco = payload.endereco or ""
    client.observacoes = payload.observacoes or ""
    db.commit()
    db.refresh(client)
    log_action(db, "Cliente atualizado", client.nome)
    return _to_out(client)


@router.post("/{client_id}/acesso")
def criar_acesso(client_id: str, payload: schemas.ClientAccessIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    """Cria (ou atualiza) a conta de acesso à área do cliente."""
    client = db.query(models.Client).filter(models.Client.id == client_id).first()
    if not client:
        raise HTTPException(404, "Cliente não encontrado.")
    if len(payload.senha) < 8 or len(payload.senha) > 64:
        raise HTTPException(400, "A senha deve ter entre 8 e 64 caracteres.")

    existing = db.query(models.User).filter(models.User.client_id == client_id).first()
    email = payload.email.strip().lower()
    dup = db.query(models.User).filter(models.User.email == email, models.User.client_id != client_id).first()
    if dup:
        raise HTTPException(400, "Já existe uma conta com este e-mail.")

    if existing:
        existing.email = email
        existing.password_hash = hash_password(payload.senha)
    else:
        existing = models.User(
            name=client.nome, email=email, password_hash=hash_password(payload.senha),
            role="client", client_id=client_id,
        )
        db.add(existing)
    db.commit()
    log_action(db, "Acesso da área do cliente criado/atualizado", client.nome)
    return {"ok": True}
