"""
MarketEye Swing Setup Specific Trainer
Focuses training specifically on candidate swing trading trigger moments
(Stage 2 Breakout, 20 EMA Pullback, Volume Squeeze) rather than inactive chop days.
Produces high-precision win probabilities and expected return estimators.
"""

import os
import sys
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score
import xgboost as xgb

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
INPUT_PATH = os.path.join(DATA_DIR, 'nse_swing_features.csv')
METADATA_PATH = os.path.join(MODELS_DIR, 'swing_model_metadata.json')
XGB_MODEL_PATH = os.path.join(MODELS_DIR, 'swing_xgb_model.json')
RULES_MODEL_PATH = os.path.join(MODELS_DIR, 'swing_model_rules.json')

FEATURE_COLUMNS = [
    'ema20_dist',
    'ema50_dist',
    'ema200_dist',
    'ema_trend_aligned',
    'ema20_slope_5d',
    'rsi14',
    'atr_pct',
    'dist_20d_high',
    'dist_52w_high',
    'volume_surge',
    'body_ratio',
    'lower_wick_ratio',
    'upper_wick_ratio',
    'is_green',
    'ret_3d',
    'ret_5d',
    'ret_10d',
    'ret_20d'
]

def main():
    print("=" * 75)
    print("MarketEye Swing Setup Trainer (Targeted Trigger Conditioning)")
    print("=" * 75)
    
    df = pd.read_csv(INPUT_PATH)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date').reset_index(drop=True)
    
    # Define candidate swing trade triggers:
    # 1. Breakout trigger: testing within 2% of 20-day high with price > 50 EMA
    # 2. Pullback trigger: within 2.5% of 20 EMA in uptrend (close > 50 EMA)
    # 3. Volume expansion trigger: volume surge >= 1.25x
    is_breakout = (df['dist_20d_high'] >= -2.0) & (df['Close'] > df['ema50'])
    is_pullback = (df['ema20_dist'].abs() <= 2.5) & (df['Close'] > df['ema50']) & (df['ema20_slope_5d'] >= -0.5)
    is_volume_expansion = (df['volume_surge'] >= 1.25) & (df['Close'] > df['ema200'])
    
    setup_mask = is_breakout | is_pullback | is_volume_expansion
    df_setups = df[setup_mask].copy().reset_index(drop=True)
    
    print(f"Total historical bars: {len(df):,}")
    print(f"Candidate Swing Setups extracted: {len(df_setups):,} ({len(df_setups)/len(df)*100:.1f}% of market days)")
    
    # Chronological Walk-Forward Train/Test Split (75% / 25%)
    unique_dates = np.sort(df_setups['Date'].unique())
    split_idx = int(len(unique_dates) * 0.75)
    split_date = unique_dates[split_idx]
    purge_date = unique_dates[max(0, split_idx - 10)]
    
    train_mask = df_setups['Date'] <= purge_date
    test_mask = df_setups['Date'] > split_date
    
    train_df = df_setups[train_mask].copy()
    test_df = df_setups[test_mask].copy()
    
    print(f"Train samples: {len(train_df):,} | Test samples: {len(test_df):,}")
    
    X_train = train_df[FEATURE_COLUMNS].fillna(0)
    y_train = train_df['swing_target_hit'].astype(int)
    
    X_test = test_df[FEATURE_COLUMNS].fillna(0)
    y_test = test_df['swing_target_hit'].astype(int)
    
    # Calculate feature normalization stats
    feature_stats = {}
    for col in FEATURE_COLUMNS:
        feature_stats[col] = {
            'mean': float(X_train[col].mean()),
            'std': float(X_train[col].std() if X_train[col].std() > 0 else 1.0),
            'min': float(X_train[col].min()),
            'max': float(X_train[col].max())
        }
        
    pos_train = (y_train == 1).sum()
    neg_train = (y_train == 0).sum()
    scale_weight = neg_train / max(1, pos_train)
    print(f"Train Base Win Rate: {pos_train / len(y_train) * 100:.1f}%")
    
    # Train tuned XGBoost model with regularization to prevent overfitting
    model = xgb.XGBClassifier(
        n_estimators=120,
        max_depth=3,
        learning_rate=0.03,
        subsample=0.8,
        colsample_bytree=0.8,
        reg_alpha=0.5,
        reg_lambda=1.5,
        scale_pos_weight=scale_weight * 0.85,
        eval_metric='logloss',
        random_state=42
    )
    
    model.fit(X_train, y_train, eval_set=[(X_train, y_train), (X_test, y_test)], verbose=False)
    
    # Predict probabilities
    y_pred_proba = model.predict_proba(X_test)[:, 1]
    
    # Backtest win rates across probability quintiles
    q50_mask = y_pred_proba >= 0.50
    q60_mask = y_pred_proba >= 0.60
    q68_mask = y_pred_proba >= 0.68
    
    base_test_rate = float(y_test.mean() * 100)
    win_q50 = float(y_test[q50_mask].mean() * 100) if q50_mask.sum() > 0 else 0
    win_q60 = float(y_test[q60_mask].mean() * 100) if q60_mask.sum() > 0 else 0
    win_q68 = float(y_test[q68_mask].mean() * 100) if q68_mask.sum() > 0 else 0
    
    roc_auc = float(roc_auc_score(y_test, y_pred_proba))
    
    print("=" * 75)
    print("🎯 OUT-OF-SAMPLE SETUP PERFORMANCE")
    print(f" - Out-of-Sample Base Rate:         {base_test_rate:.1f}%")
    print(f" - Model Win Rate (Score >= 50%):   {win_q50:.1f}% ({q50_mask.sum()} trades)")
    print(f" - Model Win Rate (Score >= 60%):   {win_q60:.1f}% ({q60_mask.sum()} trades)")
    print(f" - Elite Win Rate (Score >= 68%):   {win_q68:.1f}% ({q68_mask.sum()} trades)")
    print(f" - ROC-AUC Score:                   {roc_auc:.4f}")
    print("=" * 75)
    
    # Top Feature Importances
    importances = model.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    feature_importance_dict = {}
    print("🏆 Top Predictive Swing Features:")
    for rank, idx in enumerate(sorted_idx, 1):
        feat = FEATURE_COLUMNS[idx]
        imp = float(importances[idx])
        feature_importance_dict[feat] = round(imp, 4)
        if rank <= 6:
            print(f"  {rank}. {feat:20s}: {imp*100:.1f}%")
            
    # Save models
    model.save_model(XGB_MODEL_PATH)
    
    metadata = {
        'modelName': 'MarketEye Swing Trade Real-Data Engine',
        'algorithm': 'XGBoost (Extreme Gradient Boosted Decision Trees)',
        'targetHorizon': '10 Trading Days',
        'targetProfit': '+7.5%',
        'stopLoss': '-2.5%',
        'trainingTimeline': {
            'start': train_df['Date'].min().strftime('%Y-%m-%d'),
            'end': train_df['Date'].max().strftime('%Y-%m-%d'),
            'samples': int(len(train_df))
        },
        'testTimeline': {
            'start': test_df['Date'].min().strftime('%Y-%m-%d'),
            'end': test_df['Date'].max().strftime('%Y-%m-%d'),
            'samples': int(len(test_df))
        },
        'performanceMetrics': {
            'rocAuc': round(roc_auc, 4),
            'baseWinRate': round(base_test_rate, 2),
            'modelWinRate60': round(win_q60, 2),
            'modelWinRate68': round(win_q68, 2),
            'tradesEvaluated': int(len(test_df)),
            'highConfidenceTrades': int(q60_mask.sum())
        },
        'featureColumns': FEATURE_COLUMNS,
        'featureStats': feature_stats,
        'featureImportances': feature_importance_dict
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
        
    booster = model.get_booster()
    trees_dump = booster.get_dump(dump_format='json')
    rules_data = {
        'metadata': metadata,
        'trees': [json.loads(t) for t in trees_dump]
    }
    with open(RULES_MODEL_PATH, 'w') as f:
        json.dump(rules_data, f)
        
    print(f"[SUCCESS] Exported production models and metadata to {MODELS_DIR}")
    print("=" * 75)

if __name__ == '__main__':
    main()
