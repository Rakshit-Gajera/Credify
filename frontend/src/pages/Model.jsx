import { useEffect, useState } from 'react';
import PipelineScene from '../components/PipelineScene';
import Reveal from '../components/Reveal';
import { Cpu, Layers, Alert, Book, Scale } from '../components/Icons';
import { fetchMetrics, API_BASE } from '../lib/api';

/**
 * "How It Works" — the page built for explaining the backend out loud.
 * Each step below mirrors one block of backend/app.py, in execution order.
 */
const STEPS = [
  {
    title: 'Request received',
    short: 'JSON body hits the Flask route',
    detail:
      'The React form POSTs all sixteen applicant fields as JSON. Flask parses the body and copies each value into a plain Python dict, casting the nine numeric fields to float and leaving the seven categorical ones as strings.',
    why: 'Keeping the payload flat and explicit makes the contract between frontend and model obvious — no hidden ordering assumptions.',
    code: `data = request.json
input_data['Age']        = float(data.get('age'))
input_data['Income']     = float(data.get('income'))
input_data['LoanAmount'] = float(data.get('amount'))
input_data['Education']  = data.get('education')`,
  },
  {
    title: 'Missing-value imputation',
    short: 'Median for numerics, mode for categories',
    detail:
      'Any field the client leaves blank is filled from fill_values in preprocessing.json — the median for numeric columns and the most frequent category for text columns, both computed once during training.',
    why: 'Using training-time statistics (never statistics of the incoming row) keeps inference consistent with how the model was fitted.',
    code: `for feat, val in prep['fill_values'].items():
    if feat not in input_data:
        input_data[feat] = val

df_input = pd.DataFrame([input_data])`,
  },
  {
    title: 'Outlier clipping',
    short: 'IQR bounds, per numeric column',
    detail:
      'Every numeric column is clamped into the interval [Q1 − 1.5·IQR, Q3 + 1.5·IQR] that was measured on the training set, so a typo such as an income of 90,000,000 cannot drag the prediction to an extreme.',
    why: 'Logistic Regression is sensitive to extreme values on unbounded features; clipping bounds their influence without discarding the row.',
    code: `for col, limits in prep['clip_values'].items():
    df_input[col] = df_input[col].clip(
        lower=limits['lower'],
        upper=limits['upper'],
    )`,
  },
  {
    title: 'Categorical encoding',
    short: 'Yes/No → 1/0, then one-hot',
    detail:
      'The three binary columns map to 1/0. Education, EmploymentType, MaritalStatus and LoanPurpose are one-hot encoded with drop_first=True, then the frame is reindexed against the 24 expected_features saved at training time — missing dummies are added as 0 and anything unexpected is dropped.',
    why: 'The reindex step is what guarantees the column order and width the fitted coefficients expect, whatever the user selected.',
    code: `for col in prep['binary_cols']:
    df_input[col] = df_input[col].map({'Yes': 1, 'No': 0})

df_input = pd.get_dummies(df_input,
                          columns=prep['multi_cols'],
                          drop_first=True)

for col in prep['expected_features']:
    if col not in df_input.columns:
        df_input[col] = 0
df_input = df_input[prep['expected_features']]`,
  },
  {
    title: 'Standardisation',
    short: 'z-score with training mean and std',
    detail:
      'Each of the nine numeric features is rescaled to (x − μ) / σ using the μ and σ stored in scaler_stats, so income measured in tens of thousands and age measured in tens end up on the same scale.',
    why: 'Without it the optimiser is dominated by whichever feature happens to have the largest raw units, and the coefficients stop being comparable.',
    code: `for col in prep['scale_cols']:
    mean = prep['scaler_stats'][col]['mean']
    std  = prep['scaler_stats'][col]['std']
    df_input[col] = (df_input[col] - mean) / std`,
  },
  {
    title: 'Inference & logging',
    short: 'predict_proba, threshold, append to history',
    detail:
      'The prepared 24-feature row goes into the joblib-loaded Logistic Regression model. predict_proba returns P(default); above 0.50 the applicant is flagged high risk. The inputs, the verdict and a timestamp are appended to history.json before the response is returned.',
    why: 'Persisting the full input alongside the decision is what makes an automated credit decision auditable after the fact.',
    code: `prob = model.predict_proba(X)[0][1]
is_high_risk = prob > 0.5

result = {
    'risk': 'high' if is_high_risk else 'low',
    'confidence': f"{prob * 100:.1f}%",
}
history_data.append({'timestamp': ..., 'inputs': data,
                     'prediction': result})`,
  },
];

const ENDPOINTS = [
  { m: 'POST', p: '/api/predict', d: 'Score one applicant and log the result' },
  { m: 'GET', p: '/api/insights', d: 'Dataset KPIs, class balance, histogram, sample rows' },
  { m: 'GET', p: '/api/metrics', d: 'Trained model accuracy, F1 and feature importance' },
  { m: 'GET', p: '/api/history', d: 'Every logged prediction, newest first' },
];

