# 🚀 Deploying MarketEye Backend to Render.com

This guide provides step-by-step instructions to deploy the **MarketEye Backend API & WebSocket Server** (`apps/api`) to **[Render.com](https://render.com)** for free.

Deploying to Render allows your live GitHub Pages frontend ([https://samarth-27.github.io/stock_buyer/](https://samarth-27.github.io/stock_buyer/)) to connect to a live cloud backend over secure HTTPS/WSS, scan all **2,692 NSE equities** in real-time, and authenticate with **Angel One SmartAPI** or **Upstox** from any device.

---

## ⚡ Option 1: 1-Click Blueprint Deployment (Recommended)

MarketEye includes a pre-configured `render.yaml` Blueprint in the repository root.

1. **Sign Up / Log In**:
   - Go to [https://render.com](https://render.com) and sign in with your GitHub account.

2. **Create New Blueprint Instance**:
   - Click the **"New +"** button in the top right of the Render Dashboard.
   - Select **"Blueprint"**.
   - Connect your GitHub repository: `Samarth-27/stock_buyer`.
   - Render will automatically detect `render.yaml` and configure the service:
     - **Service Name**: `marketeye-api`
     - **Environment**: `Node`
     - **Plan**: `Free`
     - **Build Command**: `npm install && npm run build:api`
     - **Start Command**: `node apps/api/dist/server.js`
     - **Health Check**: `/api/health`
     - **Region**: Singapore (lowest latency to NSE India servers)

3. **Click "Apply"**:
   - Render will build and deploy the backend service.
   - Once deployment finishes, Render gives you a public URL, for example:  
     `https://marketeye-api-xxxx.onrender.com`

---

## ⚡ Option 2: Manual Web Service Deployment

If you prefer to configure manually:

1. On the Render Dashboard, click **New +** → **Web Service**.
2. Select your repository `Samarth-27/stock_buyer`.
3. Fill in the following settings:
   - **Name**: `marketeye-api`
   - **Region**: Singapore (or Oregon / Frankfurt)
   - **Branch**: `main`
   - **Root Directory**: *(leave blank)*
   - **Runtime**: `Node`
   - **Build Command**: `npm install && npm run build:api`
   - **Start Command**: `node apps/api/dist/server.js`
   - **Instance Type**: `Free`
4. In **Advanced** → **Environment Variables**, add:
   - `NODE_ENV`: `production`
   - `PORT`: `10000`
   - `CORS_ORIGIN`: `https://samarth-27.github.io`
   - `MARKET_DATA_MODE`: `mock` *(or set broker credentials below)*
5. Click **Create Web Service**.

---

## 🔗 Connecting Your GitHub Pages Frontend to Render

Once your Render Web Service is running:

1. Open your live MarketEye web dashboard on GitHub Pages:  
   👉 **[https://samarth-27.github.io/stock_buyer/](https://samarth-27.github.io/stock_buyer/)**
2. Click the **Feed Mode Badge** (top right header, labeled `DEMO / MOCK` or `AWAITING CREDENTIALS`).
3. Under the **Backend Server API** card, click **"Configure"**.
4. Paste your Render URL into the input:  
   `https://marketeye-api-xxxx.onrender.com`
5. Click **"Test & Save"**.
6. The dashboard will verify connectivity, display a green checkmark `✓ Connected to Render cloud backend!`, and automatically establish real-time WebSocket streams (`wss://marketeye-api-xxxx.onrender.com/ws`).

---

## 🔑 (Optional) Setting Angel One Credentials on Render

You can enter your credentials securely in the web dashboard, OR permanently configure them in Render so the backend boots directly into Angel One live scanning:

In the Render Dashboard → Your Web Service → **Environment**:
* `ANGEL_CLIENT_CODE`: Your Angel One client ID (e.g. `P123456`)
* `ANGEL_PIN`: Your 4-digit MPIN
* `ANGEL_TOTP_KEY`: Your alphanumeric TOTP seed key from Angel One SmartAPI portal
* `ANGEL_API_KEY`: Your SmartAPI Historical / Trading API key
* `MARKET_DATA_MODE`: `angel`

When these are set, MarketEye will automatically generate a fresh TOTP, log in to Angel One, and begin continuously scanning all 2,692 NSE equities across 54 rotating batches!

---

## 💡 Free Tier Notes (Cold Starts)

* **Inactivity Spin-Down**: Render's free tier spins down web services after 15 minutes of inactivity.
* **Waking Up**: The first request after sleep takes approximately 30–50 seconds to boot.
* **Keep-Alive**: You can use a free uptime monitoring service like [UptimeRobot](https://uptimerobot.com) to ping `https://your-service.onrender.com/api/health` every 10 minutes to keep your backend warm 24/7.
