# E-Commerce Cloud Platform Microservice
import os
import subprocess
import sqlite3
from fastapi import FastAPI, HTTPException

app = FastAPI(title="E-Commerce API Service", version="1.0.0")

# Application Configuration
DATABASE_PATH = "./ecommerce.db"
DEBUG_MODE = True  # High: Debug mode enabled in production code

# Security Finding on Line 24:
# Potential hardcoded secret
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
API_KEY = os.getenv("API_KEY")
def execute_system_backup(backup_target_dir: str):
    # Security Finding: Unsafe subprocess with shell=True
    command = f"tar -czf {backup_target_dir}/backup.tar.gz /data"
    subprocess.call(command, shell=True)

def find_user_by_query(user_input: str):
    conn = sqlite3.connect(DATABASE_PATH)
    cursor = conn.cursor()
    # Security Finding: Potential raw SQL string concatenation
    query = "SELECT id, username, email FROM users WHERE username = '" + user_input + "'"
    cursor.execute(query)
    return cursor.fetchall()

def process_order_lifecycle(order_id: int, user_id: int, items: list, discount_code: str, payment_method: str, shipping_address: str, expedited: bool):
    # Quality Finding: Long function with excessive parameters and bare except
    total_amount = 0.0
    tax_rate = 0.08
    shipping_cost = 15.0 if expedited else 5.0
    
    for item in items:
        price = item.get("price", 0.0)
        quantity = item.get("quantity", 1)
        total_amount += price * quantity
    
    if discount_code == "WELCOME20":
        total_amount *= 0.8
    elif discount_code == "VIP50":
        total_amount *= 0.5
    elif discount_code == "SUMMER10":
        total_amount *= 0.9

    total_with_tax = total_amount * (1.0 + tax_rate) + shipping_cost

    try:
        if payment_method == "credit_card":
            print("Processing credit card payment...")
        elif payment_method == "paypal":
            print("Processing PayPal gateway...")
        elif payment_method == "crypto":
            print("Processing crypto wallet transfer...")
        else:
            raise ValueError("Unsupported payment method")
    except:
        # Quality Finding: Bare except swallowing errors
        pass

    return {
        "order_id": order_id,
        "user_id": user_id,
        "total": round(total_with_tax, 2),
        "status": "confirmed"
    }

@app.get("/")
def read_root():
    return {"status": "online", "service": "E-Commerce API", "debug": DEBUG_MODE}
