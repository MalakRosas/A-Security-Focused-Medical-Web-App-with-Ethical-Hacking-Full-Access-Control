import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const PatientRecord = sequelize.define('PatientRecord', {
  id: { 
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  patientId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users', 
      key: 'id'
    }
  },
  doctorId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Users',
      key: 'id'
    }
  },
  diagnoses: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  notes: {
    type: DataTypes.ARRAY(DataTypes.STRING),
    allowNull: true
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'PatientRecords'
});

export default PatientRecord;
