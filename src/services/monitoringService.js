const axios = require('axios');
const ping = require('ping');
const net = require('net');
const { CronJob } = require('cron');
const { Monitor, MonitorHistory } = require('../models/Monitor');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

const log = (level, msg, extra) => {
  const ts = new Date().toISOString();
  const line = `[${ts}] [${level}] [monitoringService] ${msg}`;
  if (extra !== undefined) {
    console[level === 'ERROR' ? 'error' : 'log'](line, extra);
  } else {
    console[level === 'ERROR' ? 'error' : 'log'](line);
  }
};

let io;
let monitorCache = {};

async function checkHttp(monitor) {
  const startTime = Date.now();
  let result = { isUp: false, responseTime: 0, error: null, statusCode: null };

  try {
    log('DEBUG', `HTTP check -> ${monitor.name} (${monitor.url})`);
    const response = await axios({
      method: 'get',
      url: monitor.url,
      timeout: monitor.timeout * 1000,
      validateStatus: () => true
    });

    result.responseTime = Date.now() - startTime;
    result.statusCode = response.status;

    if (monitor.expectedStatusCode) {
      result.isUp = response.status === monitor.expectedStatusCode;
    } else {
      result.isUp = response.status >= 200 && response.status < 400;
    }
    log('DEBUG', `HTTP result ${monitor.name}: status=${result.statusCode} isUp=${result.isUp} rt=${result.responseTime}ms`);
  } catch (error) {
    result.responseTime = Date.now() - startTime;
    result.error = error.message;
    log('WARN', `HTTP check failed for ${monitor.name}: ${error.message}`);
  }

  return result;
}

function parseTcpHost(rawUrl) {
  if (!rawUrl) return null;
  const input = String(rawUrl).trim();
  try {
    const u = new URL(input);
    return u.hostname;
  } catch (_) {}
  try {
    const u = new URL(`tcp://${input}`);
    return u.hostname;
  } catch (_) {}
  return input.replace(/^\/+|\/+$/g, '').split('/')[0].split(':')[0] || null;
}

async function checkTcp(monitor) {
  const startTime = Date.now();
  let result = { isUp: false, responseTime: 0, error: null };

  return new Promise((resolve) => {
    const host = parseTcpHost(monitor.url);
    const port = Number(monitor.port);

    if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
      result.error = `Invalid TCP target (host="${host}", port="${monitor.port}")`;
      log('WARN', `TCP config invalid for ${monitor.name}: ${result.error}`);
      resolve(result);
      return;
    }

    const socket = new net.Socket();
    socket.setTimeout(monitor.timeout * 1000);

    socket.on('connect', () => {
      result.responseTime = Date.now() - startTime;
      result.isUp = true;
      log('DEBUG', `TCP connected ${monitor.name} (${host}:${port}) in ${result.responseTime}ms`);
      socket.destroy();
      resolve(result);
    });

    socket.on('timeout', () => {
      result.responseTime = Date.now() - startTime;
      result.error = 'Connection timeout';
      log('WARN', `TCP timeout ${monitor.name} (${host}:${port})`);
      socket.destroy();
      resolve(result);
    });

    socket.on('error', (error) => {
      result.responseTime = Date.now() - startTime;
      result.error = error.message;
      log('WARN', `TCP error ${monitor.name} (${host}:${port}): ${error.message}`);
      socket.destroy();
      resolve(result);
    });

    try {
      socket.connect(port, host);
    } catch (error) {
      result.responseTime = Date.now() - startTime;
      result.error = error.message;
      log('ERROR', `TCP connect threw for ${monitor.name}: ${error.message}`);
      socket.destroy();
      resolve(result);
    }
  });
}

async function checkPing(monitor) {
  const startTime = Date.now();
  let result = { isUp: false, responseTime: 0, error: null };

  try {
    const urlParts = new URL(monitor.url);
    const host = urlParts.hostname;
    log('DEBUG', `Ping -> ${monitor.name} (${host})`);
    const pingResult = await ping.promise.probe(host, {
      timeout: monitor.timeout
    });

    result.responseTime = Date.now() - startTime;
    result.isUp = pingResult.alive;
    if (!pingResult.alive) {
      result.error = 'Host unreachable';
      log('WARN', `Ping unreachable ${monitor.name} (${host})`);
    }
  } catch (error) {
    result.responseTime = Date.now() - startTime;
    result.error = error.message;
    log('ERROR', `Ping error ${monitor.name}: ${error.message}`);
  }

  return result;
}

async function updateMonitorCache() {
  try {
    const monitors = await Monitor.findAll({
      include: [{
        model: MonitorHistory,
        as: 'history',
        limit: 20,
        order: [['createdAt', 'DESC']]
      }]
    });

    monitors.forEach(monitor => {
      monitorCache[monitor.id] = monitor;
    });

    log('DEBUG', `Monitor cache updated (${monitors.length} monitors)`);
    return monitors;
  } catch (error) {
    log('ERROR', 'Failed to update monitor cache', error);
    return [];
  }
}

