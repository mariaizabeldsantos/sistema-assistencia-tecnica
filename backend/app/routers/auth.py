from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from .. import models, schemas
from ..database import get_db
from ..security import hash_password, verify_password, create_access_token, get_current_user

router = APIRouter(prefix="/auth", tags=["auth"])


@router.get("/status")
def status(db: Session = Depends(get_db)):
    """Informa se o sistema já possui um administrador configurado."""
    has_admin = db.query(models.User).filter(models.User.role == "admin").first() is not None
    return {"configured": has_admin}


@router.post("/setup", response_model=schemas.TokenOut)
def setup(payload: schemas.SetupIn, db: Session = Depends(get_db)):
    has_admin = db.query(models.User).filter(models.User.role == "admin").first()
    if has_admin:
        raise HTTPException(400, "O sistema já foi configurado.")
    if len(payload.nome.strip()) < 3:
        raise HTTPException(400, "Nome deve ter ao menos 3 caracteres.")
    if not payload.nomeAssistencia.strip():
        raise HTTPException(400, "Informe o nome da assistência.")

    admin = models.User(
        name=payload.nome.strip(),
        email=payload.email.strip().lower(),
        password_hash=hash_password(payload.senha),
        role="admin",
    )
    db.add(admin)

    settings_row = models.Setting(
        id=1,
        nome_assistencia=payload.nomeAssistencia.strip(),
        categorias=['Placa-mãe', 'Memória RAM', 'SSD/HD', 'Fonte', 'Tela/Display',
                    'Bateria', 'Teclado', 'Cooler/Ventoinha', 'Carregador', 'Outros'],
        marcas=['Dell', 'Lenovo', 'HP', 'Acer', 'Asus', 'Samsung', 'Apple', 'Positivo', 'Outra'],
        servicos=['Formatação', 'Limpeza interna', 'Troca de peça', 'Upgrade', 'Reparo de placa',
                  'Remoção de vírus', 'Diagnóstico'],
        garantia_padrao_dias=90,
        proximo_numero_os=1,
    )
    db.add(settings_row)
    db.commit()
    db.refresh(admin)

    token = create_access_token({"sub": admin.id})
    return schemas.TokenOut(access_token=token, role="admin", name=admin.name, userId=admin.id)


@router.post("/login", response_model=schemas.TokenOut)
def login(payload: schemas.LoginIn, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email.strip().lower()).first()
    if not user or not verify_password(payload.senha, user.password_hash):
        raise HTTPException(401, "E-mail ou senha inválidos.")
    token = create_access_token({"sub": user.id})
    return schemas.TokenOut(
        access_token=token, role=user.role, name=user.name,
        clientId=user.client_id, userId=user.id,
    )


@router.get("/me")
def me(user: models.User = Depends(get_current_user)):
    return {
        "userId": user.id, "name": user.name, "email": user.email,
        "role": user.role, "clientId": user.client_id,
    }
