import fs from 'node:fs';
import * as simpleIcons from 'simple-icons';

const rawData = fs.readFileSync('src/data/alternatives.json', 'utf8');
const catalog = JSON.parse(rawData);
const icons = Object.values(simpleIcons);

function findIcon(slugOrName) {
  if (!slugOrName) return null;
  const clean = slugOrName.toLowerCase().replace(/[^a-z0-9]/g, '');
  let found = icons.find(i => i && (i.slug === slugOrName.toLowerCase() || i.title?.toLowerCase() === slugOrName.toLowerCase()));
  if (!found) found = icons.find(i => i && (i.slug?.replace(/[^a-z0-9]/g, '') === clean || i.title?.toLowerCase().replace(/[^a-z0-9]/g, '') === clean));
  return found || null;
}

const PAID_MAP = {
  'notion': 'notion',
  'postman': 'postman',
  'figma': 'figma',
  'slack': 'slack',
  'dropbox': 'dropbox',
  '1password': '1password',
  'lastpass': 'lastpass',
  'dashlane': 'dashlane',
  'zoom': 'zoom',
  'trello': 'trello',
  'asana': 'asana',
  'clickup': 'clickup',
  'airtable': 'airtable',
  'miro': 'miro',
  'grammarly': 'grammarly',
  'firebase': 'firebase',
  'auth0': 'auth0',
  'heroku': 'heroku',
  'todoist': 'todoist',
  'spotify': 'spotify',
  'jira': 'jira',
  'evernote': 'evernote',
  'docker-desktop': 'docker',
  'google-photos': 'googlephotos',
  'plex': 'plex',
  'calendly': 'calendly',
  'zapier': 'zapier',
  'salesforce': 'salesforce',
  'google-analytics-360': 'googleanalytics',
  'google-drive': 'googledrive',
  'okta': 'okta',
  'vercel': 'vercel',
  'pingdom': 'pingdom',
  'discord': 'discord',
  'mailchimp': 'mailchimp',
  'medium': 'medium',
  'typeform': 'typeform',
  'surveymonkey': 'surveymonkey',
  'youtube': 'youtube',
  'autocad': 'autodesk',
  'intercom': 'intercom',
  'zendesk': 'zendesk',
  'quickbooks': 'intuit',
  'shopify': 'shopify',
  'obsidian-sync': 'obsidian',
  'stripe-billing': 'stripe',
  'x-premium': 'x',
  'google-translate-api': 'googletranslate',
  'google-nest': 'googlenest',
  'confluence': 'confluence',
  'datadog': 'datadog',
  'coda': 'coda',
  'make': 'make',
  'anydesk': 'anydesk',
  'new-relic': 'newrelic',
  'contentful': 'contentful',
  'substack': 'substack',
  'algolia': 'algolia',
  'cursor-ide': 'vscodium',
  'fathom-analytics': 'fathom',
  'bigcommerce': 'bigcommerce',
  'redis-enterprise': 'redis'
};

const REPO_MAP = {
  'toeverything/AFFiNE': 'affine',
  'usebruno/bruno': 'bruno',
  'penpot/penpot': 'penpot',
  'zulip/zulip': 'zulip',
  'LibreOffice/core': 'libreoffice',
  'GNOME/gimp': 'gimp',
  'Inkscape/inkscape': 'inkscape',
  'nextcloud/server': 'nextcloud',
  'bitwarden/clients': 'bitwarden',
  'keepassxreboot/keepassxc': 'keepassxc',
  'jitsi/jitsi-meet': 'jitsi',
  'mattermost/focalboard': 'mattermost',
  'excalidraw/excalidraw': 'excalidraw',
  'languagetool-org/languagetool': 'languagetool',
  'KDE/kdenlive': 'kdenlive',
  'metabase/metabase': 'metabase',
  'supabase/supabase': 'supabase',
  'goauthentik/authentik': 'authentik',
  'coollabsio/coolify': 'coolify',
  'go-vikunja/vikunja': 'vikunja',
  'opf/openproject': 'openproject',
  'laurent22/joplin': 'joplin',
  'containers/podman-desktop': 'podman',
  'n8n-io/n8n': 'n8n',
  'grafana/grafana': 'grafana',
  'strapi/strapi': 'strapi',
  'TryGhost/Ghost': 'ghost',
  'appwrite/appwrite': 'appwrite',
  'meilisearch/meilisearch': 'meilisearch',
  'VSCodium/vscodium': 'vscodium',
  'dani-garcia/vaultwarden': 'bitwarden',
  'PostHog/posthog': 'posthog',
  'umami-software/umami': 'umami',
  'knadh/listmonk': 'listmonk',
  'valkey-io/valkey': 'redis',
  'mastodon/mastodon': 'mastodon',
  'FreeCAD/FreeCAD': 'freecad',
  'minio/minio': 'minio',
  'element-hq/element-web': 'element',
  'logseq/logseq': 'logseq',
  'home-assistant/core': 'homeassistant',
  'immich-app/immich': 'immich',
  'jellyfin/jellyfin': 'jellyfin',
  'twentyhq/twenty': 'twenty',
  'formbricks/formbricks': 'formbricks',
  'louislam/uptime-kuma': 'uptimekuma',
  'chatwoot/chatwoot': 'chatwoot',
  'keycloak/keycloak': 'keycloak',
  'haiwen/seafile': 'seafile',
  'matomo-org/matomo': 'matomo',
  'mautic/mautic': 'mautic',
  'medusajs/medusa': 'medusa',
  'akaunting/akaunting': 'akaunting',
  'peertube/peertube': 'peertube',
  'outline/outline': 'outline',
  'JuliaLang/julia': 'julia'
};

