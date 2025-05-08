const express = require('express');
const User = require('../models/User');
const router = express.Router();

const isAuthenticated = (req, res, next) => {
  if (req.session && req.session.userId) {
    return next();
  }
  return res.status(401).json({ error: 'NÃ£o autorizado' });
};

router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    
    const existingUser = await User.findOne({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: 'Email jÃ¡ estÃ¡ em uso' });
    }
    
    
    const user = await User.create({
      name,
      email,
      password
    });
    
    
    req.session.userId = user.id;
    
    res.status(201).json({
      message: 'UsuÃ¡rio registrado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'Credenciais invÃ¡lidas' });
    }
    
    
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais invÃ¡lidas' });
    }
    
    
    req.session.userId = user.id;
    
    res.json({
      message: 'Login realizado com sucesso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post('/logout', (req, res) => {
  req.session.destroy(err => {
    if (err) {
      return res.status(500).json({ error: 'Erro ao fazer logout' });
    }
    res.json({ message: 'Logout realizado com sucesso' });
  });
});

router.get('/me', isAuthenticated, async (req, res) => {
  try {
    const user = await User.findByPk(req.session.userId, {
      attributes: { exclude: ['password'] }
    });
    
    if (!user) {
      return res.status(404).json({ error: 'UsuÃ¡rio nÃ£o encontrado' });
    }
    
    res.json(user);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router; 


