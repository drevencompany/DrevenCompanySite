const https = require('node:https');

function defaultGithubRequest(token, path, method, body = null) {
  return new Promise((resolve, reject) => {
    const payload = body ? JSON.stringify(body) : null;
    const headers = {
      'User-Agent': 'DrevenCompany-App',
      'Accept': 'application/vnd.github.v3+json',
      ...(token ? { 'Authorization': `token ${token}` } : {}),
      ...(payload ? { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(payload) } : {})
    };

    const req = https.request({
      hostname: 'api.github.com',
      path,
      method,
      headers
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(data || '{}');
          resolve({ statusCode: res.statusCode, data: json });
        } catch {
          resolve({ statusCode: res.statusCode, data: {} });
        }
      });
    });

    req.on('error', err => reject(err));
    if (payload) req.write(payload);
    req.end();
  });
}

function parseJsonFile(files, filename) {
  if (files && files[filename] && typeof files[filename].content === 'string') {
    try {
      const parsed = JSON.parse(files[filename].content);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}

function createGistRepository({ token, gistId, request }) {
  const reqFn = request || ((path, method, body) => defaultGithubRequest(token, path, method, body));

  async function fetchGistFiles() {
    if (!token || !gistId) {
      throw new Error('GITHUB_TOKEN and GITHUB_GIST_ID are required for Gist persistence');
    }
    const res = await reqFn(`/gists/${gistId}`, 'GET');
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`GitHub API returned status ${res.statusCode}: ${JSON.stringify(res.data || {})}`);
    }
    return (res.data && res.data.files) || {};
  }

  async function updateGistFile(filename, contentArray) {
    if (!token || !gistId) {
      throw new Error('GITHUB_TOKEN and GITHUB_GIST_ID are required for Gist persistence');
    }
    const res = await reqFn(`/gists/${gistId}`, 'PATCH', {
      files: {
        [filename]: {
          content: JSON.stringify(contentArray, null, 2)
        }
      }
    });
    if (res.statusCode < 200 || res.statusCode >= 300) {
      throw new Error(`GitHub API returned status ${res.statusCode}: ${JSON.stringify(res.data || {})}`);
    }
    return (res.data && res.data.files) || {};
  }

  return {
    async listLeads() {
      try {
        const files = await fetchGistFiles();
        return { ok: true, value: parseJsonFile(files, 'leads.json') };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async createLead(lead) {
      try {
        const files = await fetchGistFiles();
        const leads = parseJsonFile(files, 'leads.json');
        leads.unshift(lead);
        await updateGistFile('leads.json', leads);
        return { ok: true, value: lead };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async updateLead(id, patch) {
      try {
        const files = await fetchGistFiles();
        const leads = parseJsonFile(files, 'leads.json');
        const index = leads.findIndex(l => l.id === id);
        if (index === -1) {
          return { ok: false, error: new Error(`Lead with id ${id} not found`) };
        }
        leads[index] = { ...leads[index], ...patch };
        await updateGistFile('leads.json', leads);
        return { ok: true, value: leads[index] };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async deleteLead(id) {
      try {
        const files = await fetchGistFiles();
        const leads = parseJsonFile(files, 'leads.json');
        const target = leads.find(l => l.id === id);
        if (!target) {
          return { ok: false, error: new Error(`Lead with id ${id} not found`) };
        }
        const filtered = leads.filter(l => l.id !== id);
        await updateGistFile('leads.json', filtered);
        return { ok: true, value: target };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async listDiagnostics() {
      try {
        const files = await fetchGistFiles();
        return { ok: true, value: parseJsonFile(files, 'briefings.json') };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async createDiagnostic(diagnostic) {
      try {
        const files = await fetchGistFiles();
        const diagnostics = parseJsonFile(files, 'briefings.json');
        diagnostics.unshift(diagnostic);
        await updateGistFile('briefings.json', diagnostics);
        return { ok: true, value: diagnostic };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async updateDiagnostic(id, patch) {
      try {
        const files = await fetchGistFiles();
        const diagnostics = parseJsonFile(files, 'briefings.json');
        const index = diagnostics.findIndex(d => d.id === id);
        if (index === -1) {
          return { ok: false, error: new Error(`Diagnostic with id ${id} not found`) };
        }
        diagnostics[index] = { ...diagnostics[index], ...patch };
        await updateGistFile('briefings.json', diagnostics);
        return { ok: true, value: diagnostics[index] };
      } catch (err) {
        return { ok: false, error: err };
      }
    },

    async deleteDiagnostic(id) {
      try {
        const files = await fetchGistFiles();
        const diagnostics = parseJsonFile(files, 'briefings.json');
        const target = diagnostics.find(d => d.id === id);
        if (!target) {
          return { ok: false, error: new Error(`Diagnostic with id ${id} not found`) };
        }
        const filtered = diagnostics.filter(d => d.id !== id);
        await updateGistFile('briefings.json', filtered);
        return { ok: true, value: target };
      } catch (err) {
        return { ok: false, error: err };
      }
    }
  };
}

module.exports = { createGistRepository };
