from datetime import datetime, timedelta, date
from typing import List, Dict, Any
import numpy as np

class ForecastingService:
    @staticmethod
    def forecast_spending(history: List[Dict[str, Any]], days_to_predict: int = 30) -> List[Dict[str, Any]]:
        """
        Predicts future daily transactions.
        If history is insufficient (Prophet needs at least a few data points, preferably weeks),
        we generate a standard mathematical moving-average and daily trend projection to ensure the dashboard
        remains visual and functional for demo purposes.
        """
        today = datetime.now().date()
        forecast_results = []
        
        # Scenario A: Empty or very little history (Demo/Bootstrap phase)
        if len(history) < 5:
            # Generate a realistic baseline spend (around 150K - 400K VND per day) with a slight weekly wave
            base_amount = 250000.0
            for i in range(1, days_to_predict + 1):
                prediction_date = today + timedelta(days=i)
                # Introduce a weekly seasonality (spend more on Friday, Saturday, Sunday)
                weekday = prediction_date.weekday()
                seasonality_factor = 1.0
                if weekday in [4, 5]: # Fri, Sat
                    seasonality_factor = 1.35
                elif weekday == 6: # Sun
                    seasonality_factor = 1.15
                else: # Mon-Thu
                    seasonality_factor = 0.85
                
                # Add random noise (±15%)
                noise = np.random.uniform(0.85, 1.15)
                predicted_amount = base_amount * seasonality_factor * noise
                
                forecast_results.append({
                    "date": prediction_date,
                    "predicted_amount": round(predicted_amount, -3) # Round to nearest 1000
                })
            return forecast_results

        # Scenario B: Enough history, we can perform a moving average/regression projection
        # or fall back to Facebook Prophet
        # --- PROPHET INTEGRATION TEMPLATE (Track 4) ---
        # 
        # def forecast_prophet(history_list):
        #     import pandas as pd
        #     from prophet import Prophet
        #     
        #     # 1. Convert history to Prophet format: ds (date), y (value)
        #     df = pd.DataFrame(history_list) # structure: [{'date': '2026-05-01', 'amount': 150000}]
        #     df.columns = ['ds', 'y']
        #     
        #     # 2. Fit Prophet model
        #     model = Prophet(yearly_seasonality=False, daily_seasonality=False)
        #     model.fit(df)
        #     
        #     # 3. Create future dataframe and predict
        #     future = model.make_future_dataframe(periods=days_to_predict)
        #     forecast = model.predict(future)
        #     
        #     # 4. Extract future predictions only
        #     predictions = forecast.tail(days_to_predict)[['ds', 'yhat']]
        #     return [{'date': r['ds'].date(), 'predicted_amount': max(0.0, r['yhat'])} for _, r in predictions.iterrows()]
        
        # Simple statistical projection for MVP base:
        amounts = [h["amount"] for h in history]
        avg_spend = sum(amounts) / len(amounts)
        
        for i in range(1, days_to_predict + 1):
            prediction_date = today + timedelta(days=i)
            # Baseline is moving average
            predicted_amount = avg_spend * np.random.uniform(0.9, 1.1)
            forecast_results.append({
                "date": prediction_date,
                "predicted_amount": round(predicted_amount, -3)
            })
            
        return forecast_results
