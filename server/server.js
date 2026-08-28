const path = require('node:path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { handleContactForm, handleGetLeads, handleUpdateLead, handleDeleteLead } = require('./controllers/contact');
const { handleBriefingSubmit, handleGetBriefings, handleDeleteBriefing } = require('./controllers/briefing');
const { expressAdminAuth } = require('./middleware/admin-auth');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

// Headers globais de segurança
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  next();
});

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter para rotas públicas
const contactLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 15, // máximo de 15 envios por IP
  message: {
    success: false,
    error: 'Muitas solicitações recebidas deste endereço. Por favor, aguarde alguns minutos ou fale pelo WhatsApp.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Rotas de Autenticação Administrativa
app.get('/api/auth/login', require('../api/auth/login'));
app.get('/api/auth/callback', require('../api/auth/callback'));
app.get('/api/auth/session', require('../api/auth/session'));
app.get('/api/auth/csrf', require('../api/auth/csrf'));
app.post('/api/auth/logout', require('../api/auth/logout'));

// Rotas da API Pública
app.post('/api/contact', contactLimiter, handleContactForm);
app.post('/api/diagnostico', contactLimiter, handleBriefingSubmit);

// Endpoints legados (Depreciados & Bloqueados para acesso anônimo)
app.get('/api/briefings', (req, res) => res.status(401).json({ success: false, error: 'Unauthorized' }));
app.get('/api/diagnostico', (req, res) => res.status(401).json({ success: false, error: 'Unauthorized' }));
app.get('/api/leads', (req, res) => res.status(401).json({ success: false, error: 'Unauthorized' }));

// Rotas Administrativas Protegidas (Exigem Sessão + CSRF para mutações)
app.get('/api/admin/leads', expressAdminAuth(), handleGetLeads);
app.put('/api/admin/leads/:id?', expressAdminAuth({ requireCsrf: true }), handleUpdateLead);
app.delete('/api/admin/leads/:id?', expressAdminAuth({ requireCsrf: true }), handleDeleteLead);
app.get('/api/admin/diagnosticos', expressAdminAuth(), handleGetBriefings);
app.delete('/api/admin/diagnosticos/:id?', expressAdminAuth({ requireCsrf: true }), handleDeleteBriefing);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Dreven Company Backend API',
    timestamp: new Date().toISOString()
  });
});

// Servir páginas e arquivos estáticos públicos explicitamente
app.get('/diagnostico', (req, res) => res.sendFile(path.join(ROOT_DIR, 'diagnostico.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(ROOT_DIR, 'admin.html')));

const PUBLIC_FILES = [
  'index.html', 'styles.css', 'script.js',
  'diagnostico.html', 'diagnostico.css', 'diagnostico.js',
  'admin.html', 'admin.css', 'admin.js',
  'favicon.ico', 'robots.txt'
];

PUBLIC_FILES.forEach(filename => {
  app.get(`/${filename}`, (req, res) => res.sendFile(path.join(ROOT_DIR, filename)));
});

app.use('/assets', express.static(path.join(ROOT_DIR, 'assets')));

// Fallback SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('  DREVEN COMPANY — Servidor Backend Online');
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================================');
});
