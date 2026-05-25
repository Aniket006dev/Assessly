require('dotenv').config();
const express   = require('express');
const http      = require('http');
const WebSocket = require('ws');
const cors      = require('cors');
const helmet    = require('helmet');
const morgan    = require('morgan');
const rateLimit = require('express-rate-limit');
const connectDB      = require('./config/db');
const errorHandler   = require('./middleware/errorHandler');
const { startWorker } = require('./jobs/generationWorker');

const app    = express();
const server = http.createServer(app);

// ── WebSocket ─────────────────────────────────────────────────────────────────
const wss = new WebSocket.Server({ server, path: '/ws' });

wss.on('connection', (ws) => {
  ws.send(JSON.stringify({ type: 'connected', message: 'Assessly WebSocket ready' }));
  ws.on('message', (msg) => {
    try {
      const data = JSON.parse(msg);
      if (data.type === 'subscribe' && data.jobId) {
        ws.jobId = data.jobId;
        ws.send(JSON.stringify({ type: 'subscribed', jobId: data.jobId }));
      }
    } catch (_) {}
  });
  ws.on('error', () => {});
});

// ── Middleware ────────────────────────────────────────────────────────────────
app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({
  origin: [
    process.env.CLIENT_URL || 'http://localhost:5173',
    'http://127.0.0.1:5173',
    'http://localhost:5173',
  ],
  credentials: true,
}));
app.use(morgan('dev'));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));
app.use('/api/',      rateLimit({ windowMs: 15 * 60 * 1000, max: 300 }));
app.use('/api/auth/', rateLimit({ windowMs: 15 * 60 * 1000, max: 30  }));

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/auth',        require('./routes/auth'));
app.use('/api/assignments', require('./routes/assignments'));
app.use('/api/groups',      require('./routes/groups'));
app.use('/api/dashboard',   require('./routes/dashboard'));

app.get('/api/health', (_, res) =>
  res.json({ status: 'ok', timestamp: new Date(), message: 'Assessly server is running' })
);

// 404 handler
app.use((req, res) => {
  res.status(404).json({ success: false, message: `Route ${req.method} ${req.url} not found` });
});

// ── Error handler ─────────────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start ─────────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.PORT || '5000', 10);
const HOST = '127.0.0.1';

connectDB()
  .then(() => {
    server.listen(PORT, HOST, () => {
      console.log('');
      console.log('╔════════════════════════════════════════╗');
      console.log(`║  Assessly Server                       ║`);
      console.log(`║  http://${HOST}:${PORT}                  ║`);
      console.log('╚════════════════════════════════════════╝');
      console.log('');

      // Start BullMQ worker (gracefully skip if Redis unavailable)
      try {
        startWorker(wss);
      } catch (err) {
        console.warn('⚠️  BullMQ worker skipped (Redis may be offline):', err.message);
        console.warn('   Generation will still work via direct API calls.');
      }
    });
  })
  .catch((err) => {
    console.error('❌ Failed to connect to MongoDB:', err.message);
    console.error('   Make sure MongoDB is running and MONGODB_URI is correct in .env');
    process.exit(1);
  });

module.exports = { app, wss };
