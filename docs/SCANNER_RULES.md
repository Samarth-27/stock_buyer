# Scanner Engine & Rule Specifications

## 1. Scanner Philosophy

MarketEye surfaces stocks based on objective, quantitative market metrics derived from open order-book quantities. It operates strictly as an **analytical filter**, not a trade recommendation engine.

---

## 2. Order Book Imbalance Calculation

Let:
- $Q_{buy} \in \mathbb{R}_{\ge 0}$ be the Total Buy Quantity (cumulative volume of all pending bid orders across the exchange book).
- $Q_{sell} \in \mathbb{R}_{\ge 0}$ be the Total Sell Quantity (cumulative volume of all pending ask orders across the exchange book).

Total Order Quantity:
$$Q_{total} = Q_{buy} + Q_{sell}$$

Buy Percentage:
$$P_{buy} = \begin{cases} 
\frac{Q_{buy}}{Q_{total}} \times 100 & \text{if } Q_{total} > 0 \\
0 & \text{if } Q_{total} = 0 
\end{cases}$$

Sell Percentage:
$$P_{sell} = \begin{cases} 
\frac{Q_{sell}}{Q_{total}} \times 100 & \text{if } Q_{total} > 0 \\
0 & \text{if } Q_{total} = 0 
\end{cases}$$

### Invariant:
For all valid books where $Q_{total} > 0$:
$$P_{buy} + P_{sell} = 100.00\% \pm 0.01\% \text{ (accounting for IEEE 754 floating point rounding)}$$

---

## 3. Initial Scanner Rule: Buy Pressure

### Rule Identifier: `BUY_PRESSURE`
* **Description**: Detects securities where buy-side order book depth significantly outweighs sell-side order book depth.
* **Default Parameters**:
  - `buyThreshold`: $60.0\%$ (configurable in range $[50.0, 95.0]$)
  - `sellThreshold`: $40.0\%$ (configurable in range $[5.0, 50.0]$)
  - `minVolume`: $10,000$ shares (to filter out illiquid securities)
  - `minPriceChange`: $-100.0\%$ (no minimum filter by default)

### Evaluation Logic:
A stock qualifies if and only if:
$$P_{buy} \ge \text{buyThreshold} \quad \land \quad P_{sell} \le \text{sellThreshold} \quad \land \quad \text{Volume} \ge \text{minVolume}$$

### Explanation Generator:
Whenever a stock triggers this rule, the engine generates an explicit, human-readable reason:
> *"Buy quantity reached 64.2%, exceeding your 60.0% threshold (Sell quantity is 35.8% with total volume of 1,245,800 shares)."*

---

## 4. Extensible Rule Architecture

MarketEye is designed to support additional market conditions:

### Future Planned Rules:
1. **Extreme Buy Imbalance (`EXTREME_BUY`)**:
   - `buyThreshold >= 75.0%`, `sellThreshold <= 25.0%`
2. **Sell Pressure Imbalance (`SELL_PRESSURE`)**:
   - `sellThreshold >= 60.0%`, `buyThreshold <= 40.0%`
3. **Volume Surge with Buy Pressure (`VOLUME_SURGE_BUY`)**:
   - `buyThreshold >= 60.0%` AND current volume $\ge 2.5 \times$ 20-day average volume.
4. **Order Book Depth Convergence (`DEPTH_CONVERGENCE`)**:
   - Top-5 bid depth volume exceeds top-5 ask depth volume by $\ge 3:1$.

---

## 5. Edge Case & Data Quality Handling

| Scenario | System Behavior | Surfaced? | Explanation / Tag |
| :--- | :--- | :--- | :--- |
| $Q_{buy} = 0 \land Q_{sell} = 0$ | $P_{buy} = 0, P_{sell} = 0$ | No | `NO_ORDER_DATA` |
| $Q_{buy} > 0 \land Q_{sell} = 0$ | $P_{buy} = 100\%, P_{sell} = 0\%$ | Yes (if meets volume) | *"Zero sell orders pending; 100% buy orders."* |
| Data age $> 15$ seconds | Flagged as `STALE` | No | Retained in cache with warning indicator |
| Negative or NaN quantities | Logged as data anomaly, tick discarded | No | `MALFORMED_DATA` |
