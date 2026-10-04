"""
MarketEye Real-Data Feature Engineering & Labeling
Computes quantitative multi-day swing trading indicators and implements
Marcos López de Prado's Triple Barrier Method for institutional swing trade outcomes.
"""

import os
import sys

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import numpy as np
import pandas as pd

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
RAW_DATA_PATH = os.path.join(DATA_DIR, 'nse_swing_historical_5y.csv')
OUTPUT_PATH = os.path.join(DATA_DIR, 'nse_swing_features.csv')

def calculate_rsi(series: pd.Series, period: int = 14) -> pd.Series:
    delta = series.diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)
    
    avg_gain = gain.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    avg_loss = loss.ewm(alpha=1/period, min_periods=period, adjust=False).mean()
    
    rs = avg_gain / (avg_loss + 1e-9)
    rsi = 100 - (100 / (1 + rs))
    return rsi

def compute_atr(high: pd.Series, low: pd.Series, close: pd.Series, period: int = 14) -> pd.Series:
    prev_close = close.shift(1)
    tr1 = high - low
    tr2 = (high - prev_close).abs()
    tr3 = (low - prev_close).abs()
    tr = pd.concat([tr1, tr2, tr3], axis=1).max(axis=1)
    atr = tr.rolling(period).mean()
    return atr

def engineer_features_for_symbol(df: pd.DataFrame) -> pd.DataFrame:
    df = df.sort_values('Date').reset_index(drop=True)
    c = df['Close']
    h = df['High']
    l = df['Low']
    o = df['Open']
    v = df['Volume']
    
    # 1. Moving Averages & Trend Regimes
    df['ema20'] = c.ewm(span=20, adjust=False).mean()
    df['ema50'] = c.ewm(span=50, adjust=False).mean()
    df['ema200'] = c.ewm(span=200, adjust=False).mean()
    
    df['ema20_dist'] = ((c - df['ema20']) / df['ema20']) * 100
    df['ema50_dist'] = ((c - df['ema50']) / df['ema50']) * 100
    df['ema200_dist'] = ((c - df['ema200']) / df['ema200']) * 100
    df['ema_trend_aligned'] = ((df['ema20'] > df['ema50']) & (df['ema50'] > df['ema200'])).astype(int)
    
    # 2. Moving Average Slope (Momentum of the Trend)
    df['ema20_slope_5d'] = ((df['ema20'] - df['ema20'].shift(5)) / df['ema20'].shift(5)) * 100
    
    # 3. Momentum & Volatility
    df['rsi14'] = calculate_rsi(c, period=14)
    df['atr14'] = compute_atr(h, l, c, period=14)
    df['atr_pct'] = (df['atr14'] / c) * 100
    
    # 4. Breakout & Proximity to Key Multi-Week Highs
    rolling_high_20 = h.rolling(20).max()
    rolling_high_252 = h.rolling(252).max()
    df['dist_20d_high'] = ((c - rolling_high_20) / rolling_high_20) * 100
    df['dist_52w_high'] = ((c - rolling_high_252) / rolling_high_252) * 100
    
    # 5. Volume Expansion
    vol_sma20 = v.rolling(20).mean()
    df['volume_surge'] = v / (vol_sma20 + 1e-6)
    
    # 6. Price Action Candlestick Characteristics
    candle_range = (h - l).replace(0, 1e-6)
    df['body_ratio'] = (c - o).abs() / candle_range
    df['lower_wick_ratio'] = (np.minimum(o, c) - l) / candle_range
    df['upper_wick_ratio'] = (h - np.maximum(o, c)) / candle_range
    df['is_green'] = (c > o).astype(int)
    
    # 7. Past Cumulative Returns
    df['ret_3d'] = ((c - c.shift(3)) / c.shift(3)) * 100
    df['ret_5d'] = ((c - c.shift(5)) / c.shift(5)) * 100
    df['ret_10d'] = ((c - c.shift(10)) / c.shift(10)) * 100
    df['ret_20d'] = ((c - c.shift(20)) / c.shift(20)) * 100

    # 8. Dynamic ATR Volatility-Scaled Triple Barrier Method
    # Target: Entry + 2.2 * ATR(14) (Dynamic profit target adapted to stock volatility)
    # Stop:   Entry - 1.0 * ATR(14) (Dynamic stop loss anchored below average volatility)
    # Risk/Reward Ratio: 2.2 : 1
    # Holding Horizon: 10 Trading Days
    HOLDING_BARS = 10
    
    labels = []
    forward_mfe = []
    forward_mae = []
    forward_returns = []
    
    n = len(df)
    for i in range(n):
        if i + HOLDING_BARS >= n:
            labels.append(np.nan)
            forward_mfe.append(np.nan)
            forward_mae.append(np.nan)
            forward_returns.append(np.nan)
            continue
            
        entry_price = c.iloc[i]
        curr_atr = df['atr14'].iloc[i]
        if np.isnan(curr_atr) or curr_atr <= 0:
            curr_atr = entry_price * 0.02
            
        target_price = entry_price + (curr_atr * 2.2)
        stop_price = entry_price - (curr_atr * 1.0)
        
        outcome_label = 0
        resolved = False
        
        # Track excursion over holding window
        future_highs = h.iloc[i+1 : i+1+HOLDING_BARS]
        future_lows = l.iloc[i+1 : i+1+HOLDING_BARS]
        future_close = c.iloc[i+HOLDING_BARS]
        
        mfe = (future_highs.max() - entry_price) / entry_price * 100
        mae = (future_lows.min() - entry_price) / entry_price * 100
        fwd_ret = (future_close - entry_price) / entry_price * 100
        
        # Check day-by-day barrier triggers
        for step in range(1, HOLDING_BARS + 1):
            day_high = h.iloc[i + step]
            day_low = l.iloc[i + step]
            
            # Did day touch stop loss?
            hit_stop = day_low <= stop_price
            # Did day touch target?
            hit_target = day_high >= target_price
            
            if hit_target and not hit_stop:
                outcome_label = 1
                resolved = True
                break
            elif hit_stop:
                outcome_label = 0
                resolved = True
                break
                
        # If neither barrier was hit by end of window, reward if return >= +2.5%
        if not resolved:
            outcome_label = 1 if fwd_ret >= 2.5 else 0
            
        labels.append(outcome_label)
        forward_mfe.append(mfe)
        forward_mae.append(mae)
        forward_returns.append(fwd_ret)
        
    df['swing_target_hit'] = labels
    df['forward_mfe_pct'] = forward_mfe
    df['forward_mae_pct'] = forward_mae
    df['forward_ret_10d_pct'] = forward_returns
    
    return df

