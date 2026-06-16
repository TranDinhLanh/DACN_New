import urllib.request
import json

url = "http://127.0.0.1:8000/api/v1/auth/register"
data = {
    "email": "test_agent_999@st.hcmuaf.edu.vn",
    "password": "securepassword123",
    "full_name": "Test Agent",
    "captcha_token": "mock_captcha_token"
}

print(f"Sending POST request to {url}...")
try:
    req = urllib.request.Request(
        url,
        data=json.dumps(data).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST"
    )
    with urllib.request.urlopen(req, timeout=5) as response:
        res_data = json.loads(response.read().decode())
        print("SUCCESS! API responded with:")
        print(json.dumps(res_data, indent=2))
except Exception as e:
    print(f"FAILED to request API: {e}")
    if hasattr(e, "read"):
        print("Error response:", e.read().decode())
