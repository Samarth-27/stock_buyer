# Complete Step-by-Step Guide: Getting & Using Your Upstox API Token

This guide walks you through getting your **Upstox Access Token** and connecting it to MarketEye to scan live Indian stock market data (NSE).

---

## ⚠️ Why Did You Get "Invalid token used to access API (UDAPI100050)"?

If you tried pasting a key and received an error, **here is the common reason**:
* **API Key** (e.g. `52c938b8-....`): This is your app's Client ID. **This is NOT the Access Token.**
* **API Secret** (e.g. `ab38e9...`): This is your app's secret password. **This is NOT the Access Token.**
* **Access Token** (e.g. `eyJhbGciOi...`): This is a **long 300+ character JWT session token** generated only after you log in and verify with 2FA OTP.

MarketEye requires the **Access Token** (`eyJ...`) to stream live market quotes from the National Stock Exchange (NSE).

---

## Where to Go & How to Redeem Your Token (3 Simple Steps)

### Step 1: Open the Upstox Developer Console
1. Open this link in your browser:  
   👉 **[https://upstox.com/developer/apps/](https://upstox.com/developer/apps/)**
2. Click **Login** and sign in using your **Upstox registered mobile number**, **6-digit PIN**, and **OTP**.

---

### Step 2: Create or Open Your App
1. Click **"+ New App"** (or click your existing app if you created one).
2. Enter these details:
   - **App Name**: `MarketEye`
   - **Redirect URL / Callback URL**:  
     ```
     http://localhost:3001/api/auth/upstox/callback
     ```
   - **Postback URL**: *(leave empty)*
3. Click **Continue** / **Submit**.

---

### Step 3: Generate (Redeem) Your Access Token
1. In the **[Upstox Developer Console](https://upstox.com/developer/apps/)**, click on your **MarketEye** app.
2. Look for the **"Generate Access Token"** button (or token section).
3. Complete the quick 2FA OTP verification on your mobile phone.
4. Upstox will display a long text starting with:  
   `eyJhbGciOi...`
5. Click the **Copy** button to copy this Access Token.

### Option A: 1-Click Login Inside MarketEye (Easiest & Automatic)
1. Open MarketEye in your browser: **[http://localhost:5173/](http://localhost:5173/)**
2. In the top-right header, click the **Feed Mode badge** (marked with a settings icon).
3. Select **Upstox API**.
4. Paste your **Upstox API Key** into the API Key field.
5. In your [`.env`](../.env) file, make sure `UPSTOX_API_KEY` and `UPSTOX_API_SECRET` are set.
6. Click the **"1-Click Upstox Login"** button.
7. Upstox will prompt you to authorize MarketEye with your mobile OTP.
8. Once verified, Upstox redirects back to MarketEye, and your token is automatically redeemed and connected!

---

### Option B: Copy Token Directly from Upstox Console
1. In the **[Upstox Developer Console](https://upstox.com/developer/apps/)**, click on your `MarketEye` app.
2. In the app dashboard, look for the **"Generate Access Token"** button or test token section.
3. Complete the login verification (mobile + OTP).
4. Upstox will generate a long string starting with `eyJhbGciOi...`.
5. Click the copy icon next to the token.

---

## Step 4: Paste & Activate in MarketEye

1. Open MarketEye at **[http://localhost:5173/](http://localhost:5173/)**.
2. Click the top-right **Feed Mode badge**.
3. Select **Upstox API**.
4. In the **Upstox Access Token** box, paste your copied token (`eyJ...`).
5. Click **Apply & Connect Feed**.

### What Happens Next:
* The badge will turn bright green: **`LIVE FEED (NSE)`**.
* Real live prices (LTP), volumes, and order book depths will stream directly from the exchange.
* The 60/40 Scanner Engine will actively evaluate live order book buy/sell pressure across all 25 NSE securities!

---

## Frequently Asked Questions

### Q: Why does the token expire every morning?
SEBI (Securities and Exchange Board of India) cybersecurity regulations mandate that Indian broker access tokens expire at **06:00 AM IST daily**. You simply log in once each trading morning to refresh the token.

### Q: What if I don't have an Upstox account?
You have two great alternatives:
1. **Mock Simulation Feed**: Switch back to **Mock Feed** in MarketEye anytime to test scanner rules, charts, and order-book imbalances 24/7 without needing an account.
2. **Dhan HQ API**: If you have an account with Dhan, Dhan gives a static Personal Access Token directly in your web profile without daily OAuth.
