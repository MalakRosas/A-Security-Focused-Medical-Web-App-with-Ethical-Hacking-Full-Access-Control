import express from 'express';
import { User, PatientRecord, Prescription, Log } from '../models/associations.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeAdmin } from '../middlewares/adminMiddleware.js';

const router = express.Router();

function getIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

router.use(authenticateToken, authorizeAdmin);

// 1. GET All Users
router.get('/users', async (req, res) => {
  const users = await User.findAll({ attributes: { exclude: ['password'] } });
  res.json(users);
});

// 2. UPDATE User Role
router.put('/users/:id/role', async (req, res) => {
  const userId = req.params.id;
  const { role } = req.body;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldRole = user.role;
    user.role = role;
    await user.save();

    await Log.create({
      action: 'Role Update',
      userId: req.user.id,
      details: `Role changed from ${oldRole} to ${role} for user ${user.username}`,
      ipAddress: getIp(req),
      timestamp: new Date(),
    });

    res.json({ message: 'User role updated' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating role' });
  }
});

// 3. Enable/Disable User
router.put('/users/:id/status', async (req, res) => {
  const { isActive } = req.body;
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const oldStatus = user.isActive;
    user.isActive = isActive;
    await user.save();

    await Log.create({
      action: 'Account Status Update',
      userId: req.user.id,
      details: `Status changed from ${oldStatus} to ${isActive} for ${user.username}`,
      ipAddress: getIp(req),
      timestamp: new Date(),
    });

    res.json({ isActive });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating user status' });
  }
});

// 4. DELETE User
router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await user.destroy();

    await Log.create({
      action: 'User Deletion',
      userId: req.user.id,
      details: `User ${user.username} (ID: ${userId}) was deleted`,
      ipAddress: getIp(req),
      timestamp: new Date(),
    });

    res.json({ message: 'User deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting user' });
  }
});

// 5. Get Single User
router.get('/users/:id', async (req, res) => {
  const user = await User.findByPk(req.params.id, {
    attributes: { exclude: ['password'] },
  });
  if (!user) return res.status(404).json({ message: 'User not found' });
  res.json(user);
});

// 6. Update User
router.put('/users/:id', async (req, res) => {
  try {
    const [updated] = await User.update(req.body, {
      where: { id: req.params.id },
      returning: true,
    });

    if (!updated) return res.status(404).json({ message: 'User not found' });

    await Log.create({
      userId: req.user.id,
      action: `Updated user ${req.params.id}`,
      ipAddress: getIp(req),
      details: JSON.stringify(req.body),
    });

    const updatedUser = await User.findByPk(req.params.id);
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

// PATIENT RECORDS CRUD
router.get('/records', async (req, res) => {
  try {
    const records = await PatientRecord.findAll({
      include: [
        { model: User, as: 'patient', attributes: ['id', 'username', 'email', 'name'] },
        { model: User, as: 'doctor', attributes: ['id', 'username', 'email', 'name'] },
        { model: Prescription },
      ],
    });
    res.json({ records });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching records' });
  }
});

router.get('/records/:id', async (req, res) => {
  const record = await PatientRecord.findByPk(req.params.id, {
    include: [
      { model: User, as: 'patient', attributes: ['id', 'username', 'email', 'name'] },
      { model: User, as: 'doctor', attributes: ['id', 'username', 'email', 'name'] },
      { model: Prescription },
    ],
  });
  if (!record) return res.status(404).json({ message: 'Record not found' });
  res.json(record);
});

router.post('/records', async (req, res) => {
  try {
    const record = await PatientRecord.create(req.body);

    await Log.create({
      userId: req.user.id,
      action: `Created patient record ${record.id}`,
      ipAddress: getIp(req),
      details: JSON.stringify(req.body),
    });

    res.status(201).json(record);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating record' });
  }
});

router.put('/records/:id', async (req, res) => {
  try {
    const [updated] = await PatientRecord.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ message: 'Record not found' });

    await Log.create({
      userId: req.user.id,
      action: `Updated record ${req.params.id}`,
      ipAddress: getIp(req),
      details: JSON.stringify(req.body),
    });

    const updatedRecord = await PatientRecord.findByPk(req.params.id);
    res.json(updatedRecord);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating record' });
  }
});

router.delete('/records/:id', async (req, res) => {
  try {
    const deleted = await PatientRecord.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Record not found' });

    await Log.create({
      userId: req.user.id,
      action: `Deleted patient record ${req.params.id}`,
      ipAddress: getIp(req),
    });

    res.json({ message: 'Record deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting record' });
  }
});

// PRESCRIPTIONS CRUD
router.get('/prescriptions', async (req, res) => {
  try {
    const prescriptions = await Prescription.findAll({
      include: {
        model: PatientRecord,
        include: [
          { model: User, as: 'doctor', attributes: ['username', 'email', 'name'] },
          { model: User, as: 'patient', attributes: ['username', 'email', 'name'] },
        ],
      },
    });
    res.json(prescriptions);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching prescriptions' });
  }
});

router.get('/prescriptions/:id', async (req, res) => {
  try {
    const pres = await Prescription.findByPk(req.params.id, {
      include: {
        model: PatientRecord,
        include: [
          { model: User, as: 'doctor', attributes: ['username', 'email', 'name'] },
          { model: User, as: 'patient', attributes: ['username', 'email', 'name'] },
        ],
      },
    });
    if (!pres) return res.status(404).json({ message: 'Prescription not found' });
    res.json(pres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching prescription' });
  }
});

router.post('/prescriptions', async (req, res) => {
  try {
    const newPres = await Prescription.create(req.body);

    await Log.create({
      userId: req.user.id,
      action: `Created prescription ${newPres.id}`,
      ipAddress: getIp(req),
      details: JSON.stringify(req.body),
    });

    res.status(201).json(newPres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error creating prescription' });
  }
});

router.put('/prescriptions/:id', async (req, res) => {
  try {
    const [updated] = await Prescription.update(req.body, {
      where: { id: req.params.id },
    });
    if (!updated) return res.status(404).json({ message: 'Prescription not found' });

    await Log.create({
      userId: req.user.id,
      action: `Updated prescription ${req.params.id}`,
      ipAddress: getIp(req),
      details: JSON.stringify(req.body),
    });

    const updatedPres = await Prescription.findByPk(req.params.id);
    res.json(updatedPres);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating prescription' });
  }
});

router.delete('/prescriptions/:id', async (req, res) => {
  try {
    const deleted = await Prescription.destroy({ where: { id: req.params.id } });
    if (!deleted) return res.status(404).json({ message: 'Prescription not found' });

    await Log.create({
      userId: req.user.id,
      action: `Deleted prescription ${req.params.id}`,
      ipAddress: getIp(req),
    });

    res.json({ message: 'Prescription deleted' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error deleting prescription' });
  }
});

export default router;
