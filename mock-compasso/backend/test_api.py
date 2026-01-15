import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_login():
    print("Testing Login...")
    payload = {"username": "compasso", "password": "123456"}
    res = requests.post(f"{BASE_URL}/login", json=payload)
    assert res.status_code == 200
    print("✓ Login Success")
    return res.json()['token']

def test_products():
    print("Testing Products...")
    res = requests.get(f"{BASE_URL}/products")
    assert res.status_code == 200
    products = res.json()
    assert len(products) > 0
    print(f"✓ Products fetched: {len(products)}")
    return products

def test_campaign_discount():
    print("Testing Campaign Discount Logic...")
    products = test_products()
    p1 = products[0]
    original_price = p1['price']
    
    payload = {
        "name": "Test Campaign",
        "discount": 10,
        "products": [p1['id']]
    }
    res = requests.post(f"{BASE_URL}/campaigns", json=payload)
    assert res.status_code == 201
    
    # Check if price changed
    res_after = requests.get(f"{BASE_URL}/products")
    p1_after = [p for p in res_after.json() if p['id'] == p1['id']][0]
    expected_price = original_price * 0.9
    assert abs(p1_after['price'] - expected_price) < 0.01
    print(f"✓ Campaign applied: {original_price} -> {p1_after['price']}")

def test_create_order_stock():
    print("Testing Order Stock Deduction...")
    products = test_products()
    p1 = products[0]
    original_stock = p1['stock']
    
    payload = {
        "client_id": 1,
        "total": 100,
        "items": [{"product_id": p1['id'], "qty": 2}] # Assuming Backend should handle this
    }
    # Note: Current Backend doesn't handle items in POST /orders properly. Checking it.
    res = requests.post(f"{BASE_URL}/orders", json=payload)
    assert res.status_code == 201
    
    # If implemented, stock should be original_stock - 2
    res_products = requests.get(f"{BASE_URL}/products")
    p1_after = [p for p in res_products.json() if p['id'] == p1['id']][0]
    print(f"Stock check: {original_stock} -> {p1_after['stock']}")
    # assert p1_after['stock'] == original_stock - 2

def test_user_creation():
    print("Testing User Creation...")
    payload = {
        "name": "Audit Test",
        "email": f"test_{json.dumps(requests.utils.quote('audit'))}@test.com",
        "username": "audit_user",
        "password": "pwd",
        "role": "admin"
    }
    res = requests.post(f"{BASE_URL}/users", json=payload)
    assert res.status_code == 201
    
    res_get = requests.get(f"{BASE_URL}/users")
    users = res_get.json()
    assert any(u['username'] == 'audit_user' for u in users)
    print("✓ User Created and Listable")

if __name__ == "__main__":
    try:
        test_login()
        test_products()
        test_campaign_discount()
        test_create_order_stock()
        test_user_creation()
        print("\nSUMMARY: Basic API functional. Missing: Stock deduction and item persistence.")
    except Exception as e:
        print(f"\nFAILURE: {e}")
