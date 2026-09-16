from datetime import datetime
from typing import Optional
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import require_admin

router = APIRouter(tags=["reports"])

STATUS_FLOW = schemas.STATUS_FLOW


@router.get("/dashboard")
def dashboard(db: Session = Depends(get_db), user=Depends(require_admin)):
    orders = db.query(models.Order).all()
    parts = db.query(models.Part).all()
    today = datetime.utcnow()

    def count(status):
        return sum(1 for o in orders if o.status == status)

    estoque_baixo = [p for p in parts if p.quantidade <= p.estoque_minimo]
    garantias_vigentes = sum(
        1 for o in orders if o.garantia and datetime.fromisoformat(o.garantia["dataFinal"]) >= today
    )
    abertas = sum(1 for o in orders if o.status not in ("ENTREGUE", "CANCELADO"))
    recentes = sorted(orders, key=lambda o: o.updated_at, reverse=True)[:6]

    return {
        "kpis": {
            "abertas": abertas, "emEntrada": count("ENTRADA"), "emOrcamento": count("ORCAMENTO"),
            "aguardandoAprovacao": count("AGUARDANDO_APROVACAO"),
            "emManutencao": count("EM_MANUTENCAO"), "prontos": count("PRONTO"),
            "estoqueBaixo": len(estoque_baixo), "garantiasVigentes": garantias_vigentes,
        },
        "estoqueBaixo": [
            {"id": p.id, "nome": p.nome, "quantidade": p.quantidade, "estoqueMinimo": p.estoque_minimo}
            for p in estoque_baixo
        ],
        "ordensRecentes": [
            {
                "id": o.id, "numero": o.numero, "status": o.status,
                "clienteNome": o.client.nome if o.client else None,
                "equipamento": f"{o.equipment.marca} {o.equipment.modelo}" if o.equipment else None,
            }
            for o in recentes
        ],
    }


@router.get("/warranties")
def warranties(q: Optional[str] = None, db: Session = Depends(get_db), user=Depends(require_admin)):
    orders = db.query(models.Order).filter(models.Order.garantia.isnot(None)).all()
    today = datetime.utcnow()
    result = []
    for o in orders:
        if q and q not in str(o.numero) and (not o.client or q.lower() not in o.client.nome.lower()):
            continue
        vigente = datetime.fromisoformat(o.garantia["dataFinal"]) >= today
        result.append({
            "orderId": o.id, "numero": o.numero,
            "clienteNome": o.client.nome if o.client else None,
            "equipamento": f"{o.equipment.marca} {o.equipment.modelo}" if o.equipment else None,
            "garantia": o.garantia, "vigente": vigente,
        })
    return result


@router.get("/reports")
def reports(de: Optional[str] = None, ate: Optional[str] = None,
            db: Session = Depends(get_db), user=Depends(require_admin)):
    orders = db.query(models.Order).all()
    parts = db.query(models.Part).all()
    audit = (
        db.query(models.AuditLog).order_by(models.AuditLog.data.desc()).limit(30).all()
    )

    no_periodo = orders
    if de:
        no_periodo = [o for o in no_periodo if o.created_at >= datetime.fromisoformat(de)]
    if ate:
        no_periodo = [o for o in no_periodo if o.created_at <= datetime.fromisoformat(ate + "T23:59:59")]

    por_status = {s: sum(1 for o in orders if o.status == s) for s in STATUS_FLOW + ["CANCELADO"]}

    pecas_usadas = {}
    for o in orders:
        for pu in o.parts_used:
            pecas_usadas[pu.nome] = pecas_usadas.get(pu.nome, 0) + pu.quantidade
    top_pecas = sorted(pecas_usadas.items(), key=lambda x: x[1], reverse=True)[:6]

    today = datetime.utcnow()
    gar_vig = sum(1 for o in orders if o.garantia and datetime.fromisoformat(o.garantia["dataFinal"]) >= today)
    gar_venc = sum(1 for o in orders if o.garantia and datetime.fromisoformat(o.garantia["dataFinal"]) < today)
    estoque_baixo = [p for p in parts if p.quantidade <= p.estoque_minimo]
    valor_periodo = sum(o.orcamento["total"] for o in no_periodo if o.orcamento)
    entregues = sum(1 for o in no_periodo if o.status == "ENTREGUE")
    cancelados = sum(1 for o in no_periodo if o.status == "CANCELADO")

    return {
        "porStatus": por_status,
        "topPecas": [{"nome": n, "quantidade": q} for n, q in top_pecas],
        "garantias": {"vigentes": gar_vig, "vencidas": gar_venc},
        "periodo": {"valorTotalOrcado": valor_periodo, "entregues": entregues, "cancelados": cancelados},
        "estoqueBaixo": [
            {"id": p.id, "nome": p.nome, "quantidade": p.quantidade, "estoqueMinimo": p.estoque_minimo}
            for p in estoque_baixo
        ],
        "auditoria": [
            {"id": a.id, "acao": a.acao, "detalhe": a.detalhe, "usuario": a.usuario, "data": a.data}
            for a in audit
        ],
    }
