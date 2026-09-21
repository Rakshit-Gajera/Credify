import Reveal from '../components/Reveal';

const STEPS = [
  {
    step: '1',
    title: 'Handle Missing Values',
    color: 'var(--info)',
    colorWash: 'var(--info-wash)',
    what: 'Some rows had blank/NaN cells in numeric columns like Income, CreditScore, LoanAmount.',
    how: 'Filled numeric NaNs with the column median (not mean — median is more robust against extreme values). Filled categorical NaNs with the column mode (most frequent value).',
    code: "df['Income'].fillna(df['Income'].median())",
  },
  {
    step: '2',
    title: 'Identify & Handle Outliers',
    color: '#b07d00',
    colorWash: '#fff8e6',
    what: 'Some loan amounts and income values were extremely high (e.g. $5,000,000 income) which would mislead the model.',
    how: 'Used IQR-based outlier clipping. Values below Q1 − 1.5×IQR or above Q3 + 1.5×IQR were clipped to those limits, not removed.',
    code: 'df[col].clip(lower=lower_bound, upper=upper_bound)',
  },
  {
    step: '3',
    title: 'Encode Categorical Variables',
    color: '#7c3aed',
    colorWash: '#f3ecff',
    what: 'ML models only understand numbers. Columns like Education, EmploymentType, LoanPurpose contained text.',
    how: [
      'Binary columns (HasMortgage, HasDependents, HasCoSigner): mapped Yes→1, No→0.',
      'Multi-class columns (Education, EmploymentType, MaritalStatus, LoanPurpose): One-Hot Encoded using pd.get_dummies() with drop_first=True.',
    ],
    code: "pd.get_dummies(df, columns=['Education','EmploymentType'], drop_first=True)",
  },
  {
    step: '4',
    title: 'Normalize / Scale Numerical Features',
    color: 'var(--ok)',
    colorWash: 'var(--ok-wash)',
    what: 'Features like Income (values in $100,000s) and DTIRatio (values 0–1) were on very different scales. This causes models to unfairly prioritize large-number features.',
    how: 'Applied StandardScaler — transforms each numeric column so it has mean=0 and standard deviation=1. Now all features are on equal footing.',
    code: 'X_scaled = (X - mean) / std',
  },
  {
    step: '5',
    title: 'Exploratory Data Analysis (EDA)',
    color: 'var(--accent)',
    colorWash: 'var(--accent-wash)',
    what: 'Before modeling, we need to understand the data: distributions, correlations, and class balance.',
    how: [
      'Plotted histograms for Income, LoanAmount, CreditScore to see distributions.',
      'Created correlation heatmap to find features most related to Default.',
      'Checked class balance — ~11.6% Default vs ~88.4% Non-Default → imbalanced!',
    ],
    code: 'df["Default"].value_counts(normalize=True)',
  },
];

const COLS_PROCESSED = [
  { col: 'Income',        action: 'Median fill + IQR clip + StandardScale' },
  { col: 'LoanAmount',    action: 'Median fill + IQR clip + StandardScale' },
  { col: 'CreditScore',   action: 'Median fill + StandardScale' },
  { col: 'Age',           action: 'Median fill + StandardScale' },
  { col: 'DTIRatio',      action: 'Median fill + StandardScale' },
  { col: 'Education',     action: 'Mode fill + One-Hot Encode (drop_first)' },
  { col: 'EmploymentType',action: 'Mode fill + One-Hot Encode (drop_first)' },
  { col: 'LoanPurpose',   action: 'Mode fill + One-Hot Encode (drop_first)' },
  { col: 'HasMortgage',   action: 'Yes→1 / No→0 binary mapping' },
  { col: 'HasDependents', action: 'Yes→1 / No→0 binary mapping' },
  { col: 'HasCoSigner',   action: 'Yes→1 / No→0 binary mapping' },
];

export default function Task2() {
  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow"><span className="dot" />Week 2 · Task 2</span>
        <h1>Data Cleaning &amp; Pre-processing</h1>
        <p>
          Raw data is messy. Before training any model, we clean the dataset by handling
          missing values, fixing outliers, encoding categories, and scaling numbers.
        </p>
      </div>

      {/* Steps */}
      {STEPS.map((s, i) => (
        <Reveal key={s.step} className="card" style={{ marginBottom: 20 }} delay={i * 60}>
          <div className="card-head">
            <span style={{
              display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              width: 28, height: 28, borderRadius: '50%',
              background: s.colorWash, color: s.color,
              fontWeight: 700, fontSize: '.85rem', marginRight: 10, flexShrink: 0,
            }}>{s.step}</span>
            <h3 style={{ color: s.color }}>{s.title}</h3>
          </div>
          <div className="card-pad" style={{ paddingTop: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 14 }}>
              <div>
                <p style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Problem</p>
                <p style={{ fontSize: '.93rem', lineHeight: 1.65 }}>{s.what}</p>
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '.82rem', color: 'var(--muted)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '.05em' }}>Solution</p>
                {Array.isArray(s.how)
                  ? <ul style={{ paddingLeft: 18, fontSize: '.93rem', lineHeight: 1.7 }}>{s.how.map((h) => <li key={h}>{h}</li>)}</ul>
                  : <p style={{ fontSize: '.93rem', lineHeight: 1.65 }}>{s.how}</p>}
              </div>
            </div>
            <div style={{ background: '#1e1e2e', borderRadius: 'var(--r-sm)', padding: '10px 14px', fontFamily: 'var(--mono)', fontSize: '.82rem', color: '#a6e3a1' }}>
              {s.code}
            </div>
          </div>
        </Reveal>
      ))}

      {/* Summary Table */}
      <Reveal className="card">
        <div className="card-head">
          <h3>📋 Pre-processing Summary</h3>
          <span className="hint">What was done to each column</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr><th>Column</th><th>Pre-processing Applied</th></tr>
            </thead>
            <tbody>
              {COLS_PROCESSED.map((r) => (
                <tr key={r.col}>
                  <td><code className="inline">{r.col}</code></td>
                  <td style={{ fontSize: '.9rem', color: 'var(--ink-2)' }}>{r.action}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
