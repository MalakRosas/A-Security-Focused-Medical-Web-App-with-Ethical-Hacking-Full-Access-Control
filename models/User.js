import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js'; 

const User = sequelize.define('User', {
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  role: {
    type: DataTypes.ENUM('Admin', 'Doctor', 'Patient'),
    allowNull: false
  },
  isActive: {
    type: DataTypes.BOOLEAN,
    defaultValue: true
  },
  twoFAEnabled: {
    type: DataTypes.BOOLEAN,
    defaultValue: false
  },
  twoFASecret: {
    type: DataTypes.STRING
  },
  contactInfo: {
    type: DataTypes.JSON // storing nested phone + address
  }
}, {
  timestamps: true,
  tableName: 'Users' 
});

export default User;
