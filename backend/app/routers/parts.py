from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import require_admin
from ..utils import log_action

router = APIRouter(prefix="/parts", tags=["parts"])


def _to_out(p: models.Part) -> dict:
    return {
        "id": p.id, "nome": p.nome, "categoria": p.categoria, "fabricante": p.fabricante,
        "modelo": p.modelo, "codigo": p.codigo, "quantidade": p.quantidade,
        "estoqueMinimo": p.estoque_minimo, "custoAquisicao": float(p.custo_aquisicao or 0),
        "precoOrcamento": float(p.preco_orcamento or 0), "fornecedor": p.fornecedor,
        "localizacao": p.localizacao, "status": p.status,
        "createdAt": p.created_at, "updatedAt": p.updated_at,
    }


@router.get("", response_model=list[schemas.PartOut])
def list_parts(db: Session = Depends(get_db), user=Depends(require_admin)):
    parts = db.query(models.Part).order_by(models.Part.nome).all()
    return [_to_out(p) for p in parts]


@router.post("", response_model=schemas.PartOut)
def create_part(payload: schemas.PartIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    if not payload.nome.strip() or len(payload.nome) > 150:
        raise HTTPException(400, "Nome obrigatório (máx. 150 caracteres).")
    if payload.quantidade < 0 or payload.estoqueMinimo < 0:
        raise HTTPException(400, "Quantidade e estoque mínimo não podem ser negativos.")
    part = models.Part(
        nome=payload.nome.strip(), categoria=payload.categoria, fabricante=payload.fabricante,
        modelo=payload.modelo, codigo=payload.codigo, quantidade=payload.quantidade,
        estoque_minimo=payload.estoqueMinimo, custo_aquisicao=payload.custoAquisicao,
        preco_orcamento=payload.precoOrcamento, fornecedor=payload.fornecedor,
        localizacao=payload.localizacao, status="ativo",
    )
    db.add(part)
    db.commit()
    db.refresh(part)
    log_action(db, "Peça cadastrada", part.nome, user.name)
    return _to_out(part)


@router.put("/{part_id}", response_model=schemas.PartOut)
def update_part(part_id: str, payload: schemas.PartIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    part = db.query(models.Part).filter(models.Part.id == part_id).first()
    if not part:
        raise HTTPException(404, "Peça não encontrada.")
    part.nome = payload.nome.strip()
    part.categoria = payload.categoria
    part.fabricante = payload.fabricante
    part.modelo = payload.modelo
    part.codigo = payload.codigo
    part.estoque_minimo = payload.estoqueMinimo
    part.custo_aquisicao = payload.custoAquisicao
    part.preco_orcamento = payload.precoOrcamento
    part.fornecedor = payload.fornecedor
    part.localizacao = payload.localizacao
    db.commit()
    db.refresh(part)
    return _to_out(part)


@router.post("/{part_id}/movimentar", response_model=schemas.PartOut)
def movimentar(part_id: str, payload: schemas.StockMoveIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    part = db.query(models.Part).filter(models.Part.id == part_id).first()
    if not part:
        raise HTTPException(404, "Peça não encontrada.")
    if payload.quantidade < 1:
        raise HTTPException(400, "Informe uma quantidade válida.")
    if payload.tipo not in ("entrada", "saida"):
        raise HTTPException(400, "Tipo de movimentação inválido.")
    if payload.tipo == "saida" and part.quantidade < payload.quantidade:
        raise HTTPException(400, "Estoque insuficiente para realizar esta operação.")

    delta = payload.quantidade if payload.tipo == "entrada" else -payload.quantidade
    part.quantidade = max(0, part.quantidade + delta)
    db.add(models.StockMovement(
        peca_id=part.id, tipo=payload.tipo, quantidade=payload.quantidade, usuario=user.name,
        motivo=payload.motivo or ("Entrada manual" if payload.tipo == "entrada" else "Ajuste manual"),
    ))
    log_action(db, "Movimentação de estoque", f"{part.nome} — {payload.tipo} de {payload.quantidade}", user.name)
    db.commit()
    db.refresh(part)
    return _to_out(part)


@router.get("/{part_id}/movimentacoes")
def list_movimentacoes(part_id: str, db: Session = Depends(get_db), user=Depends(require_admin)):
    movs = (
        db.query(models.StockMovement)
        .filter(models.StockMovement.peca_id == part_id)
        .order_by(models.StockMovement.data.desc())
        .limit(20)
        .all()
    )
    return [
        {"id": m.id, "tipo": m.tipo, "quantidade": m.quantidade, "data": m.data,
         "usuario": m.usuario, "motivo": m.motivo, "ordemId": m.ordem_id}
        for m in movs
    ]
