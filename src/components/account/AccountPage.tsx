import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation, type Lang } from '../../i18n/TranslationProvider';
import { Helmet } from 'react-helmet-async';
import { auth } from '../../firebaseConfig';
import { onAuthStateChanged, type User } from 'firebase/auth';
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from 'recharts';
import './AccountPage.css';

export default function AccountPage(): React.ReactElement {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ lang?: string }>();
  const activeLang = params.lang === 'it' || params.lang === 'en' ? (params.lang as Lang) : lang;

  const [user, setUser] = useState<{ displayName: string; photoURL: string | null; uid: string } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        setUser({
          displayName: firebaseUser.displayName || 'Unknown',
          photoURL: firebaseUser.photoURL,
          uid: firebaseUser.uid
        });
      } else {
        setUser(null);
      }
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const handleClose = (): void => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/${activeLang}`);
  };

  const pageTitle = activeLang === 'it' ? 'Il Mio Account' : 'My Account';
  const canonicalUrl = `https://spinwords.web.app/${activeLang}/account`;
  const metaTitle = activeLang === 'it'
    ? 'Il Mio Account - GiraParole'
    : 'My Account - SpinWords';
  const metaDescription = activeLang === 'it'
    ? 'Gestisci il tuo account personale su GiraParole'
    : 'Manage your personal account on SpinWords';

  const getInitials = (name: string): string => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const statsData = [
    { name: t('account.stats.wins'), value: 55, fill: '#4caf50' },
    { name: t('account.stats.losses'), value: 45, fill: '#ef5350' }
  ];

  const customTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="account-tooltip">
          <p className="account-tooltip-label">{payload[0].name}</p>
          <p className="account-tooltip-value">{payload[0].value}%</p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="account-page">
        <Helmet>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={canonicalUrl} />
        </Helmet>
        <div className="account-container">
          <p>{activeLang === 'it' ? 'Caricamento...' : 'Loading...'}</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="account-page">
        <Helmet>
          <title>{metaTitle}</title>
          <meta name="description" content={metaDescription} />
          <link rel="canonical" href={canonicalUrl} />
        </Helmet>
        <div className="account-container">
          <p>{activeLang === 'it' ? 'Profilo non disponibile' : 'Profile not available'}</p>
          <button className="account-back-button" onClick={handleClose}>
            ← {activeLang === 'it' ? 'Indietro' : 'Back'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="account-page">
      <Helmet>
        <title>{metaTitle}</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />
      </Helmet>

      <div className="account-container">
        <h1 className="fancy-title account-title">{pageTitle}</h1>

        {/* Profile Section */}
        <div className="account-content">
          <div className="account-profile-section">
            <div className="account-profile-info">
              <h2 className="account-profile-label">{t('account.profileSection')}</h2>
              <p className="account-name">{user.displayName}</p>
            </div>
          </div>

          {/* Statistics Section */}
          <div className="account-stats-section">
            <h2 className="account-stats-label">{t('account.statisticsSection')}</h2>
            <div className="account-chart-container">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statsData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.value}%`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statsData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.fill} />
                    ))}
                  </Pie>
                  <Tooltip content={customTooltip} />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Back Button */}
        <button className="account-back-button" onClick={handleClose}>
          ← {activeLang === 'it' ? 'Indietro' : 'Back'}
        </button>
      </div>
    </div>
  );
}
