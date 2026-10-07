import { readFile, stat } from 'node:fs/promises';
import type { Plugin } from 'vite';

const MAX_BYTES = 10 * 1024 * 1024;
const LOOPBACK_ADDRESSES = new Set(['127.0.0.1', '::1', '::ffff:127.0.0.1']);

/** Reads an explicitly configured clean local file; never imports it into the client graph. */
export function privateCatalogPlugin(file?: string): Plugin {
  let base = '/';
  return {
    name: 'ludomaths-local-private-catalog',
    apply: 'serve',
    configResolved(config) { base = config.base; },
    configureServer(server) {
      server.middlewares.use(async (req, res, next) => {
        if (req.url?.split('?')[0] !== `${base}.__private/catalog`) return next();
        res.setHeader('Cache-Control', 'no-store');
        res.setHeader('X-Content-Type-Options', 'nosniff');
        res.setHeader('Cross-Origin-Resource-Policy', 'same-origin');
        function end(status: number) { res.statusCode = status; res.end(); }
        const host = req.headers.host ?? '';
        let hostname;
        try { hostname = new URL(`http://${host}`).hostname; } catch { return end(403); }
        if (!['localhost', '127.0.0.1', '[::1]'].includes(hostname) ||
          !LOOPBACK_ADDRESSES.has(req.socket.remoteAddress ?? '') ||
          req.headers.origin && req.headers.origin !== `http://${host}` ||
          req.headers['sec-fetch-site'] && !['same-origin', 'none'].includes(String(req.headers['sec-fetch-site']))) return end(403);
        if (req.method !== 'GET') return end(405);
        if (!file) return end(404);
        try {
          const info = await stat(file);
          if (!info.isFile() || info.size > MAX_BYTES) return end(503);
          const payload = await readFile(file);
          if (payload.byteLength > MAX_BYTES) return end(503);
          res.setHeader('Content-Type', 'application/json; charset=utf-8');
          res.end(payload);
        } catch { end(503); }
      });
    },
  };
}
