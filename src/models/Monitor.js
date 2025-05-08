const { DataTypes } = require('sequelize');const sequelize = require('../config/database');

const Monitor = sequelize.define('Monitor', {  name: {    type: DataTypes.STRING,    allowNull: false  },  url: {    type: DataTypes.STRING,    allowNull: false  },  type: {    type: DataTypes.ENUM('http', 'https', 'tcp', 'ping'),    allowNull: false  },  port: {    type: DataTypes.INTEGER,    validate: {      min: 1,      max: 65535    }  },  interval: {    type: DataTypes.INTEGER,    defaultValue: 5,    validate: {      min: 1,      max: 60    }  },  timeout: {    type: DataTypes.INTEGER,    defaultValue: 5,    validate: {      min: 1,      max: 30    }  },  expectedStatusCode: {    type: DataTypes.INTEGER,    defaultValue: 200  },  active: {    type: DataTypes.BOOLEAN,    defaultValue: true  },  lastChecked: {    type: DataTypes.DATE  },  isUp: {    type: DataTypes.BOOLEAN,    defaultValue: null  },  uptime: {    type: DataTypes.FLOAT,    defaultValue: 0  },  responseTime: {    type: DataTypes.INTEGER,    defaultValue: 0  },  userId: {    type: DataTypes.INTEGER,    allowNull: false,    references: {      model: 'Users',      key: 'id'    }  }}, {  timestamps: true});

const MonitorHistory = sequelize.define('MonitorHistory', {  monitorId: {    type: DataTypes.INTEGER,    allowNull: false,    references: {      model: 'Monitors',      key: 'id'    }  },  isUp: {    type: DataTypes.BOOLEAN  },  responseTime: {    type: DataTypes.INTEGER  },  statusCode: {    type: DataTypes.INTEGER  },  error: {    type: DataTypes.STRING  }}, {  timestamps: true});

Monitor.hasMany(MonitorHistory, {   foreignKey: 'monitorId',  as: 'history'});

MonitorHistory.belongsTo(Monitor, {  foreignKey: 'monitorId'});

module.exports = { Monitor, MonitorHistory }; 


