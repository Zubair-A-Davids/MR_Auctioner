MR Auctioner - Mirage Realms (static demo)

This is a simple static front-end demo that simulates user accounts and an auction/listing board for the fictional MMORPG "Mirage Realms".

How it works
- Accounts and listings are stored in the browser's `localStorage`.
- No server is included — it is intended as a static demo for GitHub Pages.

Files
- `index.html` — main site
- `styles.css` — simple styling
- `app.js` — client-side logic: register, login, create listings, read listings

New features
- Image upload: listings can include an optional image file (stored as a data URL in `localStorage`).
- Edit & delete: sellers can edit or delete their own listings from the UI.
- Validation & UX: client-side checks for username/password/listing fields and image previews.

Usage
1. Open `index.html` in your browser (or serve the folder from a simple static server).

Quick local test (PowerShell):

```powershell
python -m http.server 8000
# then open http://localhost:8000 in your browser
```

Deploy to GitHub Pages
- Push this repository to GitHub.
- In repository Settings > Pages, set the source to the `main` branch and root `/`.
- After the site builds, visit `https://<your-username>.github.io/<repo>`.

Notes on images
- Images are stored as data URLs inside `localStorage`. This is convenient for a static demo but not suitable for production: data URLs can grow large and are stored per-browser only.
Additional image behavior
- This demo will automatically resize and compress large images client-side before saving them to `localStorage`.
- The site attempts to keep images under ~200 KB by scaling down dimensions and reducing JPEG quality. Transparency may be lost because images are converted to JPEG for compression when necessary.
- If you want stricter limits, consider hosting images externally (S3, Imgur, or your own server) and storing only URLs.

GitHub Pages deployment (expanded)
1. Push your repository to GitHub on the `main` branch.
2. In your repository on GitHub, go to `Settings` -> `Pages`.
3. Under `Build and deployment`, set `Source` to `Deploy from a branch`.
4. Set the branch to `main` and the folder to `/ (root)`.
5. Save. GitHub will build and publish the site — the URL will be shown on the same page (usually `https://<username>.github.io/<repo>`).
6. If you prefer to use `gh-pages` branch instead, you can push the static site build to a `gh-pages` branch and set `Source` to that branch.

Tip: For development, you can preview locally with `python -m http.server 8000` and confirm everything works before pushing.

Notes and limitations
- This is a front-end demo only. Do not use this for real accounts or production data.
- localStorage keeps data per-browser and per-origin.

If you'd like, I can:
- Add listing deletion/editing by the seller
- Add simple image upload using data URLs
- Add nicer UI and validation
