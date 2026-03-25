import { useEffect, useMemo, useState } from 'react';
import {
  Bell,
  CalendarClock,
  ChartNoAxesCombined,
  ChevronRight,
  Lock,
  LogOut,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Users,
} from 'lucide-react';

const PLAN_FEATURES = {
  Starter: {
    expiryTracking: false,
    notifications: false,
    incomeAnalytics: false,
    daysLeft: false,
  },
  Growth: {
    expiryTracking: true,
    notifications: true,
    incomeAnalytics: true,
    daysLeft: true,
  },
  Elite: {
    expiryTracking: true,
    notifications: true,
    incomeAnalytics: true,
    daysLeft: true,
  },
};

const now = new Date();
const currentMonth = now.getMonth();
const currentYear = now.getFullYear();
const formatDate = (d) => new Date(d).toISOString().split('T')[0];

const seedMembers = [
  { name: 'Aarav Sharma', phone: '9876543210', plan: 'Quarterly', startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`, endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-28`, fee: 2499 },
  { name: 'Priya Nair', phone: '9988776655', plan: 'Monthly', startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-05`, endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-29`, fee: 1499 },
  { name: 'Rohan Mehta', phone: '9123456780', plan: 'Monthly', startDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-10`, endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-13`, fee: 1499 },
  { name: 'Neha Iyer', phone: '9345678901', plan: 'Annual', startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-15`, endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-02`, fee: 12999 },
  { name: 'Kabir Singh', phone: '9567890123', plan: 'Monthly', startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-20`, endDate: `${currentYear}-${String(currentMonth + 1).padStart(2, '0')}-01`, fee: 1499 },
  { name: 'Ananya Rao', phone: '9000011122', plan: 'Quarterly', startDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-03`, endDate: `${currentYear}-${String(currentMonth).padStart(2, '0')}-25`, fee: 2499 },
];

const incomeSeries = Array.from({ length: 30 }, (_, i) => ({
  day: i + 1,
  income: [0, 1499, 0, 2499, 12999, 0, 0, 1499, 0, 3499, 999, 0, 0, 1299, 2499, 0, 0, 1999, 0, 0, 2499, 0, 0, 1499, 0, 0, 5999, 0, 0, 1799][i],
}));

function dayDiff(endDate) {
  const ms = new Date(endDate).setHours(0, 0, 0, 0) - new Date().setHours(0, 0, 0, 0);
  return Math.ceil(ms / 86400000);
}

function memberStatus(days) {
  if (days < 0) return 'Expired';
  if (days <= 3) return 'Expiring';
  return 'Active';
}

