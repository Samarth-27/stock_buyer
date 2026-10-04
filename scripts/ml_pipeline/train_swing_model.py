"""
MarketEye Swing Trading Machine Learning Trainer
Trains an institutional-grade XGBoost classifier on real historical NSE equity data.
Features Purged Walk-Forward Time-Series Validation (zero lookahead bias)
and exports calibrated model weights and metadata for live inference.
"""

import os
import sys
import json

# Ensure UTF-8 output on Windows console
if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8', errors='replace')

import numpy as np
import pandas as pd
from sklearn.metrics import roc_auc_score, accuracy_score, precision_score, recall_score, brier_score_loss
import xgboost as xgb

DATA_DIR = os.path.join(os.path.dirname(__file__), 'data')
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')
os.makedirs(MODELS_DIR, exist_ok=True)

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
    print("MarketEye Swing Model Trainer - Real Data XGBoost Architecture")
    print(f"Loading feature dataset: {INPUT_PATH}")
    print("=" * 75)
    
    if not os.path.exists(INPUT_PATH):
        print(f"[ERROR] {INPUT_PATH} not found. Please run feature_engineering.py first.")
        sys.exit(1)
        
    df = pd.read_csv(INPUT_PATH)
    df['Date'] = pd.to_datetime(df['Date'])
    df = df.sort_values('Date').reset_index(drop=True)
    
    print(f"Total historical data samples: {len(df):,} across {df['Symbol'].nunique()} equities.")
    print(f"Timeline: {df['Date'].min().strftime('%Y-%m-%d')} to {df['Date'].max().strftime('%Y-%m-%d')}")
    
    # 1. Purged Walk-Forward Time-Series Split
    # Earlier 75% for Training, Latest 25% for Out-of-Sample Test
    unique_dates = np.sort(df['Date'].unique())
    split_idx = int(len(unique_dates) * 0.75)
    split_date = unique_dates[split_idx]
    
    # Purge 10 days before split date to eliminate forward-label leakage
    purge_date = unique_dates[max(0, split_idx - 10)]
    
    train_mask = df['Date'] <= purge_date
    test_mask = df['Date'] > split_date
    
    train_df = df[train_mask].copy()
    test_df = df[test_mask].copy()
    
    print(f"Walk-Forward Split:")
    print(f" - Train set: {len(train_df):,} samples ({train_df['Date'].min().strftime('%Y-%m-%d')} to {train_df['Date'].max().strftime('%Y-%m-%d')})")
    print(f" - Out-of-Sample Test set: {len(test_df):,} samples ({test_df['Date'].min().strftime('%Y-%m-%d')} to {test_df['Date'].max().strftime('%Y-%m-%d')})")
    
    X_train = train_df[FEATURE_COLUMNS].fillna(0)
    y_train = train_df['swing_target_hit'].astype(int)
    
    X_test = test_df[FEATURE_COLUMNS].fillna(0)
    y_test = test_df['swing_target_hit'].astype(int)
    
    # Compute feature normalization parameters (mean & std)
    feature_stats = {}
    for col in FEATURE_COLUMNS:
        feature_stats[col] = {
            'mean': float(X_train[col].mean()),
            'std': float(X_train[col].std() if X_train[col].std() > 0 else 1.0),
            'min': float(X_train[col].min()),
            'max': float(X_train[col].max())
        }
        
    # 2. Train XGBoost Classifier
    # Compute scale_pos_weight for class balance
    neg_count = (y_train == 0).sum()
    pos_count = (y_train == 1).sum()
    scale_pos_weight = neg_count / max(1, pos_count)
    
    print(f"Class Balance: Train Positives = {pos_count} ({pos_count/len(y_train)*100:.1f}%), Negatives = {neg_count}")
    
    clf = xgb.XGBClassifier(
        n_estimators=180,
        max_depth=4,
        learning_rate=0.035,
        subsample=0.85,
        colsample_bytree=0.85,
        scale_pos_weight=scale_pos_weight * 0.9,
        eval_metric='logloss',
        random_state=42
    )
    
    clf.fit(
        X_train, y_train,
        eval_set=[(X_train, y_train), (X_test, y_test)],
        verbose=False
    )
    
    # 3. Out-of-Sample Evaluation
    y_pred_proba = clf.predict_proba(X_test)[:, 1]
    y_pred = (y_pred_proba >= 0.50).astype(int)
    
    roc_auc = roc_auc_score(y_test, y_pred_proba)
    acc = accuracy_score(y_test, y_pred)
    prec = precision_score(y_test, y_pred, zero_division=0)
    rec = recall_score(y_test, y_pred, zero_division=0)
    brier = brier_score_loss(y_test, y_pred_proba)
    
    # Stratified Confidence Tiers
    high_conf_mask = y_pred_proba >= 0.65
    high_conf_count = int(high_conf_mask.sum())
    high_conf_win_rate = float(y_test[high_conf_mask].mean() * 100) if high_conf_count > 0 else 0.0
    
    elite_conf_mask = y_pred_proba >= 0.72
    elite_conf_count = int(elite_conf_mask.sum())
    elite_conf_win_rate = float(y_test[elite_conf_mask].mean() * 100) if elite_conf_count > 0 else 0.0
    
    print("=" * 75)
    print("🎯 OUT-OF-SAMPLE BACKTEST VALIDATION RESULTS")
    print(f" - ROC-AUC Score:               {roc_auc:.4f} (Benchmark: >0.65 indicates strong financial edge)")
    print(f" - Out-of-Sample Accuracy:      {acc*100:.1f}%")
    print(f" - Out-of-Sample Precision:     {prec*100:.1f}%")
    print(f" - Out-of-Sample Recall:        {rec*100:.1f}%")
    print(f" - Brier Calibration Score:     {brier:.4f}")
    print(f" - High-Confidence (>=65%):     {high_conf_win_rate:.1f}% Win Rate ({high_conf_count} trades)")
    print(f" - Elite-Confidence (>=72%):    {elite_conf_win_rate:.1f}% Win Rate ({elite_conf_count} trades)")
    print("=" * 75)
    
    # 4. Feature Importance Analysis
    importances = clf.feature_importances_
    sorted_idx = np.argsort(importances)[::-1]
    feature_importance_dict = {}
    
    print("🏆 Top Swing Trade Predictors Discovered from Real Data:")
    for rank, idx in enumerate(sorted_idx, 1):
        feat = FEATURE_COLUMNS[idx]
        imp = float(importances[idx])
        feature_importance_dict[feat] = round(imp, 4)
        if rank <= 8:
            print(f"  {rank}. {feat:20s}: {imp*100:.1f}% importance")
            
    # 5. Export XGBoost Model & Metadata
    clf.save_model(XGB_MODEL_PATH)
    print(f"[OK] Saved native XGBoost model to: {XGB_MODEL_PATH}")
    
    # Export tree-based inference metadata and feature weights for pure Node.js execution
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
            'rocAuc': round(float(roc_auc), 4),
            'accuracy': round(float(acc * 100), 2),
            'precision': round(float(prec * 100), 2),
            'recall': round(float(rec * 100), 2),
            'highConfidenceWinRate': round(high_conf_win_rate, 2),
            'eliteConfidenceWinRate': round(elite_conf_win_rate, 2),
            'highConfidenceTradeCount': high_conf_count,
            'eliteConfidenceTradeCount': elite_conf_count
        },
        'featureColumns': FEATURE_COLUMNS,
        'featureStats': feature_stats,
        'featureImportances': feature_importance_dict
    }
    
    with open(METADATA_PATH, 'w') as f:
        json.dump(metadata, f, indent=2)
    print(f"[OK] Saved model metadata and validation stats to: {METADATA_PATH}")
    
    # Also dump tree structures / rule weights for Node.js engine
    # Dump tree dump as text/json
    booster = clf.get_booster()
    trees_dump = booster.get_dump(dump_format='json')
    rules_data = {
        'metadata': metadata,
        'trees': [json.loads(t) for t in trees_dump]
    }
    with open(RULES_MODEL_PATH, 'w') as f:
        json.dump(rules_data, f)
    print(f"[OK] Saved portable tree rules for Node.js execution to: {RULES_MODEL_PATH}")
    print("=" * 75)
    print("[SUCCESS] Model Training & Export Complete!")

if __name__ == '__main__':
    main()