async function checkMonitor(monitor) {
  let result;

  log('INFO', `Checking monitor id=${monitor.id} name="${monitor.name}" type=${monitor.type}`);

  switch (monitor.type) {
    case 'http':
    case 'https':
      result = await checkHttp(monitor);
      break;
    case 'tcp':
      result = await checkTcp(monitor);
      break;
    case 'ping':
      result = await checkPing(monitor);
      break;
    default:
      result = { isUp: false, error: 'Tipo de monitor não suportado' };
      log('WARN', `Unsupported monitor type: ${monitor.type}`);
  }

  try {
    const transaction = await sequelize.transaction();

    try {
      await MonitorHistory.create({
        monitorId: monitor.id,
        isUp: result.isUp,
        responseTime: result.responseTime,
        statusCode: result.statusCode,
        error: result.error
      }, { transaction });

      const historyCount = await MonitorHistory.count({
        where: { monitorId: monitor.id }
      }, { transaction });

      const upCount = await MonitorHistory.count({
        where: {
          monitorId: monitor.id,
          isUp: true
        }
      }, { transaction });

      const uptimePercentage = historyCount > 0 ?
        (upCount / historyCount * 100) :
        (result.isUp ? 100 : 0);

      const statusChanged = monitor.isUp !== null && monitor.isUp !== result.isUp;

      await monitor.update({
        lastChecked: new Date(),
        isUp: result.isUp,
        responseTime: result.responseTime,
        uptime: uptimePercentage
      }, { transaction });

      await transaction.commit();

      const updatedMonitor = await Monitor.findByPk(monitor.id, {
        include: [{
          model: MonitorHistory,
          as: 'history',
          limit: 100,
          order: [['createdAt', 'DESC']]
        }]
      });

      monitorCache[monitor.id] = updatedMonitor;

      if (io && io.engine.clientsCount > 0) {
        io.emit('monitor-update', {
          id: monitor.id,
          status: result.isUp,
          responseTime: result.responseTime,
          lastChecked: new Date(),
          statusCode: result.statusCode,
          error: result.error,
          statusChanged
        });
      }

      if (statusChanged) {
        log('INFO', `Status CHANGED for "${monitor.name}" -> ${result.isUp ? 'UP' : 'DOWN'}`);
        if (io && io.engine.clientsCount > 0) {
          io.emit('status-changed', {
            id: monitor.id,
            name: monitor.name,
            url: monitor.url,
            status: result.isUp,
            timestamp: new Date(),
            responseTime: result.responseTime,
            statusCode: result.statusCode,
            error: result.error
          });
        }
      }

      return { monitor: updatedMonitor, result };
    } catch (error) {
      await transaction.rollback();
      log('ERROR', `Transaction rolled back for monitor ${monitor.id}`, error);
      throw error;
    }
  } catch (error) {
    log('ERROR', `checkMonitor failed for id=${monitor.id}`, error);
    return { error };
  }
}

async function checkAllMonitors() {
  try {
    const monitors = await Monitor.findAll({ where: { active: true } });
    log('INFO', `checkAllMonitors: ${monitors.length} active monitor(s)`);

    for (const monitor of monitors) {
      await checkMonitor(monitor);
    }

    await updateMonitorCache();
  } catch (error) {
    log('ERROR', 'checkAllMonitors failed', error);
  }
}

let monitoringJob = null;

function startMonitoring() {
  try {
    if (monitoringJob) {
      log('INFO', 'Restarting monitoring cron job');
      monitoringJob.stop();
    }

    monitoringJob = new CronJob('* * * * *', async () => {
      try {
        await checkAllMonitors();
      } catch (error) {
        log('ERROR', 'Cron tick failed', error);
      }
    }, null, true);

    log('INFO', 'Monitoring cron started (every minute)');
    updateMonitorCache();
  } catch (error) {
    log('ERROR', 'Failed to start monitoring', error);
  }
}

function stopMonitoring() {
  if (monitoringJob) {
    monitoringJob.stop();
    monitoringJob = null;
    log('INFO', 'Monitoring cron stopped');
  }
}

function getMonitorFromCache(id) {
  return monitorCache[id];
}

function getAllMonitorsFromCache() {
  return Object.values(monitorCache);
}

function init(socketIo) {
  io = socketIo;

  io.on('connection', (socket) => {
    log('DEBUG', `monitoringService: client connected ${socket.id}`);
    socket.emit('monitor-cache', getAllMonitorsFromCache());

    socket.on('request-monitor-data', (id) => {
      const monitor = getMonitorFromCache(id);
      if (monitor) {
        socket.emit('monitor-data', monitor);
      } else {
        log('WARN', `request-monitor-data: id=${id} not in cache`);
      }
    });

    socket.on('disconnect', (reason) => {
      log('DEBUG', `monitoringService: client disconnected ${socket.id} (${reason})`);
    });
  });

  startMonitoring();
}

module.exports = {
  init,
  checkMonitor,
  checkAllMonitors,
  startMonitoring,
  stopMonitoring,
  getMonitorFromCache,
  getAllMonitorsFromCache,
  updateMonitorCache
};
