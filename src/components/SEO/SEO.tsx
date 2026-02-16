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
  const safePath = path && !path.startsWith('/') ? `/${path}` : path;

  const currentUrl = `${DOMAIN}/${lang}${safePath}`;
  const alternateLang = lang === 'it' ? 'en' : 'it';
  const alternateUrl = `${DOMAIN}/${alternateLang}${safePath}`;
  const defaultUrl = `${DOMAIN}/en${safePath}`;
  const ogLocale = lang === 'it' ? 'it_IT' : 'en_US';
  const ogLocaleAlt = lang === 'it' ? 'en_US' : 'it_IT';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <html lang={lang} />

      {/* Canonical & Hreflang */}
      <link rel="canonical" href={currentUrl} />
      <link rel="alternate" hrefLang={lang} href={currentUrl} />
      <link rel="alternate" hrefLang={alternateLang} href={alternateUrl} />
      <link rel="alternate" hrefLang="x-default" href={defaultUrl} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={currentUrl} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="SpinWords" />
      <meta property="og:locale" content={ogLocale} />
      <meta property="og:locale:alternate" content={ogLocaleAlt} />
      <meta property="og:image" content={`${DOMAIN}/og-image-v2.jpg`} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />

      {/* Twitter Card */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={`${DOMAIN}/og-image-v2.jpg`} />
    </Helmet>
  );
};