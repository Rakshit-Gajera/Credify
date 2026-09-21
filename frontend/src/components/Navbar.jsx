import { useEffect, useState, useRef } from 'react';
import { NavLink, Link, useLocation } from 'react-router-dom';
import { Shield, Menu } from './Icons';
import { pingBackend } from '../lib/api';

const LINKS = [
  { to: '/', label: 'Home', end: true },
  { to: '/predict', label: 'Predict' },
  { to: '/insights', label: 'Data Insights' },
  { to: '/model', label: 'How It Works' },
  { to: '/history', label: 'History' },
];

const TASK_LINKS = [
  { to: '/task1', label: 'Task 1', sub: 'Problem Definition & Dataset Exploration' },
  { to: '/task2', label: 'Task 2', sub: 'Data Cleaning & Pre-processing' },
  { to: '/task3', label: 'Task 3', sub: 'Model Creation (Library + Scratch)' },
  { to: '/task4', label: 'Task 4', sub: 'Model Evaluation & Metrics' },
  { to: '/task5', label: 'Task 5', sub: 'Advanced Models, CV & Hyperparameter Tuning' },
  { to: '/task6', label: 'Task 6', sub: 'Visualization of Metrics & Graphs' },
];

export default function Navbar() {
  const [scrolled, setScrolled]     = useState(false);
  const [open, setOpen]             = useState(false);
  const [online, setOnline]         = useState(null);
  const [dropOpen, setDropOpen]     = useState(false);
  const [mobileTaskOpen, setMobileTaskOpen] = useState(false);
  const dropRef                     = useRef(null);
  const location                    = useLocation();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close mobile menu on route change
  useEffect(() => { setOpen(false); setDropOpen(false); setMobileTaskOpen(false); }, [location.pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handler = (e) => { if (dropRef.current && !dropRef.current.contains(e.target)) setDropOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Poll backend
  useEffect(() => {
    let alive = true;
    const check = async () => { const ok = await pingBackend(); if (alive) setOnline(ok); };
    check();
    const id = setInterval(check, 15000);
    return () => { alive = false; clearInterval(id); };
  }, []);

  const statusClass = online === null ? '' : online ? 'online' : 'offline';
  const statusText  = online === null ? 'Checking API…' : online ? 'API connected' : 'API offline';

  const isTaskActive = TASK_LINKS.some((t) => location.pathname === t.to);

  return (
    <header className={`nav ${scrolled ? 'scrolled' : ''}`}>
      <div className="nav-inner">
        <NavLink to="/" className="brand">
          <span className="brand-mark"><Shield size={18} /></span>
          <span>
            <span className="brand-name">CrediGuard</span>
            <span className="brand-sub">Risk Intelligence</span>
          </span>
        </NavLink>

        <nav className={`nav-links ${open ? 'open' : ''}`}>
          {LINKS.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              end={l.end}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              {l.label}
            </NavLink>
          ))}

          {/* ── Desktop Tasks Dropdown ── */}
          <div
            ref={dropRef}
            className="nav-dropdown-wrap"
          >
            <button
              type="button"
              className={`nav-link nav-dropdown-trigger ${isTaskActive ? 'active' : ''}`}
              onClick={() => setDropOpen((v) => !v)}
              aria-haspopup="true"
              aria-expanded={dropOpen}
            >
              Tasks
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ marginLeft: 5, transition: 'transform .2s', transform: dropOpen ? 'rotate(180deg)' : 'none' }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {dropOpen && (
              <div className="nav-dropdown">
                {TASK_LINKS.map((t) => (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={`nav-dropdown-item ${location.pathname === t.to ? 'active' : ''}`}
                    onClick={() => setDropOpen(false)}
                  >
                    <span className="nav-dropdown-label">{t.label}</span>
                    <span className="nav-dropdown-sub">{t.sub}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* ── Mobile Tasks Accordion ── */}
          <div className="nav-mobile-tasks">
            <button
              type="button"
              className={`nav-link nav-mobile-tasks-toggle ${isTaskActive ? 'active' : ''}`}
              onClick={() => setMobileTaskOpen((v) => !v)}
            >
              Tasks
              <svg
                width="10" height="10" viewBox="0 0 10 10" fill="none"
                style={{ marginLeft: 5, transition: 'transform .2s', transform: mobileTaskOpen ? 'rotate(180deg)' : 'none' }}
              >
                <path d="M2 3.5L5 6.5L8 3.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            {mobileTaskOpen && (
              <div className="nav-mobile-tasks-list">
                {TASK_LINKS.map((t) => (
                  <NavLink
                    key={t.to}
                    to={t.to}
                    className={({ isActive }) => `nav-mobile-task-item ${isActive ? 'active' : ''}`}
                  >
                    <span style={{ fontWeight: 700 }}>{t.label}</span>
                    <span style={{ fontSize: '.82rem', color: 'var(--muted)' }}> — {t.sub}</span>
                  </NavLink>
                ))}
              </div>
            )}
          </div>
        </nav>

        <span className={`status-pill ${statusClass}`} title="Flask backend on port 5000">
          <span className="led" />
          {statusText}
        </span>

        <button
          type="button"
          className="nav-toggle"
          aria-label="Toggle navigation"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          <Menu size={20} />
        </button>
      </div>
    </header>
  );
}
