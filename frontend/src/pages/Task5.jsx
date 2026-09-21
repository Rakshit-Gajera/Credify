import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';
import { fetchEvaluation } from '../lib/api';

/* ──────────────────────────────────────────────────────────────
   Static fallback data (shown when backend is offline / notebook
   hasn't been run yet). Values match typical Loan Default results.
────────────────────────────────────────────────────────────── */
const FALLBACK = {
  models: [
    { Model: 'Logistic Regression', 'Train Acc': 0.895,  'Test Acc (Accuracy)': 0.9167, Precision: 0.7500, Recall: 0.1111, 'F1-Score': 0.1935, '5-Fold CV Avg': 0.8917, 'CV Spread (Std)': 0.0065, 'Fit Status': 'Good Fit ✅' },
    { Model: 'Decision Tree',       'Train Acc': 1.0000, 'Test Acc (Accuracy)': 0.8300, Precision: 0.1842, Recall: 0.2593, 'F1-Score': 0.2154, '5-Fold CV Avg': 0.8175, 'CV Spread (Std)': 0.0116, 'Fit Status': 'Overfitting ⚠️' },
    { Model: 'Random Forest',       'Train Acc': 1.0000, 'Test Acc (Accuracy)': 0.9133, Precision: 1.0000, Recall: 0.0370, 'F1-Score': 0.0714, '5-Fold CV Avg': 0.8925, 'CV Spread (Std)': 0.0031, 'Fit Status': 'Overfitting ⚠️' },
    { Model: 'AdaBoost',            'Train Acc': 0.8917, 'Test Acc (Accuracy)': 0.9133, Precision: 0.5714, Recall: 0.1481, 'F1-Score': 0.2353, '5-Fold CV Avg': 0.8817, 'CV Spread (Std)': 0.0133, 'Fit Status': 'Good Fit ✅' },
    { Model: 'Gradient Boosting',   'Train Acc': 0.9492, 'Test Acc (Accuracy)': 0.9067, Precision: 0.4286, Recall: 0.1111, 'F1-Score': 0.1765, '5-Fold CV Avg': 0.8883, 'CV Spread (Std)': 0.0067, 'Fit Status': 'Good Fit ✅' },
  ],
  best_model: 'Random Forest',
  best_cv_score: 0.8925,
  tuning: {
    best_params: { max_depth: null, n_estimators: 50 },
    tuned_accuracy: 0.91,
    baseline_accuracy: 0.9133,
  },
};

const MODEL_EXPLANATIONS = [
  {
    name: 'Logistic Regression',
    desc: 'A basic statistical baseline model. It calculates the probability of default using a linear mathematical equation. It is very fast and easy to interpret, but struggles if the relationships in the data are complex or non-linear.',
  },
  {
    name: 'Decision Tree',
    desc: 'A flowchart-like model that splits data based on questions (e.g., "Is income < $50k?"). It\'s highly interpretable but notoriously prone to overfitting — meaning it tends to memorize the training data rather than learning general rules.',
    italic: true,
    italicWord: 'overfitting',
  },
  {
    name: 'Random Forest (Bagging)',
    desc: 'An ensemble method that builds hundreds of different Decision Trees and averages their predictions (majority vote).',
    why: 'It automatically fixes the overfitting problem of single Decision Trees. It is extremely robust, stable, and usually performs exceptionally well right out of the box.',
  },
  {
    name: 'AdaBoost (Boosting)',
    desc: 'Instead of building trees independently, AdaBoost builds them sequentially. Each new tree focuses specifically on correcting the mistakes (misclassifications) made by the previous tree.',
    why: 'It is excellent at boosting accuracy on borderline or difficult-to-predict applicants.',
  },
  {
    name: 'Gradient Boosting (Advanced Boosting)',
    desc: 'Similar to AdaBoost, but uses an advanced mathematical technique (gradient descent) to minimize prediction errors.',
    why: 'It frequently yields the absolute highest accuracy in machine learning competitions, though it requires careful hyperparameter tuning to avoid overfitting.',
  },
];

