import re
from sqlalchemy.orm import Session
from . import models


def only_digits(s: str) -> str:
    return re.sub(r"\D", "", s or "")


def validate_cpf(cpf_raw: str) -> bool:
    cpf = only_digits(cpf_raw)
    if not cpf:
        return True  # opcional
    if len(cpf) != 11 or cpf == cpf[0] * 11:
        return False
    soma = sum(int(cpf[i]) * (10 - i) for i in range(9))
    d1 = (soma * 10) % 11
    d1 = 0 if d1 == 10 else d1
    if d1 != int(cpf[9]):
        return False
    soma = sum(int(cpf[i]) * (11 - i) for i in range(10))
    d2 = (soma * 10) % 11
    d2 = 0 if d2 == 10 else d2
    if d2 != int(cpf[10]):
        return False
    return True


def log_action(db: Session, acao: str, detalhe: str = None, usuario: str = None):
    entry = models.AuditLog(acao=acao, detalhe=detalhe, usuario=usuario)
    db.add(entry)
    db.commit()
