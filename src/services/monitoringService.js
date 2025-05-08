const axios = require('axios');
const ping = require('ping');
const net = require('net');
const { CronJob } = require('cron');
const { Monitor, MonitorHistory } = require('../models/Monitor');
const { Op } = require('sequelize');
const sequelize = require('../config/database');

let io;
let monitorCache = {};

async function checkHttp(monitor) {
  const startTime = Date.now();
  let result = { isUp: false, responseTime: 0, error: null, statusCode: null };

  try {
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
  } catch (error) {
    result.responseTime = Date.now() - startTime;
    result.error = error.message;
  }

  return result;
}

async function checkTcp(monitor) {
  const startTime = Date.now();
  let result = { isUp: false, responseTime: 0, error: null };

  return new Promise((resolve) => {
    const socket = new net.Socket();
    socket.setTimeout(monitor.timeout * 1000);

    socket.on('connect', () => {
      result.responseTime = Date.now() - startTime;
      result.isUp = true;
      socket.destroy();
      resolve(result);
    });

    socket.on('timeout', () => {
      result.responseTime = Date.now() - startTime;
      result.error = 'Connection timeout';
      socket.destroy();
      resolve(result);
    });

    socket.on('error', (error) => {
      result.responseTime = Date.now() - startTime;
      result.error = error.message;
      socket.destroy();
      resolve(result);
    });

    const urlParts = new URL(monitor.url);
    socket.connect(monitor.port, urlParts.hostname);
  });
}

async function checkPing(monitor) {
  const startTime = Date.now();
  let result = { isUp: false, responseTime: 0, error: null };

  try {
    const urlParts = new URL(monitor.url);
    const host = urlParts.hostname;
    const pingResult = await ping.promise.probe(host, {
      timeout: monitor.timeout
    });

    result.responseTime = Date.now() - startTime;
    result.isUp = pingResult.alive;
    if (!pingResult.alive) {
      result.error = 'Host unreachable';
    }
  } catch (error) {
    result.responseTime = Date.now() - startTime;
    result.error = error.message;
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
    
    return monitors;
  } catch (error) {
    return [];
  }
}

async function checkMonitor(monitor) {
  let result;

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
      result = { isUp: false, error: 'Tipo de monitor nÃ£o suportado' };
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

      
      if (io) {
        
        if (io.engine.clientsCount > 0) {
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
      }

      if (statusChanged) {
        
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
      throw error;
    }
  } catch (error) {
    return { error };
  }
}

async function checkAllMonitors() {
  try {
    const monitors = await Monitor.findAll({ 
      where: { active: true }
    });
    
    for (const monitor of monitors) {
      await checkMonitor(monitor);
    }
    
    
    await updateMonitorCache();
  } catch (error) {
  }
}

let monitoringJob = null;

function startMonitoring() {
  try {
    if (monitoringJob) {
      monitoringJob.stop();
    }

    
    monitoringJob = new CronJob('* * * * *', async () => {
      try {
        await checkAllMonitors();
      } catch (error) {
      }
    }, null, true);
    
    updateMonitorCache();
  } catch (error) {
  }
}

function stopMonitoring() {
  if (monitoringJob) {
    monitoringJob.stop();
    monitoringJob = null;
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
    socket.emit('monitor-cache', getAllMonitorsFromCache());
    
    socket.on('request-monitor-data', (id) => {
      const monitor = getMonitorFromCache(id);
      if (monitor) {
        socket.emit('monitor-data', monitor);
      }
    });
    
    socket.on('disconnect', () => {
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


