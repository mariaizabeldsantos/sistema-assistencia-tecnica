from datetime import datetime
from typing import Optional, List, Any
from pydantic import BaseModel, EmailStr, field_validator

STATUS_FLOW = ['ENTRADA', 'ORCAMENTO', 'AGUARDANDO_APROVACAO',
               'EM_MANUTENCAO', 'PRONTO', 'ENTREGUE']


# ---------- Auth ----------
class SetupIn(BaseModel):
    nomeAssistencia: str
    nome: str
    email: EmailStr
    senha: str

    @field_validator("senha")
    @classmethod
    def senha_len(cls, v):
        if not (8 <= len(v) <= 64):
            raise ValueError("A senha deve ter entre 8 e 64 caracteres.")
        return v


class LoginIn(BaseModel):
    email: EmailStr
    senha: str


class TokenOut(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    name: str
    clientId: Optional[str] = None
    userId: str


# ---------- Client ----------
class ClientIn(BaseModel):
    nome: str
    cpf: Optional[str] = None
    telefone: str
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    observacoes: Optional[str] = None


class ClientOut(ClientIn):
    id: str
    status: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class ClientAccessIn(BaseModel):
    email: EmailStr
    senha: str


# ---------- Equipment ----------
class EquipmentIn(BaseModel):
    clientId: str
    tipo: str = "notebook"
    marca: str
    modelo: Optional[str] = None
    numeroSerie: Optional[str] = None
    acessorios: Optional[str] = None
    observacoes: Optional[str] = None
    senha: Optional[str] = None


class EquipmentOut(BaseModel):
    id: str
    clientId: str
    tipo: str
    marca: str
    modelo: Optional[str] = None
    numeroSerie: Optional[str] = None
    acessorios: Optional[str] = None
    observacoes: Optional[str] = None
    senha: Optional[str] = None
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


# ---------- Orders ----------
class OrderCreateIn(BaseModel):
    equipmentId: str
    problemaRelatado: str
    acessorios: Optional[str] = ""
    estadoFisico: Optional[str] = ""
    observacoes: Optional[str] = ""
    prazo: Optional[str] = ""


class DiagnosticoIn(BaseModel):
    diagnostico: str = ""
    testes: str = ""
    solucao: str = ""


class OrcamentoItemIn(BaseModel):
    id: Optional[str] = None
    pecaId: Optional[str] = None
    descricao: str
    quantidade: int
    valorUnitario: float


class MaoObraIn(BaseModel):
    id: Optional[str] = None
    descricao: str
    valor: float


class OrcamentoIn(BaseModel):
    itens: List[OrcamentoItemIn] = []
    maoObra: List[MaoObraIn] = []
    desconto: float = 0


class AprovacaoIn(BaseModel):
    status: str  # aprovado | recusado
    observacao: Optional[str] = ""


class UsarPecaIn(BaseModel):
    pecaId: str
    quantidade: int


class StatusChangeIn(BaseModel):
    status: str


class OrderOut(BaseModel):
    id: str
    numero: int
    clientId: str
    equipmentId: str
    problemaRelatado: str
    acessorios: Optional[str]
    estadoFisico: Optional[str]
    observacoes: Optional[str]
    prazo: Optional[str]
    status: str
    diagnostico: Optional[Any]
    orcamento: Optional[Any]
    aprovacao: Optional[Any]
    garantia: Optional[Any]
    dataConclusao: Optional[datetime]
    dataEntrega: Optional[datetime]
    createdAt: datetime
    updatedAt: datetime
    statusHistory: List[Any] = []
    partsUsed: List[Any] = []

    class Config:
        from_attributes = True


# ---------- Parts / Stock ----------
class PartIn(BaseModel):
    nome: str
    categoria: Optional[str] = None
    fabricante: Optional[str] = None
    modelo: Optional[str] = None
    codigo: Optional[str] = None
    quantidade: int = 0
    estoqueMinimo: int = 0
    custoAquisicao: float = 0
    precoOrcamento: float = 0
    fornecedor: Optional[str] = None
    localizacao: Optional[str] = None


class PartOut(PartIn):
    id: str
    status: str
    createdAt: datetime
    updatedAt: datetime

    class Config:
        from_attributes = True


class StockMoveIn(BaseModel):
    tipo: str  # entrada | saida
    quantidade: int
    motivo: Optional[str] = None


# ---------- Settings ----------
class SettingsIn(BaseModel):
    nomeAssistencia: str
    telefone: Optional[str] = None
    whatsapp: Optional[str] = None
    email: Optional[str] = None
    endereco: Optional[str] = None
    categorias: List[str] = []
    marcas: List[str] = []
    servicos: List[str] = []
    garantiaPadraoDias: int = 90


class SettingsOut(SettingsIn):
    proximoNumeroOS: int

    class Config:
        from_attributes = True


# ---------- Profile ----------
class ProfileUpdateIn(BaseModel):
    nome: str
    email: EmailStr


class PasswordChangeIn(BaseModel):
    senhaAtual: str
    novaSenha: str
