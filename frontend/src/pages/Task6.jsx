import { useEffect, useState } from 'react';
import Reveal from '../components/Reveal';
import { fetchEvaluation } from '../lib/api';

/* ── Mini Bar Chart Component ── */
function MiniBar({ label, value, max, color, format }) {
  const pct = Math.min((value / max) * 100, 100);
  const display = format === 'pct' ? `${(value * 100).toFixed(1)}%` : value.toFixed(4);
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, fontSize: '.85rem' }}>
        <span>{label}</span>
        <span style={{ fontFamily: 'var(--mono)', fontWeight: 600, color }}>{display}</span>
      </div>
      <div style={{ height: 5, background: 'var(--line)', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 999, background: color,
          width: `${pct}%`, transition: 'width 1.2s ease',
        }} />
      </div>
    </div>
  );
}

/* ── Model color map ── */
const MODEL_COLORS = {
  'Logistic Regression': 'var(--info)',
  'Decision Tree':       '#7c3aed',
  'Random Forest':       'var(--ok)',
  'AdaBoost':            '#b07d00',
  'Gradient Boosting':   'var(--accent)',
};

const GRAPH_TYPES = [
  { icon: '📊', name: 'Bar Chart — Accuracy Comparison', desc: 'Side-by-side bar chart comparing test accuracy across all 5 models. Immediately shows which model performs best.' },
  { icon: '🕸️', name: 'Radar Chart — Multi-Metric Comparison', desc: 'Spider/radar chart showing Accuracy, Precision, Recall, F1-Score for all models simultaneously. Great for holistic comparison.' },
  { icon: '🔀', name: 'Confusion Matrix Heatmap', desc: 'Grid showing True Positives, True Negatives, False Positives, False Negatives. Reveals where the model goes wrong.' },
  { icon: '📈', name: 'ROC Curve & AUC Score', desc: 'Plots True Positive Rate vs False Positive Rate at different thresholds. AUC close to 1.0 = excellent model.' },
  { icon: '🎻', name: 'Cross-Validation Score Distribution', desc: 'Box plot showing the spread of 5-Fold CV scores per model. Low spread = stable model.' },
  { icon: '🌡️', name: 'Feature Importance Heatmap', desc: 'Shows which input features (Income, CreditScore, etc.) matter most for each model\'s predictions.' },
];

export default function Task6() {
  const [evalData, setEvalData] = useState(null);
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    fetchEvaluation()
      .then(setEvalData)
      .catch(() => setOffline(true));
  }, []);

  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow"><span className="dot" />Week 6 · Task 6</span>
        <h1>Visualization of Metrics &amp; Graphs</h1>
        <p>
          Display all types of graphs associated with model performance metrics.
          Visual representations make it easy to compare, interpret, and present ML results.
        </p>
        {offline && (
          <div className="alert" style={{ marginTop: 14 }}>
            <span>⚠️</span>
            <span>Backend offline — run the Flask server to see live data.</span>
          </div>
        )}
      </div>

      {/* Graph Types */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>📐 Graphs Used in This Project</h3><span className="hint">6 visualization types</span></div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 14 }}>
            {GRAPH_TYPES.map((g) => (
              <div key={g.name} style={{
                background: 'var(--bg-tint)', border: '1px solid var(--line)',
                borderRadius: 'var(--r-sm)', padding: '14px 16px',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{g.icon}</div>
                <p style={{ fontWeight: 700, marginBottom: 6, fontSize: '.9rem' }}>{g.name}</p>
                <p style={{ color: 'var(--muted)', fontSize: '.85rem', lineHeight: 1.65 }}>{g.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Dynamic Accuracy Bar Chart from API */}
      {evalData && (
        <Reveal className="card" style={{ marginBottom: 24 }}>
          <div className="card-head">
            <h3>📊 Accuracy Comparison — All Models <span style={{ fontSize: '.78rem', fontWeight: 400, color: 'var(--ok)' }}>● live data</span></h3>
            <span className="hint">Test Accuracy — from evaluation.json</span>
          </div>
          <div className="card-pad">
            {evalData.models.map((m) => (
              <MiniBar
                key={m.Model}
                label={m.Model}
                value={m['Test Acc (Accuracy)']}
                max={1}
                color={MODEL_COLORS[m.Model] || 'var(--accent)'}
                format="pct"
              />
            ))}
          </div>
        </Reveal>
      )}

      {/* Precision / Recall / F1 Comparison */}
      {evalData && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 20, marginBottom: 24 }}>
          {['Precision', 'Recall', 'F1-Score'].map((metric, idx) => {
            const colors = ['#7c3aed', '#b07d00', 'var(--danger)'];
            return (
              <Reveal key={metric} className="card" delay={idx * 80}>
                <div className="card-head"><h3>{metric}</h3></div>
                <div className="card-pad">
                  {evalData.models.map((m) => (
                    <MiniBar
                      key={m.Model}
                      label={m.Model}
                      value={m[metric]}
                      max={1}
                      color={colors[idx]}
                      format="val"
                    />
                  ))}
                </div>
              </Reveal>
            );
          })}
        </div>
      )}

      {/* CV Score Comparison */}
      {evalData && (
        <Reveal className="card" style={{ marginBottom: 24 }}>
          <div className="card-head">
            <h3>🎻 5-Fold Cross-Validation Scores</h3>
            <span className="hint">Higher avg + lower spread = more stable model</span>
          </div>
          <div className="card-pad">
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 14 }}>
              {evalData.models.map((m) => {
                const isBest = m.Model === evalData.best_model;
                return (
                  <div key={m.Model} style={{
                    background: isBest ? 'var(--ok-wash)' : 'var(--bg-tint)',
                    border: `1px solid ${isBest ? 'var(--ok)' : 'var(--line)'}`,
                    borderRadius: 'var(--r-sm)', padding: '14px 16px', textAlign: 'center',
                  }}>
                    <p style={{ fontSize: '.82rem', fontWeight: 600, marginBottom: 6, color: MODEL_COLORS[m.Model] || 'var(--accent)' }}>
                      {m.Model}
                      {isBest && <span style={{ marginLeft: 6, color: 'var(--ok)' }}>★</span>}
                    </p>
                    <p style={{ fontFamily: 'var(--mono)', fontSize: '1.25rem', fontWeight: 700, color: 'var(--ink)' }}>
                      {(m['5-Fold CV Avg'] * 100).toFixed(2)}%
                    </p>
                    <p style={{ fontSize: '.75rem', color: 'var(--muted)', marginTop: 4 }}>
                      ±{(m['CV Spread (Std)'] * 100).toFixed(2)}% std
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </Reveal>
      )}

      {/* Best Model Summary */}
      {evalData && (
        <Reveal className="card" style={{ borderLeft: '4px solid var(--gold)' }}>
          <div className="card-head"><h3>🏆 Winner: {evalData.best_model}</h3></div>
          <div className="card-pad">
            <p style={{ lineHeight: 1.75 }}>
              Based on the highest 5-Fold Cross-Validation average score of{' '}
              <strong>{(evalData.best_cv_score * 100).toFixed(2)}%</strong>,{' '}
              <strong>{evalData.best_model}</strong> was selected as the best model.
              After GridSearchCV hyperparameter tuning, the tuned test accuracy is{' '}
              <strong>{(evalData.tuning.tuned_accuracy * 100).toFixed(2)}%</strong>.
            </p>
          </div>
        </Reveal>
      )}
    </div>
  );
}
