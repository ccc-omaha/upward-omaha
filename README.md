# upwardomaha.com

Upward Sports Omaha, the youth soccer, flag football, and cheer league at Christ Community Church.

- **Edit:** Pages CMS (app.pagescms.org), or the CCC edit site at edit.cccomaha.org
- **Hosting:** Netlify (Comm Team), deploys from `main`
- **Build:** `node build.js` renders `index.html` from `src/template.html` and `content/*.json`

Never hand-edit `index.html`. Change copy in `content/`, design in `src/template.html`.

The soccer age chart and birthday finder are calculated from `content/ages.json` (`fallYear`), so only that one number changes each season.
