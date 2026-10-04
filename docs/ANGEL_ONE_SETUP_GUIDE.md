# Complete Guide: Connecting Angel One (SmartAPI) to MarketEye

If you have an **Angel One Demat account**, you can connect MarketEye directly to official live NSE market data **completely free of cost (₹0 subscription)**.

---

## ⚡ Why Angel One is Recommended Over Groww

| Feature | Angel One SmartAPI | Groww API |
| :--- | :--- | :--- |
| **API Cost** | **100% FREE (₹0/mo)** | **₹499 + GST / month** |
| **Static IP Requirement** | **Register Public IPv4** (Self-service via portal) | **Mandatory Static IP Whitelist** |
| **Market Depth (5 Bids/Asks)** | **Yes (Full L2 Depth)** | Restricted / Beta |
| **Total Buy/Sell Quantities (TBQ/TSQ)** | **Yes (Live Exchange Data)** | Limited |
| **1-Click Login** | **Yes (via Client Code + MPIN + TOTP)** | Manual OAuth redirect |

Because Angel One provides **free market data** with no monthly charges and instant API key generation, it is the ideal broker API for MarketEye.

---

## 3 Simple Steps to Get Your Free Angel One API Key

### Step 1: Open the Angel One SmartAPI Portal
1. Open your browser and go to:  
   👉 **[https://smartapi.angelbroking.com/](https://smartapi.angelbroking.com/)**
2. Click **Login** / **Sign Up** (use your Angel One Demat registered mobile number or Client Code).

---

### Step 2: Create a Free Developer App
1. On the SmartAPI dashboard, click **"Create an App"** (or **"+ Create App"**).
2. Fill in the modal fields:
   - **App Name**: `MarketEye` (or `StockBuyer`)
   - **Redirect URL**: `https://www.google.com` *(or `https://smartapi.angelbroking.com` — Angel One requires a valid `https://` domain and blocks `localhost`)*
   - **Post back URL**: Leave empty (optional)
   - **Primary Static IP**: Enter your public IPv4 address (e.g. run `curl ifconfig.me` or search "what is my ip")
   - **Secondary Static IP**: Leave empty (optional)
3. Click **Add** / **Create App**.
4. Angel One will generate your **API Key** (e.g., `a7B8c9D...`).
5. Copy your **API Key**.

---

### Step 3: Connect in MarketEye (Two Easy Ways)

Open MarketEye at **[http://localhost:5173/](http://localhost:5173/)** and click the **Feed Mode badge** in the top header. Select **Angel One**.

#### Method A: ⚡ 1-Click Login (Recommended — Zero Daily Copy-Pasting)
Fill in the 4 boxes directly inside the MarketEye settings modal:
1. **Angel Client Code**: Your Angel One User ID (e.g. `A123456`)
2. **MPIN / Password**: Your 4-digit Angel One trading PIN
3. **TOTP**: The 6-digit code currently showing in your Google Authenticator or Angel One app
4. **SmartAPI API Key**: The API Key copied from Step 2
5. Click **"Log In & Connect Angel One Live Feed"**

MarketEye will securely authenticate with Angel One, acquire your daily session token, and immediately start streaming live NSE quotes and order-book depth!

---

#### Method B: Paste Existing JWT Session Token
If you already generated a JWT token via the SmartAPI portal or Python script:
1. Paste your **SmartAPI API Key**.
2. Paste your **JWT Session Token** into the token box.
3. Click **Apply & Connect Feed**.

---

## What Happens When Connected?
* The top header badge turns bright green: **`LIVE FEED (NSE)`**.
* Real-time Total Buy Quantity (TBQ) and Total Sell Quantity (TSQ) stream from the exchange.
* The **60/40 Scanner Rule Engine** evaluates real buy/sell volume imbalances and triggers immediate alerts for trading opportunities.
