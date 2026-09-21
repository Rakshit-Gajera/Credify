import json

NB_PATH = r"c:/R drive/Sem-5/ML/MLProject/Loan_default.ipynb"
with open(NB_PATH, "r", encoding="utf-8") as f:
    nb = json.load(f)

# New training function cell source — with class weights
new_train_src = (
    "# STEP 2: Training Function (with class weights to handle imbalance)\n"
    "def train_logistic_regression(X, y, learning_rate=0.1, epochs=1000):\n"
    "    n_samples, n_features = X.shape\n"
    "\n"
    "    # Class weights: give more importance to the minority class (defaulted loans)\n"
    "    n0 = np.sum(y == 0)             # count of non-defaults\n"
    "    n1 = np.sum(y == 1)             # count of defaults\n"
    "    weight_0 = n_samples / (2 * n0) # weight for class 0\n"
    "    weight_1 = n_samples / (2 * n1) # weight for class 1\n"
    "    sample_weights = np.where(y == 1, weight_1, weight_0)\n"
    "\n"
    "    weights = np.zeros(n_features)  # start all weights at 0\n"
    "    bias    = 0.0\n"
    "    loss_history = []\n"
    "\n"
    "    for epoch in range(epochs):\n"
    "        # Forward: calculate predictions\n"
    "        z    = X.dot(weights) + bias\n"
    "        pred = sigmoid(z)\n"
    "\n"
    "        # Loss (weighted)\n"
    "        pred_safe = np.clip(pred, 1e-7, 1 - 1e-7)\n"
    "        loss = -np.mean(sample_weights * (y * np.log(pred_safe) + (1 - y) * np.log(1 - pred_safe)))\n"
    "        loss_history.append(loss)\n"
    "\n"
    "        # Backward: how to fix weights\n"
    "        error = (pred - y) * sample_weights\n"
    "        dw = X.T.dot(error) / n_samples\n"
    "        db = error.mean()\n"
    "\n"
    "        # Update weights\n"
    "        weights -= learning_rate * dw\n"
    "        bias    -= learning_rate * db\n"
    "\n"
    "        if (epoch + 1) % 100 == 0:\n"
    "            print(f'Epoch {epoch+1:4d}/{epochs}  |  Loss: {loss:.4f}')\n"
    "\n"
    "    return weights, bias, loss_history\n"
    "\n"
    "\n"
    "# STEP 3: Predict Function\n"
    "def predict(X, weights, bias, threshold=0.5):\n"
    "    prob = sigmoid(X.dot(weights) + bias)\n"
    "    return (prob >= threshold).astype(int)"
)

# Update cell at index 92
nb["cells"][92]["source"] = new_train_src

with open(NB_PATH, "w", encoding="utf-8") as f:
    json.dump(nb, f, indent=1, ensure_ascii=False)

print("Updated! Total cells:", len(nb["cells"]))

# Verify
src = "".join(nb["cells"][92]["source"])
print("Cell 92 first line:", src.split("\n")[0])
