import express from 'express';
import { authenticateToken, authorizeRoles } from '../middlewares/authMiddleware.js';
import { PatientRecord, Prescription, User } from '../models/associations.js';

const router = express.Router();

router.use(authenticateToken, authorizeRoles('Doctor'));

router.post('/records/:patientId', async (req, res) => {
  try {
    const doctorId = req.user.userId; 
    const patientId = req.params.patientId;
    const { diagnosis, treatmentNotes, prescription } = req.body;

    // Validate patient existence and role
    const patient = await User.findByPk(patientId);
    if (!patient || patient.role !== 'Patient') {
      return res.status(404).json({ message: 'Patient not found or not a valid patient role' });
    }

    // diagnosis and treatmentNotes are expected to be strings now
    if (typeof diagnosis !== 'string' || typeof treatmentNotes !== 'string') {
      return res.status(400).json({ message: 'Diagnosis and treatment notes must be strings' });
    }

    // Create the new PatientRecord
    const newRecord = await PatientRecord.create({
      doctorId,
      patientId,
      diagnoses: diagnosis,      // string, will be encrypted in model hook
      notes: treatmentNotes      // string, will be encrypted in model hook
    });

    let savedPrescription = null;
    if (prescription?.medication) {
      savedPrescription = await Prescription.create({
        recordId: newRecord.id,
        medication: prescription.medication,
        dosage: prescription.dosage,
        instructions: prescription.instructions
      });
    }

    res.status(201).json({
      message: 'Record and prescription created successfully',
      patientUsername: patient.username,
      record: newRecord,
      prescription: savedPrescription
    });

  } catch (error) {
    console.error('Error creating record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


// View records of patients assigned to the doctor

router.get('/patients/records', async (req, res) => {
  try {
    const doctorId = req.user.userId; 

    const records = await PatientRecord.findAll({
      where: { doctorId },
      include: [
        {
          model: User,
          as: 'patient',
          attributes: ['id', 'username', 'email']
        },
        {
          model: Prescription
        }
      ]
    });

    res.json({ records });
  } catch (error) {
    console.error('Error fetching patient records:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// UPDATE: Modify treatment notes in an existing record 
router.put('/records/:recordId', async (req, res) => {
  try {
    const doctorId = String(req.user.userId); // ensure it's a string
    const recordId = req.params.recordId;
    let { treatmentNotes } = req.body;

    const record = await PatientRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (String(record.doctorId) !== doctorId) {
      return res.status(403).json({ message: 'Access denied: Not your record' });
    }

    // Validate that treatmentNotes is a string
    if (typeof treatmentNotes !== 'string') {
      return res.status(400).json({ message: 'Treatment notes must be a string' });
    }

    record.notes = treatmentNotes; // directly assign string

    await record.save();

    res.json({ message: 'Treatment notes updated', record });
  } catch (error) {
    console.error('Error updating record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});


 // DELETE: Remove draft record (only if isDraft = true)
router.delete('/records/:recordId', async (req, res) => {
  try {
    const doctorId = String(req.user.userId); // Ensure string comparison
    const recordId = req.params.recordId;

    const record = await PatientRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Record not found' });
    }

    if (String(record.doctorId) !== doctorId) {
      return res.status(403).json({ message: 'Access denied: Not your record' });
    }

    if (!record.status) {
      return res.status(400).json({ message: 'Only draft records can be deleted' });
    }

    await record.destroy();
    res.json({ message: 'Draft record deleted successfully' });
  } catch (error) {
    console.error('Error deleting draft record:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

export default router;
