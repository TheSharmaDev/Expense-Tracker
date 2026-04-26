from contextlib import asynccontextmanager
from datetime import datetime, timezone
from decimal import Decimal
from typing import List, Optional
from uuid import UUID, uuid4

from fastapi import FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from models import Expense, ExpenseCreate, ExpenseSummaryItem, ExpenseUpdate
from store import create_expense, get_by_client_id, list_expenses, summary_by_category, update_expense, delete_expense


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield


app = FastAPI(title="Expense Tracker API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ExpenseResponse(BaseModel):
    data: Expense
    created: bool


@app.post("/expenses", response_model=ExpenseResponse, status_code=201)
async def create_new_expense(payload: ExpenseCreate):
    if payload.client_id:
        existing = get_by_client_id(payload.client_id)
        if existing:
            return ExpenseResponse(data=existing, created=False)

    new_expense = Expense(
        id=uuid4(),
        amount=payload.amount,
        category=payload.category,
        description=payload.description,
        date=payload.date,
        created_at=datetime.now(timezone.utc),
        client_id=payload.client_id or uuid4(),
    )
    created = create_expense(new_expense)
    return ExpenseResponse(data=created, created=True)


@app.get("/expenses", response_model=List[Expense])
async def get_expenses(
    category: Optional[str] = Query(None, description="Filter by category"),
    sort: Optional[str] = Query(None, description="Use 'date_desc' to sort newest first"),
):
    sort_date_desc = sort == "date_desc"
    return list_expenses(category=category, sort_date_desc=sort_date_desc)


@app.put("/expenses/{expense_id}", response_model=Expense)
async def update_existing_expense(expense_id: UUID, payload: ExpenseUpdate):
    updates = payload.model_dump(exclude_none=True)
    if not updates:
        raise HTTPException(status_code=400, detail="No fields provided for update")
    updated = update_expense(expense_id, updates)
    if not updated:
        raise HTTPException(status_code=404, detail="Expense not found")
    return updated


@app.delete("/expenses/{expense_id}", status_code=204)
async def remove_expense(expense_id: UUID):
    deleted = delete_expense(expense_id)
    if not deleted:
        raise HTTPException(status_code=404, detail="Expense not found")
    return None


@app.get("/expenses/summary", response_model=List[ExpenseSummaryItem])
async def get_summary():
    raw = summary_by_category()
    return [ExpenseSummaryItem(category=r["category"], total=r["total"]) for r in raw]


# @app.get("/health")
# async def health():
#     return {"status": "ok"}


