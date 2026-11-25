from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload

from .. import models, schemas
from ..database import get_db
from ..security import require_admin, get_current_user
from ..utils import log_action

router = APIRouter(prefix="/orders", tags=["orders"])

STATUS_FLOW = schemas.STATUS_FLOW
NEXT_STATUS = {
    "ENTRADA": "ORCAMENTO",
    "EM_MANUTENCAO": "PRONTO",
    "PRONTO": "ENTREGUE",
}


def _to_out(o: models.Order) -> dict:
    return {
        "id": o.id, "numero": o.numero, "clientId": o.client_id, "equipmentId": o.equipment_id,
        "problemaRelatado": o.problema_relatado, "acessorios": o.acessorios,
        "estadoFisico": o.estado_fisico, "observacoes": o.observacoes, "prazo": o.prazo,
        "status": o.status, "diagnostico": o.diagnostico, "orcamento": o.orcamento,
        "aprovacao": o.aprovacao, "garantia": o.garantia,
        "dataConclusao": o.data_conclusao, "dataEntrega": o.data_entrega,
        "createdAt": o.created_at, "updatedAt": o.updated_at,
        "statusHistory": [
            {"statusAnterior": h.status_anterior, "statusNovo": h.status_novo,
             "data": h.data.isoformat(), "usuario": h.usuario}
            for h in sorted(o.status_history, key=lambda x: x.data)
        ],
        "partsUsed": [
            {"id": p.id, "pecaId": p.peca_id, "nome": p.nome, "quantidade": p.quantidade,
             "custo": float(p.custo or 0), "data": p.data.isoformat(), "usuario": p.usuario}
            for p in o.parts_used
        ],
    }


def _get_order_or_404(db: Session, order_id: str) -> models.Order:
    order = (
        db.query(models.Order)
        .options(joinedload(models.Order.status_history), joinedload(models.Order.parts_used))
        .filter(models.Order.id == order_id)
        .first()
    )
    if not order:
        raise HTTPException(404, "Ordem de serviço não encontrada.")
    return order


def _check_access(order: models.Order, user: models.User):
    if user.role == "client" and order.client_id != user.client_id:
        raise HTTPException(403, "Você não tem acesso a esta ordem de serviço.")


@router.get("", response_model=list[schemas.OrderOut])
def list_orders(clientId: Optional[str] = None, status: Optional[str] = None,
                 db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    query = db.query(models.Order).options(
        joinedload(models.Order.status_history), joinedload(models.Order.parts_used)
    )
    if user.role == "client":
        query = query.filter(models.Order.client_id == user.client_id)
    elif clientId:
        query = query.filter(models.Order.client_id == clientId)
    if status:
        query = query.filter(models.Order.status == status)
    orders = query.order_by(models.Order.created_at.desc()).all()
    return [_to_out(o) for o in orders]


@router.post("", response_model=schemas.OrderOut)
def create_order(payload: schemas.OrderCreateIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    equip = db.query(models.Equipment).filter(models.Equipment.id == payload.equipmentId).first()
    if not equip:
        raise HTTPException(400, "Selecione o equipamento (ou cadastre um novo).")
    if not payload.problemaRelatado.strip() or len(payload.problemaRelatado.strip()) < 5:
        raise HTTPException(400, "Descreva o problema (mínimo 5 caracteres).")

    settings_row = db.query(models.Setting).filter(models.Setting.id == 1).first()
    numero = settings_row.proximo_numero_os
    settings_row.proximo_numero_os = numero + 1

    order = models.Order(
        numero=numero, client_id=equip.client_id, equipment_id=equip.id,
        problema_relatado=payload.problemaRelatado.strip(), acessorios=payload.acessorios or "",
        estado_fisico=payload.estadoFisico or "", observacoes=payload.observacoes or "",
        prazo=payload.prazo or "", status="ENTRADA",
    )
    db.add(order)
    db.flush()
    db.add(models.OrderStatusHistory(order_id=order.id, status_anterior=None, status_novo="ENTRADA", usuario="Sistema"))
    db.commit()
    order = _get_order_or_404(db, order.id)
    log_action(db, "OS criada", f"OS #{order.numero}", user.name)
    return _to_out(order)


@router.get("/{order_id}", response_model=schemas.OrderOut)
def get_order(order_id: str, db: Session = Depends(get_db), user: models.User = Depends(get_current_user)):
    order = _get_order_or_404(db, order_id)
    _check_access(order, user)
    return _to_out(order)


@router.put("/{order_id}/observacoes", response_model=schemas.OrderOut)
def update_observacoes(order_id: str, body: dict, db: Session = Depends(get_db), user=Depends(require_admin)):
    order = _get_order_or_404(db, order_id)
    order.observacoes = body.get("observacoes", order.observacoes)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))


@router.put("/{order_id}/diagnostico", response_model=schemas.OrderOut)
def salvar_diagnostico(order_id: str, payload: schemas.DiagnosticoIn, avancar: bool = False,
                        db: Session = Depends(get_db), user=Depends(require_admin)):
    order = _get_order_or_404(db, order_id)
    order.diagnostico = payload.model_dump()
    log_action(db, "Diagnóstico registrado", f"OS #{order.numero}", user.name)
    if avancar and order.status == "ENTRADA":
        _apply_status_change(db, order, "ORCAMENTO", user.name)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))


def _calc_orcamento_total(payload: schemas.OrcamentoIn):
    total_pecas = sum(i.quantidade * i.valorUnitario for i in payload.itens)
    total_mo = sum(m.valor for m in payload.maoObra)
    total = max(0, total_pecas + total_mo - (payload.desconto or 0))
    return total_pecas, total_mo, total


