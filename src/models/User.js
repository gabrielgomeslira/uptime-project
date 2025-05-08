const { DataTypes } = require('sequelize');const bcrypt = require('bcrypt');const sequelize = require('../config/database');

const User = sequelize.define('User', {  name: {    type: DataTypes.STRING,    allowNull: false  },  email: {    type: DataTypes.STRING,    allowNull: false,    unique: true,    validate: {      isEmail: true    }  },  password: {    type: DataTypes.STRING,    allowNull: false  },  role: {    type: DataTypes.ENUM('admin', 'user'),    defaultValue: 'user'  },  notificationEmail: {    type: DataTypes.STRING,    allowNull: true  },  timezone: {    type: DataTypes.STRING,    defaultValue: 'UTC'  }}, {  timestamps: true});

User.beforeCreate(async (user) => {  user.password = await bcrypt.hash(user.password, 10);});

User.beforeUpdate(async (user) => {  if (user.changed('password')) {    user.password = await bcrypt.hash(user.password, 10);  }});

User.prototype.comparePassword = async function(candidatePassword) {  return bcrypt.compare(candidatePassword, this.password);};

module.exports = User; 


