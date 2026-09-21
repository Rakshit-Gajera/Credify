<div align="center">
  <img src="./frontend/public/favicon.svg" alt="Credify Logo" width="80" height="80">
  <h1 align="center">Credify — Loan Default Risk Intelligence</h1>
  
  <p align="center">
    A Full-Stack Machine Learning Application for predicting loan default risk.
    <br />
    <a href="https://credify-webapp.vercel.app/"><strong>View Live Demo »</strong></a>
    <br />
    <br />
    <a href="https://github.com/Rakshit-Gajera/Credify/issues">Report Bug</a>
    ·
    <a href="https://github.com/Rakshit-Gajera/Credify/issues">Request Feature</a>
  </p>
</div>

---

## 🚀 About The Project

**Credify** is an end-to-end Machine Learning project designed to predict whether a loan applicant is likely to default on their loan. It takes an applicant's financial profile—including their income, credit score, loan amount, and loan purpose—and calculates a probability score in milliseconds using a highly trained **Logistic Regression** model.

This project was built step-by-step following a structured ML pipeline, from raw data exploration to deploying a live React + Flask application. 

### 🌟 Key Features
- **Live ML Inference:** Predicts loan defaults instantly using a real-time REST API.
- **Data Insights Dashboard:** Interactive visualizations of the 255k+ record dataset.
- **Model Evaluation Metrics:** Live computation of Accuracy, F1-Score, and feature importance.
- **Beautiful UI:** A modern, premium React interface featuring dynamic 3D elements powered by Three.js.

---

## 🛠️ Built With

* **Frontend:** React, Vite, Three.js, React Router
* **Backend:** Python, Flask, Pandas, Scikit-learn, Joblib
* **Deployment:** Vercel (Frontend), Render (Backend)

---

## 📊 The Machine Learning Pipeline

The project was developed in 6 core phases, fully documented and visualised within the application:

1. **Problem Definition & Dataset Exploration:** Understanding the `Loan_default.csv` dataset and analyzing class imbalances.
2. **Data Cleaning & Pre-processing:** Handling missing values, standardizing continuous features (`StandardScaler`), and encoding categorical variables (`OneHotEncoder`).
3. **Model Creation:** Building a Logistic Regression model (both from scratch and using `scikit-learn`).
4. **Model Evaluation:** Computing Accuracy, Precision, Recall, and F1-Scores on held-out test data to diagnose overfitting/underfitting.
5. **Advanced Models & Tuning:** Evaluating powerful algorithms (Decision Trees, Random Forests, Gradient Boosting) using 5-Fold Cross-Validation and GridSearchCV.
6. **Visualization:** Comparing model metrics visually with interactive bar charts and radar charts.

---

## 💻 Getting Started (Local Development)

To get a local copy up and running, follow these simple steps.

### Prerequisites
* Node.js (v18+)
* Python 3.10+
* Git

### Installation

1. **Clone the repo**
   ```sh
   git clone https://github.com/Rakshit-Gajera/Credify.git
   cd Credify
   ```

2. **Setup the Backend (Flask API)**
   ```sh
   cd backend
   pip install -r requirements.txt
   python app.py
   ```
   *The backend will run on `http://127.0.0.1:5000`*

3. **Setup the Frontend (React)**
   Open a new terminal window:
   ```sh
   cd frontend
   npm install
   npm run dev
   ```
   *The frontend will run on `http://localhost:5173`*

---

## 🌐 Live Deployment

The application is deployed across two cloud providers:

- **Frontend:** Deployed on **[Vercel](https://credify-webapp.vercel.app/)**
- **Backend:** Deployed on **Render** (via Gunicorn)

To update the live site, simply push your changes to the `main` branch. Both Vercel and Render will automatically rebuild and deploy the new version!

---

## 📝 License

Distributed under the MIT License. See `LICENSE` for more information.
