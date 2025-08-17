# Site package for Netlify deployment

Contenu du zip :
- `index.html` : ton fichier complet (modifié pour remplacer le logo glitché par `MON_BASE_64`). **eventsData** est intact.
- `kra.json` : fichier initial pour stocker le texte (peut être géré par la Function).
- `netlify/functions/kra.js` : Netlify Function pour `GET`/`POST` le texte partagé.
- `.netlify.toml` : configuration minimale.

## Installer et déployer sur Netlify

1. Pousse ce dossier dans ton repo GitHub.
2. Sur Netlify, connecte ton repo et configure ces variables d'environnement :
   - `GITHUB_TOKEN` : Personal Access Token GitHub (scope `repo` pour privé ou `public_repo` pour public)
   - `GITHUB_REPO` : `owner/repo` (ex: `monPseudo/mon-depot`)
   - `GITHUB_FILE_PATH` : `kra.json`
   - `GITHUB_BRANCH` : `main`
   - `KRA_PASS` : mot de passe pour sécuriser le POST (ex: `123` -> change-le)

3. Déploie le site depuis Netlify. La Function sera accessible via `/.netlify/functions/kra`.

## Front-end
Dans `index.html`, remplace le code client pour appeler la Function :
- `GET /.netlify/functions/kra` pour récupérer le texte partagé.
- `POST /.netlify/functions/kra` avec `{ text, pass }` pour sauvegarder (le `pass` doit matcher `KRA_PASS`).

Je t'ai fourni la Function prête à l'emploi. Si tu veux que j'intègre le code fetch directement dans `index.html` (déjà modifié) pour appeler la Function (GET/POST), dis-le — je peux l'inclure aussi.
