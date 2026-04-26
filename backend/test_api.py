import json
from datetime import date
from decimal import Decimal
from uuid import uuid4

import pytest
from fastapi.testclient import TestClient

from main import app
from store import DATA_PATH

client = TestClient(app)


@pytest.fixture(autouse=True)
def clean_data():
    if DATA_PATH.exists():
        DATA_PATH.unlink()
    yield
    if DATA_PATH.exists():
        DATA_PATH.unlink()


def test_create_and_list_expense():
    payload = {
        "amount": "150.50",
        "category": "Food",
        "description": "Lunch",
        "date": "2024-05-20",
    }
    res = client.post("/expenses", json=payload)
    assert res.status_code == 201
    data = res.json()["data"]
    assert data["amount"] == "150.50"
    assert data["category"] == "Food"

    res2 = client.get("/expenses")
    assert res2.status_code == 200
    assert len(res2.json()) == 1


def test_idempotent_create_with_client_id():
    client_id = str(uuid4())
    payload = {
        "amount": "200.00",
        "category": "Transport",
        "description": "Taxi",
        "date": "2024-05-21",
        "client_id": client_id,
    }
    res1 = client.post("/expenses", json=payload)
    assert res1.status_code == 201
    id1 = res1.json()["data"]["id"]

    res2 = client.post("/expenses", json=payload)
    assert res2.status_code == 201
    id2 = res2.json()["data"]["id"]
    assert id1 == id2
    assert res2.json()["created"] is False

    res3 = client.get("/expenses")
    assert len(res3.json()) == 1


def test_filter_and_sort():
    for cat, amt, d in [
        ("Food", "100", "2024-05-18"),
        ("Food", "50", "2024-05-20"),
        ("Transport", "75", "2024-05-19"),
    ]:
        client.post("/expenses", json={"amount": amt, "category": cat, "description": "x", "date": d})

    res = client.get("/expenses?category=Food&sort=date_desc")
    assert res.status_code == 200
    items = res.json()
    assert len(items) == 2
    assert items[0]["date"] == "2024-05-20"
    assert items[1]["date"] == "2024-05-18"


def test_validation_rejects_negative_amount():
    payload = {
        "amount": "-10.00",
        "category": "Food",
        "description": "Bad",
        "date": "2024-05-20",
    }
    res = client.post("/expenses", json=payload)
    assert res.status_code == 422


def test_summary_endpoint():
    client.post("/expenses", json={"amount": "100", "category": "Food", "description": "A", "date": "2024-05-20"})
    client.post("/expenses", json={"amount": "50", "category": "Food", "description": "B", "date": "2024-05-21"})
    client.post("/expenses", json={"amount": "30", "category": "Transport", "description": "C", "date": "2024-05-22"})

    res = client.get("/expenses/summary")
    assert res.status_code == 200
    data = {item["category"]: item["total"] for item in res.json()}
    assert Decimal(data["Food"]) == Decimal("150")
    assert Decimal(data["Transport"]) == Decimal("30")


def test_update_expense():
    res = client.post("/expenses", json={"amount": "100", "category": "Food", "description": "A", "date": "2024-05-20"})
    expense_id = res.json()["data"]["id"]

    update_res = client.put(f"/expenses/{expense_id}", json={"amount": "150", "description": "Updated"})
    assert update_res.status_code == 200
    data = update_res.json()
    assert data["amount"] == "150"
    assert data["description"] == "Updated"
    assert data["category"] == "Food"


def test_update_expense_not_found():
    res = client.put(f"/expenses/{uuid4()}", json={"amount": "200"})
    assert res.status_code == 404


def test_delete_expense():
    res = client.post("/expenses", json={"amount": "100", "category": "Food", "description": "A", "date": "2024-05-20"})
    expense_id = res.json()["data"]["id"]

    del_res = client.delete(f"/expenses/{expense_id}")
    assert del_res.status_code == 204

    list_res = client.get("/expenses")
    assert len(list_res.json()) == 0


def test_delete_expense_not_found():
    res = client.delete(f"/expenses/{uuid4()}")
    assert res.status_code == 404

