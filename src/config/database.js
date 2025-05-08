const { Sequelize } = require('sequelize');require('dotenv').config();

const sequelize = new Sequelize(  process.env.DB_NAME || 'uptime_monitor',  process.env.DB_USER || 'uptime',  process.env.DB_PASSWORD || 'uptime_password',  {    host: process.env.DB_HOST || 'localhost',    port: process.env.DB_PORT || 3306,    dialect: 'mysql',    logging: process.env.NODE_ENV === 'development',    pool: {      max: 5,      min: 0,      acquire: 30000,      idle: 10000    }  });

module.exports = sequelize; 


