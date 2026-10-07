// @vitest-environment node
import { afterEach, describe, expect, it } from 'vitest';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join, relative, isAbsolute } from 'node:path';
import { request } from 'node:http';
import { createServer, type ViteDevServer } from 'vite';
import { privateCatalogPlugin } from '../../privateCatalogPlugin';

let server: ViteDevServer | undefined;
let folder: string | undefined;
afterEach(async () => {
  await server?.close();
  server = undefined;
  if (folder) {
    const withinTemp = relative(tmpdir(), folder);
    if (isAbsolute(withinTemp) || withinTemp.startsWith('..') || !withinTemp.startsWith('ludomaths-catalog-test-')) throw new Error('TEST_CLEANUP_INVALID');
    await rm(folder, { recursive: true, force: true });
  }
  folder = undefined;
});
async function start(file?: string, base = '/') {
  server = await createServer({ configFile: false, root: process.cwd(), base,
    plugins: [privateCatalogPlugin(file)], logLevel: 'silent', server: { host: '127.0.0.1', port: 0 } });
  await server.listen();
  const address = server.httpServer!.address();
  if (!address || typeof address === 'string') throw new Error('TEST_SERVER_INVALID');
  return `http://127.0.0.1:${address.port}${base}.__private/catalog`;
}
async function fixture() {
  folder = await mkdtemp(join(tmpdir(), 'ludomaths-catalog-test-'));
  const file = join(folder, 'synthetic.json');
  await writeFile(file, '{"synthetic":true}');
  return file;
}
describe('local private catalog endpoint', () => {
  it('serves the configured file locally with no-cache headers and supports a base path', async () => {
    const response = await fetch(await start(await fixture(), '/ludomaths/'));
    expect(response.status).toBe(200);
    expect(response.headers.get('cache-control')).toBe('no-store');
    expect(response.headers.get('access-control-allow-origin')).toBeNull();
    expect(await response.json()).toEqual({ synthetic: true });
  });
  it('rejects cross-origin reads even when the server enables CORS', async () => {
    const response = await fetch(await start(await fixture()), { headers: { Origin: 'https://example.invalid' } });
    expect(response.status).toBe(403);
    expect(await response.text()).toBe('');
  });
  it('rejects non-loopback host names and unsafe methods', async () => {
    const url = await start(await fixture());
    const status = await new Promise(resolve => {
      const req = request(url, { headers: { Host: 'example.invalid' } }, res => { res.resume(); resolve(res.statusCode); });
      req.end();
    });
    expect(status).toBe(403);
    expect((await fetch(url, { method: 'POST' })).status).toBe(405);
  });
  it('returns a neutral missing response without a configured file', async () => {
    const response = await fetch(await start());
    expect(response.status).toBe(404);
    expect(await response.text()).toBe('');
  });
  it('does not leak file paths on read failure', async () => {
    const response = await fetch(await start('nonexistent-private-file.json'));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('');
  });
  it('limits private files before sending their contents', async () => {
    const file = await fixture();
    await writeFile(file, ' '.repeat(10 * 1024 * 1024 + 1));
    const response = await fetch(await start(file));
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('');
  });
  it('only registers a development server handler and emits no build assets', () => {
    const plugin = privateCatalogPlugin('private-file.json');
    expect(plugin.apply).toBe('serve');
    expect(plugin).not.toHaveProperty('configurePreviewServer');
    expect(plugin).not.toHaveProperty('generateBundle');
    expect(plugin).not.toHaveProperty('load');
    expect(plugin).not.toHaveProperty('transform');
  });
});
