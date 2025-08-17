// netlify/functions/kra.js
const fetch = require('node-fetch');

const GITHUB_TOKEN = process.env.GITHUB_TOKEN; // token set in Netlify env
const REPO = process.env.GITHUB_REPO; // e.g. "phil-gadz/AM-Usin-ss"
const FILE_PATH = process.env.GITHUB_FILE_PATH || 'kra.json';
const BRANCH = process.env.GITHUB_BRANCH || 'main';
const SERVER_PASS = process.env.KRA_PASS || 'changeme';

const API_ROOT = 'https://api.github.com';

async function getFile() {
  const url = `${API_ROOT}/repos/${REPO}/contents/${FILE_PATH}?ref=${BRANCH}`;
  const r = await fetch(url, { headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json' }});
  if (r.status === 404) return null;
  if (!r.ok) throw new Error(`GitHub GET failed: ${r.status}`);
  const json = await r.json();
  const content = Buffer.from(json.content, 'base64').toString('utf8');
  return { content, sha: json.sha };
}

async function updateFile(newContent, sha) {
  const url = `${API_ROOT}/repos/${REPO}/contents/${FILE_PATH}`;
  const body = {
    message: `Update kra.json via Netlify Function`,
    content: Buffer.from(newContent, 'utf8').toString('base64'),
    branch: BRANCH,
    sha
  };
  const r = await fetch(url, {
    method: 'PUT',
    headers: { Authorization: `token ${GITHUB_TOKEN}`, Accept: 'application/vnd.github.v3+json', 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });
  if (!r.ok) {
    const txt = await r.text();
    throw new Error(`GitHub PUT failed: ${r.status} - ${txt}`);
  }
  return await r.json();
}

exports.handler = async function(event) {
  try {
    if (event.httpMethod === 'GET') {
      const f = await getFile();
      if (!f) return { statusCode: 200, body: JSON.stringify({ text: '', ts: 0 }) };
      const parsed = JSON.parse(f.content || '{}');
      return { statusCode: 200, body: JSON.stringify(parsed) };
    }

    if (event.httpMethod === 'POST') {
      const body = JSON.parse(event.body || '{}');
      const pass = body.pass || '';
      if (pass !== SERVER_PASS) return { statusCode: 401, body: JSON.stringify({ error: 'Invalid pass' }) };

      const text = String(body.text || '');
      const payload = { text, ts: Date.now() };

      const f = await getFile();
      const sha = f ? f.sha : undefined;
      await updateFile(JSON.stringify(payload, null, 2), sha);

      return { statusCode: 200, body: JSON.stringify(payload) };
    }

    return { statusCode: 405, body: 'Method not allowed' };
  } catch (err) {
    console.error(err);
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

