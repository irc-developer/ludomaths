# Deploy the web app to GitHub Pages

The workflow in [`.github/workflows/deploy.yml`](../.github/workflows/deploy.yml)
publishes the React + Vite app in `web/`. Its domain and application modules are
compiled from `src/` alongside the web code.

## One-time repository setup

1. Open the repository's **Settings → Pages**.
2. Under **Build and deployment → Source**, select **GitHub Actions**.
3. Commit and push the workflow and the web app's source files to `main`.
   Include `web/package-lock.json` and any shared modules imported from `src/`.
4. Open **Actions → Deploy web to GitHub Pages** to follow the deployment.

The expected URL for this repository, unless a custom domain is configured, is
<https://irc-developer.github.io/ludomaths/>. The deployment's `github-pages`
environment also shows the actual published URL.

GitHub Pages must be available for the repository's visibility and account plan.
The workflow uses the automatic `GITHUB_TOKEN`; no personal token, custom secret,
or `gh-pages` branch is required. If `github-pages` has deployment protection
rules, allow deployments from `main`.

## Automatic and manual deployments

Every push to `main` installs the locked web dependencies with `npm ci`, runs the
web tests, checks TypeScript, builds the app, uploads `web/dist`, and deploys it.
Failed tests or builds prevent publication.

To redeploy manually, open **Actions → Deploy web to GitHub Pages → Run workflow**
and select `main`. Other branches are skipped. Deployments share a concurrency
group so an active deployment can finish before another starts.

The build uses `configure-pages`'s `base_path` output to set Vite's `--base`.
For this repository that normally produces `/ludomaths/`; for an account site or
custom domain it produces `/`. This ensures generated asset URLs match the site
without hardcoding the repository name in the Vite configuration.

## Verify the production build locally

From the repository root:

```bash
cd web
npm ci
npm test
npm run build -- --base=/ludomaths/
npm run preview -- --base=/ludomaths/
```

Open <http://localhost:4173/ludomaths/>. Build output belongs in the workflow
artifact; committing `web/dist` is unnecessary.

The three approved clean pilot catalogs live in `web/public/catalogs` and are
copied into the deployment artifact by Vite. A fresh browser automatically
loads `catalogs/pilot-combined.json` using the configured base path, validates
its structure and trusted digest, and stores the validated catalog locally.
Publishing these files does not require a machine-local environment file or
the development-only catalog endpoint.

## Troubleshooting

If the site shows the README with a Jekyll theme, it is serving a deployment of
the repository root rather than the Vite build. Confirm **Settings → Pages →
Source** is **GitHub Actions**, then check the latest **Deploy web to GitHub
Pages** run. A failed run leaves the previously published site visible.

The web build and tests must work with only `web/` dependencies installed.
Shared modules in `src/domain` and `src/application` are transformed using the
web TypeScript options explicitly supplied in both `web/vite.config.ts` and
`web/vitest.config.ts`. Supplying `tsconfigRaw` as a JSON string prevents Vite
from looking up the mobile `tsconfig.json` for those files and requiring
`@react-native/typescript-config` during the web deployment.

When verifying this in a clean checkout, install dependencies in `web/` only.
An existing root `node_modules` can hide this configuration error.

## Official documentation

- [GitHub: using custom workflows with GitHub Pages](https://docs.github.com/en/pages/getting-started-with-github-pages/using-custom-workflows-with-github-pages)
- [GitHub: configuring a publishing source](https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site)
- [Vite: deploying to GitHub Pages](https://vite.dev/guide/static-deploy.html#github-pages)