function App() {
  const [screen, setScreen] = useState('landing');
  const [authed, setAuthed] = useState(false);
  const [plan, setPlan] = useState('Growth');
  const [ownerName, setOwnerName] = useState('Nikhil Verma');
  const [members] = useState(seedMembers);
  const [search, setSearch] = useState('');
  const [planFilter, setPlanFilter] = useState('All');
  const [subTab, setSubTab] = useState('All');
  const [setupDone, setSetupDone] = useState(false);
  const [setupStep, setSetupStep] = useState(1);
  const [showNotif, setShowNotif] = useState(false);
  const [seenNotifIds, setSeenNotifIds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 900);
    return () => clearTimeout(t);
  }, [screen]);

  const decoratedMembers = useMemo(
    () =>
      members.map((m) => {
        const daysLeft = dayDiff(m.endDate);
        return { ...m, daysLeft, status: memberStatus(daysLeft) };
      }),
    [members],
  );

  const autoNotifs = useMemo(() => {
    if (!PLAN_FEATURES[plan].notifications) return [];
    return decoratedMembers
      .filter((m) => m.daysLeft === 3)
      .map((m) => ({
        id: `${m.phone}-3day`,
        member: m.name,
        message: 'Your gym membership will expire in 3 days. Please renew to continue your workouts.',
        createdAt: formatDate(new Date()),
      }));
  }, [decoratedMembers, plan]);


  const monthlyJoined = decoratedMembers.filter((m) => {
    const d = new Date(m.startDate);
    return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
  }).length;

  const monthlyIncome = incomeSeries.reduce((sum, row) => sum + row.income, 0);
  const totalMembers = decoratedMembers.length;
  const active = decoratedMembers.filter((m) => m.status === 'Active').length;
  const expiring7 = decoratedMembers.filter((m) => m.daysLeft >= 0 && m.daysLeft <= 7).length;
  const expired = decoratedMembers.filter((m) => m.status === 'Expired').length;

  const filteredMembers = decoratedMembers.filter((m) => {
    const query = search.toLowerCase();
    const matchesSearch = m.name.toLowerCase().includes(query) || m.phone.includes(query);
    const matchesPlan = planFilter === 'All' || m.plan === planFilter;
    return matchesSearch && matchesPlan;
  });

  const subFiltered = decoratedMembers.filter((m) => {
    if (subTab === 'All') return true;
    if (subTab === 'Expiring') return m.daysLeft >= 0 && m.daysLeft <= 7;
    return m.status === 'Expired';
  });

  const notifs = autoNotifs.map((n) => ({ ...n, status: seenNotifIds.includes(n.id) ? 'Seen' : 'Sent' }));
  const unread = notifs.filter((n) => n.status === 'Sent').length;

  const routeToApp = (target) => {
    if (!authed) {
      setScreen('login');
      return;
    }
    if (!setupDone) {
      setScreen('onboarding');
      return;
    }
    setScreen(target);
  };

  const lock = (feature, children) =>
    PLAN_FEATURES[plan][feature] ? (
      children
    ) : (
      <div className="locked-shell">
        <div className="blurred">{children}</div>
        <div className="lock-overlay">
          <Lock size={20} />
          <p>Upgrade your plan to unlock this feature</p>
          <button onClick={() => setScreen('pricing')}>View Pricing</button>
        </div>
      </div>
    );

  const markSeen = () => {
    setSeenNotifIds((prev) => [...new Set([...prev, ...autoNotifs.map((n) => n.id)])]);
  };

  const nav = (
    <header className="top-nav glass">
      <div className="brand" onClick={() => setScreen('dashboard')}>
        <Sparkles size={18} /> GymFlow
      </div>
      <nav>
        {['dashboard', 'members', 'subscriptions', 'pricing'].map((n) => (
          <button key={n} className={screen === n ? 'active' : ''} onClick={() => routeToApp(n)}>
            {n[0].toUpperCase() + n.slice(1)}
          </button>
        ))}
      </nav>
      <div className="right-nav">
        <button className="icon-btn" onClick={() => setShowNotif((s) => !s)}>
          <Bell size={16} /> {unread > 0 && <span className="badge">{unread}</span>}
        </button>
        <span>{ownerName}</span>
        <button className="chip-btn">
          <Plus size={14} /> Add Gym
        </button>
        <button
          className="ghost"
          onClick={() => {
            setAuthed(false);
            setSetupDone(false);
            setScreen('landing');
          }}
        >
          <LogOut size={14} /> Logout
        </button>
      </div>
    </header>
  );

  if (screen === 'landing') {
    return (
      <main className="page landing">
        <section className="hero">
          <div className="glass hero-card">
            <h1>GymFlow</h1>
            <h2>Smart Memberships. More Revenue. Zero Confusion.</h2>
            <p>
              GymFlow helps gym owners track memberships, expiry dates, income, and growth — all in one
              premium dashboard.
            </p>
            <div className="row">
              <button className="primary" onClick={() => setScreen('signup')}>Start Free</button>
              <button className="ghost" onClick={() => setScreen('pricing')}>View Pricing</button>
            </div>
          </div>
        </section>
        <section className="preview-grid">
          {['Dashboard Command Center', 'Member Management', 'Expiry + Revenue Alerts'].map((t) => (
            <div className="glass mock" key={t}><p>{t}</p></div>
          ))}
        </section>
        <section className="problems">
          <h3>Running a gym is hard. GymFlow makes it simple.</h3>
          <div className="grid-4">
            {['Forgetting member expiry', 'Revenue lost from missed renewals', 'No monthly income clarity', 'Manual spreadsheet chaos'].map((p) => (
              <article className="glass" key={p}><h4>{p}</h4><small>One dashboard. Clear operations.</small></article>
            ))}
          </div>
        </section>
        <section className="features grid-3">
          {[
            'Membership Expiry Tracking',
            'Days Left Countdown',
            'Automated Renewal Reminders',
            'Monthly Income Analytics',
            'New Members This Month',
            'Subscription-based Feature Unlocking',
          ].map((f) => (
            <div className="glass feature" key={f}>{f}</div>
          ))}
        </section>
        <section className="steps">
          <h3>How GymFlow works</h3>
          <div className="grid-3">
            {['Gym Owner Signs Up', 'Adds Members & Plans', 'Tracks Expiry, Income & Growth'].map((s, i) => (
              <div className="glass" key={s}><strong>{i + 1}. {s}</strong></div>
            ))}
          </div>
        </section>
        <section className="pricing-teaser grid-3">
          {[
            ['Starter', '₹0', 'Start Free'],
            ['Growth', '₹199', 'View Pricing'],
            ['Elite', 'Premium', 'View Pricing'],
          ].map(([n, p, c]) => (
            <article className={`glass price ${n === 'Growth' ? 'recommended' : ''}`} key={n}>
              <h4>{n}</h4><h2>{p}</h2><button onClick={() => setScreen('pricing')}>{c}</button>
            </article>
          ))}
        </section>
        <section className="glass cta-final">
          <h3>Take control of your gym today.</h3>
          <button className="primary" onClick={() => setScreen('signup')}>Get Started with GymFlow</button>
        </section>
        <footer>
          <span>GymFlow</span>
          <div><a onClick={() => setScreen('pricing')}>Pricing</a><a onClick={() => setScreen('login')}>Login</a><a>Privacy</a><a>Terms</a></div>
        </footer>
      </main>
    );
  }

  if (screen === 'login' || screen === 'signup') {
    return (
      <main className="auth-page">
        <div className="glass auth-card">
          <h1>GymFlow</h1>
          <h3>{screen === 'login' ? 'Welcome back, owner' : 'Create your owner account'}</h3>
          <div className="fields">
            {screen === 'signup' && <input placeholder="Full Name" onChange={(e) => setOwnerName(e.target.value || 'Gym Owner')} />}
            <input placeholder="Email" type="email" />
            <input placeholder="Password" type="password" />
            {screen === 'signup' && (
              <>
                <input placeholder="Confirm Password" type="password" />
                <label><input type="checkbox" /> I accept Terms & Privacy</label>
              </>
            )}
          </div>
          <button className="primary" onClick={() => { setAuthed(true); setScreen('onboarding'); }}>
            {screen === 'login' ? 'Sign In' : 'Create Account'}
          </button>
          <div className="row small-links">
            <a onClick={() => setScreen('pricing')}>Pricing</a>
            <a onClick={() => setScreen(screen === 'login' ? 'signup' : 'login')}>
              {screen === 'login' ? 'Create Account' : 'Back to Login'}
            </a>
          </div>
        </div>
      </main>
    );
  }

  if (screen === 'onboarding') {
    return (
      <main className="onboarding">
        <div className="glass wizard">
          <div className="progress"><span style={{ width: `${(setupStep / 2) * 100}%` }} /></div>
          <h2>Setup your gym</h2>
          {setupStep === 1 ? (
            <div className="fields">
              <input placeholder="Gym Name" />
              <input placeholder="Address" />
              <input placeholder="City" />
              <input placeholder="State" />
            </div>
          ) : (
            <div className="fields">
              <input placeholder="ZIP Code" />
              <input placeholder="Phone Number" />
              <input placeholder="Email" />
            </div>
          )}
          <div className="row">
            {setupStep > 1 && <button className="ghost" onClick={() => setSetupStep(1)}>Back</button>}
            {setupStep < 2 ? (
              <button className="primary" onClick={() => setSetupStep(2)}>Next <ChevronRight size={14} /></button>
            ) : (
              <button className="primary" onClick={() => { setSetupDone(true); setScreen('dashboard'); }}>Continue to Dashboard</button>
            )}
          </div>
        </div>
      </main>
    );
  }

  const appBody = (
    <>
      {showNotif && (
        <aside className="glass notif-drawer">
          <div className="row"><h4>Notifications</h4><button onClick={markSeen}>Mark all seen</button></div>
          {!PLAN_FEATURES[plan].notifications ? (
            <p className="muted">Notifications are available on paid plans only.</p>
          ) : notifs.length === 0 ? (
            <p className="muted">No alerts yet.</p>
          ) : (
            notifs.map((n) => (
              <article className="glass notif" key={n.id}>
                <strong>{n.member}</strong>
                <p>{n.message}</p>
                <small>{n.status} · {n.createdAt}</small>
              </article>
            ))
          )}
        </aside>
      )}

      {screen === 'dashboard' && (
        <section className="dashboard">
          <div className="stats grid-3">
            {[
              ['Total Members', totalMembers, 'blue'],
              ['Active Members', active, 'green'],
              ['Expiring Soon', expiring7, 'amber'],
              ['Expired Members', expired, 'red'],
              ['New Members This Month', monthlyJoined, 'cyan'],
              ['Monthly Income', `₹${monthlyIncome.toLocaleString('en-IN')}`, 'green'],
            ].map(([label, val, tone]) => (
              <article className={`glass stat ${tone}`} key={label}>
                <small>{label}</small>
                <h2>{loading ? '...' : val}</h2>
              </article>
            ))}
          </div>

          {lock('incomeAnalytics',
            <div className="glass chart-wrap">
              <h3>Monthly Income Overview</h3>
              <p className="muted">Real-time revenue flow for this month</p>
              {incomeSeries.every((p) => p.income === 0) ? (
                <div className="empty">No income data available for this month</div>
              ) : (
                <IncomeChart points={incomeSeries} />
              )}
            </div>,
          )}
        </section>
      )}

      {screen === 'members' && (
        <section className="members-page">
          <div className="row spread">
            <h2>Member Management</h2>
            <button className="primary"><Plus size={14} /> Add Member</button>
          </div>
          <div className="stats grid-3 mini">
            <article className="glass"><small>Total</small><h3>{totalMembers}</h3></article>
            <article className="glass"><small>Active</small><h3>{active}</h3></article>
            <article className="glass"><small>Expiring Soon</small><h3>{expiring7}</h3></article>
          </div>

          <div className="glass table-controls row">
            <label className="search"><Search size={14} /><input placeholder="Search by name or phone" value={search} onChange={(e) => setSearch(e.target.value)} /></label>
            <select value={planFilter} onChange={(e) => setPlanFilter(e.target.value)}>
              {['All', 'Monthly', 'Quarterly', 'Annual'].map((p) => <option key={p}>{p}</option>)}
            </select>
          </div>

          <div className="glass table-wrap">
            {filteredMembers.length === 0 ? (
              <div className="empty">No members found for this filter.</div>
            ) : (
              <table>
                <thead>
                  <tr><th>Name</th><th>Phone</th><th>Plan</th><th>End Date</th><th>Days Left</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.phone}>
                      <td>{m.name}</td>
                      <td>{m.phone}</td>
                      <td>{m.plan}</td>
                      <td>{m.endDate}</td>
                      <td>{PLAN_FEATURES[plan].daysLeft ? m.daysLeft : '—'}</td>
                      <td><span className={`pill ${m.status.toLowerCase()}`}>{m.status}</span></td>
                      <td><button className="ghost sm">View</button><button className="ghost sm">Edit</button></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </section>
      )}

      {screen === 'subscriptions' && (
        <section className="subscriptions-page">
          <h2>Subscription Status</h2>
          {lock('expiryTracking',
            <>
              <div className="stats grid-3 mini">
                <article className="glass"><small>Active</small><h3>{active}</h3></article>
                <article className="glass"><small>Expiring ≤ 7 days</small><h3>{expiring7}</h3></article>
                <article className="glass"><small>Expired</small><h3>{expired}</h3></article>
              </div>
              <div className="tabs">
                {['All', 'Expiring', 'Expired'].map((t) => (
                  <button key={t} className={subTab === t ? 'active' : ''} onClick={() => setSubTab(t)}>{t}</button>
                ))}
              </div>
              <div className="glass lifecycle-list">
                {subFiltered.map((m) => (
                  <article key={m.phone} className="member-card glass">
                    <div><strong>{m.name}</strong><small>{m.plan}</small></div>
                    <div className="meta"><CalendarClock size={14} /> {m.startDate} → {m.endDate}</div>
                    <span className={`pill ${m.status.toLowerCase()}`}>{m.status}{PLAN_FEATURES[plan].daysLeft ? ` (${m.daysLeft} days)` : ''}</span>
                  </article>
                ))}
              </div>
            </>,
          )}
        </section>
      )}

      {screen === 'pricing' && (
        <section className="pricing-page">
          <h2>Flexible pricing for every gym stage</h2>
          <div className="grid-3">
            <PriceCard name="Starter" price="₹0" current={plan === 'Starter'} onSelect={() => setPlan('Starter')} features={['Basic member management', 'No automation']} cta="Start Free" />
            <PriceCard name="Growth" price="₹199" recommended current={plan === 'Growth'} onSelect={() => setPlan('Growth')} features={['Unlimited members', 'Automated renewal reminders', 'Revenue analytics']} cta="Upgrade Plan" />
            <PriceCard name="Elite" price="Premium" current={plan === 'Elite'} onSelect={() => setPlan('Elite')} features={['Everything in Growth', 'Advanced reports', 'Multi-location ready (UI only)']} cta="Upgrade Plan" />
          </div>
        </section>
      )}
    </>
  );

  return (
    <main className="page app-shell">
      {nav}
      {appBody}
    </main>
  );
}

