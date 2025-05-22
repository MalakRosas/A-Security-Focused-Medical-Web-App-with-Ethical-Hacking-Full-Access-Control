import User from './User.js';
import PatientRecord from './PatientRecord.js';
import Prescription from './Prescription.js';
import Appointment from './Appointment.js';
import Log from './Log.js'; 

// User - PatientRecord relations
// A PatientRecord belongs to a patient user and a doctor user
PatientRecord.belongsTo(User, { as: 'patient', foreignKey: 'patientId', onDelete: 'CASCADE' });
PatientRecord.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId', onDelete: 'CASCADE' });

// User - Appointment relations
// An Appointment belongs to a patient user and a doctor user
Appointment.belongsTo(User, { as: 'patient', foreignKey: 'patientId', onDelete: 'CASCADE' });
Appointment.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId', onDelete: 'CASCADE' });

// PatientRecord - Prescription relations
// A PatientRecord has many Prescriptions
PatientRecord.hasMany(Prescription, { foreignKey: 'recordId', onDelete: 'CASCADE' });
Prescription.belongsTo(PatientRecord, { foreignKey: 'recordId', onDelete: 'CASCADE' });

// Log - User relations
// A Log belongs to a User
Log.belongsTo(User, { foreignKey: 'userId', as: 'user', onDelete: 'CASCADE' });
User.hasMany(Log, { foreignKey: 'userId', as: 'logs', onDelete: 'CASCADE' });

export {
  User,
  PatientRecord,
  Prescription,
  Appointment,
  Log 
};