const RAW_FEATURES = [
  ['Age', 'numeric', 'Applicant age in years'],
  ['Income', 'numeric', 'Annual income (USD)'],
  ['LoanAmount', 'numeric', 'Principal requested (USD)'],
  ['CreditScore', 'numeric', 'Credit score, 300–850'],
  ['MonthsEmployed', 'numeric', 'Tenure in current job'],
  ['NumCreditLines', 'numeric', 'Open credit lines'],
  ['InterestRate', 'numeric', 'Annual rate (%)'],
  ['LoanTerm', 'numeric', 'Term in months'],
  ['DTIRatio', 'numeric', 'Debt-to-income, 0–1'],
  ['HasMortgage', 'binary', 'Yes / No → 1 / 0'],
  ['HasDependents', 'binary', 'Yes / No → 1 / 0'],
  ['HasCoSigner', 'binary', 'Yes / No → 1 / 0'],
  ['Education', 'one-hot', '4 levels → 3 dummies'],
  ['EmploymentType', 'one-hot', '4 levels → 3 dummies'],
  ['MaritalStatus', 'one-hot', '3 levels → 2 dummies'],
  ['LoanPurpose', 'one-hot', '5 levels → 4 dummies'],
];

export default function Model() {
  const [active, setActive] = useState(0);
  const [metrics, setMetrics] = useState(null);
  const step = STEPS[active];

  useEffect(() => {
    fetchMetrics().then(setMetrics).catch(() => {});
  }, []);

  const maxImportance = metrics
    ? Math.max(...metrics.feature_importance.map((f) => f.importance))
    : 1;

  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow">
          <span className="dot" />
          Backend walkthrough
        </span>
        <h1>How a prediction is made</h1>
        <p>
          One HTTP request travels through six transformations before it becomes a
          probability. Click any node in the diagram — or any step in the list — to see
          exactly what the server does at that stage and why.
        </p>
      </div>

      {/* ---------------- 3D pipeline ---------------- */}
      <Reveal className="card" style={{ overflow: 'hidden', marginBottom: 22 }}>
        <PipelineScene count={STEPS.length} active={active} onSelect={setActive} height={300} />
      </Reveal>

      {/* ---------------- Steps + detail ---------------- */}
      <div className="model-grid">
        <div className="step-list">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              className={`step ${i === active ? 'on' : ''}`}
              onClick={() => setActive(i)}
            >
              <span className="step-n">{i + 1}</span>
              <span>
                <span className="step-t">{s.title}</span>
                <span className="step-d">{s.short}</span>
              </span>
            </button>
          ))}
        </div>

        <Reveal className="card" key={step.title}>
          <div className="card-head">
            <h3>
              Step {active + 1} · {step.title}
            </h3>
            <span className="hint">backend/app.py</span>
          </div>
          <div className="card-pad">
            <p style={{ color: 'var(--ink-2)' }}>{step.detail}</p>

            <div className="alert info" style={{ margin: '18px 0' }}>
              <Book size={17} />
              <span>
                <strong>Why it matters — </strong>
                {step.why}
              </span>
            </div>

            <pre className="code">{step.code}</pre>
          </div>
        </Reveal>
      </div>

      {/* ---------------- Model card ---------------- */}
      <section style={{ marginTop: 40 }}>
        <div className="section-head left" style={{ marginBottom: 22 }}>
          <h2>Model card</h2>
          <p>Reported by the backend from the artifacts written during training.</p>
        </div>

        <div className="grid-kpi" style={{ marginBottom: 22 }}>
          <Reveal className="card kpi" style={{ '--kpi-c': 'var(--accent)', '--kpi-wash': 'var(--accent-wash)' }}>
            <span className="kpi-icon">
              <Cpu size={18} />
            </span>
            <div className="kpi-label">Algorithm</div>
            <div className="kpi-value" style={{ fontSize: '1.3rem' }}>
              {metrics?.algorithm ?? 'Logistic Regression'}
            </div>
            <div className="kpi-foot">max_iter 1000 · class_weight balanced</div>
          </Reveal>

          <Reveal delay={70} className="card kpi" style={{ '--kpi-c': 'var(--ok)', '--kpi-wash': 'var(--ok-wash)' }}>
            <span className="kpi-icon">
              <Scale size={18} />
            </span>
            <div className="kpi-label">Accuracy</div>
            <div className="kpi-value">{metrics ? `${metrics.accuracy}%` : '—'}</div>
            <div className="kpi-foot">Correct predictions overall</div>
          </Reveal>

          <Reveal delay={140} className="card kpi" style={{ '--kpi-c': 'var(--info)', '--kpi-wash': 'var(--info-wash)' }}>
            <span className="kpi-icon">
              <Layers size={18} />
            </span>
            <div className="kpi-label">F1 score</div>
            <div className="kpi-value">{metrics ? metrics.f1_score : '—'}</div>
            <div className="kpi-foot">Balance of precision and recall on defaults</div>
          </Reveal>

          <Reveal delay={210} className="card kpi" style={{ '--kpi-c': 'var(--gold)', '--kpi-wash': '#fbf3e2' }}>
            <span className="kpi-icon">
              <Book size={18} />
            </span>
            <div className="kpi-label">Feature width</div>
            <div className="kpi-value">16 → 24</div>
            <div className="kpi-foot">Raw inputs expanded by one-hot encoding</div>
          </Reveal>
        </div>

        <div className="model-grid">
          <Reveal className="card">
            <div className="card-head">
              <h3>Most influential features</h3>
              <span className="hint">|coefficient| share</span>
            </div>
            <div className="card-pad">
              {metrics ? (
                metrics.feature_importance.map((f) => (
                  <div className="bar-row" key={f.feature}>
                    <div className="top">
                      <span className="name">{f.feature}</span>
                      <span className="val">{f.importance}%</span>
                    </div>
                    <div className="bar-track">
                      <div
                        className="bar-fill"
                        style={{ width: `${(f.importance / maxImportance) * 100}%` }}
                      />
                    </div>
                  </div>
                ))
              ) : (
                <p style={{ color: 'var(--muted)', fontSize: '.9rem' }}>
                  Start the backend to load feature importance.
                </p>
              )}
              <p style={{ fontSize: '.83rem', color: 'var(--muted)', marginTop: 4 }}>
                Because every numeric feature is standardised first, the absolute coefficients
                are directly comparable — a larger bar means that feature moves the log-odds of
                default more.
              </p>
            </div>
          </Reveal>

          <Reveal delay={120} className="card">
            <div className="card-head">
              <h3>Evaluation caveat</h3>
              <span className="hint">Read this before quoting the numbers</span>
            </div>
            <div className="card-pad">
              <div className="alert">
                <Alert size={17} />
                <span>
                  <code className="inline">train_model.py</code> fits on the full dataset and
                  scores on that same data, so the accuracy and F1 above are{' '}
                  <strong>training-set</strong> figures, not held-out performance.
                </span>
              </div>
              <p style={{ color: 'var(--ink-2)', marginTop: 16, fontSize: '.92rem' }}>
                The F1 of {metrics?.f1_score ?? '0.33'} on the minority class is the number worth
                discussing: with roughly 88% of loans never defaulting, overall accuracy is a weak
                signal. A model that always answered &ldquo;no default&rdquo; would already score
                near 88% and catch nothing.
              </p>
              <p style={{ color: 'var(--muted)', marginTop: 12, fontSize: '.88rem' }}>
                Natural next step:{' '}
                <code className="inline">train_test_split</code> with stratification, then report
                precision, recall and ROC-AUC on the held-out split.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ---------------- Feature dictionary ---------------- */}
      <Reveal className="card" style={{ marginTop: 40 }}>
        <div className="card-head">
          <h3>Feature dictionary</h3>
          <span className="hint">16 raw inputs → 24 model columns</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>Column</th>
                <th>Type</th>
                <th>Treatment</th>
              </tr>
            </thead>
            <tbody>
              {RAW_FEATURES.map(([name, type, note]) => (
                <tr key={name}>
                  <td style={{ fontFamily: 'var(--mono)', fontSize: '.84rem', color: 'var(--ink)' }}>{name}</td>
                  <td>
                    <span
                      className={`badge ${
                        type === 'numeric' ? 'badge-info' : type === 'binary' ? 'badge-neutral' : 'badge-ok'
                      }`}
                    >
                      {type}
                    </span>
                  </td>
                  <td>{note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>

      {/* ---------------- API reference ---------------- */}
      <Reveal className="card" style={{ marginTop: 22 }}>
        <div className="card-head">
          <h3>API reference</h3>
          <span className="hint" style={{ fontFamily: 'var(--mono)' }}>
            {API_BASE}
          </span>
        </div>
        <div>
          {ENDPOINTS.map((e) => (
            <div className="endpoint" key={e.p}>
              <span className={`method ${e.m.toLowerCase()}`}>{e.m}</span>
              <span className="path">{e.p}</span>
              <span className="desc">{e.d}</span>
            </div>
          ))}
        </div>
        <div className="card-pad">
          <div className="grid-2">
            <div>
              <div className="kpi-label" style={{ marginBottom: 10 }}>
                Request body
              </div>
              <pre className="code">{`{
  "age": "35",
  "income": "65000",
  "amount": "25000",
  "score": "680",
  "rate": "10.50",
  "dti": "0.35",
  "education": "Bachelor's",
  "employment": "Full-time",
  "purpose": "Auto"
}`}</pre>
            </div>
            <div>
              <div className="kpi-label" style={{ marginBottom: 10 }}>
                Response
              </div>
              <pre className="code">{`{
  "risk": "low",
  "confidence": "34.2%",
  "message": "Applicant is likely to repay"
}`}</pre>
            </div>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
