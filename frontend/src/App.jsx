import { BrowserRouter, Routes, Route, useLocation, Link } from 'react-router-dom';
import { useEffect } from 'react';
import Navbar from './components/Navbar';
import { Shield } from './components/Icons';
import Home from './pages/Home';
import Predict from './pages/Predict';
import Insights from './pages/Insights';
import Model from './pages/Model';
import History from './pages/History';
import Task1 from './pages/Task1';
import Task2 from './pages/Task2';
import Task3 from './pages/Task3';
import Task4 from './pages/Task4';
import Task5 from './pages/Task5';
import Task6 from './pages/Task6';

/** Routers keep scroll position by default; a fresh page should start at the top. */
function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-inner">
        <span className="brand-mark" style={{ width: 30, height: 30 }}>
          <Shield size={16} />
        </span>
        <div>
          <div className="brand-name" style={{ fontSize: '1rem' }}>
            CrediGuard
          </div>
          <p className="footer-copy">
            Loan default prediction · Logistic Regression · Flask + React + Three.js
          </p>
        </div>
        <nav className="footer-links">
          <Link to="/predict">Predict</Link>
          <Link to="/insights">Insights</Link>
          <Link to="/model">How It Works</Link>
          <Link to="/history">History</Link>
          <span style={{ color: 'var(--muted)', fontSize: '.8rem', alignSelf: 'center' }}>Tasks:</span>
          <Link to="/task1">T1</Link>
          <Link to="/task2">T2</Link>
          <Link to="/task3">T3</Link>
          <Link to="/task4">T4</Link>
          <Link to="/task5">T5</Link>
          <Link to="/task6">T6</Link>
        </nav>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <div className="app">
        <Navbar />
        <main className="main">
          <Routes>
            <Route path="/"        element={<Home />} />
            <Route path="/predict" element={<Predict />} />
            <Route path="/insights" element={<Insights />} />
            <Route path="/model"   element={<Model />} />
            <Route path="/history" element={<History />} />
            <Route path="/task1"   element={<Task1 />} />
            <Route path="/task2"   element={<Task2 />} />
            <Route path="/task3"   element={<Task3 />} />
            <Route path="/task4"   element={<Task4 />} />
            <Route path="/task5"   element={<Task5 />} />
            <Route path="/task6"   element={<Task6 />} />
            <Route path="*"        element={<Home />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  );
}
