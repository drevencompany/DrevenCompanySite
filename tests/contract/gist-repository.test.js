const assert = require('node:assert/strict');
const test = require('node:test');
const { createGistRepository } = require('../../server/adapters/gist-repository');

test('createGistRepository fails closed when token or gistId is missing', async () => {
  const repo = createGistRepository({ token: '', gistId: '' });
  const result = await repo.listLeads();
  assert.equal(result.ok, false);
  assert.match(result.error.message, /GITHUB_TOKEN and GITHUB_GIST_ID are required/);
});

test('createGistRepository handles successful read and write operations', async () => {
  let gistsState = {
    'leads.json': { content: JSON.stringify([{ id: 'lead_1', name: 'Lead Antigo' }]) },
    'briefings.json': { content: JSON.stringify([{ id: 'diag_1', empresa: 'Empresa Antiga' }]) }
  };

  const fakeRequest = async (path, method, body) => {
    if (method === 'GET') {
      return {
        statusCode: 200,
        data: { files: gistsState }
      };
    }
    if (method === 'PATCH') {
      for (const [filename, fileObj] of Object.entries(body.files || {})) {
        gistsState[filename] = { content: fileObj.content };
      }
      return {
        statusCode: 200,
        data: { files: gistsState }
      };
    }
    return { statusCode: 400, data: {} };
  };

  const repo = createGistRepository({
    token: 'test_token',
    gistId: 'test_gist_id',
    request: fakeRequest
  });

  // listLeads
  const leadsResult = await repo.listLeads();
  assert.equal(leadsResult.ok, true);
  assert.equal(leadsResult.value.length, 1);
  assert.equal(leadsResult.value[0].name, 'Lead Antigo');

  // createLead
  const createLeadResult = await repo.createLead({ id: 'lead_2', name: 'Lead Novo' });
  assert.equal(createLeadResult.ok, true);
  assert.equal(createLeadResult.value.id, 'lead_2');

  const afterCreateLeads = await repo.listLeads();
  assert.equal(afterCreateLeads.value.length, 2);
  assert.equal(afterCreateLeads.value[0].id, 'lead_2');

  // updateLead
  const updateResult = await repo.updateLead('lead_2', { status: 'contatado' });
  assert.equal(updateResult.ok, true);
  assert.equal(updateResult.value.status, 'contatado');

  // deleteLead
  const deleteResult = await repo.deleteLead('lead_1');
  assert.equal(deleteResult.ok, true);
  assert.equal(deleteResult.value.id, 'lead_1');

  const afterDeleteLeads = await repo.listLeads();
  assert.equal(afterDeleteLeads.value.length, 1);
  assert.equal(afterDeleteLeads.value[0].id, 'lead_2');

  // listDiagnostics & createDiagnostic
  const diagsResult = await repo.listDiagnostics();
  assert.equal(diagsResult.ok, true);
  assert.equal(diagsResult.value.length, 1);

  const createDiagResult = await repo.createDiagnostic({ id: 'diag_2', empresa: 'Empresa Nova' });
  assert.equal(createDiagResult.ok, true);
  assert.equal(createDiagResult.value.id, 'diag_2');

  const afterCreateDiags = await repo.listDiagnostics();
  assert.equal(afterCreateDiags.value.length, 2);
  assert.equal(afterCreateDiags.value[0].id, 'diag_2');
});

test('createGistRepository fails closed on non-200 GitHub response', async () => {
  const fakeErrorRequest = async () => ({
    statusCode: 401,
    data: { message: 'Bad credentials' }
  });

  const repo = createGistRepository({
    token: 'invalid_token',
    gistId: 'test_gist_id',
    request: fakeErrorRequest
  });

  const listResult = await repo.listLeads();
  assert.equal(listResult.ok, false);
  assert.match(listResult.error.message, /GitHub API returned status 401/);

  const writeResult = await repo.createLead({ id: 'lead_1', name: 'Test' });
  assert.equal(writeResult.ok, false);
  assert.match(writeResult.error.message, /GitHub API returned status 401/);
});

test('createGistRepository handles malformed JSON in Gist file safely', async () => {
  const fakeMalformedRequest = async () => ({
    statusCode: 200,
    data: {
      files: {
        'leads.json': { content: 'invalid json {' }
      }
    }
  });

  const repo = createGistRepository({
    token: 'test_token',
    gistId: 'test_gist_id',
    request: fakeMalformedRequest
  });

  const listResult = await repo.listLeads();
  assert.equal(listResult.ok, true);
  assert.deepEqual(listResult.value, []);
});
