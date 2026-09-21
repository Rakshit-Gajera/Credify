import { useEffect, useState } from 'react';
import BarChart3D from '../components/BarChart3D';
import DonutChart from '../components/DonutChart';
import Reveal from '../components/Reveal';
import { Database, Alert, Wallet, Card, Refresh } from '../components/Icons';
import { fetchInsights } from '../lib/api';

const KPI_META = [
  { key: 'total_records', label: 'Training records', icon: <Database size={18} />, color: 'var(--info)', wash: 'var(--info-wash)', foot: 'Rows in Loan_default.csv' },
  { key: 'default_rate', label: 'Default rate', icon: <Alert size={18} />, color: 'var(--danger)', wash: 'var(--danger-wash)', foot: 'Share of loans that defaulted' },
  { key: 'avg_loan_amount', label: 'Avg loan amount', icon: <Wallet size={18} />, color: 'var(--ok)', wash: 'var(--ok-wash)', foot: 'Mean principal requested' },
  { key: 'avg_credit_score', label: 'Avg credit score', icon: <Card size={18} />, color: 'var(--accent)', wash: 'var(--accent-wash)', foot: 'Mean FICO-style score' },
];

export default function Insights() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const load = () => {
    setLoading(true);
    setError('');
    fetchInsights()
      .then(setData)
      .catch((e) =>
        setError(`${e.message}. Start the Flask server on port 5000 and try again.`)
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  /* Backend returns 8 histogram bins over the clipped LoanAmount range. */
  const binLabels = data
    ? data.loan_dist.map((_, i) => `B${i + 1}`)
    : [];

  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow">
          <span className="dot" />
          GET /api/insights
        </span>
        <h1>Inside the training data</h1>
        <p>
          Everything on this page is computed server-side with pandas and NumPy from the same
          CSV the model was trained on — no numbers are hard-coded in the frontend.
        </p>
      </div>

      {error ? (
        <div className="alert" style={{ marginBottom: 22 }}>
          <Alert size={17} />
          <span>{error}</span>
          <button type="button" className="btn btn-quiet btn-sm" style={{ marginLeft: 'auto' }} onClick={load}>
            <Refresh size={14} /> Retry
          </button>
        </div>
      ) : null}

      {loading ? (
        <div className="empty">
          <span className="spinner dark" style={{ width: 30, height: 30, margin: '0 auto 16px', display: 'block' }} />
          <p>Reading the dataset…</p>
        </div>
      ) : null}

      {data ? (
        <>
          {/* ---------------- KPIs ---------------- */}
          <div className="grid-kpi" style={{ marginBottom: 22 }}>
            {KPI_META.map((m, i) => (
              <Reveal
                key={m.key}
                delay={i * 70}
                className="card kpi card-hover"
                style={{ '--kpi-c': m.color, '--kpi-wash': m.wash }}
              >
                <span className="kpi-icon">{m.icon}</span>
                <div className="kpi-label">{m.label}</div>
                <div className="kpi-value">{data.kpis[m.key]}</div>
                <div className="kpi-foot">{m.foot}</div>
              </Reveal>
            ))}
          </div>

          {/* ---------------- Charts ---------------- */}
          <div className="insights-grid">
            <Reveal className="card">
              <div className="card-head">
                <h3>Class balance</h3>
                <span className="hint">Default vs non-default</span>
              </div>
              <div className="card-pad">
                <DonutChart
                  slices={[
                    { name: data.default_dist[0].name, value: data.default_dist[0].value, color: '#4a6fa5' },
                    { name: data.default_dist[1].name, value: data.default_dist[1].value, color: '#c8462f' },
                  ]}
                />
                <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginTop: 20 }}>
                  The classes are heavily imbalanced, which is why the model is trained with{' '}
                  <code className="inline">class_weight=&apos;balanced&apos;</code> — otherwise it
                  could reach high accuracy by predicting &ldquo;no default&rdquo; every time.
                </p>
              </div>
            </Reveal>

            <Reveal delay={120} className="card">
              <div className="card-head">
                <h3>Loan amount distribution</h3>
                <span className="hint">8 bins · NumPy histogram</span>
              </div>
              <div style={{ padding: '6px 6px 0' }}>
                <BarChart3D values={data.loan_dist} height={300} />
              </div>
              <div className="card-pad" style={{ paddingTop: 10 }}>
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                  {data.loan_dist.map((v, i) => (
                    <span key={binLabels[i]} className="chip" style={{ fontSize: '.73rem', padding: '4px 10px' }}>
                      <strong style={{ fontFamily: 'var(--mono)' }}>{binLabels[i]}</strong>
                      <span className="num" style={{ color: 'var(--muted)' }}>
                        {v.toLocaleString('en-US')}
                      </span>
                    </span>
                  ))}
                </div>
                <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginTop: 14 }}>
                  Bins run from the smallest to the largest loan in the dataset, left to right.
                  Taller and warmer means more loans fall in that range.
                </p>
              </div>
            </Reveal>
          </div>

          {/* ---------------- Sample records ---------------- */}
          <Reveal className="card" style={{ marginTop: 22 }}>
            <div className="card-head">
              <h3>Sample records</h3>
              <span className="hint">Random sample · seed 42</span>
            </div>
            <div className="table-wrap">
              <table className="data">
                <thead>
                  <tr>
                    <th>#</th>
                    <th>Annual income</th>
                    <th>Loan amount</th>
                    <th>Credit score</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {data.table_data.map((row) => (
                    <tr key={row.id}>
                      <td className="num">{row.id}</td>
                      <td className="num">{row.income}</td>
                      <td className="num">{row.amount}</td>
                      <td className="num">{row.score}</td>
                      <td>
                        <span className={`badge ${row.status === 'Default' ? 'badge-danger' : 'badge-ok'}`}>
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Reveal>

          <div style={{ marginTop: 18, display: 'flex', justifyContent: 'flex-end' }}>
            <button type="button" className="btn btn-ghost btn-sm" onClick={load}>
              <Refresh size={15} /> Refresh from server
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
