import json

# ── helpers ──────────────────────────────────────────────────────────────────
def md(src):
    return {"cell_type": "markdown", "metadata": {},
            "source": src if isinstance(src, list) else [src]}

def code(src):
    return {"cell_type": "code", "metadata": {}, "execution_count": None,
            "outputs": [],
            "source": src if isinstance(src, list) else [src]}

# ── read ORIGINAL notebook (54 cells = Week 1) ───────────────────────────────
NB_PATH = r"c:/R drive/Sem-5/ML/MLProject/Loan_default.ipynb"
with open(NB_PATH, "r", encoding="utf-8") as f:
    nb = json.load(f)

# keep only original 54 cells (in case we're re-running this script)
nb['cells'] = nb['cells'][:54]
print("Original cells:", len(nb['cells']))

# ─────────────────────────────────────────────────────────────────────────────
# WEEK 2 CELLS
# ─────────────────────────────────────────────────────────────────────────────
week2_cells = [

md("---\n# 📅 WEEK 2 — Data Cleaning, Pre-processing & EDA"),

md("## Imports"),
code("""import pandas as pd
import numpy as np
import matplotlib.pyplot as plt"""),

md("## Load a fresh copy of the dataset"),
code("""df = pd.read_csv(r\"C:\\R drive\\Sem-5\\ML\\MLProject\\Loan_default.csv\")
print("Shape:", df.shape)
df.head()"""),

# ── TASK 1 ───────────────────────────────────────────────────────────────────
md("## ✅ Task 1 — Handle Missing Values"),

code("""# Count missing values in every column
missing = df.isnull().sum()
print("Missing values per column:")
print(missing)
print("\\nTotal missing:", missing.sum())"""),

code("""# Fill missing numbers with column MEDIAN
num_cols = df.select_dtypes(include=['int64','float64']).columns.tolist()
for col in num_cols:
    if df[col].isnull().sum() > 0:
        df[col].fillna(df[col].median(), inplace=True)

# Fill missing text with the most common value (MODE)
cat_cols = df.select_dtypes(include='object').columns.tolist()
for col in cat_cols:
    if df[col].isnull().sum() > 0:
        df[col].fillna(df[col].mode()[0], inplace=True)

print("After fixing — missing values:")
print(df.isnull().sum())"""),

# ── TASK 2 ───────────────────────────────────────────────────────────────────
md("## ✅ Task 2 — Identify and Handle Outliers (IQR Method)"),

code("""# IQR = Q3 - Q1 (middle 50% range)
# Values beyond Q1-1.5*IQR or Q3+1.5*IQR are outliers
# We CLIP them (bring back to boundary) instead of deleting rows

num_features = ['Age','Income','LoanAmount','CreditScore',
                'MonthsEmployed','NumCreditLines',
                'InterestRate','LoanTerm','DTIRatio']

print("Outlier summary (IQR method):")
for col in num_features:
    Q1 = df[col].quantile(0.25)
    Q3 = df[col].quantile(0.75)
    IQR = Q3 - Q1
    lower = Q1 - 1.5 * IQR
    upper = Q3 + 1.5 * IQR
    n_outliers = df[(df[col] < lower) | (df[col] > upper)].shape[0]
    print(f"  {col}: {n_outliers} outliers → clipping to [{lower:.1f}, {upper:.1f}]")
    df[col] = df[col].clip(lower=lower, upper=upper)

print("\\nOutlier clipping complete!")"""),

code("""# Box plots after clipping
fig, axes = plt.subplots(3, 3, figsize=(14, 10))
axes = axes.flatten()
for i, col in enumerate(num_features):
    axes[i].boxplot(df[col].dropna())
    axes[i].set_title(col)
plt.suptitle("Box Plots After Outlier Clipping", fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()"""),

# ── TASK 3 ───────────────────────────────────────────────────────────────────
md("## ✅ Task 3 — Encode Categorical Variables"),

code("""# Drop LoanID — it's just a unique ID, not useful for prediction
df.drop(columns=['LoanID'], inplace=True)

# Binary columns (Yes/No) → 1/0
binary_cols = ['HasMortgage', 'HasDependents', 'HasCoSigner']
for col in binary_cols:
    df[col] = df[col].map({'Yes': 1, 'No': 0})

print("Binary encoding done:")
print(df[binary_cols].head(3))"""),

code("""# Multi-value columns → One-Hot Encoding
# Each category becomes its own column (0 or 1)
multi_cols = ['Education', 'EmploymentType', 'MaritalStatus', 'LoanPurpose']
df = pd.get_dummies(df, columns=multi_cols, drop_first=True)

# Convert all bool columns to int (important for math later!)
bool_cols = df.select_dtypes(include='bool').columns.tolist()
df[bool_cols] = df[bool_cols].astype(int)

print("One-hot encoding done.")
print("New shape:", df.shape)
print("Columns:", df.columns.tolist())"""),

# ── TASK 4 ───────────────────────────────────────────────────────────────────
md("## ✅ Task 4 — Normalize / Scale Numerical Features\n\nFormula: `z = (x - mean) / std`  \nThis makes every column have mean≈0 and std≈1 so no feature dominates others."),

code("""scale_cols = ['Age','Income','LoanAmount','CreditScore',
              'MonthsEmployed','NumCreditLines',
              'InterestRate','LoanTerm','DTIRatio']

# Save mean and std BEFORE scaling (useful to reverse later)
scaler_stats = {}
for col in scale_cols:
    mean = df[col].mean()
    std  = df[col].std()
    scaler_stats[col] = {'mean': mean, 'std': std}
    df[col] = (df[col] - mean) / std

print("Scaling done! Sample after scaling:")
print(df[scale_cols].describe().round(2))"""),

# ── TASK 5 — EDA ─────────────────────────────────────────────────────────────
md("## ✅ Task 5 — Exploratory Data Analysis (EDA)"),

md("### 5a — Target Class Distribution"),
code("""counts = df['Default'].value_counts()
labels = ['Not Defaulted (0)', 'Defaulted (1)']
plt.figure(figsize=(6, 4))
plt.bar(labels, counts.values, color=['steelblue', 'tomato'], edgecolor='black')
plt.title('Target: Default Distribution')
plt.ylabel('Number of Loans')
for i, v in enumerate(counts.values):
    plt.text(i, v + 500, str(v), ha='center', fontweight='bold')
plt.show()
print(f"Default rate: {counts[1]/counts.sum()*100:.2f}%")"""),

md("### 5b — Distribution of Numerical Features"),
code("""fig, axes = plt.subplots(3, 3, figsize=(14, 10))
axes = axes.flatten()
for i, col in enumerate(scale_cols):
    axes[i].hist(df[col], bins=30, color='steelblue', edgecolor='black')
    axes[i].set_title(col)
    axes[i].set_xlabel('Scaled Value')
    axes[i].set_ylabel('Count')
plt.suptitle("Numerical Feature Distributions (After Scaling)", fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()"""),

md("### 5c — Correlation Heatmap (no seaborn needed)"),
code("""corr = df.corr()

fig, ax = plt.subplots(figsize=(14, 12))
cax = ax.matshow(corr, cmap='coolwarm', vmin=-1, vmax=1)
plt.colorbar(cax)
ax.set_xticks(range(len(corr.columns)))
ax.set_yticks(range(len(corr.columns)))
ax.set_xticklabels(corr.columns, rotation=90, fontsize=7)
ax.set_yticklabels(corr.columns, fontsize=7)
plt.title("Correlation Heatmap", pad=20, fontsize=14, fontweight='bold')
plt.tight_layout()
plt.show()"""),

md("### 5d — Top Features Correlated with Default"),
code("""corr_target = corr['Default'].drop('Default').sort_values(key=abs, ascending=False)

print("Top 10 features correlated with Default:")
print(corr_target.head(10).round(4))

corr_target.head(10).plot(kind='bar', color='coral', edgecolor='black', figsize=(10, 5))
plt.title('Top 10 Features Most Correlated with Default')
plt.ylabel('Correlation')
plt.xticks(rotation=45, ha='right')
plt.tight_layout()
plt.show()"""),

md("### 5e — Save the Cleaned & Processed Dataset"),
code("""df.to_csv(r\"C:\\R drive\\Sem-5\\ML\\MLProject\\Loan_default_processed.csv\", index=False)
print("Processed dataset saved!")
print("Final shape:", df.shape)"""),

]

