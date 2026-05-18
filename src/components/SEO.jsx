import { Helmet } from 'react-helmet-async';

export default function SEO({
  title,
  description,
  keywords,
  url,
  image,
  noindex = false,
  schema,
}) {
  const siteUrl = 'https://om-tools.netlify.app';
  const canonical = url || siteUrl;
  const ogImage = image || `${siteUrl}/og-image.jpg`;
  const robots = noindex
    ? 'noindex, nofollow, noarchive'
    : 'index, follow, max-snippet:-1, max-image-preview:large, max-video-preview:-1';

  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      {keywords && <meta name="keywords" content={keywords} />}
      <meta name="robots" content={robots} />
      <link rel="canonical" href={canonical} />

      {/* Open Graph */}
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:url" content={canonical} />
      <meta property="og:image" content={ogImage} />
      <meta property="og:type" content="website" />
      <meta property="og:site_name" content="OM Tools" />

      {/* Twitter */}
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      <meta name="twitter:description" content={description} />
      <meta name="twitter:image" content={ogImage} />

      {/* Structured Data */}
      {schema && (
        <script type="application/ld+json">
          {JSON.stringify(schema)}
        </script>
      )}
    </Helmet>
  );
}
