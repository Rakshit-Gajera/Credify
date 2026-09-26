from flask import Flask, jsonify, request
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import json
import os
from datetime import datetime

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))

# Load artifacts
print("Loading model and preprocessing data...")
model = joblib.load(os.path.join(BASE_DIR, 'model.pkl'))
with open(os.path.join(BASE_DIR, 'preprocessing.json'), 'r') as f:
    prep = json.load(f)

# Load dataset for insights (using a sample to avoid memory bloat)
csv_path = os.path.join(BASE_DIR, '..', 'Loan_default.csv')
if not os.path.exists(csv_path):
    csv_path = os.path.join(BASE_DIR, 'Loan_default.csv')

if os.path.exists(csv_path):
    df_full = pd.read_csv(csv_path)
    # Coerce numeric columns so stray strings become NaN instead of crashing int()
    for _col in ['Income', 'LoanAmount', 'CreditScore', 'Default']:
        if _col in df_full.columns:
            df_full[_col] = pd.to_numeric(df_full[_col], errors='coerce')
else:
    df_full = pd.DataFrame()

@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Credify API'}), 200

@app.route('/api/insights', methods=['GET'])
def get_insights():
    try:
        if df_full.empty:
            return jsonify({
                'kpis': {
                    'total_records': "0",
                    'default_rate': "0%",
                    'avg_loan_amount': "$0",
                    'avg_credit_score': "0"
                },
                'table_data': [],
                'default_dist': [],
                'loan_dist': []
            })

        # KPIs
        total_records = len(df_full)
        default_rate = (df_full['Default'].mean() * 100).round(1)
        avg_loan_amount = df_full['LoanAmount'].mean()
        avg_credit_score = df_full['CreditScore'].mean()

        # Table data (sample 6 records)
        sample = df_full.sample(min(6, len(df_full)), random_state=42)
        table_data = []
        def safe_int(val, fallback=0):
            try:
                return int(float(val))
            except (ValueError, TypeError):
                return fallback

        for i, (_, row) in enumerate(sample.iterrows(), 1):
            table_data.append({
                'id': i,
                'income': f"${safe_int(row['Income']):,}",
                'amount': f"${safe_int(row['LoanAmount']):,}",
                'score': safe_int(row['CreditScore']),
                'status': 'Default' if row['Default'] == 1 else 'No Default'
            })

        # Chart Data
        # Default distribution
        default_dist = [
            {'name': 'Non-Default', 'value': round(100 - default_rate, 1)},
            {'name': 'Default', 'value': default_rate}
        ]

        # Loan Amount Distribution (simple histogram bins)
        loan_hist, bin_edges = np.histogram(df_full['LoanAmount'].dropna(), bins=8)
        loan_dist = [int(x) for x in loan_hist]

        return jsonify({
            'kpis': {
                'total_records': f"{total_records:,}",
                'default_rate': f"{default_rate}%",
                'avg_loan_amount': f"${int(avg_loan_amount):,}",
                'avg_credit_score': f"{int(avg_credit_score)}"
            },
            'table_data': table_data,
            'default_dist': default_dist,
            'loan_dist': loan_dist
        })
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/evaluation', methods=['GET'])
def get_evaluation():
    try:
        eval_path = os.path.join(BASE_DIR, 'evaluation.json')
        if not os.path.exists(eval_path):
            return jsonify({'error': 'evaluation.json not found. Run Week_5.ipynb first.'}), 404
        with open(eval_path, 'r') as f:
            data = json.load(f)
        return jsonify(data)
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/metrics', methods=['GET'])
def get_metrics():
    try:
        metrics_path = os.path.join(BASE_DIR, 'metrics.json')
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        return jsonify(metrics)
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        history_path = os.path.join(BASE_DIR, 'history.json')
        if not os.path.exists(history_path):
            return jsonify([])
        with open(history_path, 'r') as f:
            history = json.load(f)
        # Return history descending (newest first)
        return jsonify(history[::-1])
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json or {}
        print("Received data:", data)

        def safe_float(val, fallback):
            if val is not None and str(val).strip() != '':
                try:
                    return float(val)
                except (ValueError, TypeError):
                    pass
            return float(fallback)

        # Create a single row DataFrame with missing values filled
        input_data = {}
        
        # Map all inputs to expected feature names
        # Numeric fields
        input_data['Age'] = safe_float(data.get('age'), prep['fill_values']['Age'])
        input_data['Income'] = safe_float(data.get('income'), prep['fill_values']['Income'])
        input_data['LoanAmount'] = safe_float(data.get('amount'), prep['fill_values']['LoanAmount'])
        input_data['InterestRate'] = safe_float(data.get('rate'), prep['fill_values']['InterestRate'])
        input_data['LoanTerm'] = safe_float(data.get('duration'), prep['fill_values']['LoanTerm'])
        input_data['CreditScore'] = safe_float(data.get('score'), prep['fill_values']['CreditScore'])
        input_data['MonthsEmployed'] = safe_float(data.get('months_employed'), prep['fill_values']['MonthsEmployed'])
        input_data['NumCreditLines'] = safe_float(data.get('credit_lines'), prep['fill_values']['NumCreditLines'])
        input_data['DTIRatio'] = safe_float(data.get('dti'), prep['fill_values']['DTIRatio'])

        # Categorical fields (binary handled by map logic below)
        if data.get('education'): input_data['Education'] = data.get('education')
        if data.get('employment'): input_data['EmploymentType'] = data.get('employment')
        if data.get('marital_status'): input_data['MaritalStatus'] = data.get('marital_status')
        if data.get('purpose'): input_data['LoanPurpose'] = data.get('purpose')
        
        # Binary categorical fields (these expect Yes/No which is mapped below)
        if data.get('dependents') is not None: input_data['HasDependents'] = data.get('dependents')
        if data.get('mortgage') is not None: input_data['HasMortgage'] = data.get('mortgage')
        if data.get('cosigner') is not None: input_data['HasCoSigner'] = data.get('cosigner')
        
        # Fill rest with medians/modes
        for feat, val in prep['fill_values'].items():
            if feat not in input_data:
                input_data[feat] = val

        df_input = pd.DataFrame([input_data])
        
        # 2. Outlier Clipping
        for col, limits in prep['clip_values'].items():
            if col in df_input.columns:
                df_input[col] = pd.to_numeric(df_input[col], errors='coerce').clip(lower=limits['lower'], upper=limits['upper'])

        # 3. Categorical encoding
        # Binary: Robustly map Yes/No, true/false, 1/0 regardless of pandas series dtype (str, object, int)
        binary_map = {
            'yes': 1, 'no': 0,
            'true': 1, 'false': 0,
            '1': 1, '0': 0
        }
        for col in prep['binary_cols']:
            if col in df_input.columns:
                df_input[col] = (
                    df_input[col]
                    .astype(str)
                    .str.strip()
                    .str.lower()
                    .map(binary_map)
                    .fillna(0)
                    .astype(int)
                )

        # One-hot encode
        df_input = pd.get_dummies(df_input, columns=prep['multi_cols'], drop_first=True, dtype=int)
        bool_cols = df_input.select_dtypes(include=['bool', 'boolean']).columns.tolist()
        if bool_cols:
            df_input[bool_cols] = df_input[bool_cols].astype(int)
        
        # Align columns with expected features (add missing dummies, drop extras)
        for col in prep['expected_features']:
            if col not in df_input.columns:
                df_input[col] = 0
        df_input = df_input[prep['expected_features']]

        # 4. Scaling
        for col in prep['scale_cols']:
            if col in df_input.columns and col in prep['scaler_stats']:
                mean = prep['scaler_stats'][col]['mean']
                std = prep['scaler_stats'][col]['std']
                df_input[col] = (df_input[col].astype(float) - mean) / std

        # 5. Predict
        X = df_input.values
        prob = float(model.predict_proba(X)[0][1])
        
        # Adjust logic as needed, standard threshold is 0.5
        is_high_risk = prob > 0.5
        
        result = {
            'risk': 'high' if is_high_risk else 'low',
            'confidence': f"{prob * 100:.1f}%",
            'message': 'Elevated Default Probability' if is_high_risk else 'Applicant is likely to repay'
        }
        
        # Save to history.json
        history_record = {
            'timestamp': datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            'inputs': data,
            'prediction': result
        }
        
        history_file = os.path.join(BASE_DIR, 'history.json')
        history_data = []
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r') as f:
                    history_data = json.load(f)
            except Exception:
                history_data = []
        
        history_data.append(history_record)
        try:
            with open(history_file, 'w') as f:
                json.dump(history_data, f, indent=4)
        except Exception as save_err:
            print("Warning: could not write to history.json:", save_err)
        
        return jsonify(result)
        
    except Exception as e:
        print("Prediction error:", e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
