import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';
import { fetchMetrics } from '../lib/api';

const METRICS_EXPLAINED = [
  {
    key: 'Accuracy',
    icon: '🎯',
    color: 'var(--info)',
    colorWash: 'var(--info-wash)',
    desc: 'Out of all predictions, how many were correct? High accuracy can be misleading with imbalanced data — a model that always says "No Default" gets 88% accuracy doing nothing useful!',
    formula: '(TP + TN) / Total',
  },
  {
    key: 'Precision',
    icon: '🔬',
    color: '#7c3aed',
    colorWash: '#f3ecff',
    desc: 'Of all loans the model flagged as "will default", what % actually did? High precision = fewer false alarms. Important for the bank — you don\'t want to wrongly reject good applicants.',
    formula: 'TP / (TP + FP)',
  },
  {
    key: 'Recall',
    icon: '🔍',
    color: '#b07d00',
    colorWash: '#fff8e6',
    desc: 'Of all loans that truly defaulted, how many did the model catch? High recall = fewer missed defaults. Critical for the bank — missing a real default costs money.',
    formula: 'TP / (TP + FN)',
  },
  {
    key: 'F1-Score',
    icon: '⚖️',
    color: 'var(--danger)',
    colorWash: 'var(--danger-wash)',
    desc: 'The harmonic mean of Precision and Recall. Best single metric when the dataset is imbalanced. A high F1 means the model is good at both catching defaults AND not over-alarming.',
    formula: '2 × (Precision × Recall) / (Precision + Recall)',
  },
];

function MetricBar({ label, value, max = 100, color }) {
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.88rem' }}>
        <span style={{ fontWeight: 600 }}>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', color }}>{value}</span>
      </div>
      <div style={{ height: 6, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999,
          background: color,
          width: `${Math.min((parseFloat(value) / max) * 100, 100)}%`,
          transition: 'width 1s ease',
        }} />
      </div>
    </div>
  );
}

const FIT_INFO = [
  {
    status: 'Good Fit ✅',
    bg: 'var(--ok-wash)', color: 'var(--ok)',
    title: 'Good Fit',
    desc: 'Train accuracy ≈ Test accuracy. The model learned genuine patterns and generalizes well to unseen data.',
  },
  {
    status: 'Overfitting ⚠️',
    bg: '#fff8e6', color: '#b07d00',
    title: 'Overfitting',
    desc: 'Train accuracy >> Test accuracy. The model memorized training data instead of learning patterns. It fails on new data.',
  },
  {
    status: 'Underfitting 🔴',
    bg: 'var(--danger-wash)', color: 'var(--danger)',
    title: 'Underfitting',
    desc: 'Both Train & Test accuracy are low. The model is too simple and missed important patterns in the data.',
  },
];

export default function Task4() {
  const [metrics, setMetrics] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetchMetrics()
      .then(setMetrics)
      .catch(() => setOffline(true));
  }, []);

  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow"><span className="dot" />Week 4 · Task 4</span>
        <h1>Model Evaluation</h1>
        <p>
          Test the trained Logistic Regression model on the held-out test set, compute
          performance metrics, and diagnose whether it is overfitting or underfitting.
        </p>
        {offline && (
          <div className="alert" style={{ marginTop: 14 }}>
            <span>⚠️</span>
            <span>Backend offline — metric values shown below may be from cache.</span>
          </div>
        )}
      </div>

      {/* What are Metrics */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>📐 Performance Metrics — Explained</h3></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {METRICS_EXPLAINED.map((m) => (
              <div key={m.key} style={{
                border: `1px solid ${m.color}44`,
                borderRadius: 'var(--r-sm)',
                padding: '14px 16px',
                background: m.colorWash,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                  <span style={{ fontSize: '1.3rem' }}>{m.icon}</span>
                  <span style={{ fontWeight: 700, color: m.color }}>{m.key}</span>
                </div>
                <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: 'var(--ink)', marginBottom: 10 }}>{m.desc}</p>
                <div style={{ fontFamily: 'var(--mono)', fontSize: '.78rem', background: 'rgba(0,0,0,.06)', borderRadius: 4, padding: '4px 8px', color: m.color }}>
                  {m.formula}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Live Metrics from API */}
      {metrics && (
        <Reveal className="card" style={{ marginBottom: 24 }}>
          <div className="card-head">
            <h3>📊 Live Model Metrics <span style={{ fontSize: '.78rem', fontWeight: 400, color: 'var(--ok)' }}>● from backend</span></h3>
            <span className="hint">{metrics.algorithm}</span>
          </div>
          <div className="card-pad">
            <MetricBar label="Accuracy" value={`${metrics.accuracy}%`} max={100} color="var(--info)" />
            <MetricBar label="F1-Score" value={metrics.f1_score} max={1} color="var(--danger)" />

            {metrics.feature_importance?.length > 0 && (
              <>
                <p style={{ fontWeight: 600, marginTop: 20, marginBottom: 10, fontSize: '.9rem' }}>Top Feature Importances</p>
                {metrics.feature_importance.map((f) => (
                  <MetricBar key={f.feature} label={f.feature} value={`${f.importance}%`} max={20} color="var(--accent)" />
                ))}
              </>
            )}
          </div>
        </Reveal>
      )}

      {/* Overfitting / Underfitting Explained */}
      <Reveal className="card">
        <div className="card-head"><h3>🩺 Overfitting vs Underfitting Diagnosis</h3></div>
        <div className="card-pad">
          <p style={{ marginBottom: 20, lineHeight: 1.7, color: 'var(--ink-2)' }}>
            After getting accuracy scores on both the training set and test set, we compare them to
            diagnose model health. This is critical — a model that "memorizes" rather than "learns"
            is useless in production.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 14 }}>
            {FIT_INFO.map((f) => (
              <div key={f.status} style={{
                background: f.bg, borderRadius: 'var(--r-sm)',
                padding: '16px', border: `1px solid ${f.color}44`,
              }}>
                <div style={{ fontWeight: 700, color: f.color, marginBottom: 8, fontSize: '.95rem' }}>{f.title}</div>
                <p style={{ fontSize: '.88rem', lineHeight: 1.65, color: 'var(--ink)' }}>{f.desc}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, background: 'var(--bg-tint)', borderRadius: 'var(--r-sm)', padding: '14px 16px', border: '1px solid var(--line)' }}>
            <p style={{ fontWeight: 600, marginBottom: 6 }}>Our Logistic Regression Result</p>
            <p style={{ color: 'var(--muted)', fontSize: '.92rem', lineHeight: 1.7 }}>
              Logistic Regression showed <strong>Underfitting</strong> — both train and test accuracy were similar (~67%)
              but low. This is expected for a simple linear model on complex, imbalanced data.
              This motivated exploring advanced models in Task 5.
            </p>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
