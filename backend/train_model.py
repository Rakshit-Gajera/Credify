import pandas as pd
import numpy as np
from sklearn.linear_model import LogisticRegression
import joblib
import json
import os

print("Loading dataset...")
df = pd.read_csv(r"C:\R drive\Sem-5\ML\MLProject\Loan_default.csv")

# 1. Handle Missing Values
num_cols = df.select_dtypes(include=['int64','float64']).columns.tolist()
if 'Default' in num_cols: num_cols.remove('Default')
cat_cols = df.select_dtypes(include='object').columns.tolist()
if 'LoanID' in cat_cols: cat_cols.remove('LoanID')

fill_values = {}
for col in num_cols:
    median_val = df[col].median()
    df[col].fillna(median_val, inplace=True)
    fill_values[col] = median_val

for col in cat_cols:
    mode_val = df[col].mode()[0]
    df[col].fillna(mode_val, inplace=True)
    fill_values[col] = mode_val

# Drop LoanID
df.drop(columns=['LoanID'], inplace=True, errors='ignore')

# 2. Outliers (IQR)
num_features = ['Age','Income','LoanAmount','CreditScore',
                'MonthsEmployed','NumCreditLines',
                'InterestRate','LoanTerm','DTIRatio']

clip_values = {}
for col in num_features:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    clip_values[col] = {'lower': lower, 'upper': upper}
    df[col] = df[col].clip(lower=lower, upper=upper)

# 3. Categorical Encoding
binary_cols = ['HasMortgage', 'HasDependents', 'HasCoSigner']
for col in binary_cols:
    df[col] = df[col].map({'Yes': 1, 'No': 0})
    if col not in fill_values: fill_values[col] = 0

multi_cols = ['Education', 'EmploymentType', 'MaritalStatus', 'LoanPurpose']
df = pd.get_dummies(df, columns=multi_cols, drop_first=True)
bool_cols = df.select_dtypes(include='bool').columns.tolist()
df[bool_cols] = df[bool_cols].astype(int)

# Save the expected feature names
expected_features = df.drop(columns=['Default']).columns.tolist()

# 4. Scaling
scale_cols = num_features
scaler_stats = {}
for col in scale_cols:
    mean = df[col].mean()
    std = df[col].std()
    scaler_stats[col] = {'mean': mean, 'std': std}
    df[col] = (df[col] - mean) / std

# 5. Train Model
X = df.drop(columns=['Default']).values
y = df['Default'].values

print("Training model...")
model = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
model.fit(X, y)

print("Calculating metrics...")
from sklearn.metrics import accuracy_score, f1_score
y_pred = model.predict(X)
accuracy = accuracy_score(y, y_pred)
f1 = f1_score(y, y_pred)

# Calculate feature importance using absolute coefficients
coeffs = np.abs(model.coef_[0])
total_coeff = np.sum(coeffs)
feature_importances = []
for i, feature in enumerate(expected_features):
    importance = (coeffs[i] / total_coeff) * 100
    if importance > 1: # Only save meaningful features
        feature_importances.append({
            'feature': feature,
            'importance': round(importance, 1)
        })

# Sort by importance and take top 4
feature_importances = sorted(feature_importances, key=lambda x: x['importance'], reverse=True)[:4]

metrics = {
    'algorithm': 'Logistic Regression',
    'accuracy': round(accuracy * 100, 1),
    'f1_score': round(f1, 2),
    'feature_importance': feature_importances
}

print("Saving artifacts...")
joblib.dump(model, 'model.pkl')

preprocessing_info = {
    'fill_values': fill_values,
    'clip_values': clip_values,
    'scaler_stats': scaler_stats,
    'expected_features': expected_features,
    'binary_cols': binary_cols,
    'multi_cols': multi_cols,
    'scale_cols': scale_cols
}

with open('preprocessing.json', 'w') as f:
    json.dump(preprocessing_info, f, indent=4)

with open('metrics.json', 'w') as f:
    json.dump(metrics, f, indent=4)

print("Training complete and files saved successfully!")
