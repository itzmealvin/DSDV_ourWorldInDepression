# Deploy the static website

The website is the contents of public/. There is no build step, package installation, runtime server, cf configuration or Vite configuration. Do not publish the repository root: assets/ contains identifiable survey responses.

## Any static host

Upload public/ as the site's document root. Keep filenames and subfolders intact, and serve .mjs as JavaScript. Use public/404.html as the custom not-found page. public/\_headers supplies security headers on hosts that support the Cloudflare/Netlify headers format; other hosts need equivalent server settings.

## Cloudflare Workers Builds from Git

The source stays plain HTML/CSS/JS. The existing wrangler.jsonc selects Worker dsdv and uploads public/ as static assets; no build step is needed.

1. Push the repository to GitHub or GitLab after reviewing your changes.
2. In Cloudflare, create a Worker connected to that Git repository, or connect it under the Worker's Settings → Build.
3. Choose your actual production branch and keep the repository root directory as `/`.
4. Leave the build command empty.
5. Set the deploy command to:

   ```sh
   npx wrangler@4 deploy
   ```

6. Use the Worker name `dsdv` in the dashboard, matching wrangler.jsonc. Let Workers Builds create/select its deployment token. No secret belongs in the static files.
7. Disable non-production branch deployments initially. Save and deploy; later pushes to the selected production branch repeat the upload automatically.
8. Open your configured domain or route. The current configuration disables workers.dev and preview URLs; enable them explicitly in wrangler.jsonc only if you want to use those URLs. Check index.html, vietnam.html, all survey links, filter URLs and a deliberately missing URL. Confirm `/assets/education/education.csv` and `/data/world_data.csv` return 404.

The deploy command runs Wrangler only inside Cloudflare's build environment. You do not need Wrangler, cf or Node to serve the site locally. No deployment was performed as part of the code changes.

If the dashboard prompts for automatic framework detection or configuration, select the static-assets upload path and retain the explicit deploy command above. Do not deploy `--assets .` because that would include research inputs.

Official references:

- https://developers.cloudflare.com/workers/ci-cd/builds/configuration/
- https://developers.cloudflare.com/workers/static-assets/get-started/
