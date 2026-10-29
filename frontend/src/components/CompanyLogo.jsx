import { useState } from 'react';

export function getLogoUrl(url, name) {
  const raw = (url || '').trim();

  // If already an image or data URL or CDN
  const isDirectImage =
    /\.(png|jpe?g|svg|webp|ico|gif)(\?.*)?$/i.test(raw) ||
    raw.startsWith('data:image/') ||
    raw.includes('cloudinary.com') ||
    raw.includes('gstatic.com') ||
    raw.includes('icon.horse') ||
    raw.includes('clearbit.com');

  if (isDirectImage) return raw;

  // Extract domain from URL or string
  let domain = '';
  if (raw) {
    try {
      const withProto = raw.startsWith('http://') || raw.startsWith('https://') ? raw : `https://${raw}`;
      const parsed = new URL(withProto);
      domain = parsed.hostname.replace(/^www\./, '');
    } catch {
      domain = raw.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
    }
  }

  // If no URL given but company name exists, infer domain (e.g. Apple -> apple.com)
  if (!domain && name) {
    const cleanName = name.trim().toLowerCase().replace(/[^a-z0-9]/g, '');
    if (cleanName) domain = `${cleanName}.com`;
  }

  if (domain && domain.includes('.')) {
    return `https://t1.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&url=https://${domain}&size=128`;
  }

  return raw || null;
}

export default function CompanyLogo({ name, url, className = 'small' }) {
  const [hasError, setHasError] = useState(false);
  const resolvedUrl = getLogoUrl(url, name);

  if (resolvedUrl && !hasError) {
    return (
      <img
        src={resolvedUrl}
        alt={name || 'Company logo'}
        className={`company-logo-img ${className}`}
        onError={() => setHasError(true)}
        loading="lazy"
      />
    );
  }

  const initials = name?.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() || '?';
  return <div className={`company-logo-initials ${className}`}>{initials}</div>;
}
