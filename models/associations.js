import User from './User.js';
import PatientRecord from './PatientRecord.js';
import Prescription from './Prescription.js';
import Appointment from './Appointment.js';
import Log from './Log.js'; 

// User - PatientRecord relations
// A PatientRecord belongs to a patient user and a doctor user
PatientRecord.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
PatientRecord.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });

// User - Appointment relations
// An Appointment belongs to a patient user and a doctor user
Appointment.belongsTo(User, { as: 'patient', foreignKey: 'patientId' });
Appointment.belongsTo(User, { as: 'doctor', foreignKey: 'doctorId' });

// PatientRecord - Prescription relations
// A PatientRecord has many Prescriptions
PatientRecord.hasMany(Prescription, { foreignKey: 'recordId' });
Prescription.belongsTo(PatientRecord, { foreignKey: 'recordId' });

// Log - User relations
// A Log belongs to a User
Log.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Log, { foreignKey: 'userId', as: 'logs' });

export {
  User,
  PatientRecord,
  Prescription,
  Appointment,
  Log 
};
