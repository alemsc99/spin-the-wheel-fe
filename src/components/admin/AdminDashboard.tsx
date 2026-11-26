import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { onAuthStateChanged } from 'firebase/auth';
import { auth } from '../../firebaseConfig';
import { API_URL } from '../../constants/constants';
import { useTranslation, type Lang } from '../../i18n/TranslationProvider';
import './AdminDashboard.css';

type Analytics = {
  google_players: number;
  guest_players: number;
  daily_puzzles: { started: number; completed: number };
  games_started: number;
  games_completed: number;
  by_mode: Record<string, { started: number; completed: number }>;
  by_category: Record<string, { started: number; completed: number }>;
  multiplayer_powerups: Record<string, number>;
  multiplayer_powerups_total: number;
  time_series: { date: string; games_started: number; games_completed: number; daily_puzzles_solved: number; google_players: number; guest_players: number }[];
};
type Period = 'today' | '7' | '30' | 'custom';
const ADMIN_EMAIL = 'alessandromasci20@gmail.com';
const formatDate = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
const today = () => formatDate(new Date());
const daysAgo = (days: number) => {
  const date = new Date();
  date.setDate(date.getDate() - (days - 1));
  return formatDate(date);
};

export default function AdminDashboard(): React.ReactElement {
  const { lang: routeLang } = useParams<{ lang?: string }>();
  const { lang } = useTranslation();
  const navigate = useNavigate();
  const activeLang: Lang = routeLang === 'en' ? 'en' : routeLang === 'it' ? 'it' : lang;
  const isIt = activeLang === 'it';
  const [authReady, setAuthReady] = useState(false);
  const [authorized, setAuthorized] = useState(false);
  const [period, setPeriod] = useState<Period>('30');
  const [startDate, setStartDate] = useState(daysAgo(30));
  const [endDate, setEndDate] = useState(today());
  const [data, setData] = useState<Analytics | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => onAuthStateChanged(auth, user => {
    setAuthorized(user?.email?.toLowerCase() === ADMIN_EMAIL && user.emailVerified);
    setAuthReady(true);
  }), []);

  useEffect(() => {
    if (!authReady) return;
    if (!authorized) {
      navigate(`/${activeLang}`, { replace: true });
      return;
    }
    if (period !== 'custom') {
      const currentDay = today();
      setStartDate(period === 'today' ? currentDay : daysAgo(Number(period)));
      setEndDate(currentDay);
    }
  }, [authReady, authorized, activeLang, navigate, period]);

  useEffect(() => {
    if (!authorized || !authReady || !startDate || !endDate || startDate > endDate) return;
    let cancelled = false;
    setLoading(true);
    setError('');
    void (async () => {
      try {
        const token = await auth.currentUser?.getIdToken();
        const response = await fetch(`${API_URL}/admin/analytics?start_date=${encodeURIComponent(startDate)}&end_date=${encodeURIComponent(endDate)}`, {
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        });
        if (!response.ok) throw new Error(response.status === 403 ? 'Accesso negato.' : 'Impossibile caricare le statistiche.');
        const result = await response.json() as Analytics;
        if (!cancelled) setData(result);
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : 'Errore di connessione.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authorized, authReady, startDate, endDate]);

  const modeRows = useMemo(() => Object.entries(data?.by_mode ?? {}).sort(([a], [b]) => a.localeCompare(b)), [data]);
  const categoryRows = useMemo(() => Object.entries(data?.by_category ?? {}).sort(([a], [b]) => a.localeCompare(b)), [data]);
  const powerupRows = useMemo(() => Object.entries(data?.multiplayer_powerups ?? {}).sort(([a], [b]) => a.localeCompare(b)), [data]);
  const labels: Record<string, string> = {
    'single-player': isIt ? 'Giocatore singolo' : 'Single player',
    'local-multiplayer': isIt ? 'Multiplayer locale' : 'Local multiplayer',
    'online-multiplayer': isIt ? 'Multiplayer online' : 'Online multiplayer',
    'daily-puzzle': isIt ? 'Puzzle giornaliero' : 'Daily puzzle',
  };
  const powerupLabels: Record<string, string> = {
    Double: isIt ? 'Doppio' : 'Double',
    Skip: isIt ? 'Salta turno' : 'Skip',
    Lose: isIt ? 'Perdi tutto' : 'Lose it all',
    Shield: isIt ? 'Scudo' : 'Shield',
  };
  if (!authReady || !authorized) return <div className="admin-loading">{isIt ? 'Verifica accesso…' : 'Checking access…'}</div>;

  return <main className="admin-dashboard">
    <header className="admin-header">
      <div><span className="admin-eyebrow">SPINWORDS · ADMIN</span><h1>{isIt ? 'Dashboard gestionale' : 'Admin dashboard'}</h1><p>{isIt ? 'Statistiche di utilizzo nel periodo selezionato' : 'Usage statistics for the selected period'}</p></div>
      <button className="admin-back" onClick={() => navigate(`/${activeLang}`)}>← {isIt ? 'Home' : 'Home'}</button>
    </header>
    <section className="admin-filters">
      <label>{isIt ? 'Periodo' : 'Period'}<select value={period} onChange={e => setPeriod(e.target.value as Period)}>
        <option value="today">{isIt ? 'Oggi' : 'Today'}</option><option value="7">{isIt ? 'Ultimi 7 giorni' : 'Last 7 days'}</option><option value="30">{isIt ? 'Ultimo mese' : 'Last month'}</option><option value="custom">{isIt ? 'Personalizzato' : 'Custom'}</option>
      </select></label>
      {period === 'custom' && <><label>{isIt ? 'Dal' : 'From'}<input type="date" value={startDate} max={endDate} onChange={e => setStartDate(e.target.value)} /></label><label>{isIt ? 'Al' : 'To'}<input type="date" value={endDate} min={startDate} max={today()} onChange={e => setEndDate(e.target.value)} /></label></>}
      <span className="admin-range">{startDate} — {endDate}</span>
    </section>
    {error && <div className="admin-error">{error}</div>}
    <section className="admin-kpis">
      {[
        ['👤', isIt ? 'Giocatori Google' : 'Google players', data?.google_players, ''],
        ['🎮', isIt ? 'Giocatori ospiti' : 'Guest players', data?.guest_players, ''],
        ['📅', isIt ? 'Daily puzzle avviati' : 'Daily puzzles started', data?.daily_puzzles?.started, isIt ? `${data?.daily_puzzles?.completed ?? 0} conclusi` : `${data?.daily_puzzles?.completed ?? 0} completed`],
        ['🚀', isIt ? 'Partite iniziate' : 'Games started', data?.games_started, ''],
        ['🏁', isIt ? 'Partite concluse' : 'Games completed', data?.games_completed, ''],
      ].map(([icon, label, value, hint]) => <article className="admin-kpi" key={String(label)}><span>{icon}</span><div><strong>{loading && !data ? '…' : value ?? '—'}</strong><small>{label}</small>{hint && <small className="admin-kpi-hint">{hint}</small>}</div></article>)}
    </section>
    <div className="admin-tables">
      <section className="admin-panel"><h2>{isIt ? 'Partite per modalità' : 'Games by mode'}</h2><div className="admin-mode-pies">
        <div><p className="admin-chart-subtitle">{isIt ? 'Iniziate' : 'Started'}</p><PieChart rows={modeRows.map(([name, stats]) => [labels[name] ?? name, stats.started])} emptyLabel={isIt ? 'Nessuna partita nel periodo' : 'No games in this period'} totalLabel={isIt ? 'totale' : 'total'} /></div>
        <div><p className="admin-chart-subtitle">{isIt ? 'Concluse' : 'Completed'}</p><PieChart rows={modeRows.map(([name, stats]) => [labels[name] ?? name, stats.completed])} emptyLabel={isIt ? 'Nessuna partita conclusa' : 'No completed games'} totalLabel={isIt ? 'totale' : 'total'} /></div>
      </div></section>
      <section className="admin-panel"><h2>{isIt ? 'Partite per categoria' : 'Games by category'}</h2><p className="admin-chart-subtitle">{isIt ? 'Distribuzione delle partite iniziate' : 'Distribution of games started'}</p><PieChart rows={categoryRows.map(([name, stats]) => [name, stats.started])} emptyLabel={isIt ? 'Nessuna partita nel periodo' : 'No games in this period'} totalLabel={isIt ? 'totale' : 'total'} /></section>
      <section className="admin-panel admin-powerups-panel">
        <h2>{isIt ? `Power-up multiplayer · ${data?.multiplayer_powerups_total ?? 0} utilizzi` : `Multiplayer power-ups · ${data?.multiplayer_powerups_total ?? 0} uses`}</h2>
        <p className="admin-chart-subtitle">{isIt ? 'Distribuzione degli utilizzi nelle partite multiplayer' : 'Usage distribution in multiplayer games'}</p>
        <PieChart rows={powerupRows.map(([name, count]) => [powerupLabels[name] ?? name, count])} emptyLabel={isIt ? 'Nessun utilizzo nel periodo' : 'No uses in this period'} totalLabel={isIt ? 'totale' : 'total'} />
      </section>
    </div>
    <section className="admin-trends">
      <h2>{isIt ? 'Andamento nel tempo' : 'Trends over time'}</h2>
      <div className="admin-trend-grid">
        <TrendChart title={isIt ? 'Partite iniziate' : 'Games started'} values={data?.time_series ?? []} field="games_started" color="#3974d8" />
        <TrendChart title={isIt ? 'Partite concluse' : 'Games completed'} values={data?.time_series ?? []} field="games_completed" color="#18a78c" />
        <TrendChart title={isIt ? 'Daily puzzle risolti' : 'Daily puzzles solved'} values={data?.time_series ?? []} field="daily_puzzles_solved" color="#e29a25" />
        <TrendChart title={isIt ? 'Giocatori Google attivi' : 'Active Google players'} values={data?.time_series ?? []} field="google_players" color="#8063c7" />
        <TrendChart title={isIt ? 'Giocatori ospiti' : 'Guest players'} values={data?.time_series ?? []} field="guest_players" color="#dc6684" />
      </div>
    </section>
    {loading && <p className="admin-status">{isIt ? 'Aggiornamento…' : 'Refreshing…'}</p>}
    <p className="admin-note">{isIt ? 'I dati temporali sono raccolti da questa versione in avanti. I giocatori Google indicano gli account distinti che hanno avviato almeno una partita nel periodo.' : 'Date-filtered data is collected from this version onward. Google players counts distinct accounts that started at least one game in the period.'}</p>
  </main>;
}

const CHART_COLORS = ['#3974d8', '#18a78c', '#e29a25', '#8063c7', '#dc6684', '#42a5bd', '#9aaf3e'];
function PieChart({ rows, emptyLabel, totalLabel }: { rows: [string, number][]; emptyLabel: string; totalLabel: string }): React.ReactElement {
  const positiveRows = rows.filter(([, value]) => value > 0);
  const total = positiveRows.reduce((sum, [, value]) => sum + value, 0);
  const radius = 66;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return <div className="admin-pie-chart">
    <svg className="admin-donut" viewBox="0 0 180 180" role="img" aria-label={emptyLabel}>
      <circle cx="90" cy="90" r={radius} fill="none" stroke="#edf1f7" strokeWidth="30" />
      {total > 0 && positiveRows.map(([name, value], index) => {
        const length = (value / total) * circumference;
        const segment = <circle key={name} cx="90" cy="90" r={radius} fill="none" stroke={CHART_COLORS[index % CHART_COLORS.length]} strokeWidth="30" strokeDasharray={`${length} ${circumference - length}`} strokeDashoffset={-offset} transform="rotate(-90 90 90)"><title>{`${name}: ${value} (${Math.round(value / total * 100)}%)`}</title></circle>;
        offset += length;
        return segment;
      })}
      <text x="90" y="86" textAnchor="middle" className="admin-donut-total">{total}</text>
      <text x="90" y="106" textAnchor="middle" className="admin-donut-caption">{total ? totalLabel : '—'}</text>
    </svg>
    {total ? <ul className="admin-legend">{positiveRows.map(([name, value], index) => <li key={name}><span className="admin-legend-name"><i style={{ background: CHART_COLORS[index % CHART_COLORS.length] }} />{name}</span><strong>{value}<small> · {Math.round(value / total * 100)}%</small></strong></li>)}</ul> : <p className="admin-chart-empty">{emptyLabel}</p>}
  </div>;
}

type TrendPoint = Analytics['time_series'][number];
function TrendChart({ title, values, field, color }: { title: string; values: TrendPoint[]; field: 'games_started' | 'games_completed' | 'daily_puzzles_solved' | 'google_players' | 'guest_players'; color: string }): React.ReactElement {
  const width = 620;
  const height = 190;
  const left = 42;
  const right = 12;
  const top = 14;
  const bottom = 34;
  const plotWidth = width - left - right;
  const plotHeight = height - top - bottom;
  const maximum = Math.max(1, ...values.map(point => point[field]));
  const points = values.map((point, index) => {
    const x = left + (values.length <= 1 ? plotWidth / 2 : index * plotWidth / (values.length - 1));
    const y = top + plotHeight - (point[field] / maximum) * plotHeight;
    return { x, y, value: point[field], date: point.date };
  });
  const dateIndices = [...new Set([0, Math.floor((values.length - 1) / 2), values.length - 1])].filter(index => index >= 0);
  const polyline = points.map(point => `${point.x},${point.y}`).join(' ');
  return <article className="admin-trend-card">
    <h3>{title}</h3>
    <svg className="admin-line-chart" viewBox={`0 0 ${width} ${height}`} role="img" aria-label={title}>
      {[0, 0.5, 1].map((fraction, index) => {
        const y = top + fraction * plotHeight;
        const value = Math.round(maximum * (1 - fraction));
        return <g key={fraction}><line x1={left} x2={width - right} y1={y} y2={y} stroke="#e8edf4" /><text x={left - 8} y={y + 4} textAnchor="end" className="admin-axis-label">{value}</text></g>;
      })}
      {points.length > 1 && <polyline points={polyline} fill="none" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />}
      {points.map(point => <circle key={point.date} cx={point.x} cy={point.y} r="3.4" fill={color}><title>{`${point.date}: ${point.value}`}</title></circle>)}
      {dateIndices.map(index => <text key={values[index]?.date ?? index} x={points[index]?.x ?? left} y={height - 9} textAnchor={index === 0 ? 'start' : index === values.length - 1 ? 'end' : 'middle'} className="admin-axis-label">{values[index]?.date.slice(5) ?? ''}</text>)}
    </svg>
  </article>;
}