@router.put("/{order_id}/orcamento", response_model=schemas.OrderOut)
def salvar_orcamento(order_id: str, payload: schemas.OrcamentoIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    order = _get_order_or_404(db, order_id)
    total_pecas, total_mo, total = _calc_orcamento_total(payload)
    order.orcamento = {
        "itens": [i.model_dump() for i in payload.itens],
        "maoObra": [m.model_dump() for m in payload.maoObra],
        "desconto": payload.desconto,
        "totalPecas": total_pecas, "totalMaoObra": total_mo, "total": total,
    }
    log_action(db, "Orçamento salvo", f"OS #{order.numero}", user.name)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))


@router.post("/{order_id}/orcamento/enviar", response_model=schemas.OrderOut)
def enviar_orcamento(order_id: str, payload: schemas.OrcamentoIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    order = _get_order_or_404(db, order_id)
    if not payload.itens and not payload.maoObra:
        raise HTTPException(400, "Adicione pelo menos um item ao orçamento.")
    total_pecas, total_mo, total = _calc_orcamento_total(payload)
    order.orcamento = {
        "itens": [i.model_dump() for i in payload.itens],
        "maoObra": [m.model_dump() for m in payload.maoObra],
        "desconto": payload.desconto,
        "totalPecas": total_pecas, "totalMaoObra": total_mo, "total": total,
    }
    _apply_status_change(db, order, "AGUARDANDO_APROVACAO", user.name)
    log_action(db, "Orçamento enviado para aprovação", f"OS #{order.numero}", user.name)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))


def _apply_status_change(db: Session, order: models.Order, new_status: str, usuario: str):
    old_status = order.status
    order.status = new_status
    db.add(models.OrderStatusHistory(order_id=order.id, status_anterior=old_status, status_novo=new_status, usuario=usuario))
    if new_status == "PRONTO":
        order.data_conclusao = datetime.utcnow()
    if new_status == "ENTREGUE":
        order.data_entrega = datetime.utcnow()
        settings_row = db.query(models.Setting).filter(models.Setting.id == 1).first()
        dias = settings_row.garantia_padrao_dias if settings_row else 90
        inicio = datetime.utcnow()
        order.garantia = {
            "periodoDias": dias, "dataInicio": inicio.isoformat(),
            "dataFinal": (inicio + timedelta(days=dias)).isoformat(),
            "condicoes": "Garantia padrão sobre o serviço realizado.", "status": "vigente",
        }


@router.post("/{order_id}/status", response_model=schemas.OrderOut)
def change_status(order_id: str, payload: schemas.StatusChangeIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    order = _get_order_or_404(db, order_id)
    new_status = payload.status
    if new_status == "CANCELADO":
        if order.status in ("ENTREGUE", "CANCELADO"):
            raise HTTPException(400, "Esta OS não pode mais ser cancelada.")
    else:
        expected = NEXT_STATUS.get(order.status)
        if new_status != expected and order.status != "AGUARDANDO_APROVACAO":
            raise HTTPException(400, f"Transição de status inválida ({order.status} → {new_status}).")
    _apply_status_change(db, order, new_status, user.name)
    log_action(db, f"Status alterado para {new_status}", f"OS #{order.numero}", user.name)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))


@router.post("/{order_id}/aprovacao", response_model=schemas.OrderOut)
def registrar_aprovacao(order_id: str, payload: schemas.AprovacaoIn, db: Session = Depends(get_db),
                         user: models.User = Depends(get_current_user)):
    order = _get_order_or_404(db, order_id)
    _check_access(order, user)
    if payload.status not in ("aprovado", "recusado"):
        raise HTTPException(400, "Status de aprovação inválido.")
    order.aprovacao = {
        "status": payload.status, "data": datetime.utcnow().isoformat(),
        "usuario": user.name, "observacao": payload.observacao or "",
    }
    if payload.status == "aprovado":
        _apply_status_change(db, order, "EM_MANUTENCAO", user.name)
    log_action(db, f"Orçamento {payload.status}", f"OS #{order.numero}", user.name)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))


@router.post("/{order_id}/pecas", response_model=schemas.OrderOut)
def usar_peca(order_id: str, payload: schemas.UsarPecaIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    order = _get_order_or_404(db, order_id)
    # with_for_update(): trava a linha da peça (SELECT ... FOR UPDATE) até o commit, a mesma
    # trava que o módulo de Estoque em Java usa, evitando baixas simultâneas conflitantes.
    peca = db.query(models.Part).filter(models.Part.id == payload.pecaId).with_for_update().first()
    if not peca:
        raise HTTPException(400, "Selecione uma peça.")
    if payload.quantidade < 1:
        raise HTTPException(400, "Quantidade inválida.")
    if peca.quantidade < payload.quantidade:
        raise HTTPException(400, "Estoque insuficiente para realizar esta operação.")

    peca.quantidade -= payload.quantidade
    db.add(models.StockMovement(
        peca_id=peca.id, tipo="saida", quantidade=payload.quantidade,
        usuario=user.name, motivo="Uso em OS", ordem_id=order.id,
    ))
    db.add(models.OrderPartUsed(
        order_id=order.id, peca_id=peca.id, nome=peca.nome,
        quantidade=payload.quantidade, custo=peca.custo_aquisicao, usuario=user.name,
    ))
    log_action(db, "Peça utilizada em OS", f"OS #{order.numero} — {peca.nome}", user.name)
    db.commit()
    return _to_out(_get_order_or_404(db, order_id))