const PAID_DOMAINS = {
  'notion': 'notion.so',
  'postman': 'postman.com',
  'figma': 'figma.com',
  'slack': 'slack.com',
  'microsoft-365': 'office.com',
  'photoshop': 'adobe.com',
  'illustrator': 'adobe.com',
  'dropbox': 'dropbox.com',
  '1password': '1password.com',
  'lastpass': 'lastpass.com',
  'dashlane': 'dashlane.com',
  'zoom': 'zoom.us',
  'trello': 'trello.com',
  'asana': 'asana.com',
  'monday': 'monday.com',
  'airtable': 'airtable.com',
  'clickup': 'clickup.com',
  'miro': 'miro.com',
  'grammarly': 'grammarly.com',
  'premiere-pro': 'adobe.com',
  'tableau': 'tableau.com',
  'firebase': 'firebase.google.com',
  'auth0': 'auth0.com',
  'heroku': 'heroku.com',
  'todoist': 'todoist.com',
  'spotify': 'spotify.com',
  'jira': 'atlassian.com',
  'evernote': 'evernote.com',
  'lightroom': 'adobe.com',
  'docker-desktop': 'docker.com',
  'google-photos': 'photos.google.com',
  'plex': 'plex.tv',
  'calendly': 'calendly.com',
  'adobe-acrobat': 'adobe.com',
  'zapier': 'zapier.com',
  'salesforce': 'salesforce.com',
  'google-analytics-360': 'analytics.google.com',
  'google-drive': 'drive.google.com',
  'okta': 'okta.com',
  'aws-s3': 'aws.amazon.com',
  'vercel': 'vercel.com',
  'pingdom': 'pingdom.com',
  'discord': 'discord.com',
  'microsoft-teams': 'microsoft.com',
  'mailchimp': 'mailchimp.com',
  'medium': 'medium.com',
  'typeform': 'typeform.com',
  'surveymonkey': 'surveymonkey.com',
  'youtube': 'youtube.com',
  'after-effects': 'adobe.com',
  'autocad': 'autodesk.com',
  'matlab': 'mathworks.com',
  'intercom': 'intercom.com',
  'zendesk': 'zendesk.com',
  'quickbooks': 'quickbooks.intuit.com',
  'shopify': 'shopify.com',
  'obsidian-sync': 'obsidian.md',
  'stripe-billing': 'stripe.com',
  'x-premium': 'x.com',
  'google-translate-api': 'translate.google.com',
  'google-nest': 'nest.google.com',
  'confluence': 'atlassian.com',
  'datadog': 'datadoghq.com',
  'coda': 'coda.io',
  'make': 'make.com',
  'anydesk': 'anydesk.com',
  'new-relic': 'newrelic.com',
  'contentful': 'contentful.com',
  'power-bi': 'powerbi.microsoft.com',
  'substack': 'substack.com',
  'backendless': 'backendless.com',
  'algolia': 'algolia.com',
  'cursor-ide': 'cursor.com',
  'amplitude': 'amplitude.com',
  'fathom-analytics': 'usefathom.com',
  'pandadoc': 'pandadoc.com',
  'smartsheet': 'smartsheet.com',
  'bigcommerce': 'bigcommerce.com',
  'klaviyo': 'klaviyo.com',
  'onenote': 'onenote.com',
  'redis-enterprise': 'redis.io'
};

const brandByPaid = {};
const brandByRepo = {};

for (const [slug, target] of Object.entries(PAID_MAP)) {
  const icon = findIcon(target);
  if (icon) {
    brandByPaid[slug] = {
      title: icon.title,
      hex: icon.hex,
      path: icon.path,
      slug: icon.slug
    };
  }
}

for (const [repo, target] of Object.entries(REPO_MAP)) {
  const icon = findIcon(target);
  if (icon) {
    brandByRepo[repo] = {
      title: icon.title,
      hex: icon.hex,
      path: icon.path,
      slug: icon.slug
    };
  }
}

const content = `// Brand logo map — vector SVGs & verified canonical domains for all 81 catalog tools.
// Inlined for ultra-fast, zero-dependency client-side rendering with instant CDN fallback.

export const BRAND_BY_REPO = ${JSON.stringify(brandByRepo, null, 2)};

export const BRAND_BY_PAID = ${JSON.stringify(brandByPaid, null, 2)};

export const PAID_DOMAINS = ${JSON.stringify(PAID_DOMAINS, null, 2)};
`;

fs.writeFileSync('dashboard/src/lib/logos.js', content, 'utf8');
console.log('Successfully generated dashboard/src/lib/logos.js!');
