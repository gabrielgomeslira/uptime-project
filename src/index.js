require('dotenv').config();const express = require('express');const http = require('http');const path = require('path');const session = require('express-session');const socketIo = require('socket.io');const sequelize = require('./config/database');const monitorRoutes = require('./routes/monitors');const authRoutes = require('./routes/auth');const monitoringService = require('./services/monitoringService');

const app = express();const server = http.createServer(app);const io = socketIo(server);

const User = require('./models/User');const { Monitor, MonitorHistory } = require('./models/Monitor');

async function waitForDatabase(retries = 10, delay = 5000) {  let currentRetry = 0;    while (currentRetry < retries) {    try {      await sequelize.authenticate();      return true;    } catch (error) {      currentRetry++;            if (currentRetry < retries) {        await new Promise(resolve => setTimeout(resolve, delay));      }    }  }    return false;}

async function initDatabase() {  try {    const isDatabaseAvailable = await waitForDatabase();        if (!isDatabaseAvailable) {      throw new Error('NÃ£o foi possÃ­vel conectar ao banco de dados.');    }

    User.hasMany(Monitor, { foreignKey: 'userId' });    Monitor.belongsTo(User, { foreignKey: 'userId' });        await sequelize.sync();        monitoringService.init(io);  } catch (error) {  }}

app.use(express.json());app.use(express.urlencoded({ extended: true }));app.use(express.static(path.join(__dirname, '../public')));app.use(session({  secret: process.env.SESSION_SECRET || 'uptime-monitor-secret',  resave: false,  saveUninitialized: false}));

app.use('/api/monitors', monitorRoutes);app.use('/api/auth', authRoutes);

app.get('*', (req, res) => {  res.sendFile(path.join(__dirname, '../public/index.html'));});

io.on('connection', (socket) => {  socket.on('disconnect', () => {  });});

const PORT = process.env.PORT || 3000;server.listen(PORT, () => {  initDatabase();}); 


