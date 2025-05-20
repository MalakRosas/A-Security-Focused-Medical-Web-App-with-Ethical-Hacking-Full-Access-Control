import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';

const Prescription = sequelize.define('Prescription', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  recordId: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'PatientRecords',
      key: 'id'
    }
  },
  medication: {
    type: DataTypes.STRING,
    allowNull: false
  },
  dosage: {
    type: DataTypes.STRING,
    allowNull: true
  },
  instructions: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  timestamps: false,
  tableName: 'Prescriptions'
});

export default Prescription;
