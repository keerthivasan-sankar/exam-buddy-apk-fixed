const fs = require('fs');
let code = fs.readFileSync('vite.config.ts', 'utf8');

const pluginCode = `
function securityHeadersPlugin() {
  const headers = {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'X-XSS-Protection': '1; mode=block',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy': "default-src 'self' https: wss: 'unsafe-inline' 'unsafe-eval' data: blob:;",
    'Permissions-Policy': 'geolocation=(), microphone=(), camera=()'
  };
  return {
    name: 'security-headers',
    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req, res, next) => {
        Object.entries(headers).forEach(([key, value]) => res.setHeader(key, value));
        next();
      });
    }
  };
}
`;

// Insert the plugin code before export default defineConfig
code = code.replace('export default defineConfig(() => {', pluginCode + '\nexport default defineConfig(() => {');

// Add the plugin to the plugins array
code = code.replace('VitePWA({', 'securityHeadersPlugin(),\n      VitePWA({');

fs.writeFileSync('vite.config.ts', code);
