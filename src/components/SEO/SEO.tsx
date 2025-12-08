import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  lang: 'it' | 'en'; // o 'eng' se usi quello
  path: string; // es: '/rules' o '/scoreboard'
}
const DOMAIN = 'https://spinwords.pages.dev';

export const SEO: React.FC<SEOProps> = ({ title, description, lang, path }) => {
  // Costruiamo gli URL completi
  const currentUrl = `${DOMAIN}/${lang}${path}`;
  
  // Calcoliamo l'URL dell'altra lingua per il tag alternate
  const alternateLang = lang === 'it' ? 'en' : 'it'; // o 'eng'
  const alternateUrl = `${DOMAIN}/${alternateLang}${path}`;

  return (
    <Helmet>
      {/* Titolo e Descrizione base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <html lang={lang} />

      {/* Canonical: dice a Google "questo è l'URL ufficiale di questa pagina" */}
      <link rel="canonical" href={currentUrl} />

      {/* Hreflang: dice a Google "questa pagina ha una versione tradotta qui" */}
      <link rel="alternate" hrefLang={lang} href={currentUrl} />
      <link rel="alternate" hrefLang={alternateLang} href={alternateUrl} />
      
      {/* x-default: rimanda alla versione inglese (o quella che preferisci) per utenti non IT/EN */}
      <link rel="alternate" hrefLang="x-default" href={`${DOMAIN}/en${path}`} />

      {/* Open Graph (per le anteprime su WhatsApp/Facebook) */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      {/* Aggiungi un'immagine og-image.jpg in public/ se vuoi */}
      {/* <meta property="og:image" content={`${DOMAIN}/og-image.jpg`} /> */}
    </Helmet>
  );
};