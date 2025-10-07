// src/lib/api.js
export const API_BASE = __DEV__ ? "http://192.168.8.179:4000" : "https://YOUR-PROD-API";

export async function sendOtp(phone) {
  const r = await fetch(`${API_BASE}/send-otp/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ phone }),
  });
  return r.json();
}

export async function verifyOtp({ phone, code, idToken }) {
  const r = await fetch(`${API_BASE}/verify-otp/`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(idToken ? { Authorization: `Bearer ${idToken}` } : {}),
    },
    body: JSON.stringify({ phone, code }),
  });
  return r.json();
}
