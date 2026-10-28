from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .config import settings
from .database import Base, engine
from . import models  # noqa: F401  (garante que os modelos sejam registrados)
from .routers import auth, clients, equipment, orders, parts, settings_router, reports

app = FastAPI(title="Assistência Técnica API", version="1.0.0")

_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=_origins,
    # a autenticação usa token Bearer (não cookies); com "*" não se usa credentials
    allow_credentials="*" not in _origins,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup():
    # Cria as tabelas automaticamente a partir de models.py, caso ainda não existam.
    # Escolha de projeto: para o escopo acadêmico deste sistema, isso é suficiente
    # e mais simples de explicar do que um sistema de migrações versionado.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health():
    return {"status": "ok"}


app.include_router(auth.router)
app.include_router(clients.router)
app.include_router(equipment.router)
app.include_router(orders.router)
app.include_router(parts.router)
app.include_router(settings_router.router)
app.include_router(settings_router.profile_router)
app.include_router(reports.router)
