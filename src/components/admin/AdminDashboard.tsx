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
};
type Period = '15' | '30' | '180' | '365' | 'custom';
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
      const length = Number(period);
      setStartDate(daysAgo(length));
      setEndDate(today());
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
  if (!authReady || !authorized) return <div className="admin-loading">{isIt ? 'Verifica accesso…' : 'Checking access…'}</div>;

  return <main className="admin-dashboard">
    <header className="admin-header">
      <div><span className="admin-eyebrow">SPINWORDS · ADMIN</span><h1>{isIt ? 'Dashboard gestionale' : 'Admin dashboard'}</h1><p>{isIt ? 'Statistiche di utilizzo nel periodo selezionato' : 'Usage statistics for the selected period'}</p></div>
      <button className="admin-back" onClick={() => navigate(`/${activeLang}`)}>← {isIt ? 'Home' : 'Home'}</button>
    </header>
    <section className="admin-filters">
      <label>{isIt ? 'Periodo' : 'Period'}<select value={period} onChange={e => setPeriod(e.target.value as Period)}>
        <option value="15">{isIt ? 'Ultimi 15 giorni' : 'Last 15 days'}</option><option value="30">{isIt ? 'Ultimo mese' : 'Last 30 days'}</option><option value="180">{isIt ? 'Ultimi 6 mesi' : 'Last 6 months'}</option><option value="365">{isIt ? 'Ultimo anno' : 'Last year'}</option><option value="custom">{isIt ? 'Intervallo personalizzato' : 'Custom range'}</option>
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
      <section className="admin-panel"><h2>{isIt ? 'Partite per modalità' : 'Games by mode'}</h2><AnalyticsTable rows={modeRows} labels={labels} isIt={isIt} /></section>
      <section className="admin-panel"><h2>{isIt ? 'Partite per categoria' : 'Games by category'}</h2><AnalyticsTable rows={categoryRows} isIt={isIt} /></section>
      <section className="admin-panel admin-powerups-panel">
        <h2>{isIt ? `Power-up multiplayer · ${data?.multiplayer_powerups_total ?? 0} utilizzi` : `Multiplayer power-ups · ${data?.multiplayer_powerups_total ?? 0} uses`}</h2>
        <div className="admin-table-wrap"><table><thead><tr><th>{isIt ? 'Power-up' : 'Power-up'}</th><th>{isIt ? 'Utilizzi' : 'Uses'}</th></tr></thead><tbody>
          {powerupRows.length ? powerupRows.map(([name, count]) => <tr key={name}><td>{({ Double: isIt ? 'Doppio' : 'Double', Skip: isIt ? 'Salta turno' : 'Skip', Lose: isIt ? 'Perdi tutto' : 'Lose it all', Shield: isIt ? 'Scudo' : 'Shield' } as Record<string, string>)[name] ?? name}</td><td>{count}</td></tr>) : <tr><td colSpan={2}>{isIt ? 'Nessun utilizzo nel periodo' : 'No uses in this period'}</td></tr>}
        </tbody></table></div>
      </section>
    </div>
    {loading && <p className="admin-status">{isIt ? 'Aggiornamento…' : 'Refreshing…'}</p>}
    <p className="admin-note">{isIt ? 'I dati temporali sono raccolti da questa versione in avanti. I giocatori Google indicano gli account distinti che hanno avviato almeno una partita nel periodo.' : 'Date-filtered data is collected from this version onward. Google players counts distinct accounts that started at least one game in the period.'}</p>
  </main>;
}

function AnalyticsTable({ rows, labels = {}, isIt }: { rows: [string, { started: number; completed: number }][]; labels?: Record<string, string>; isIt: boolean }): React.ReactElement {
  return <div className="admin-table-wrap"><table><thead><tr><th>{isIt ? 'Gruppo' : 'Group'}</th><th>{isIt ? 'Iniziate' : 'Started'}</th><th>{isIt ? 'Concluse' : 'Completed'}</th></tr></thead><tbody>
    {rows.length ? rows.map(([name, stats]) => <tr key={name}><td>{labels[name] ?? name}</td><td>{stats.started}</td><td>{stats.completed}</td></tr>) : <tr><td colSpan={3}>{isIt ? 'Nessun dato nel periodo' : 'No data in this period'}</td></tr>}
  </tbody></table></div>;
}
