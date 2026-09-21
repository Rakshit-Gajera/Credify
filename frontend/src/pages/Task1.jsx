import Reveal from '../components/Reveal';

const COLUMNS = [
  { name: 'LoanID',          type: 'String',  desc: 'Unique identifier for each loan application' },
  { name: 'Age',             type: 'Integer', desc: 'Age of the applicant in years' },
  { name: 'Income',          type: 'Float',   desc: 'Annual income of the applicant (USD)' },
  { name: 'LoanAmount',      type: 'Float',   desc: 'Total loan amount requested (USD)' },
  { name: 'CreditScore',     type: 'Integer', desc: 'FICO-style credit score (300–850)' },
  { name: 'MonthsEmployed',  type: 'Integer', desc: 'Number of months employed at current job' },
  { name: 'NumCreditLines',  type: 'Integer', desc: 'Total number of open credit lines' },
  { name: 'InterestRate',    type: 'Float',   desc: 'Annual interest rate on the loan (%)' },
  { name: 'LoanTerm',        type: 'Integer', desc: 'Duration of the loan in months' },
  { name: 'DTIRatio',        type: 'Float',   desc: 'Debt-to-Income ratio — monthly debt / monthly income' },
  { name: 'Education',       type: 'Category',desc: "Applicant's highest education level" },
  { name: 'EmploymentType',  type: 'Category',desc: 'Type of employment (Full-time, Part-time, Self-employed, Unemployed)' },
  { name: 'MaritalStatus',   type: 'Category',desc: 'Marital status (Single, Married, Divorced)' },
  { name: 'HasMortgage',     type: 'Binary',  desc: 'Does the applicant have an existing mortgage? (Yes/No)' },
  { name: 'HasDependents',   type: 'Binary',  desc: 'Does the applicant have dependents? (Yes/No)' },
  { name: 'LoanPurpose',     type: 'Category',desc: 'Reason for the loan (Auto, Business, Education, Home, Other)' },
  { name: 'HasCoSigner',     type: 'Binary',  desc: 'Does the loan have a co-signer? (Yes/No)' },
  { name: 'Default',         type: 'Target',  desc: '🎯 Target — did the applicant default? (1 = Yes, 0 = No)' },
];

const TYPE_COLORS = {
  Integer:  { bg: 'var(--info-wash)',   color: 'var(--info)' },
  Float:    { bg: 'var(--info-wash)',   color: 'var(--info)' },
  String:   { bg: 'var(--bg-tint)',     color: 'var(--ink-2)' },
  Category: { bg: '#f3ecff',            color: '#7c3aed' },
  Binary:   { bg: '#fff3f3',            color: '#b91c1c' },
  Target:   { bg: 'var(--ok-wash)',     color: 'var(--ok)' },
};

function TypeBadge({ type }) {
  const s = TYPE_COLORS[type] || TYPE_COLORS.String;
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 999,
      fontSize: '.75rem', fontWeight: 600,
      background: s.bg, color: s.color,
    }}>
      {type}
    </span>
  );
}

const OBSERVATIONS = [
  { icon: '📊', title: '255,347 rows', desc: 'Large dataset — enough data to train robust ML models without overfitting.' },
  { icon: '🏷️', title: '18 columns', desc: '17 input features + 1 target variable (Default).' },
  { icon: '⚠️', title: 'Class imbalance', desc: 'Only ~11.6% of loans defaulted. The model must be trained with class_weight="balanced" to avoid always predicting "No Default".' },
  { icon: '🔢', title: 'Mixed data types', desc: 'Both numerical (Income, CreditScore) and categorical (Education, LoanPurpose) features are present — requiring encoding.' },
  { icon: '❓', title: 'Missing values', desc: 'Some columns contain NaN values that need to be filled using median/mode imputation.' },
  { icon: '📏', title: 'Different scales', desc: 'Features like Income ($) and DTIRatio (0-1) exist on very different scales — StandardScaler normalization is required.' },
];

export default function Task1() {
  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow"><span className="dot" />Week 1 · Task 1</span>
        <h1>Problem Definition &amp; Dataset Exploration</h1>
        <p>
          Define the ML problem, understand the dataset structure, and make initial observations
          before any data cleaning or model training begins.
        </p>
      </div>

      {/* Problem Statement */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head"><h3>🎯 Problem Statement</h3></div>
        <div className="card-pad">
          <p style={{ fontSize: '1rem', lineHeight: 1.8, marginBottom: 16 }}>
            <strong>Goal:</strong> Build a Machine Learning model that can predict whether a loan applicant will{' '}
            <strong>default (fail to repay)</strong> their loan, based on their financial profile.
          </p>
          <div style={{ background: 'var(--info-wash)', border: '1px solid rgba(74,111,165,.18)', borderRadius: 'var(--r-sm)', padding: '14px 18px' }}>
            <p style={{ marginBottom: 8, fontWeight: 600 }}>Dataset Source</p>
            <p style={{ color: 'var(--muted)', fontSize: '.93rem' }}>
              <strong>Loan Default Prediction</strong> from Kaggle —{' '}
              <code className="inline">nikhil1e9/loan-default</code>
            </p>
            <p style={{ color: 'var(--muted)', fontSize: '.93rem', marginTop: 8 }}>
              255,347 loan records from a banking dataset with 18 features covering applicant demographics,
              financial history, and loan details.
            </p>
          </div>
        </div>
      </Reveal>

      {/* Initial Observations */}
      <Reveal className="card" style={{ marginBottom: 24 }}>
        <div className="card-head">
          <h3>🔍 Initial Observations</h3>
          <span className="hint">Key findings from first look at the data</span>
        </div>
        <div className="card-pad">
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 14 }}>
            {OBSERVATIONS.map((o) => (
              <div key={o.title} style={{
                background: 'var(--bg-tint)', borderRadius: 'var(--r-sm)',
                padding: '14px 16px', border: '1px solid var(--line)',
              }}>
                <div style={{ fontSize: '1.5rem', marginBottom: 8 }}>{o.icon}</div>
                <div style={{ fontWeight: 700, marginBottom: 6 }}>{o.title}</div>
                <p style={{ color: 'var(--muted)', fontSize: '.88rem', lineHeight: 1.6 }}>{o.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </Reveal>

      {/* Dataset Column Reference */}
      <Reveal className="card">
        <div className="card-head">
          <h3>📋 Dataset Column Reference</h3>
          <span className="hint">18 columns · all features explained</span>
        </div>
        <div className="table-wrap">
          <table className="data">
            <thead>
              <tr>
                <th>#</th>
                <th>Column Name</th>
                <th>Data Type</th>
                <th>Description</th>
              </tr>
            </thead>
            <tbody>
              {COLUMNS.map((col, i) => (
                <tr key={col.name} style={col.type === 'Target' ? { background: 'var(--ok-wash)' } : {}}>
                  <td className="num" style={{ color: 'var(--muted)', fontSize: '.85rem' }}>{i + 1}</td>
                  <td><code className="inline">{col.name}</code></td>
                  <td><TypeBadge type={col.type} /></td>
                  <td style={{ fontSize: '.9rem', color: 'var(--ink-2)' }}>{col.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Reveal>
    </div>
  );
}
