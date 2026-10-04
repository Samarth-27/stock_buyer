"""
MarketEye Real-Data Ingestion Script
Fetches 5 years of daily OHLCV candlestick data for all 25 monitored NSE equities
using Yahoo Finance (.NS tickers) and prepares clean historical datasets for model training.
"""

import os
import sys
import time

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import pandas as pd
import yfinance as yf

# 25 Core NSE Equities monitored in MarketEye
NSE_SYMBOLS = [
    'RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'ICICIBANK',
    'TATAMOTORS', 'SBIN', 'BHARTIARTL', 'ITC', 'KOTAKBANK',
    'LT', 'BAJFINANCE', 'MARUTI', 'TITAN', 'SUNPHARMA',
    'ASIANPAINT', 'HINDUNILVR', 'AXISBANK', 'WIPRO', 'NTPC',
    'TATASTEEL', 'POWERGRID', 'M&M', 'COALINDIA', 'ADANIENT'
]

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
os.makedirs(DATA_DIR, exist_ok=True)

def fetch_symbol_data(symbol: str, period: str = '5y') -> pd.DataFrame:
    ticker_str = f"{symbol}.NS"
    print(f"[{symbol}] Downloading {period} daily OHLCV from NSE ({ticker_str})...")
    
    try:
        ticker = yf.Ticker(ticker_str)
        df = ticker.history(period=period, interval='1d', auto_adjust=True)
        
        if df.empty or len(df) < 50:
            print(f"[WARN] [{symbol}] Insufficient data returned ({len(df)} rows).")
            return pd.DataFrame()
            
        # Clean columns and index
        df = df.reset_index()
        # Normalize date column
        if 'Date' in df.columns:
            df['Date'] = pd.to_datetime(df['Date']).dt.tz_localize(None)
        
        # Keep standard OHLCV
        required_cols = ['Date', 'Open', 'High', 'Low', 'Close', 'Volume']
        available_cols = [c for c in required_cols if c in df.columns]
        df = df[available_cols].copy()
        
        # Add metadata
        df['Symbol'] = symbol
        df = df.sort_values('Date').reset_index(drop=True)
        
        # Save individual symbol file
        symbol_file = os.path.join(DATA_DIR, f"{symbol}_daily.csv")
        df.to_csv(symbol_file, index=False)
        print(f"[OK] [{symbol}] Successfully saved {len(df)} daily bars ({df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')})")
        return df
        
    except Exception as e:
        print(f"[ERROR] [{symbol}] Error downloading data: {e}")
        return pd.DataFrame()

def main():
    print("=" * 70)
    print("MarketEye Machine Learning Pipeline - Historical Data Ingestion")
    print(f"Target Universe: {len(NSE_SYMBOLS)} Core NSE Equities")
    print(f"Destination: {DATA_DIR}")
    print("=" * 70)
    
    all_dfs = []
    start_time = time.time()
    
    for symbol in NSE_SYMBOLS:
        df = fetch_symbol_data(symbol, period='5y')
        if not df.empty:
            all_dfs.append(df)
        time.sleep(0.3)  # Gentle rate limit
        
    if not all_dfs:
        print("[ERROR] No data could be fetched. Please check internet connection.")
        sys.exit(1)
        
    combined_df = pd.concat(all_dfs, ignore_index=True)
    combined_file = os.path.join(DATA_DIR, 'nse_swing_historical_5y.csv')
    combined_df.to_csv(combined_file, index=False)
    
    elapsed = time.time() - start_time
    print("=" * 70)
    print(f"[SUCCESS] Data Ingestion Complete in {elapsed:.1f}s!")
    print(f"Total Datapoints: {len(combined_df):,} daily bars across {len(all_dfs)} NSE equities.")
    print(f"Consolidated file saved: {combined_file}")
    print("=" * 70)

if __name__ == '__main__':
    main()
