from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import require_admin, get_current_user, hash_password, verify_password

# Este arquivo junta duas coisas pequenas e parecidas: configurações gerais
# do sistema ("/settings") e dados do próprio usuário logado ("/profile").
# Nenhuma das duas é grande o suficiente para merecer um arquivo só pra si.

router = APIRouter(prefix="/settings", tags=["settings"])
profile_router = APIRouter(prefix="/profile", tags=["profile"])


# ---------- /settings — configurações da assistência ----------

def _to_out(s: models.Setting) -> dict:
    return {
        "nomeAssistencia": s.nome_assistencia, "telefone": s.telefone, "whatsapp": s.whatsapp,
        "email": s.email, "endereco": s.endereco, "categorias": s.categorias or [],
        "marcas": s.marcas or [], "servicos": s.servicos or [],
        "garantiaPadraoDias": s.garantia_padrao_dias, "proximoNumeroOS": s.proximo_numero_os,
    }


@router.get("", response_model=schemas.SettingsOut)
def get_settings(db: Session = Depends(get_db), user=Depends(require_admin)):
    s = db.query(models.Setting).filter(models.Setting.id == 1).first()
    if not s:
        raise HTTPException(404, "Configurações não encontradas.")
    return _to_out(s)


@router.put("", response_model=schemas.SettingsOut)
def update_settings(payload: schemas.SettingsIn, db: Session = Depends(get_db), user=Depends(require_admin)):
    s = db.query(models.Setting).filter(models.Setting.id == 1).first()
    if not s:
        raise HTTPException(404, "Configurações não encontradas.")
    s.nome_assistencia = payload.nomeAssistencia
    s.telefone = payload.telefone
    s.whatsapp = payload.whatsapp
    s.email = payload.email
    s.endereco = payload.endereco
    s.categorias = payload.categorias
    s.marcas = payload.marcas
    s.servicos = payload.servicos
    s.garantia_padrao_dias = payload.garantiaPadraoDias
    db.commit()
    db.refresh(s)
    return _to_out(s)


@router.get("/public")
def get_public_settings(db: Session = Depends(get_db)):
    """Dados usados nas telas de login/setup, sem exigir autenticação."""
    s = db.query(models.Setting).filter(models.Setting.id == 1).first()
    if not s:
        return {"nomeAssistencia": None}
    return {"nomeAssistencia": s.nome_assistencia}


# ---------- /profile — dados do usuário logado ----------

@profile_router.put("")
def update_profile(payload: schemas.ProfileUpdateIn, db: Session = Depends(get_db),
                    user: models.User = Depends(get_current_user)):
    if len(payload.nome.strip()) < 3:
        raise HTTPException(400, "Nome deve ter ao menos 3 caracteres.")
    user.name = payload.nome.strip()
    user.email = payload.email.strip().lower()
    db.commit()
    return {"ok": True, "name": user.name, "email": user.email}


@profile_router.put("/senha")
def change_password(payload: schemas.PasswordChangeIn, db: Session = Depends(get_db),
                     user: models.User = Depends(get_current_user)):
    if not verify_password(payload.senhaAtual, user.password_hash):
        raise HTTPException(400, "Senha atual incorreta.")
    if len(payload.novaSenha) < 8 or len(payload.novaSenha) > 64:
        raise HTTPException(400, "A nova senha deve ter entre 8 e 64 caracteres.")
    user.password_hash = hash_password(payload.novaSenha)
    db.commit()
    return {"ok": True}