function PriceCard({ name, price, features, cta, recommended, current, onSelect }) {
  return (
    <article className={`glass price-card ${recommended ? 'recommended' : ''}`}>
      {recommended && <span className="badge-pop">Recommended</span>}
      <h3>{name}</h3>
      <h2>{price}</h2>
      <ul>
        {features.map((f) => (
          <li key={f}><ShieldCheck size={14} /> {f}</li>
        ))}
      </ul>
      <button className={recommended ? 'primary' : 'ghost'} onClick={onSelect}>{current ? 'Current Plan' : cta}</button>
    </article>
  );
}

function IncomeChart({ points }) {
  const max = Math.max(...points.map((p) => p.income), 1);
  const path = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${10 + i * 24} ${220 - (p.income / max) * 180}`)
    .join(' ');

  return (
    <div className="income-chart">
      <svg viewBox="0 0 760 260" role="img" aria-label="Monthly income line chart">
        <defs>
          <linearGradient id="lineGradient" x1="0" x2="1">
            <stop offset="0%" stopColor="#35e3ff" />
            <stop offset="100%" stopColor="#31d27c" />
          </linearGradient>
        </defs>
        <path d={path} fill="none" stroke="url(#lineGradient)" strokeWidth="3" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle key={p.day} cx={10 + i * 24} cy={220 - (p.income / max) * 180} r="3" fill="#8befff">
            <title>{`Day ${p.day}: ₹${p.income.toLocaleString('en-IN')}`}</title>
          </circle>
        ))}
      </svg>
      <div className="axis-label"><Users size={13} /> Day of month · <ChartNoAxesCombined size={13} /> Income (₹)</div>
    </div>
  );
}

export default App;
