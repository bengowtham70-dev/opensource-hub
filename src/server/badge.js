// Dynamic SVG Badge Generator for GitHub READMEs & documentation

const BAND_COLORS = {
  strong: "#059669", // Emerald
  good: "#0d9488",   // Teal
  caution: "#d97706",// Amber
  "high-risk": "#dc2626", // Red
};

export function generateTrustBadgeSvg({ score = 0, band = "good", repo = "" }) {
  const safeScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));
  const color = BAND_COLORS[band] || BAND_COLORS.caution;
  const leftText = "Trust Score";
  const rightText = `${safeScore}/100`;

  const leftWidth = 78;
  const rightWidth = 56;
  const totalWidth = leftWidth + rightWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="#18181B"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="${color}"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="14">${leftText}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14" font-weight="bold">${rightText}</text>
  </g>
</svg>`;
}

export function generateAlternativeBadgeSvg({ name = "", paidTool = "" }) {
  const leftText = "OpenSource Hub";
  const rightText = paidTool ? `Replaces ${paidTool}` : name;

  const leftWidth = 100;
  const rightWidth = Math.max(70, rightText.length * 7 + 16);
  const totalWidth = leftWidth + rightWidth;
  const height = 20;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${totalWidth}" height="${height}" role="img" aria-label="${leftText}: ${rightText}">
  <title>${leftText}: ${rightText}</title>
  <linearGradient id="s" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="1" stop-opacity=".1"/>
  </linearGradient>
  <clipPath id="r">
    <rect width="${totalWidth}" height="${height}" rx="3" fill="#fff"/>
  </clipPath>
  <g clip-path="url(#r)">
    <rect width="${leftWidth}" height="${height}" fill="#18181B"/>
    <rect x="${leftWidth}" width="${rightWidth}" height="${height}" fill="#C2410C"/>
    <rect width="${totalWidth}" height="${height}" fill="url(#s)"/>
  </g>
  <g fill="#fff" text-anchor="middle" font-family="-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif" text-rendering="geometricPrecision" font-size="11">
    <text aria-hidden="true" x="${leftWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${leftText}</text>
    <text x="${leftWidth / 2}" y="14">${leftText}</text>
    <text aria-hidden="true" x="${leftWidth + rightWidth / 2}" y="15" fill="#010101" fill-opacity=".3">${rightText}</text>
    <text x="${leftWidth + rightWidth / 2}" y="14" font-weight="bold">${rightText}</text>
  </g>
</svg>`;
}
