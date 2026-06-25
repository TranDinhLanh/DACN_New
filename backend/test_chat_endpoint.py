import urllib.request
import json
import random
import sys

# Configure UTF-8 encoding for Windows console
if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

BASE_URL = "http://127.0.0.1:8000/api/v1"

# Generate a random email to avoid duplicate key issues in tests
test_email = f"test_chat_{random.randint(1000, 9999)}@example.com"
password = "password123"
name = "Aura Chat Tester"

def register():
    url = f"{BASE_URL}/auth/register"
    data = {
        "email": test_email,
        "password": password,
        "full_name": name,
        "captcha_token": "mock_captcha_token"
    }
    print(f"1. Registering user {test_email}...")
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode())
        print("Register Success:", res)

def login():
    url = f"{BASE_URL}/auth/login"
    # Form data encoding for OAuth2 password grant type
    data = f"username={urllib.parse.quote(test_email)}&password={urllib.parse.quote(password)}".encode("utf-8")
    print("\n2. Logging in...")
    req = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/x-www-form-urlencoded"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=10) as response:
        res = json.loads(response.read().decode())
        token = res["access_token"]
        print("Login Success! Token acquired.")
        return token

def test_chat(token, message):
    url = f"{BASE_URL}/chat/"
    data = {
        "message": message,
        "history": []
    }
    print(f"\n3. Sending message: '{message}' to AI Chatbox...")
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {token}"
        },
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=15) as response:
        res = json.loads(response.read().decode())
        print("\n=== AI RESPONSE ===")
        print(res["response"])
        print("===================\n")
        print("Suggested questions:", res.get("suggested_questions"))

if __name__ == "__main__":
    try:
        register()
        token = login()
        test_chat(token, "Ngân sách tháng này thế nào?")
        test_chat(token, "Tôi còn lại bao nhiêu số dư?")
    except Exception as e:
        print("ERROR:", e)
        if hasattr(e, "read"):
            print("Error details:", e.read().decode())
