import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import HeroScene from '../components/HeroScene';
import Reveal from '../components/Reveal';
import { Target, Chart, Layers, Clock, Arrow, Cpu, Database, Scale } from '../components/Icons';
import { fetchInsights, fetchMetrics } from '../lib/api';

const FEATURES = [
  {
    to: '/predict',
    icon: <Target size={20} />,
    title: 'Score an applicant',
    body:
      'Sixteen applicant attributes go in, a calibrated default probability comes out — rendered as a live 3D risk gauge.',
    cta: 'Run a prediction',
  },
  {
    to: '/insights',
    icon: <Chart size={20} />,
    title: 'Explore the dataset',
    body:
      'Class balance, loan-size distribution and sample records, read straight from the 255k-row training file.',
    cta: 'Open insights',
  },
  {
    to: '/model',
    icon: <Layers size={20} />,
    title: 'Understand the model',
    body:
      'Walk the full server-side pipeline node by node: imputation, IQR clipping, encoding, scaling, inference.',
    cta: 'See how it works',
  },
  {
    to: '/history',
    icon: <Clock size={20} />,
    title: 'Audit past decisions',
    body:
      'Every prediction is persisted server-side with its inputs, so any decision can be replayed and justified.',
    cta: 'View history',
  },
];

const STACK = [
  { icon: <Database size={17} />, k: 'Data', v: 'Loan_default.csv · 255,347 rows · 16 features' },
  { icon: <Cpu size={17} />, k: 'Model', v: 'Logistic Regression · class-weight balanced' },
  { icon: <Scale size={17} />, k: 'Serving', v: 'Flask REST API · joblib model.pkl' },
];

export default function Home() {
  const [stats, setStats] = useState(null);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    // Both are optional decoration — the page still reads fine if Flask is down.
    fetchInsights().then(setStats).catch(() => {});
    fetchMetrics().then(setMetrics).catch(() => {});
  }, []);

  const proof = [
    { n: stats?.kpis?.total_records ?? '255,347', l: 'Training records' },
    { n: metrics ? `${metrics.accuracy}%` : '67.7%', l: 'Model accuracy' },
    { n: stats?.kpis?.default_rate ?? '11.6%', l: 'Base default rate' },
    { n: '16', l: 'Input features' },
  ];

  return (
    <>
      {/* ---------------- Hero ---------------- */}
      <section className="shell hero">
        <div className="hero-grid">
          <div>
            <span className="eyebrow">
              <span className="dot" />
              Machine Learning · Semester 5
            </span>

            <h1>
              Know the risk
              <br />
              <span className="accent">before</span> you lend.
            </h1>

            <p className="hero-lede">
              CrediGuard turns an applicant&apos;s financial profile into a default
              probability in milliseconds — using a Logistic Regression model trained on a
              quarter of a million real loan records, served live from a Flask API.
            </p>

            <div className="hero-actions">
              <Link to="/predict" className="btn btn-primary">
                Assess an applicant <Arrow size={17} />
              </Link>
              <Link to="/model" className="btn btn-ghost">
                How the model works
              </Link>
            </div>

            <div className="hero-proof">
              {proof.map((p) => (
                <div key={p.l}>
                  <div className="n">{p.n}</div>
                  <div className="l">{p.l}</div>
                </div>
              ))}
            </div>
          </div>

          <div className="hero-stage">
            <div className="float-card float-a">
              <div className="t">Decision latency</div>
              <div className="v">&lt; 50 ms</div>
            </div>
            <div className="float-card float-b">
              <div className="t">Live endpoint</div>
              <div className="v" style={{ fontFamily: 'var(--mono)', fontSize: '.86rem' }}>
                POST /api/predict
              </div>
            </div>
            <HeroScene />
          </div>
        </div>
      </section>

      {/* ---------------- Stack strip ---------------- */}
      <section className="shell">
        <Reveal className="card card-pad" style={{ display: 'grid', gap: 18 }}>
          <div className="grid-3">
            {STACK.map((s) => (
              <div key={s.k} style={{ display: 'flex', gap: 13, alignItems: 'flex-start' }}>
                <span
                  className="kpi-icon"
                  style={{ margin: 0, width: 34, height: 34, borderRadius: 10 }}
                >
                  {s.icon}
                </span>
                <div>
                  <div className="kpi-label">{s.k}</div>
                  <div style={{ fontSize: '.9rem', color: 'var(--ink-2)', marginTop: 3 }}>{s.v}</div>
                </div>
              </div>
            ))}
          </div>
        </Reveal>
      </section>

      {/* ---------------- Features ---------------- */}
      <section className="shell section">
        <Reveal className="section-head">
          <h2>Four ways into the model</h2>
          <p>
            Each screen answers a different question a lender — or an examiner — is likely to
            ask about an automated credit decision.
          </p>
        </Reveal>

        <div className="grid-feature">
          {FEATURES.map((f, i) => (
            <Reveal key={f.to} delay={i * 90}>
              <Link to={f.to} className="card card-hover feature" style={{ height: '100%' }}>
                <span className="ic">{f.icon}</span>
                <h3>{f.title}</h3>
                <p>{f.body}</p>
                <span className="go">
                  {f.cta} <Arrow size={15} />
                </span>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ---------------- Closing CTA ---------------- */}
      <section className="shell" style={{ paddingBottom: 80 }}>
        <Reveal
          className="card card-pad"
          style={{
            textAlign: 'center',
            padding: '52px 28px',
            background:
              'linear-gradient(150deg, #ffffff 0%, var(--accent-wash) 100%)',
            borderColor: 'rgba(217,119,87,.25)',
          }}
        >
          <h2 style={{ marginBottom: 12 }}>Ready to score your first applicant?</h2>
          <p style={{ color: 'var(--muted)', maxWidth: 520, margin: '0 auto 26px' }}>
            Start the Flask server on port 5000, then fill in the form — the prediction and
            its full input record are logged automatically.
          </p>
          <Link to="/predict" className="btn btn-primary">
            Open the predictor <Arrow size={17} />
          </Link>
        </Reveal>
      </section>
    </>
  );
}