const FIT_COLORS = {
  'Good Fit ✅':     { bg: 'var(--ok-wash)',     color: 'var(--ok)' },
  'Overfitting ⚠️': { bg: '#fff8e6',             color: '#b07d00' },
  'Underfitting 🔴': { bg: 'var(--danger-wash)', color: 'var(--danger)' },
};

function FitBadge({ status }) {
  const style = FIT_COLORS[status] || { bg: 'var(--bg-tint)', color: 'var(--ink-2)' };
  return (
    <span style={{
      padding: '3px 9px',
      borderRadius: 999,
      fontSize: '.78rem',
      fontWeight: 600,
      background: style.bg,
      color: style.color,
      whiteSpace: 'nowrap',
    }}>
      {status}
    </span>
  );
}

export default function Task5() {
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetchEvaluation()
      .then((d) => { setData(d); setLoading(false); })
      .catch(() => { setData(FALLBACK); setOffline(true); setLoading(false); });
  }, []);

  if (loading) {
    return (
      <div className="shell page" style={{ textAlign: 'center', paddingTop: 80 }}>
        <div className="spinner" style={{ margin: '0 auto 16px', width: 36, height: 36, border: '3px solid var(--line)', borderTopColor: 'var(--accent)', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        <p style={{ color: 'var(--muted)' }}>Loading evaluation data…</p>
      </div>
    );
  }

  const { models, best_model, tuning } = data;

  return (
    <div className="shell page">
      {/* ── Page header ── */}
      <div className="page-head">
        <span className="eyebrow">
          <span className="dot" />
          Week 5 · Task 5
        </span>
        <h1>Model Evaluation &amp; Tuning</h1>
        <p>Comprehensive model performance analysis, cross-validation, and hyperparameter tuning.</p>
        {offline && (
          <div className="alert" style={{ marginTop: 16 }}>
            <span>⚠️</span>
            <span>
              Backend offline — showing <strong>demonstration data</strong>.{' '}
              Run <code className="inline">Week_5.ipynb</code> then restart the Flask server to see your real results.
            </span>
          </div>
        )}
      </div>

      {/* ── Tasks 1,2,3,4 — Model Comparison Table ── */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head">
          <h3>1, 2, 3 &amp; 4. Model Evaluation &amp; Comparison</h3>
        </div>
        <div className="card-pad" style={{ paddingTop: 0 }}>
          <p style={{ color: 'var(--muted)', fontSize: '.93rem', marginBottom: 16 }}>
            Includes Base vs Test scores (Overfitting check), Accuracy, Precision, Recall, F1-Score, and 5-Fold Cross Validation.
          </p>
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th style={{ width: 28 }}></th>
                  <th>Model</th>
                  <th>Train Acc</th>
                  <th>Test Acc (Accuracy)</th>
                  <th>Precision</th>
                  <th>Recall</th>
                  <th>F1-Score</th>
                  <th>5-Fold CV Avg</th>
                  <th>CV Spread (Std)</th>
                  <th>Fit Status</th>
                </tr>
              </thead>
              <tbody>
                {models.map((row, i) => (
                  <tr
                    key={row.Model}
                    style={row.Model === best_model ? { background: 'var(--ok-wash)' } : {}}
                  >
                    <td style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{i}</td>
                    <td style={{ fontWeight: row.Model === best_model ? 700 : 400 }}>
                      {row.Model}
                      {row.Model === best_model && (
                        <span style={{ marginLeft: 6, fontSize: '.75rem', color: 'var(--ok)', fontWeight: 700 }}>★ Best</span>
                      )}
                    </td>
                    <td>{row['Train Acc']?.toFixed(4)}</td>
                    <td>{row['Test Acc (Accuracy)']?.toFixed(4)}</td>
                    <td>{row['Precision']?.toFixed(4)}</td>
                    <td>{row['Recall']?.toFixed(4)}</td>
                    <td>{row['F1-Score']?.toFixed(4)}</td>
                    <td style={{ fontWeight: 600 }}>{row['5-Fold CV Avg']?.toFixed(4)}</td>
                    <td>{row['CV Spread (Std)']?.toFixed(4)}</td>
                    <td><FitBadge status={row['Fit Status']} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      {/* ── Best Model + Hyperparameter Tuning side by side ── */}
      <div className="model-grid" style={{ marginBottom: 24 }}>
        {/* Best Model */}
        <Reveal className="card">
          <div className="card-head">
            <h3>🏆 Best Model Selected</h3>
          </div>
          <div className="card-pad">
            <p>
              <strong>{best_model}</strong> selected based on highest Cross-Validation accuracy and stability.
            </p>
            <div style={{ marginTop: 20 }}>
              <div className="kpi-label" style={{ marginBottom: 12 }}>Task 6 — Advanced Models Implemented</div>
              {['Random Forest (Bagging)', 'AdaBoost (Boosting)', 'Gradient Boosting (Advanced Boosting)'].map((m) => (
                <div key={m} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: '.95rem' }}>
                  <span style={{ color: 'var(--ok)', fontSize: '1rem' }}>✅</span>
                  <span>{m}</span>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        {/* Hyperparameter Tuning */}
        <Reveal delay={100} className="card">
          <div className="card-head">
            <h3>5. Hyperparameter Tuning</h3>
          </div>
          <div className="card-pad">
            <p style={{ color: 'var(--muted)', fontSize: '.9rem', marginBottom: 16 }}>
              Applied GridSearchCV to <strong>{best_model}</strong>:
            </p>
            <div style={{ background: 'var(--info-wash)', border: '1px solid rgba(74,111,165,.18)', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: 12, fontFamily: 'var(--mono)', fontSize: '.85rem' }}>
              Best Parameters Found:{' '}
              {JSON.stringify(tuning?.best_params ?? {})}
            </div>
            <div style={{ background: 'var(--info-wash)', border: '1px solid rgba(74,111,165,.18)', borderRadius: 'var(--r-sm)', padding: '12px 16px', marginBottom: 16, fontFamily: 'var(--mono)', fontSize: '.85rem' }}>
              Tuned Model Test Accuracy: {tuning?.tuned_accuracy?.toFixed(4)}
            </div>
            <p style={{ fontSize: '.93rem' }}>
              Baseline Test Accuracy was:{' '}
              <strong>{tuning?.baseline_accuracy?.toFixed(4)}</strong>
            </p>
          </div>
        </Reveal>
      </div>

      {/* ── Model Explanations ── */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head">
          <h3>🧠 Understanding the Models: Which to choose and why?</h3>
        </div>
        <div className="card-pad">
          {MODEL_EXPLANATIONS.map((m, i) => (
            <div key={m.name} style={{ marginBottom: i < MODEL_EXPLANATIONS.length - 1 ? 18 : 0 }}>
              <p style={{ fontSize: '.95rem', lineHeight: 1.7 }}>
                <strong>{i + 1}. {m.name}:</strong>{' '}
                {m.desc}
                {m.why && (
                  <> <strong>Why choose it:</strong> {m.why}</>
                )}
              </p>
            </div>
          ))}
        </div>
      </Reveal>

      {/* ── Why Random Forest won ── */}
      <Reveal className="card" style={{ marginBottom: 0, borderLeft: '4px solid var(--gold)' }}>
        <div className="card-head">
          <h3>💡 Why did we select <em>{best_model}</em> as the winner?</h3>
        </div>
        <div className="card-pad">
          <p style={{ marginBottom: 14 }}>
            The system automatically selected <strong>{best_model}</strong> because it achieved the highest{' '}
            <strong>5-Fold Cross-Validation Average Score</strong>.
          </p>
          <p style={{ marginBottom: 14 }}>
            <strong>Why does Cross-Validation matter?</strong> Instead of just testing the model once, Cross-Validation
            cuts the data into 5 equal pieces. It trains the model 5 separate times on different chunks and averages
            the score. This proves that the model didn't just get "lucky" on one specific test set.
          </p>
          <p style={{ color: 'var(--ink-2)' }}>
            A high Cross-Validation score, combined with a low CV Spread (Standard Deviation), guarantees that the model
            is both highly accurate and highly stable, making it the safest choice for deploying into a real-world
            Loan Prediction Engine.
          </p>
        </div>
      </Reveal>

      {/* ── Spinner keyframes ── */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
