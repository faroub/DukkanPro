const fs = require('fs');
const path = require('path');

const corsPath = path.join(
  __dirname,
  '..',
  'node_modules',
  '@expo',
  'cli',
  'build',
  'src',
  'start',
  'server',
  'middleware',
  'CorsMiddleware.js'
);

if (fs.existsSync(corsPath)) {
  let content = fs.readFileSync(corsPath, 'utf8');

  // Patch isAllowedHost to allow requests from reverse-proxy hosts like .run.app and x-forwarded-host
  const targetPattern = 'const isAllowedHost = allowedHosts.includes(host) || isLocalhost;';
  const replacement = `const forwardedHost = req.headers['x-forwarded-host'];
            const isForwardedMatch = forwardedHost && host === forwardedHost;
            const isAllowedHost = allowedHosts.includes(host) || isLocalhost || isForwardedMatch || host.endsWith('.run.app') || host.endsWith('.google.com');`;

  if (content.includes(targetPattern)) {
    content = content.replace(targetPattern, replacement);
    fs.writeFileSync(corsPath, content, 'utf8');
    console.log('[patch-cors] Successfully patched CorsMiddleware.js for Cloud Run / proxy environments.');
  } else if (content.includes('isForwardedMatch')) {
    console.log('[patch-cors] CorsMiddleware.js is already patched.');
  } else {
    console.warn('[patch-cors] Could not find target pattern in CorsMiddleware.js');
  }
} else {
  console.warn('[patch-cors] CorsMiddleware.js not found at', corsPath);
}
