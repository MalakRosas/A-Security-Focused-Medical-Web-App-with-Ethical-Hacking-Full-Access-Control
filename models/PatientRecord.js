import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { encrypt, decrypt } from '../utils/encryption.js';

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
    type: DataTypes.TEXT,
    allowNull: true
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  status: {
    type: DataTypes.STRING,
    allowNull: false,
    defaultValue: 'active'
  },
  createdAt: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  }
}, {
  timestamps: false,
  tableName: 'PatientRecords',
  hooks: {
    beforeCreate(record) {
      if (record.diagnoses) {
        record.diagnoses = encrypt(record.diagnoses);
      }
      if (record.notes) {
        record.notes = encrypt(record.notes);
      }
    },
    beforeUpdate(record) {
      if (record.diagnoses) {
        record.diagnoses = encrypt(record.diagnoses);
      }
      if (record.notes) {
        record.notes = encrypt(record.notes);
      }
    },
    afterFind(result) {
      const decryptField = (entry) => {
        if (entry?.diagnoses) {
          entry.diagnoses = decrypt(entry.diagnoses);
        }
        if (entry?.notes) {
          entry.notes = decrypt(entry.notes);
        }
      };

      if (Array.isArray(result)) {
        result.forEach(decryptField);
      } else {
        decryptField(result);
      }
    }
  }
});

export default PatientRecord;
