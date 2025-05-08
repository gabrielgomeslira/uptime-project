const express = require('express');
const { Monitor, MonitorHistory } = require('../models/Monitor');
const monitoringService = require('../services/monitoringService');
const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'NÃ£o autorizado' });
};

router.get('/', isAuthenticated, async (req, res) => {
  try {
    const monitors = await Monitor.findAll({
      where: { userId: req.session.userId },
      order: [['createdAt', 'DESC']],
      include: [{
        model: MonitorHistory,
        as: 'history',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }]
    });
    res.json(monitors);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/:id', isAuthenticated, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      where: {
        id: req.params.id,
        userId: req.session.userId
      },
      include: [{
        model: MonitorHistory,
        as: 'history',
        limit: 50,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor nÃ£o encontrado' });
    }
    
    res.json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/', isAuthenticated, async (req, res) => {
  try {
    const {
      name,
      url,
      type,
      port,
      interval,
      timeout,
      expectedStatusCode,
      active = true
    } = req.body;
    
    const monitor = await Monitor.create({
      name,
      url,
      type,
      port,
      interval,
      timeout,
      expectedStatusCode,
      active,
      userId: req.session.userId
    });
    
    
    monitoringService.checkMonitor(monitor);
    
    res.status(201).json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/:id', isAuthenticated, async (req, res) => {
  try {
    const {
      name,
      url,
      type,
      port,
      interval,
      timeout,
      expectedStatusCode,
      active
    } = req.body;
    
    const [updated] = await Monitor.update(
      {
        name,
        url,
        type,
        port,
        interval,
        timeout,
        expectedStatusCode,
        active
      },
      {
        where: { 
          id: req.params.id,
          userId: req.session.userId
        }
      }
    );
    
    if (updated === 0) {
      return res.status(404).json({ error: 'Monitor nÃ£o encontrado' });
    }
    
    const updatedMonitor = await Monitor.findByPk(req.params.id, {
      include: [{
        model: MonitorHistory,
        as: 'history',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    res.json(updatedMonitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete('/:id', isAuthenticated, async (req, res) => {
  try {
    const deleted = await Monitor.destroy({
      where: {
        id: req.params.id,
        userId: req.session.userId
      }
    });
    
    if (deleted === 0) {
      return res.status(404).json({ error: 'Monitor nÃ£o encontrado' });
    }
    
    res.json({ message: 'Monitor excluÃ­do com sucesso' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/:id/check', isAuthenticated, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      where: {
        id: req.params.id,
        userId: req.session.userId
      },
      include: [{
        model: MonitorHistory,
        as: 'history',
        limit: 10,
        order: [['createdAt', 'DESC']]
      }]
    });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor nÃ£o encontrado' });
    }
    
    const result = await monitoringService.checkMonitor(monitor);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/check-all', isAuthenticated, async (req, res) => {
  try {
    const monitors = await Monitor.findAll({
      where: {
        userId: req.session.userId,
        active: true
      }
    });
    
    if (monitors.length === 0) {
      return res.json({ message: 'Nenhum monitor ativo encontrado' });
    }
    
    const results = [];
    
    for (const monitor of monitors) {
      const result = await monitoringService.checkMonitor(monitor);
      results.push(result);
    }
    
    res.json({ 
      message: `${monitors.length} monitores verificados com sucesso`,
      count: monitors.length
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch('/:id/toggle', isAuthenticated, async (req, res) => {
  try {
    const monitor = await Monitor.findOne({
      where: {
        id: req.params.id,
        userId: req.session.userId
      }
    });
    
    if (!monitor) {
      return res.status(404).json({ error: 'Monitor nÃ£o encontrado' });
    }
    
    monitor.active = !monitor.active;
    await monitor.save();
    
    res.json(monitor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 


