from decimal import Decimal
from datetime import date, datetime
from typing import Optional
from uuid import UUID, uuid4

from pydantic import BaseModel, Field, field_validator


class ExpenseBase(BaseModel):
    amount: Decimal = Field(..., gt=0, decimal_places=2, description="Amount must be positive with max 2 decimal places")
    category: str = Field(..., min_length=1, max_length=100)
    description: str = Field(..., min_length=1, max_length=500)
    date: date
    client_id: Optional[UUID] = Field(default=None, description="Client-generated idempotency key")

    @field_validator("amount")
    @classmethod
    def validate_amount_precision(cls, v: Decimal) -> Decimal:
        if v.as_tuple().exponent < -2:
            raise ValueError("Amount must have at most 2 decimal places")
        return v

    @field_validator("category", "description")
    @classmethod
    def strip_whitespace(cls, v: str) -> str:
        return v.strip()

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: date) -> date:
        if v > date.today():
            raise ValueError("Date cannot be in the future")
        return v


class ExpenseUpdate(BaseModel):
    amount: Optional[Decimal] = Field(default=None, gt=0)
    category: Optional[str] = Field(default=None, min_length=1, max_length=100)
    description: Optional[str] = Field(default=None, min_length=1, max_length=500)
    date: Optional[str] = Field(default=None, pattern=r'^\d{4}-\d{2}-\d{2}$')

    @field_validator("amount")
    @classmethod
    def validate_amount_precision(cls, v: Optional[Decimal]) -> Optional[Decimal]:
        if v is None:
            return v
        if v.as_tuple().exponent < -2:
            raise ValueError("Amount must have at most 2 decimal places")
        return v

    @field_validator("category", "description")
    @classmethod
    def strip_whitespace(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        return v.strip()

    @field_validator("date")
    @classmethod
    def validate_date_not_future(cls, v: Optional[str]) -> Optional[str]:
        if v is None:
            return v
        from datetime import date as dt
        parsed = dt.fromisoformat(v)
        if parsed > dt.today():
            raise ValueError("Date cannot be in the future")
        return v


class ExpenseCreate(ExpenseBase):
    pass


class Expense(ExpenseBase):
    id: UUID
    created_at: datetime

    model_config = {"json_schema_extra": {"example": {"id": "123e4567-e89b-12d3-a456-426614174000", "amount": "150.50", "category": "Food", "description": "Lunch at cafe", "date": "2024-05-20", "created_at": "2024-05-20T12:34:56", "client_id": "123e4567-e89b-12d3-a456-426614174001"}}}


class ExpenseSummaryItem(BaseModel):
    category: str
    total: Decimal

