require('dotenv').config();
const express = require('express');
const http = require('http');
const path = require('path');
const session = require('express-session');
const socketIo = require('socket.io');
const sequelize = require('./config/database');
const monitorRoutes = require('./routes/monitors');
const authRoutes = require('./routes/auth');
const monitoringService = require('./services/monitoringService');

const log = (level, msg, extra) => {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] ${msg}`;
  if (extra !== undefined) {
    console[level === 'ERROR' ? 'error' : 'log'](line, extra);
  } else {
    console[level === 'ERROR' ? 'error' : 'log'](line);
  }
};

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

const User = require('./models/User');
const { Monitor, MonitorHistory } = require('./models/Monitor');

async function waitForDatabase(retries = 10, delay = 5000) {
  let currentRetry = 0;
  while (currentRetry < retries) {
    try {
      await sequelize.authenticate();
      log('INFO', `Database connection established (attempt ${currentRetry + 1})`);
      return true;
    } catch (error) {
      currentRetry++;
      log('WARN', `DB connection attempt ${currentRetry}/${retries} failed: ${error.message}`);
      if (currentRetry < retries) {
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  return false;
}

async function initDatabase() {
  try {
    log('INFO', 'Initializing database...');
    const isDatabaseAvailable = await waitForDatabase();
    if (!isDatabaseAvailable) {
      throw new Error('Não foi possível conectar ao banco de dados.');
    }

    User.hasMany(Monitor, { foreignKey: 'userId' });
    Monitor.belongsTo(User, { foreignKey: 'userId' });

    await sequelize.sync();
    log('INFO', 'Database synced successfully');

    monitoringService.init(io);
    log('INFO', 'Monitoring service initialized');
  } catch (error) {
    log('ERROR', 'Failed to initialize database/monitoring', error);
  }
}

app.use((req, res, next) => {
  log('INFO', `${req.method} ${req.originalUrl}`);
  next();
});

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.use(session({
  secret: process.env.SESSION_SECRET || 'uptime-monitor-secret',
  resave: false,
  saveUninitialized: false
}));

app.use('/api/monitors', monitorRoutes);
app.use('/api/auth', authRoutes);

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

app.use((err, req, res, next) => {
  log('ERROR', `Unhandled error on ${req.method} ${req.originalUrl}`, err);
  res.status(500).json({ error: 'Internal server error' });
});

io.on('connection', (socket) => {
  log('INFO', `Socket connected: ${socket.id}`);
  socket.on('disconnect', (reason) => {
    log('INFO', `Socket disconnected: ${socket.id} (${reason})`);
  });
});

process.on('unhandledRejection', (reason) => {
  log('ERROR', 'Unhandled promise rejection', reason);
});
process.on('uncaughtException', (err) => {
  log('ERROR', 'Uncaught exception', err);
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  log('INFO', `Server listening on port ${PORT}`);
  initDatabase();
});
