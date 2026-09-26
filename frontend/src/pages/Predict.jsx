import { useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import RiskOrb from '../components/RiskOrb';
import Reveal from '../components/Reveal';
import { Target, Alert, Check, Sparkle, Refresh, Arrow, Clock } from '../components/Icons';
import { postPrediction } from '../lib/api';

/* The backend's median/mode fallbacks — a neutral, realistic starting point. */
const DEFAULTS = {
  age: '35',
  income: '65000',
  amount: '25000',
  education: "Bachelor's",
  employment: 'Full-time',
  rate: '10.50',
  marital_status: 'Married',
  months_employed: '36',
  duration: '36',
  dependents: 'No',
  score: '680',
  purpose: 'Auto',
  credit_lines: '3',
  mortgage: 'No',
  dti: '0.35',
  cosigner: 'No',
};

/* One-click demo profiles — handy when presenting, so you don't retype 16 fields. */
const PRESETS = {
  prime: {
    label: 'Prime borrower',
    values: {
      ...DEFAULTS,
      age: '44',
      income: '120000',
      amount: '18000',
      education: "Master's",
      employment: 'Full-time',
      rate: '6.25',
      marital_status: 'Married',
      months_employed: '156',
      duration: '24',
      dependents: 'No',
      score: '790',
      purpose: 'Home',
      credit_lines: '2',
      mortgage: 'Yes',
      dti: '0.18',
      cosigner: 'Yes',
    },
  },
  subprime: {
    label: 'High-risk borrower',
    values: {
      ...DEFAULTS,
      age: '23',
      income: '24000',
      amount: '210000',
      education: 'High School',
      employment: 'Unemployed',
      rate: '21.75',
      marital_status: 'Single',
      months_employed: '3',
      duration: '60',
      dependents: 'Yes',
      score: '430',
      purpose: 'Other',
      credit_lines: '4',
      mortgage: 'No',
      dti: '0.86',
      cosigner: 'No',
    },
  },
};

const SELECTS = {
  education: ['High School', "Bachelor's", "Master's", 'PhD'],
  employment: ['Full-time', 'Part-time', 'Self-employed', 'Unemployed'],
  marital_status: ['Single', 'Married', 'Divorced'],
  purpose: ['Auto', 'Business', 'Education', 'Home', 'Other'],
  duration: ['12', '24', '36', '48', '60'],
};

const money = (n) =>
  Number.isFinite(n) ? `$${Math.round(n).toLocaleString('en-US')}` : '—';

function Field({ label, unit, children }) {
  return (
    <div className="field">
      <label>
        <span>{label}</span>
        {unit ? <span className="unit">{unit}</span> : null}
      </label>
      {children}
    </div>
  );
}

function Group({ n, title, children }) {
  return (
    <div className="fieldset">
      <div className="fieldset-head">
        <span className="fieldset-num">{n}</span>
        <h3>{title}</h3>
        <span className="rule" />
      </div>
      <div className="grid-3">{children}</div>
    </div>
  );
}

function YesNo({ name, value, onChange }) {
  return (
    <div className="seg" style={{ width: '100%' }}>
      {['No', 'Yes'].map((opt) => (
        <button
          key={opt}
          type="button"
          className={value === opt ? 'on' : ''}
          onClick={() => onChange({ target: { name, value: opt } })}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

export default function Predict() {
  const [form, setForm] = useState(DEFAULTS);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const resultRef = useRef(null);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const applyPreset = (key) => {
    setForm(PRESETS[key].values);
    setResult(null);
    setError('');
  };

  /* Client-side affordability maths. Purely informational context for the
     reviewer — the model never sees these; it only gets the 16 raw fields. */
  const derived = useMemo(() => {
    const principal = Number(form.amount) || 0;
    const months = Number(form.duration) || 1;
    const annualRate = Number(form.rate) || 0;
    const income = Number(form.income) || 0;

    const r = annualRate / 100 / 12;
    const emi =
      r > 0 ? (principal * r) / (1 - (1 + r) ** -months) : principal / months;
    const totalPaid = emi * months;
    const monthlyIncome = income / 12;

    return {
      emi,
      totalInterest: totalPaid - principal,
      loanToIncome: income > 0 ? principal / income : 0,
      emiBurden: monthlyIncome > 0 ? emi / monthlyIncome : 0,
    };
  }, [form.amount, form.duration, form.rate, form.income]);

  const probability = useMemo(() => {
    if (!result?.confidence) return 0;
    const pct = parseFloat(String(result.confidence).replace('%', ''));
    return Number.isFinite(pct) ? pct / 100 : 0;
  }, [result]);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setResult(null);
    try {
      const data = await postPrediction(form);
      setResult(data);
      requestAnimationFrame(() =>
        resultRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' })
      );
    } catch (err) {
      const msg = err.message || 'An error occurred during prediction';
      if (msg.includes('Failed to fetch') || msg.includes('NetworkError') || msg.includes('Load failed')) {
        setError(`${msg}. Make sure the backend server is reachable.`);
      } else {
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  };

  const isHigh = result?.risk === 'high';

  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow">
          <span className="dot" />
          POST /api/predict
        </span>
        <h1>Assess loan default risk</h1>
        <p>
          Enter the applicant&apos;s profile. The server imputes anything missing, clips
          outliers, encodes categories, standardises the numerics and returns the model&apos;s
          probability of default.
        </p>
      </div>

      {/* ---------------- Result ---------------- */}
      {result ? (
        <div ref={resultRef} style={{ marginBottom: 26 }}>
          <div className="card result-shell">
            <div className="result-orb">
              <RiskOrb probability={probability} />
            </div>

            <div className="result-body">
              <span className={`badge ${isHigh ? 'badge-danger' : 'badge-ok'}`}>
                {isHigh ? <Alert size={13} /> : <Check size={13} />}
                {isHigh ? 'High risk' : 'Low risk'}
              </span>

              <h2 className="result-verdict" style={{ marginTop: 14 }}>
                {isHigh ? 'Likely to default' : 'Likely to repay'}
              </h2>
              <p style={{ color: 'var(--muted)', marginTop: 8 }}>{result.message}</p>

              <div style={{ margin: '22px 0 20px' }}>
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: 8,
                    fontSize: '.8rem',
                  }}
                >
                  <span style={{ fontWeight: 600, color: 'var(--ink-2)' }}>
                    Probability of default
                  </span>
                  <span className="num" style={{ color: isHigh ? 'var(--danger)' : 'var(--ok)' }}>
                    {result.confidence}
                  </span>
                </div>
                <div className="meter">
                  <i
                    style={{
                      width: `${Math.min(probability * 100, 100)}%`,
                      background: isHigh
                        ? 'linear-gradient(90deg, var(--accent), var(--danger))'
                        : 'linear-gradient(90deg, #4ec18f, var(--ok))',
                    }}
                  />
                </div>
                <p style={{ fontSize: '.78rem', color: 'var(--faint)', marginTop: 8 }}>
                  Decision threshold 0.50 · above it the applicant is flagged high risk.
                </p>
              </div>

              <div className="readout">
                <div>
                  <div className="l">Est. monthly</div>
                  <div className="v">{money(derived.emi)}</div>
                </div>
                <div>
                  <div className="l">Loan / income</div>
                  <div className="v">{derived.loanToIncome.toFixed(2)}×</div>
                </div>
                <div>
                  <div className="l">Credit score</div>
                  <div className="v">{form.score}</div>
                </div>
                <div>
                  <div className="l">DTI ratio</div>
                  <div className="v">{form.dti}</div>
                </div>
              </div>

              <div style={{ display: 'flex', gap: 10, marginTop: 22, flexWrap: 'wrap' }}>
                <Link to="/history" className="btn btn-ghost btn-sm">
                  <Clock size={15} /> View in history
                </Link>
                <button
                  type="button"
                  className="btn btn-quiet btn-sm"
                  onClick={() => setResult(null)}
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {error ? (
        <div className="alert" style={{ marginBottom: 22 }}>
          <Alert size={17} />
          <span>{error}</span>
        </div>
      ) : null}

      {/* ---------------- Form + aside ---------------- */}
      <div className="predict-layout">
        <Reveal className="card">
          <div className="card-head">
            <h3>Applicant record</h3>
            <span className="hint">16 features</span>
          </div>

          <form id="predict-form" onSubmit={onSubmit} className="card-pad">
            <Group n="1" title="Applicant profile">
              <Field label="Age" unit="years">
                <input
                  className="input"
                  type="number"
                  name="age"
                  min="18"
                  max="100"
                  value={form.age}
                  onChange={onChange}
                  required
                />
              </Field>
              <Field label="Marital status">
                <select className="select" name="marital_status" value={form.marital_status} onChange={onChange}>
                  {SELECTS.marital_status.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Education">
                <select className="select" name="education" value={form.education} onChange={onChange}>
                  {SELECTS.education.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Has dependents">
                <YesNo name="dependents" value={form.dependents} onChange={onChange} />
              </Field>
            </Group>

            <Group n="2" title="Employment & income">
              <Field label="Employment type">
                <select className="select" name="employment" value={form.employment} onChange={onChange}>
                  {SELECTS.employment.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Annual income" unit="USD">
                <input
                  className="input"
                  type="number"
                  name="income"
                  min="0"
                  step="1000"
                  value={form.income}
                  onChange={onChange}
                  required
                />
              </Field>
              <Field label="Months employed" unit="months">
                <input
                  className="input"
                  type="number"
                  name="months_employed"
                  min="0"
                  value={form.months_employed}
                  onChange={onChange}
                  required
                />
              </Field>
            </Group>

            <Group n="3" title="Loan request">
              <Field label="Loan amount" unit="USD">
                <input
                  className="input"
                  type="number"
                  name="amount"
                  min="0"
                  step="500"
                  value={form.amount}
                  onChange={onChange}
                  required
                />
              </Field>
              <Field label="Loan term" unit="months">
                <select className="select" name="duration" value={form.duration} onChange={onChange}>
                  {SELECTS.duration.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
              <Field label="Interest rate" unit={`${form.rate}%`}>
                <input
                  className="input"
                  type="number"
                  name="rate"
                  step="0.01"
                  min="0"
                  max="30"
                  value={form.rate}
                  onChange={onChange}
                  required
                />
                <input
                  type="range"
                  name="rate"
                  min="2"
                  max="25"
                  step="0.25"
                  value={form.rate}
                  onChange={onChange}
                />
              </Field>
              <Field label="Loan purpose">
                <select className="select" name="purpose" value={form.purpose} onChange={onChange}>
                  {SELECTS.purpose.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </Field>
            </Group>

            <Group n="4" title="Credit profile">
              <Field label="Credit score" unit={form.score}>
                <input
                  className="input"
                  type="number"
                  name="score"
                  min="300"
                  max="850"
                  value={form.score}
                  onChange={onChange}
                  required
                />
                <input
                  type="range"
                  name="score"
                  min="300"
                  max="850"
                  step="5"
                  value={form.score}
                  onChange={onChange}
                />
              </Field>
              <Field label="Open credit lines">
                <input
                  className="input"
                  type="number"
                  name="credit_lines"
                  min="0"
                  max="20"
                  value={form.credit_lines}
                  onChange={onChange}
                  required
                />
              </Field>
              <Field label="Debt-to-income ratio" unit={form.dti}>
                <input
                  className="input"
                  type="number"
                  name="dti"
                  step="0.01"
                  min="0"
                  max="1"
                  value={form.dti}
                  onChange={onChange}
                  required
                />
                <input
                  type="range"
                  name="dti"
                  min="0"
                  max="1"
                  step="0.01"
                  value={form.dti}
                  onChange={onChange}
                />
              </Field>
              <Field label="Has mortgage">
                <YesNo name="mortgage" value={form.mortgage} onChange={onChange} />
              </Field>
              <Field label="Has co-signer">
                <YesNo name="cosigner" value={form.cosigner} onChange={onChange} />
              </Field>
            </Group>
          </form>
        </Reveal>

        {/* ---------------- Sticky aside ---------------- */}
        <aside className="predict-aside">
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ height: 210, background: 'linear-gradient(170deg, var(--surface-2), var(--bg-tint))' }}>
              <RiskOrb probability={probability} idle={!result} />
            </div>
            <div className="card-pad" style={{ paddingTop: 18 }}>
              <div className="kpi-label">Affordability preview</div>
              <p style={{ fontSize: '.8rem', color: 'var(--muted)', margin: '6px 0 16px' }}>
                Computed in the browser from your inputs — context only, not part of the model.
              </p>

              <div className="readout" style={{ gridTemplateColumns: '1fr 1fr' }}>
                <div>
                  <div className="l">Monthly</div>
                  <div className="v">{money(derived.emi)}</div>
                </div>
                <div>
                  <div className="l">Total interest</div>
                  <div className="v">{money(derived.totalInterest)}</div>
                </div>
                <div>
                  <div className="l">Loan / income</div>
                  <div className="v">{derived.loanToIncome.toFixed(2)}×</div>
                </div>
                <div>
                  <div className="l">Income used</div>
                  <div className="v">{(derived.emiBurden * 100).toFixed(0)}%</div>
                </div>
              </div>

              <button
                type="submit"
                form="predict-form"
                className="btn btn-primary"
                disabled={loading}
                style={{ width: '100%', marginTop: 20 }}
              >
                {loading ? (
                  <>
                    <span className="spinner" /> Scoring…
                  </>
                ) : (
                  <>
                    <Target size={17} /> Predict default risk
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="card card-pad">
            <div className="kpi-label" style={{ marginBottom: 12 }}>
              Demo profiles
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset('prime')}>
                <Sparkle size={15} /> {PRESETS.prime.label}
              </button>
              <button type="button" className="btn btn-ghost btn-sm" onClick={() => applyPreset('subprime')}>
                <Alert size={15} /> {PRESETS.subprime.label}
              </button>
              <button
                type="button"
                className="btn btn-quiet btn-sm"
                onClick={() => {
                  setForm(DEFAULTS);
                  setResult(null);
                  setError('');
                }}
              >
                <Refresh size={15} /> Reset to dataset median
              </button>
            </div>
          </div>

          <Link to="/model" className="card card-pad card-hover" style={{ display: 'block' }}>
            <div className="kpi-label">Presenting this?</div>
            <p style={{ fontSize: '.88rem', color: 'var(--ink-2)', marginTop: 6 }}>
              The <strong>How It Works</strong> page walks through every transformation the
              server applies to these inputs.
            </p>
            <span className="go" style={{ color: 'var(--accent-deep)', fontWeight: 600, fontSize: '.84rem', display: 'inline-flex', gap: 6, alignItems: 'center', marginTop: 10 }}>
              Open the pipeline <Arrow size={15} />
            </span>
          </Link>
        </aside>
      </div>
    </div>
  );
}
