import { Fragment, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import Reveal from '../components/Reveal';
import { Clock, Alert, Check, Search, Download, Refresh, Inbox, Target } from '../components/Icons';
import { fetchHistory } from '../lib/api';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'high', label: 'High risk' },
  { key: 'low', label: 'Low risk' },
];

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n.toLocaleString('en-US') : v ?? '—';
};

export default function History() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [query, setQuery] = useState('');
  const [openRow, setOpenRow] = useState(null);

  const load = () => {
    setLoading(true);
    setError('');
    fetchHistory()
      .then((data) => setRows(Array.isArray(data) ? data : []))
      .catch((e) =>
        setError(`${e.message}. Start the Flask server on port 5000 and try again.`)
      )
      .finally(() => setLoading(false));
  };

  useEffect(load, []);

  const stats = useMemo(() => {
    const total = rows.length;
    const high = rows.filter((r) => r.prediction?.risk === 'high').length;
    const avg =
      total > 0
        ? rows.reduce(
            (sum, r) => sum + (parseFloat(String(r.prediction?.confidence).replace('%', '')) || 0),
            0
          ) / total
        : 0;
    return { total, high, low: total - high, avg };
  }, [rows]);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return rows.filter((r) => {
      if (filter !== 'all' && r.prediction?.risk !== filter) return false;
      if (!q) return true;
      return JSON.stringify(r.inputs ?? {}).toLowerCase().includes(q) ||
        String(r.timestamp ?? '').toLowerCase().includes(q);
    });
  }, [rows, filter, query]);

  /* Export whatever is currently on screen, so filters carry into the file. */
  const exportCsv = () => {
    const cols = [
      'timestamp', 'risk', 'confidence', 'age', 'income', 'amount', 'score',
      'rate', 'duration', 'dti', 'education', 'employment', 'marital_status',
      'purpose', 'months_employed', 'credit_lines', 'dependents', 'mortgage', 'cosigner',
    ];
    const escape = (v) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const lines = [cols.join(',')];
    visible.forEach((r) => {
      lines.push(
        cols
          .map((c) => {
            if (c === 'timestamp') return escape(r.timestamp);
            if (c === 'risk') return escape(r.prediction?.risk);
            if (c === 'confidence') return escape(r.prediction?.confidence);
            return escape(r.inputs?.[c]);
          })
          .join(',')
      );
    });

    const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `crediguard-history-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="shell page">
      <div className="page-head">
        <span className="eyebrow">
          <span className="dot" />
          GET /api/history
        </span>
        <h1>Prediction log</h1>
        <p>
          Every scored applicant is written to <code className="inline">history.json</code> on the
          server with its complete input record — so any decision here can be reopened and
          explained later.
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

      {/* ---------------- Summary ---------------- */}
      {rows.length > 0 ? (
        <div className="grid-kpi" style={{ marginBottom: 22 }}>
          <Reveal className="card kpi" style={{ '--kpi-c': 'var(--info)', '--kpi-wash': 'var(--info-wash)' }}>
            <span className="kpi-icon"><Clock size={18} /></span>
            <div className="kpi-label">Predictions logged</div>
            <div className="kpi-value">{stats.total}</div>
          </Reveal>
          <Reveal delay={70} className="card kpi" style={{ '--kpi-c': 'var(--danger)', '--kpi-wash': 'var(--danger-wash)' }}>
            <span className="kpi-icon"><Alert size={18} /></span>
            <div className="kpi-label">Flagged high risk</div>
            <div className="kpi-value">{stats.high}</div>
            <div className="kpi-foot">
              {stats.total ? `${((stats.high / stats.total) * 100).toFixed(0)}% of all runs` : '—'}
            </div>
          </Reveal>
          <Reveal delay={140} className="card kpi" style={{ '--kpi-c': 'var(--ok)', '--kpi-wash': 'var(--ok-wash)' }}>
            <span className="kpi-icon"><Check size={18} /></span>
            <div className="kpi-label">Cleared as low risk</div>
            <div className="kpi-value">{stats.low}</div>
          </Reveal>
          <Reveal delay={210} className="card kpi" style={{ '--kpi-c': 'var(--accent)', '--kpi-wash': 'var(--accent-wash)' }}>
            <span className="kpi-icon"><Target size={18} /></span>
            <div className="kpi-label">Mean probability</div>
            <div className="kpi-value">{stats.avg.toFixed(1)}%</div>
            <div className="kpi-foot">Average P(default) across the log</div>
          </Reveal>
        </div>
      ) : null}

      {/* ---------------- Controls ---------------- */}
      {rows.length > 0 ? (
        <div className="history-controls">
          <div className="seg">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                type="button"
                className={filter === f.key ? 'on' : ''}
                onClick={() => setFilter(f.key)}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div className="search-wrap">
            <Search size={16} />
            <input
              className="input"
              type="search"
              placeholder="Search inputs or timestamp…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <button type="button" className="btn btn-ghost btn-sm" onClick={exportCsv}>
            <Download size={15} /> Export CSV
          </button>
          <button type="button" className="btn btn-quiet btn-sm" onClick={load}>
            <Refresh size={15} /> Refresh
          </button>
        </div>
      ) : null}

      {/* ---------------- Table ---------------- */}
      {loading ? (
        <div className="empty">
          <span className="spinner dark" style={{ width: 30, height: 30, margin: '0 auto 16px', display: 'block' }} />
          <p>Loading the log…</p>
        </div>
      ) : rows.length === 0 ? (
        <div className="card empty">
          <span className="ic"><Inbox size={26} /></span>
          <h3>No predictions yet</h3>
          <p style={{ marginBottom: 22 }}>
            Score an applicant and it will appear here with its full input record.
          </p>
          <Link to="/predict" className="btn btn-primary">
            <Target size={17} /> Run the first prediction
          </Link>
        </div>
      ) : visible.length === 0 ? (
        <div className="card empty">
          <span className="ic"><Search size={26} /></span>
          <h3>Nothing matches</h3>
          <p>Try a different search term or switch the risk filter back to “All”.</p>
        </div>
      ) : (
        <Reveal className="card">
          <div className="table-wrap">
            <table className="data">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Age</th>
                  <th>Income</th>
                  <th>Loan</th>
                  <th>Score</th>
                  <th>P(default)</th>
                  <th>Verdict</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {visible.map((r, i) => {
                  const high = r.prediction?.risk === 'high';
                  const open = openRow === i;
                  return (
                    <Fragment key={`${r.timestamp}-${i}`}>
                      <tr>
                        <td className="num" style={{ whiteSpace: 'nowrap' }}>{r.timestamp}</td>
                        <td className="num">{r.inputs?.age ?? '—'}</td>
                        <td className="num">${num(r.inputs?.income)}</td>
                        <td className="num">${num(r.inputs?.amount)}</td>
                        <td className="num">{r.inputs?.score ?? '—'}</td>
                        <td className="num" style={{ color: high ? 'var(--danger)' : 'var(--ok)', fontWeight: 600 }}>
                          {r.prediction?.confidence ?? '—'}
                        </td>
                        <td>
                          <span className={`badge ${high ? 'badge-danger' : 'badge-ok'}`}>
                            {high ? <Alert size={12} /> : <Check size={12} />}
                            {high ? 'High' : 'Low'}
                          </span>
                        </td>
                        <td style={{ textAlign: 'right' }}>
                          <button
                            type="button"
                            className="btn btn-quiet btn-sm"
                            onClick={() => setOpenRow(open ? null : i)}
                          >
                            {open ? 'Hide' : 'Details'}
                          </button>
                        </td>
                      </tr>
                      {open ? (
                        <tr>
                          <td colSpan={8} style={{ background: 'var(--surface-2)' }}>
                            <div className="detail-grid">
                              {Object.entries(r.inputs ?? {}).map(([k, v]) => (
                                <div key={k}>
                                  <div className="l">{k.replace(/_/g, ' ')}</div>
                                  <div className="v">{String(v)}</div>
                                </div>
                              ))}
                            </div>
                            <p style={{ fontSize: '.84rem', color: 'var(--muted)', marginTop: 14 }}>
                              {r.prediction?.message}
                            </p>
                          </td>
                        </tr>
                      ) : null}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Reveal>
      )}
    </div>
  );
}
