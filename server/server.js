const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const express = require('express');
const cors = require('cors');
const rateLimit = require('express-rate-limit');

const { handleContactForm, handleGetLeads, handleUpdateLead, handleDeleteLead } = require('./controllers/contact');

const app = express();
const PORT = process.env.PORT || 3000;
const ROOT_DIR = path.join(__dirname, '..');

// Middlewares essenciais
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Rate limiter para proteger o endpoint de envio contra spam/abuso
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

// Rotas da API
app.post('/api/contact', contactLimiter, handleContactForm);
app.get('/api/leads', handleGetLeads);
app.put('/api/leads/:id', handleUpdateLead);
app.delete('/api/leads/:id', handleDeleteLead);

app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    service: 'Dreven Company Backend API',
    timestamp: new Date().toISOString()
  });
});

// Servir arquivos estáticos do frontend (HTML, CSS, JS, Assets)
app.use(express.static(ROOT_DIR));

// Fallback para SPA / index.html
app.get('*', (req, res) => {
  res.sendFile(path.join(ROOT_DIR, 'index.html'));
});

// Inicialização do servidor
app.listen(PORT, '0.0.0.0', () => {
  console.log('====================================================');
  console.log('  DREVEN COMPANY — Servidor Backend Online');
  console.log(`  Local: http://localhost:${PORT}`);
  console.log(`  Rede Wi-Fi: http://192.168.15.11:${PORT}`);
  console.log(`  Ambiente: ${process.env.NODE_ENV || 'development'}`);
  console.log('====================================================');
});
