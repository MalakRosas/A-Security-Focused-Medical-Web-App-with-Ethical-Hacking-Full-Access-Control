import express from 'express';
import { Appointment, User, PatientRecord, Prescription } from '../models/associations.js';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import bcrypt from 'bcrypt';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('Patient'));

router.post('/appointments', async (req, res) => {
  try {
    const patientId = req.user.userId;
    const patientUsername = req.user.username;
    const { doctorUsername, dateTime, reason } = req.body;

    const doctor = await User.findOne({ where: { username: doctorUsername, role: 'Doctor' } });
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const newAppointment = await Appointment.create({
      patientId,
      patientUsername,
      doctorId: doctor.id,
      doctorUsername,
      dateTime,
      reason
    });

    res.status(201).json({
      message: 'Appointment booked successfully',
      appointment: newAppointment
    });
  } catch (err) {
    console.error('Error booking appointment:', err);
    res.status(500).json({ message: 'Server error booking appointment' });
  }
});

router.get('/appointments', async (req, res) => {
  try {
    const patientId =req.user.userId;
 
    const appointments = await Appointment.findAll({
      where: { patientId },
      order: [['dateTime', 'ASC']] // Optional: sort by upcoming first
    });
 
    if (appointments.length === 0) {
      return res.status(404).json({ message: 'No appointments found for this patient' });
    }
 
    res.status(200).json({
      message: 'Appointments retrieved successfully',
      appointments
    });
  } catch (err) {
    console.error('Error retrieving appointments:', err);
    res.status(500).json({ message: 'Server error retrieving appointments' });
  }
});
 
router.get('/profile', async (req, res) => {
  try {
    const patientId = req.user.userId;

    const user = await User.findByPk(patientId, {
      attributes: { exclude: ['password', 'twoFASecret'] }
    });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const records = await PatientRecord.findAll({
      where: { patientId },
      attributes: ['id']
    });

    const recordIds = records.map(record => record.id);

    const prescriptions = await Prescription.findAll({
      where: { recordId: recordIds }
    });

    res.json({
      profile: user,
      prescriptions
    });
  } catch (err) {
    console.error('Error fetching profile and prescriptions:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

// View prescriptions (with doctor info)
router.get('/prescriptions', async (req, res) => {
  try {
    const patientId = req.user.userId;

    const records = await PatientRecord.findAll({
      where: { patientId },
      attributes: ['id', 'doctorId']
    });

    const recordIds = records.map(r => r.id);
    const doctorMap = new Map(records.map(r => [r.id, r.doctorId]));

    const prescriptions = await Prescription.findAll({
      where: { recordId: recordIds }
    });

    const uniqueDoctorIds = [...new Set(records.map(r => r.doctorId))];
    const doctors = await User.findAll({
      where: { id: uniqueDoctorIds },
      attributes: ['id', 'username', 'email']
    });
    const doctorInfoMap = new Map(doctors.map(doc => [doc.id, doc]));

    const prescriptionsWithDoctor = prescriptions.map(pres => {
      const doctorId = doctorMap.get(pres.recordId);
      const doctor = doctorInfoMap.get(doctorId);
      return {
        ...pres.toJSON(),
        doctor: doctor ? {
          username: doctor.username,
          email: doctor.email
        } : null
      };
    });

    res.json({ prescriptions: prescriptionsWithDoctor });
  } catch (err) {
    console.error('Error fetching prescriptions:', err);
    res.status(500).json({ message: 'Error fetching prescriptions' });
  }
});

router.put('/profile', async (req, res) => {
  try {
    const userId = req.user.userId;
    const { email, phone, address, oldPassword, newPassword } = req.body;
    console.log('Old password from request:', oldPassword);

    const user = await User.findByPk(userId);
    console.log('Hashed password from DB:', user.password);

    if (!user) return res.status(404).json({ message: 'User not found' });

    if (email) user.email = email;

    if (phone || address) {
      user.contactInfo = {
        ...(user.contactInfo || {}),
        ...(phone && { phone }),
        ...(address && { address })
      };
    }

    if (newPassword) {
      if (!oldPassword) {
        return res.status(400).json({ message: 'Old password is required' });
      }

      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Old password is incorrect' });
      }

      user.password = await bcrypt.hash(newPassword, 10);
    }

    await user.save();

    res.json({ message: 'Profile updated successfully' });
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ message: 'Server error updating profile' });
  }
});

router.delete('/appointments/:appointmentId', async (req, res) => {
  try {
    // Ensure user context is present
    if (!req.user || !req.user.userId) {
      return res.status(401).json({ message: 'Unauthorized: Missing user context' });
    }

    const patientId = req.user.userId;;
    const { appointmentId } = req.params;

    const appointment = await Appointment.findByPk(appointmentId);

    if (!appointment) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    // Debugging logs
    console.log('Authenticated user ID:', patientId);
    console.log('Appointment patient ID:', appointment.patientId);

    // Use String comparison to prevent type mismatch errors
    if (String(appointment.patientId) !== String(patientId)) {
      return res.status(403).json({ message: 'Access denied: Cannot delete others\' appointments' });
    }

    await appointment.destroy();

    res.json({ message: `Appointment ${appointmentId} canceled successfully` });
  } catch (err) {
    console.error('Error canceling appointment:', err);
    res.status(500).json({ message: 'Server error canceling appointment' });
  }
});


export default router;
