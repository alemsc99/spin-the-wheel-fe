import React, { useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTranslation, type Lang } from '../../i18n/TranslationProvider';
import './RulesPage.css';
import translations from '../../i18n/strings.json';
import { SEO } from '../SEO/SEO';

type RulesSection = { title: string; content: string[] };

function isLiteralPlaceholder(sections: RulesSection[], placeholder: string): boolean {
  if (sections.length === 0) return false;
  return sections.every(section => section.content.length === 1 && section.content[0] === placeholder);
}

function normalizeRulesBody(raw: unknown): RulesSection[] {
  if (Array.isArray(raw)) {
    return raw
      .map((entry, index) => {
        if (typeof entry !== 'object' || entry === null) {
          return null;
        }
        const section = entry as Record<string, unknown>;
        const title =
          typeof section.title === 'string' ? section.title : `Section ${index + 1}`;
        const contentArray = Array.isArray(section.content)
          ? section.content.filter((line): line is string => typeof line === 'string')
          : typeof section.content === 'string'
          ? section.content.split('\n').map((line) => line.trim()).filter(Boolean)
          : [];

        return { title, content: contentArray };
      })
      .filter((section): section is RulesSection => section !== null);
  }

  if (typeof raw === 'string') {
    const content = raw.split('\n').map((line) => line.trim()).filter(Boolean);
    return content.length > 0 ? [{ title: '', content }] : [];
  }

  return [];
}

export default function RulesPage(): React.ReactElement {
  const { t, lang } = useTranslation();
  const navigate = useNavigate();
  const params = useParams<{ lang?: string }>();
  const activeLang = params.lang === 'it' || params.lang === 'en' ? (params.lang as Lang) : lang;
  const rulesPages = useMemo<RulesSection[]>(() => {
    const maybe = t('start.rulesBody') as unknown;
    const normalized = normalizeRulesBody(maybe);
    if (normalized.length > 0 && !isLiteralPlaceholder(normalized, 'start.rulesBody')) {
      return normalized;
    }
    const langMap = (translations as Record<string, Record<string, unknown>>)[activeLang] ?? {};
    return normalizeRulesBody(langMap['start.rulesBody']);
  }, [t, activeLang]);

  const baseTitle =
    typeof t('start.rulesTitle') === 'string' ? t('start.rulesTitle') : 'Rules';
  const emptyLabel = typeof t('rules.empty') === 'string' && t('rules.empty') !== 'rules.empty'
    ? t('rules.empty')
    : '';

  const handleClose = (): void => {
    if (window.history.length > 1) {
      navigate(-1);
      return;
    }
    navigate(`/${activeLang}`);
  };

  const pageName = t('rules.pageHeading')
  return (
    <div className="rules-page">
      <SEO
        title={activeLang === 'it'
          ? "Regole di GiraParole - Come si Gioca | Gioco di Parole Online"
          : "SpinWords Rules - How to Play | Free Online Word Game Guide"}
        description={activeLang === 'it'
          ? "Impara le regole di GiraParole: gira la ruota, indovina consonanti e vocali, usa potenziamenti come Scudo e Doppio. Guida completa al gioco di parole online multiplayer ispirato alla Ruota della Fortuna."
          : "Learn how to play SpinWords: spin the wheel, guess consonants and vowels, use power-ups like Shield and Double. Complete guide to the free online multiplayer word puzzle game inspired by Wheel of Fortune."}
        lang={activeLang as 'it' | 'en'}
        path="/rules"
      />
      
      {/* Sfondo Decorativo */}
      <svg className="bg-decor bg-star star1" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700" /></svg>
      <svg className="bg-decor bg-star star2" viewBox="0 0 38 38"><polygon points="19,2 23,14 36,14 25,22 29,35 19,27 9,35 13,22 2,14 15,14" fill="#ffd700" /></svg>
      <div className="bg-decor bg-circle c1" />
      <div className="bg-decor bg-circle c2" />
      

      {/* 1. TITOLO PRINCIPALE (ESTERNO) */}
      <h1 className="title fancy-title">
        {pageName}
      </h1>

      {/* 2. IL BOX DELLE REGOLE */}
      <div className="rules-page-wrapper">
        <div className="rules-modal pretty-card">
          
          {/* Icona che "esce" sopra */}
          <div className="rules-modal-icon-wrapper">
            <span className="rules-modal-icon" role="img" aria-label="wheel">🎡</span>
          </div>
          
          <div className="rules-content">
            {rulesPages.length > 0 ? (
              rulesPages.map((section, sectionIdx) => (
                <div className="rules-section" key={sectionIdx}>
                  {section.title && section.title !== baseTitle && <h3 className="rules-section-title">{section.title}</h3>}
                  <ol className="rules-list">
                    {section.content.map((line, lineIdx) => (
                      <li key={lineIdx} className="rules-list-item" dangerouslySetInnerHTML={{ __html: line }} />
                    ))}
                  </ol>
                </div>
              ))
            ) : (
              emptyLabel && <p className="rules-empty">{emptyLabel}</p>
            )}
          </div>
        </div>
      </div>

      {/* 3. PULSANTE INDIETRO (SOTTO IL BOX) */}
      <div className="rules-footer-action">
        <button onClick={handleClose} className="rules-close-btn">
            {activeLang === 'it' ? 'Indietro' : 'Back'}
        </button>
      </div>

    </div>
  );
}