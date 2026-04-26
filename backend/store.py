import json
import os
import threading
from datetime import date, datetime
from decimal import Decimal
from pathlib import Path
from typing import List, Optional
from uuid import UUID

from models import Expense

DATA_PATH = Path(__file__).with_name("data") / "expenses.json"
_lock = threading.Lock()


class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            return str(obj)
        if isinstance(obj, UUID):
            return str(obj)
        if isinstance(obj, datetime):
            return obj.isoformat()
        if isinstance(obj, date):
            return obj.isoformat()
        return super().default(obj)


def _decode_expense(raw: dict) -> Expense:
    return Expense(
        id=UUID(raw["id"]),
        amount=Decimal(raw["amount"]),
        category=raw["category"],
        description=raw["description"],
        date=date.fromisoformat(raw["date"]),
        created_at=datetime.fromisoformat(raw["created_at"]),
        client_id=UUID(raw["client_id"]) if raw.get("client_id") else None,
    )


def _load_all() -> List[Expense]:
    if not DATA_PATH.exists():
        return []
    with open(DATA_PATH, "r", encoding="utf-8") as f:
        try:
            raw_list = json.load(f)
        except json.JSONDecodeError:
            return []
    if not isinstance(raw_list, list):
        return []
    return [_decode_expense(item) for item in raw_list]


def _save_all(expenses: List[Expense]) -> None:
    DATA_PATH.parent.mkdir(parents=True, exist_ok=True)
    temp_path = DATA_PATH.with_suffix(".tmp")
    with open(temp_path, "w", encoding="utf-8") as f:
        json.dump([e.model_dump() for e in expenses], f, cls=DecimalEncoder, indent=2, ensure_ascii=False)
    os.replace(temp_path, DATA_PATH)


def list_expenses(category: Optional[str] = None, sort_date_desc: bool = False) -> List[Expense]:
    with _lock:
        expenses = _load_all()
    if category:
        expenses = [e for e in expenses if e.category.lower() == category.lower()]
    if sort_date_desc:
        expenses = sorted(expenses, key=lambda e: (e.date, e.created_at), reverse=True)
    return expenses


def get_by_client_id(client_id: UUID) -> Optional[Expense]:
    with _lock:
        expenses = _load_all()
    for e in expenses:
        if e.client_id == client_id:
            return e
    return None


def get_by_id(expense_id: UUID) -> Optional[Expense]:
    with _lock:
        expenses = _load_all()
    for e in expenses:
        if e.id == expense_id:
            return e
    return None


def create_expense(expense: Expense) -> Expense:
    with _lock:
        expenses = _load_all()
        expenses.append(expense)
        _save_all(expenses)
    return expense


def update_expense(expense_id: UUID, updates: dict) -> Optional[Expense]:
    with _lock:
        expenses = _load_all()
        for i, e in enumerate(expenses):
            if e.id == expense_id:
                updated_data = e.model_dump()
                updated_data.update({k: v for k, v in updates.items() if v is not None})
                updated_expense = Expense(**updated_data)
                expenses[i] = updated_expense
                _save_all(expenses)
                return updated_expense
    return None


def delete_expense(expense_id: UUID) -> bool:
    with _lock:
        expenses = _load_all()
        for i, e in enumerate(expenses):
            if e.id == expense_id:
                expenses.pop(i)
                _save_all(expenses)
                return True
    return False


def summary_by_category() -> List[dict]:
    with _lock:
        expenses = _load_all()
    totals = {}
    for e in expenses:
        totals[e.category] = totals.get(e.category, Decimal("0")) + e.amount
    return [{"category": cat, "total": amt} for cat, amt in totals.items()]

