import Reveal from '../components/Reveal';

const ALGORITHMS = [
  {
    name: 'Logistic Regression ✅ Chosen',
    chosen: true,
    why: 'Perfect starting baseline. Simple, fast, interpretable, and works well for binary classification (Default / No Default). Easy to understand what each feature contributes.',
    pros: ['Very fast to train', 'Easy to interpret coefficients', 'No risk of overfitting on large data', 'Outputs probability scores directly'],
    cons: ['Assumes a linear relationship', 'Struggles with complex, non-linear patterns'],
    code: 'LogisticRegression(class_weight="balanced", max_iter=1000)',
  },
  {
    name: 'Decision Tree',
    chosen: false,
    why: 'Considered but not selected as the primary model because it tends to memorize training data (overfitting) rather than generalize.',
    pros: ['Human-readable rules', 'No scaling needed'],
    cons: ['Severe overfitting on complex data', 'Unstable — small data changes flip predictions'],
    code: 'DecisionTreeClassifier()',
  },
  {
    name: 'Naive Bayes',
    chosen: false,
    why: 'Rejected because it assumes all features are independent of each other — which is clearly false (Income and LoanAmount are correlated).',
    pros: ['Extremely fast', 'Works well with text'],
    cons: ['Independence assumption is unrealistic here', 'Poor with correlated features'],
    code: 'GaussianNB()',
  },
];

const SCRATCH_STEPS = [
  { step: '1', label: 'Initialize weights (θ)', desc: 'Start all feature weights at 0.' },
  { step: '2', label: 'Sigmoid function', desc: 'Convert the weighted sum to a probability between 0 and 1: P = 1 / (1 + e^(−z)).' },
  { step: '3', label: 'Predict probability', desc: 'For each loan application, compute probability of default using current weights.' },
  { step: '4', label: 'Calculate loss', desc: 'Measure how wrong our predictions are using Binary Cross-Entropy loss.' },
  { step: '5', label: 'Gradient Descent', desc: 'Nudge the weights in the direction that reduces the loss. Repeat 1000 times.' },
  { step: '6', label: 'Final prediction', desc: 'If probability > 0.5 → predict Default. Otherwise → No Default.' },
];

export default function Task3() {
  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow"><span className="dot" />Week 3 · Task 3</span>
        <h1>Model Creation</h1>
        <p>
          Select the right algorithm for the problem, train it using the scikit-learn library,
          and also implement Logistic Regression <strong>from scratch</strong> (without any library).
        </p>
      </div>

      {/* Algorithm Selection */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>🔍 Algorithm Selection</h3><span className="hint">Why Logistic Regression?</span></div>
        <div className="card-pad">
          {ALGORITHMS.map((a, i) => (
            <div key={a.name} style={{
              marginBottom: i < ALGORITHMS.length - 1 ? 20 : 0,
              border: `1px solid ${a.chosen ? 'var(--ok)' : 'var(--line)'}`,
              borderRadius: 'var(--r-sm)',
              padding: '16px 18px',
              background: a.chosen ? 'var(--ok-wash)' : 'var(--bg)',
            }}>
              <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 8 }}>
                {a.name}
              </div>
              <p style={{ color: 'var(--ink-2)', fontSize: '.92rem', lineHeight: 1.65, marginBottom: 12 }}>{a.why}</p>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--ok)', marginBottom: 4 }}>✅ Pros</p>
                  <ul style={{ paddingLeft: 16, fontSize: '.88rem', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                    {a.pros.map((p) => <li key={p}>{p}</li>)}
                  </ul>
                </div>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '.8rem', color: 'var(--danger)', marginBottom: 4 }}>❌ Cons</p>
                  <ul style={{ paddingLeft: 16, fontSize: '.88rem', color: 'var(--ink-2)', lineHeight: 1.7 }}>
                    {a.cons.map((c) => <li key={c}>{c}</li>)}
                  </ul>
                </div>
              </div>
              <div style={{ marginTop: 12, background: '#1e1e2e', borderRadius: 6, padding: '8px 12px', fontFamily: 'var(--mono)', fontSize: '.8rem', color: '#89b4fa' }}>
                {a.code}
              </div>
            </div>
          ))}
        </div>
      </Reveal>

      {/* Library Training */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>📦 Training with scikit-learn (Library)</h3></div>
        <div className="card-pad">
          <p style={{ marginBottom: 16, lineHeight: 1.7 }}>
            The dataset was split 80% training / 20% testing using <code className="inline">train_test_split</code>.
            The model was trained with <code className="inline">class_weight="balanced"</code> to compensate for the
            class imbalance (only ~11.6% defaults).
          </p>
          <div style={{ background: '#1e1e2e', borderRadius: 'var(--r-sm)', padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: '.83rem', color: '#cdd6f4', lineHeight: 1.9 }}>
            <span style={{ color: '#6c7086' }}># Split data</span><br />
            X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)<br /><br />
            <span style={{ color: '#6c7086' }}># Train model</span><br />
            model = LogisticRegression(class_weight=<span style={{ color: '#a6e3a1' }}>"balanced"</span>, max_iter=<span style={{ color: '#fab387' }}>1000</span>)<br />
            model.fit(X_train, y_train)
          </div>
        </div>
      </Reveal>

      {/* Scratch Implementation */}
      <Reveal className="card">
        <div className="card-head">
          <h3>🛠️ Scratch Implementation (No Library)</h3>
          <span className="hint">Mandatory — implemented manually using NumPy only</span>
        </div>
        <div className="card-pad">
          <p style={{ marginBottom: 20, lineHeight: 1.7 }}>
            As per the SOP requirement, Logistic Regression was implemented entirely from scratch
            using only <code className="inline">numpy</code>. This proves understanding of the math behind the algorithm.
          </p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {SCRATCH_STEPS.map((s) => (
              <div key={s.step} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 28, height: 28, borderRadius: '50%',
                  background: 'var(--accent-wash)', color: 'var(--accent)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontWeight: 700, fontSize: '.82rem',
                }}>{s.step}</span>
                <div>
                  <p style={{ fontWeight: 600, fontSize: '.93rem', marginBottom: 2 }}>{s.label}</p>
                  <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 20, background: '#1e1e2e', borderRadius: 'var(--r-sm)', padding: '14px 18px', fontFamily: 'var(--mono)', fontSize: '.8rem', color: '#cdd6f4', lineHeight: 2 }}>
            <span style={{ color: '#6c7086' }}># Sigmoid</span><br />
            <span style={{ color: '#89b4fa' }}>def</span> <span style={{ color: '#a6e3a1' }}>sigmoid</span>(z): <span style={{ color: '#f38ba8' }}>return</span> 1 / (1 + np.exp(-z))<br /><br />
            <span style={{ color: '#6c7086' }}># Gradient Descent loop</span><br />
            <span style={{ color: '#f38ba8' }}>for</span> _ <span style={{ color: '#f38ba8' }}>in</span> range(iterations):<br />
            &nbsp;&nbsp;predictions = sigmoid(X @ theta)<br />
            &nbsp;&nbsp;theta -= lr * (X.T @ (predictions - y)) / m
          </div>
        </div>
      </Reveal>
    </div>
  );
}
