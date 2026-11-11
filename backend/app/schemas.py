from datetime import datetime
from typing import Literal, Optional, List
from pydantic import BaseModel, ConfigDict, EmailStr, Field

CATEGORIES = [
    "Printer Network Connection", "Printer Hardware", "Internet Connection",
    "Software Installation", "Laptop Device Issue", "Software Crash/ Issue",
]
DEPARTMENTS = [
    "Admin", "Purchasing", "Finance", "Cebu Office", "Aftersales", "Supersam", "HR", "CSG", "CM",
    "ESG", "OP", "MIS", "Accounting", "Opulence", "OVP", "Marketing", "EDD", "IT", "SD-Aftersales",
    "PE-QS", "PED-QS", "Insys", "Progressive", "OEVP", "Warehouse", "PM-ES", "QA", "Lobby", "QAQC",
    "QS", "Baguio", "Sales Admin", "Trade", "SUPERSAM COMMI", "RMA-SLA",
]
Category = Literal[tuple(CATEGORIES)]
Department = Literal[tuple(DEPARTMENTS)]
Status = Literal["OPEN", "IN_PROGRESS", "RESOLVED", "CLOSED"]
<<<<<<< HEAD
PriorityLevel = Literal["P1", "P2", "P3", "P4"]
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe


class StaffCreate(BaseModel):
    """Used by the main admin to add an IT assistant."""
    email: EmailStr
    password: str = Field(min_length=6, max_length=72)
    full_name: str = Field(min_length=1, max_length=255)
    department: Optional[Department] = None


class AccountDecision(BaseModel):
    decision: Literal["APPROVED", "REJECTED"]


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    email: EmailStr
    full_name: str
    role: str
    department: Optional[str] = None
    account_status: str = "APPROVED"
    created_at: Optional[datetime] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    user: UserOut


class CommentCreate(BaseModel):
    content: str = Field(min_length=1)
    is_internal: bool = False


class CommentOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    ticket_id: int
    content: str
    is_internal: bool
    created_at: datetime
    user: UserOut


class PublicTicketCreate(BaseModel):
    """What an employee sends from the public form (no login)."""
    requester_name: str = Field(min_length=1, max_length=100)
    department: Department
    category: Category
    title: str = Field(min_length=1, max_length=255)
    description: str = Field(min_length=1, max_length=5000)
    website: Optional[str] = Field(default=None, max_length=200)  # hidden spam trap, humans leave it empty


class PublicTicketOut(BaseModel):
    """The only thing a public visitor ever gets back: no names, notes or account data."""
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    status: str
    created_at: datetime


class TicketUpdate(BaseModel):
    # Ticket information may be corrected by authenticated IT staff.
    title: Optional[str] = Field(default=None, min_length=1, max_length=255)
    description: Optional[str] = Field(default=None, min_length=1, max_length=5000)
    category: Optional[Category] = None
    department: Optional[Department] = None  # send explicit null to clear
    status: Optional[Status] = None
    assigned_to_id: Optional[int] = None  # send explicit null to unassign
<<<<<<< HEAD
    priority_level: Optional[PriorityLevel] = None  # send explicit null to clear
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe


class TicketOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    title: str
    description: str
    category: str
    department: Optional[str]
    status: str
    reporter_id: Optional[int] = None
<<<<<<< HEAD
    priority_level: Optional[str] = None
=======
>>>>>>> 8ea02deb3a1965e435a46fafed7de5339cfc65fe
    requester_name: Optional[str] = None
    assigned_to_id: Optional[int]
    created_at: datetime
    updated_at: datetime
    last_edited_at: Optional[datetime] = None
    last_edited_by: Optional[UserOut] = None
    reporter: Optional[UserOut] = None
    assigned_to: Optional[UserOut]


class TicketDetail(TicketOut):
    comments: List[CommentOut] = []


class TicketDeletionLogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    original_ticket_id: int
    ticket_title: str
    ticket_description: str
    ticket_category: str
    ticket_department: Optional[str] = None
    ticket_status: str
    requester_name: Optional[str] = None
    assigned_to_id: Optional[int] = None
    assigned_to_name: Optional[str] = None
    ticket_created_at: Optional[datetime] = None
    deleted_by_id: int
    deleted_by_name: str
    deleted_at: datetime


class BulkDelete(BaseModel):
    ids: List[int] = Field(min_length=1, max_length=500)
