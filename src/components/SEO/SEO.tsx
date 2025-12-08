import React from 'react';
import { Helmet } from 'react-helmet-async';

interface SEOProps {
  title: string;
  description: string;
  lang: 'it' | 'en';
  path: string; // es: "" (per home) oppure "/rules"
}

const DOMAIN = 'https://spinwords.pages.dev';

export const SEO: React.FC<SEOProps> = ({ title, description, lang, path }) => {
  // 1. Sicurezza: Assicuriamoci che il path inizi con uno slash se non è vuoto
  // Questo evita url tipo "https://.../itrules" se ti dimentichi lo slash
  const safePath = path && !path.startsWith('/') ? `/${path}` : path;

  // Costruiamo gli URL completi
  const currentUrl = `${DOMAIN}/${lang}${safePath}`;
  
  // Calcoliamo l'URL dell'altra lingua
  const alternateLang = lang === 'it' ? 'en' : 'it';
  const alternateUrl = `${DOMAIN}/${alternateLang}${safePath}`;

  // URL Default (Inglese)
  const defaultUrl = `${DOMAIN}/en${safePath}`;

  return (
    <Helmet>
      {/* Titolo e Descrizione base */}
      <title>{title}</title>
      <meta name="description" content={description} />
      <html lang={lang} />

      {/* Canonical */}
      <link rel="canonical" href={currentUrl} />

      <link rel="alternate" hrefLang={lang} href={currentUrl} />
      <link rel="alternate" hrefLang={alternateLang} href={alternateUrl} />
      <link rel="alternate" hrefLang="x-default" href={defaultUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      
      {/* 2. Immagine Scommentata: Ora WhatsApp mostrerà l'anteprima! */}
      <meta property="og:image" content={`${DOMAIN}/og-image.jpg`} />
      {/* Opzionale: dimensioni immagine per aiutare WhatsApp a caricarla subito */}
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
    </Helmet>
  );
};