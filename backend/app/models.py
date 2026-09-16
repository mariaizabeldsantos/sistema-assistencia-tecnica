import uuid
from datetime import datetime

from sqlalchemy import (
    Column, String, Boolean, Integer, ForeignKey, DateTime, Numeric, Text
)
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship

from .database import Base


def gen_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    name = Column(String(150), nullable=False)
    email = Column(String(254), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(20), nullable=False, default="admin")  # admin | client
    client_id = Column(UUID(as_uuid=False), ForeignKey("clients.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="user_account")


class Client(Base):
    __tablename__ = "clients"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nome = Column(String(150), nullable=False)
    cpf = Column(String(11), nullable=True, index=True)
    telefone = Column(String(11), nullable=False)
    whatsapp = Column(String(11), nullable=True)
    email = Column(String(254), nullable=True)
    endereco = Column(String(500), nullable=True)
    observacoes = Column(Text, nullable=True)
    status = Column(String(20), default="ativo")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user_account = relationship("User", back_populates="client", uselist=False)
    equipment = relationship("Equipment", back_populates="client", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="client")


class Equipment(Base):
    __tablename__ = "equipment"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    client_id = Column(UUID(as_uuid=False), ForeignKey("clients.id"), nullable=False)
    tipo = Column(String(20), nullable=False, default="notebook")  # notebook | computador
    marca = Column(String(50), nullable=False)
    modelo = Column(String(100), nullable=True)
    numero_serie = Column(String(100), nullable=True, index=True)
    acessorios = Column(String(500), nullable=True)
    observacoes = Column(Text, nullable=True)
    senha = Column(String(255), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="equipment")
    orders = relationship("Order", back_populates="equipment")


class Order(Base):
    __tablename__ = "orders"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    numero = Column(Integer, nullable=False, unique=True, index=True)
    client_id = Column(UUID(as_uuid=False), ForeignKey("clients.id"), nullable=False)
    equipment_id = Column(UUID(as_uuid=False), ForeignKey("equipment.id"), nullable=False)

    problema_relatado = Column(Text, nullable=False)
    acessorios = Column(String(500), nullable=True)
    estado_fisico = Column(String(500), nullable=True)
    observacoes = Column(Text, nullable=True)
    prazo = Column(String(20), nullable=True)  # ISO date (yyyy-mm-dd)

    status = Column(String(30), nullable=False, default="ENTRADA")

    diagnostico = Column(JSONB, nullable=True)
    orcamento = Column(JSONB, nullable=True)
    aprovacao = Column(JSONB, nullable=True)
    garantia = Column(JSONB, nullable=True)

    data_conclusao = Column(DateTime, nullable=True)
    data_entrega = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    client = relationship("Client", back_populates="orders")
    equipment = relationship("Equipment", back_populates="orders")
    status_history = relationship("OrderStatusHistory", back_populates="order", cascade="all, delete-orphan", order_by="OrderStatusHistory.data")
    parts_used = relationship("OrderPartUsed", back_populates="order", cascade="all, delete-orphan")


class OrderStatusHistory(Base):
    __tablename__ = "order_status_history"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False)
    status_anterior = Column(String(30), nullable=True)
    status_novo = Column(String(30), nullable=False)
    data = Column(DateTime, default=datetime.utcnow)
    usuario = Column(String(150), nullable=True)

    order = relationship("Order", back_populates="status_history")


class OrderPartUsed(Base):
    __tablename__ = "order_parts_used"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    order_id = Column(UUID(as_uuid=False), ForeignKey("orders.id"), nullable=False)
    peca_id = Column(UUID(as_uuid=False), ForeignKey("parts.id"), nullable=False)
    nome = Column(String(150), nullable=False)
    quantidade = Column(Integer, nullable=False)
    custo = Column(Numeric(12, 2), default=0)
    data = Column(DateTime, default=datetime.utcnow)
    usuario = Column(String(150), nullable=True)

    order = relationship("Order", back_populates="parts_used")


class Part(Base):
    __tablename__ = "parts"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    nome = Column(String(150), nullable=False)
    categoria = Column(String(100), nullable=True)
    fabricante = Column(String(100), nullable=True)
    modelo = Column(String(100), nullable=True)
    codigo = Column(String(100), nullable=True)
    quantidade = Column(Integer, default=0)
    estoque_minimo = Column(Integer, default=0)
    custo_aquisicao = Column(Numeric(12, 2), default=0)
    preco_orcamento = Column(Numeric(12, 2), default=0)
    fornecedor = Column(String(150), nullable=True)
    localizacao = Column(String(150), nullable=True)
    status = Column(String(20), default="ativo")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class StockMovement(Base):
    __tablename__ = "stock_movements"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    peca_id = Column(UUID(as_uuid=False), ForeignKey("parts.id"), nullable=False)
    tipo = Column(String(20), nullable=False)  # entrada | saida
    quantidade = Column(Integer, nullable=False)
    data = Column(DateTime, default=datetime.utcnow)
    usuario = Column(String(150), nullable=True)
    motivo = Column(String(255), nullable=True)
    ordem_id = Column(UUID(as_uuid=False), ForeignKey("orders.id"), nullable=True)


class Setting(Base):
    __tablename__ = "settings"
    id = Column(Integer, primary_key=True, default=1)
    nome_assistencia = Column(String(150), default="Minha Assistência Técnica")
    telefone = Column(String(11), nullable=True)
    whatsapp = Column(String(11), nullable=True)
    email = Column(String(254), nullable=True)
    endereco = Column(String(500), nullable=True)
    categorias = Column(JSONB, default=list)
    marcas = Column(JSONB, default=list)
    servicos = Column(JSONB, default=list)
    garantia_padrao_dias = Column(Integer, default=90)
    proximo_numero_os = Column(Integer, default=1)


class AuditLog(Base):
    __tablename__ = "audit_log"
    id = Column(UUID(as_uuid=False), primary_key=True, default=gen_uuid)
    acao = Column(String(255), nullable=False)
    detalhe = Column(String(500), nullable=True)
    usuario = Column(String(150), nullable=True)
    data = Column(DateTime, default=datetime.utcnow)
