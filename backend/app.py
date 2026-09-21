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

# Load artifacts
print("Loading model and preprocessing data...")
model = joblib.load('model.pkl')
with open('preprocessing.json', 'r') as f:
    prep = json.load(f)

# Load dataset for insights (using a sample to avoid memory bloat)
import os
csv_path = os.path.join(os.path.dirname(__file__), '..', 'Loan_default.csv')
df_full = pd.read_csv(csv_path)
# Coerce numeric columns so stray strings become NaN instead of crashing int()
for _col in ['Income', 'LoanAmount', 'CreditScore', 'Default']:
    if _col in df_full.columns:
        df_full[_col] = pd.to_numeric(df_full[_col], errors='coerce')
@app.route('/', methods=['GET'])
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({'status': 'healthy', 'service': 'Credify API'}), 200

@app.route('/api/insights', methods=['GET'])
def get_insights():
    try:
        # KPIs
        total_records = len(df_full)
        default_rate = (df_full['Default'].mean() * 100).round(1)
        avg_loan_amount = df_full['LoanAmount'].mean()
        avg_credit_score = df_full['CreditScore'].mean()

        # Table data (sample 6 records)
        sample = df_full.sample(6, random_state=42)
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
        loan_hist, bin_edges = np.histogram(df_full['LoanAmount'], bins=8)
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
        eval_path = 'evaluation.json'
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
        with open('metrics.json', 'r') as f:
            metrics = json.load(f)
        return jsonify(metrics)
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/history', methods=['GET'])
def get_history():
    try:
        if not os.path.exists('history.json'):
            return jsonify([])
        with open('history.json', 'r') as f:
            history = json.load(f)
        # Return history descending (newest first)
        return jsonify(history[::-1])
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

@app.route('/api/predict', methods=['POST'])
def predict():
    try:
        data = request.json
        print("Received data:", data)

        # Create a single row DataFrame with missing values filled
        input_data = {}
        
        # Map all inputs to expected feature names
        # Numeric fields
        input_data['Age'] = float(data.get('age')) if data.get('age') else prep['fill_values']['Age']
        input_data['Income'] = float(data.get('income')) if data.get('income') else prep['fill_values']['Income']
        input_data['LoanAmount'] = float(data.get('amount')) if data.get('amount') else prep['fill_values']['LoanAmount']
        input_data['InterestRate'] = float(data.get('rate')) if data.get('rate') else prep['fill_values']['InterestRate']
        input_data['LoanTerm'] = float(data.get('duration')) if data.get('duration') else prep['fill_values']['LoanTerm']
        input_data['CreditScore'] = float(data.get('score')) if data.get('score') else prep['fill_values']['CreditScore']
        input_data['MonthsEmployed'] = float(data.get('months_employed')) if data.get('months_employed') else prep['fill_values']['MonthsEmployed']
        input_data['NumCreditLines'] = float(data.get('credit_lines')) if data.get('credit_lines') else prep['fill_values']['NumCreditLines']
        input_data['DTIRatio'] = float(data.get('dti')) if data.get('dti') else prep['fill_values']['DTIRatio']

        # Categorical fields (binary handled by map logic below)
        if data.get('education'): input_data['Education'] = data.get('education')
        if data.get('employment'): input_data['EmploymentType'] = data.get('employment')
        if data.get('marital_status'): input_data['MaritalStatus'] = data.get('marital_status')
        if data.get('purpose'): input_data['LoanPurpose'] = data.get('purpose')
        
        # Binary categorical fields (these expect Yes/No which is mapped below)
        if data.get('dependents'): input_data['HasDependents'] = data.get('dependents')
        if data.get('mortgage'): input_data['HasMortgage'] = data.get('mortgage')
        if data.get('cosigner'): input_data['HasCoSigner'] = data.get('cosigner')
        
        # Fill rest with medians/modes
        for feat, val in prep['fill_values'].items():
            if feat not in input_data:
                input_data[feat] = val

        df_input = pd.DataFrame([input_data])
        
        # 2. Outlier Clipping
        for col, limits in prep['clip_values'].items():
            df_input[col] = df_input[col].clip(lower=limits['lower'], upper=limits['upper'])

        # 3. Categorical encoding
        # Binary
        for col in prep['binary_cols']:
            if df_input[col].dtype == object:
                df_input[col] = df_input[col].map({'Yes': 1, 'No': 0})
            df_input[col] = df_input[col].fillna(0).astype(int)


        # One-hot encode
        df_input = pd.get_dummies(df_input, columns=prep['multi_cols'], drop_first=True)
        bool_cols = df_input.select_dtypes(include='bool').columns.tolist()
        df_input[bool_cols] = df_input[bool_cols].astype(int)
        
        # Align columns with expected features (add missing dummies, drop extras)
        for col in prep['expected_features']:
            if col not in df_input.columns:
                df_input[col] = 0
        df_input = df_input[prep['expected_features']]

        # 4. Scaling
        for col in prep['scale_cols']:
            mean = prep['scaler_stats'][col]['mean']
            std = prep['scaler_stats'][col]['std']
            df_input[col] = (df_input[col] - mean) / std

        # 5. Predict
        X = df_input.values
        prob = model.predict_proba(X)[0][1]
        
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
        
        history_file = 'history.json'
        history_data = []
        if os.path.exists(history_file):
            try:
                with open(history_file, 'r') as f:
                    history_data = json.load(f)
            except:
                pass
        
        history_data.append(history_record)
        with open(history_file, 'w') as f:
            json.dump(history_data, f, indent=4)
        
        return jsonify(result)
        
    except Exception as e:
        print(e)
        return jsonify({'error': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)