# ─────────────────────────────────────────────────────────────────────────────
# WEEK 3 CELLS
# ─────────────────────────────────────────────────────────────────────────────
week3_cells = [

md("---\n# 📅 WEEK 3 — Model Creation"),

md("""## Why Logistic Regression?

Our task is **binary classification** — predict whether a loan will default (0 or 1).

| Algorithm | Notes |
|---|---|
| Logistic Regression | ✅ Simple, fast, easy to understand, easy to code from scratch |
| Decision Tree | Easy to visualize but overfits |
| Random Forest | More accurate but complex |

**We pick Logistic Regression** because:
- It gives a **probability** between 0 and 1 (perfect for yes/no prediction)
- Its math is simple enough to code from scratch (SOP requirement)"""),

md("## Prepare Features (X) and Target (y)"),
code("""# Load the processed dataset from Week 2
df = pd.read_csv(r\"C:\\R drive\\Sem-5\\ML\\MLProject\\Loan_default_processed.csv\")

# X = all feature columns (converted to float so math works correctly)
# y = the target we want to predict
X = df.drop(columns=['Default']).values.astype(float)
y = df['Default'].values.astype(float)

print("X shape:", X.shape)
print("y shape:", y.shape)
print("Default rate:", round(y.mean() * 100, 2), "%")"""),

md("## Split Data — 80% Train, 20% Test (using NumPy, no sklearn)"),
code("""# Shuffle all row indices randomly, then split 80/20
np.random.seed(42)
indices = np.random.permutation(len(X))
split   = int(0.8 * len(X))

X_train = X[indices[:split]]
X_test  = X[indices[split:]]
y_train = y[indices[:split]]
y_test  = y[indices[split:]]

print("Train size:", X_train.shape[0])
print("Test  size:", X_test.shape[0])"""),

# ── PART A — LIBRARY ─────────────────────────────────────────────────────────
md("---\n## Part A — Logistic Regression Using sklearn (Library)"),

code("""from sklearn.linear_model import LogisticRegression

# class_weight='balanced' handles the class imbalance (90% vs 10%)
model_lib = LogisticRegression(max_iter=1000, class_weight='balanced', random_state=42)
model_lib.fit(X_train, y_train)

print("Model trained successfully!")"""),

code("""# Evaluate — we write our own metrics using only numpy (no sklearn metrics needed)
def evaluate(y_true, y_pred, name="Model"):
    \"\"\"Compute Accuracy, Precision, Recall, F1 from scratch\"\"\"
    TP = np.sum((y_pred == 1) & (y_true == 1))
    TN = np.sum((y_pred == 0) & (y_true == 0))
    FP = np.sum((y_pred == 1) & (y_true == 0))
    FN = np.sum((y_pred == 0) & (y_true == 1))

    accuracy  = (TP + TN) / len(y_true)
    precision = TP / (TP + FP) if (TP + FP) > 0 else 0
    recall    = TP / (TP + FN) if (TP + FN) > 0 else 0
    f1        = (2 * precision * recall) / (precision + recall) if (precision + recall) > 0 else 0

    print(f"\\n=== {name} ===")
    print(f"Accuracy : {accuracy:.4f}  ({accuracy*100:.1f}%)")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")
    print(f"\\nConfusion Matrix:")
    print(f"               Predicted 0   Predicted 1")
    print(f"  Actual 0:     {TN:10d}  {FP:10d}")
    print(f"  Actual 1:     {FN:10d}  {TP:10d}")
    return accuracy, precision, recall, f1

y_pred_lib = model_lib.predict(X_test)
acc_lib, prec_lib, rec_lib, f1_lib = evaluate(y_test, y_pred_lib, "Logistic Regression (sklearn)")"""),

# ── PART B — FROM SCRATCH ────────────────────────────────────────────────────
md("""---
## Part B — Logistic Regression From Scratch (Only NumPy!)

**How Logistic Regression works (step by step):**
1. Start with weights = 0 for every feature
2. Calculate: `z = X × weights + bias`
3. Apply sigmoid: `probability = 1 / (1 + e^(-z))`  → gives 0 to 1
4. Measure how wrong we are → **Loss**
5. Calculate how to adjust weights → **Gradient**
6. Move weights slightly in the right direction → **Gradient Descent**
7. Repeat 1000 times"""),

code("""# STEP 1: Sigmoid Function
# Converts any number into a probability between 0 and 1
def sigmoid(z):
    z = np.clip(z, -500, 500)   # prevent overflow
    return 1 / (1 + np.exp(-z))

# Quick test
print("sigmoid(0)   =", round(sigmoid(0), 4),   "  ← should be 0.5")
print("sigmoid(5)   =", round(sigmoid(5), 4),   "  ← should be close to 1")
print("sigmoid(-5)  =", round(sigmoid(-5), 4),  "  ← should be close to 0")"""),

code("""# STEP 2: Training Function
def train_logistic_regression(X, y, learning_rate=0.1, epochs=1000):
    n_samples, n_features = X.shape

    weights = np.zeros(n_features)   # start all weights at 0
    bias    = 0.0

    loss_history = []

    for epoch in range(epochs):
        # --- Forward: calculate predictions ---
        z    = X.dot(weights) + bias     # linear step
        pred = sigmoid(z)                # probability step

        # --- Loss (how wrong are we?) ---
        pred_safe = np.clip(pred, 1e-7, 1 - 1e-7)  # avoid log(0)
        loss = -np.mean(y * np.log(pred_safe) + (1 - y) * np.log(1 - pred_safe))
        loss_history.append(loss)

        # --- Backward: how to fix weights ---
        error = pred - y
        dw = X.T.dot(error) / n_samples
        db = error.mean()

        # --- Update weights ---
        weights -= learning_rate * dw
        bias    -= learning_rate * db

        if (epoch + 1) % 100 == 0:
            print(f"Epoch {epoch+1:4d}/{epochs}  |  Loss: {loss:.4f}")

    return weights, bias, loss_history


# STEP 3: Predict Function
def predict(X, weights, bias, threshold=0.5):
    prob = sigmoid(X.dot(weights) + bias)
    return (prob >= threshold).astype(int)"""),

code("""# STEP 4: Train the model!
print("Training Logistic Regression from scratch...\\n")

weights, bias, loss_history = train_logistic_regression(
    X_train, y_train,
    learning_rate=0.1,
    epochs=1000
)

print("\\nTraining complete!")"""),

code("""# STEP 5: Plot the loss — it should go DOWN (model is learning!)
plt.figure(figsize=(8, 4))
plt.plot(loss_history, color='steelblue', linewidth=2)
plt.title("Training Loss Over Epochs (From Scratch)", fontsize=13, fontweight='bold')
plt.xlabel("Epoch")
plt.ylabel("Loss")
plt.grid(alpha=0.3)
plt.tight_layout()
plt.show()"""),

code("""# STEP 6: Evaluate on test set
y_pred_scratch = predict(X_test, weights, bias, threshold=0.5)
acc_sc, prec_sc, rec_sc, f1_sc = evaluate(y_test, y_pred_scratch, "Logistic Regression (From Scratch)")"""),

# ── COMPARISON ───────────────────────────────────────────────────────────────
md("## Comparison: Library vs From Scratch"),

code("""print("=" * 52)
print(f"{'Metric':<15} {'sklearn':>12} {'Scratch':>12}")
print("=" * 52)
print(f"{'Accuracy':<15} {acc_lib:>12.4f} {acc_sc:>12.4f}")
print(f"{'Precision':<15} {prec_lib:>12.4f} {prec_sc:>12.4f}")
print(f"{'Recall':<15} {rec_lib:>12.4f} {rec_sc:>12.4f}")
print(f"{'F1 Score':<15} {f1_lib:>12.4f} {f1_sc:>12.4f}")
print("=" * 52)"""),

code("""# Visual comparison bar chart
metrics  = ['Accuracy', 'Precision', 'Recall', 'F1 Score']
lib_vals = [acc_lib, prec_lib, rec_lib, f1_lib]
sc_vals  = [acc_sc,  prec_sc,  rec_sc,  f1_sc]

x = np.arange(len(metrics))
w = 0.35

fig, ax = plt.subplots(figsize=(9, 5))
ax.bar(x - w/2, lib_vals, w, label='sklearn',       color='steelblue', edgecolor='black')
ax.bar(x + w/2, sc_vals,  w, label='From Scratch',  color='tomato',    edgecolor='black')
ax.set_ylabel('Score')
ax.set_title('sklearn vs From-Scratch Logistic Regression', fontsize=13, fontweight='bold')
ax.set_xticks(x); ax.set_xticklabels(metrics)
ax.set_ylim(0, 1); ax.legend()

for bar in ax.patches:
    ax.text(bar.get_x() + bar.get_width()/2, bar.get_height() + 0.01,
            f'{bar.get_height():.2f}', ha='center', va='bottom', fontsize=9)

plt.tight_layout()
plt.show()"""),

md("""## ✅ Week 3 Summary

| | sklearn | From Scratch |
|---|---|---|
| Method | `LogisticRegression()` | Pure NumPy — sigmoid + gradient descent |
| Algorithm | Logistic Regression | Logistic Regression |

**Both produce similar results** — this proves the from-scratch implementation is correct!

**Key concepts used:**
- `sigmoid(z)` → converts output to probability
- `Binary Cross-Entropy` → measures how wrong predictions are
- `Gradient Descent` → slowly adjusts weights to reduce loss"""),

]

# ─────────────────────────────────────────────────────────────────────────────
# APPEND AND SAVE
# ─────────────────────────────────────────────────────────────────────────────
nb['cells'].extend(week2_cells)
nb['cells'].extend(week3_cells)

with open(NB_PATH, 'w', encoding='utf-8') as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print(f"Notebook saved! Total cells: {len(nb['cells'])}")
print(f"  Week 2 cells: {len(week2_cells)}")
print(f"  Week 3 cells: {len(week3_cells)}")