def main():
    print("=" * 70)
    print("MarketEye Feature Engineering & Triple Barrier Swing Labeling")
    print(f"Loading raw dataset: {RAW_DATA_PATH}")
    print("=" * 70)
    
    if not os.path.exists(RAW_DATA_PATH):
        print(f"[ERROR] {RAW_DATA_PATH} not found. Please run fetch_historical_data.py first.")
        sys.exit(1)
        
    df_raw = pd.read_csv(RAW_DATA_PATH)
    symbols = df_raw['Symbol'].unique()
    print(f"Found {len(symbols)} symbols in dataset: {list(symbols)}")
    
    processed_dfs = []
    for sym in symbols:
        sym_df = df_raw[df_raw['Symbol'] == sym].copy()
        if len(sym_df) < 250:
            print(f"Skipping {sym}, insufficient bars ({len(sym_df)})")
            continue
        feat_df = engineer_features_for_symbol(sym_df)
        processed_dfs.append(feat_df)
        print(f"Processed {sym}: {len(feat_df)} rows")
        
    combined = pd.concat(processed_dfs, ignore_index=True)
    # Drop warm-up period for 200 EMA and null labels
    clean_df = combined.dropna(subset=['ema200', 'swing_target_hit']).copy()
    clean_df.to_csv(OUTPUT_PATH, index=False)
    
    pos_samples = (clean_df['swing_target_hit'] == 1).sum()
    total_samples = len(clean_df)
    pos_rate = (pos_samples / total_samples) * 100
    
    print("=" * 70)
    print("[SUCCESS] Feature Engineering Complete!")
    print(f"Final Clean Samples: {total_samples:,}")
    print(f"Successful Swing Trade Setups (Target Hit): {pos_samples:,} ({pos_rate:.1f}%)")
    print(f"Features Generated: ema20_dist, ema50_dist, ema20_slope_5d, rsi14, atr_pct, dist_20d_high, volume_surge, body_ratio, etc.")
    print(f"Output saved to: {OUTPUT_PATH}")
    print("=" * 70)

if __name__ == '__main__':
    main()
