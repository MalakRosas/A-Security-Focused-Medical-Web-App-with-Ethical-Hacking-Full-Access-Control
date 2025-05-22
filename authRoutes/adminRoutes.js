import express from 'express';
import { PatientRecord, User, Log } from '../models/associations.js';
import { authenticateToken } from '../middlewares/authMiddleware.js';
import { authorizeAdmin } from '../middlewares/adminMiddleware.js';
import { Sequelize } from 'sequelize';

const router = express.Router();

function getIp(req) {
  return req.ip || req.headers['x-forwarded-for'] || req.connection.remoteAddress;
}

router.use(authenticateToken, authorizeAdmin);

router.get('/users', async (req, res) => {
  try {
    const users = await User.findAll({ attributes: { exclude: ['password'] } });
    res.json(users);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching users' });
  }
});

router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id, {
      attributes: { exclude: ['password'] },
    });
    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json(user);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error fetching user' });
  }
});

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

// UPDATE User
router.put('/users/:id', async (req, res) => {
  const userId = req.params.id;
  const { username } = req.body;

  try {
    if (username) {
      const existingUser = await User.findOne({
        where: {
          username,
          id: { [Sequelize.Op.ne]: userId },
        },
      });
      if (existingUser) {
        return res.status(400).json({ message: 'Username already taken' });
      }
    }

    const [updated] = await User.update(req.body, {
      where: { id: userId },
      returning: true,
    });

    if (!updated) return res.status(404).json({ message: 'User not found' });

    await Log.create({
      userId: req.user.id,
      action: `Updated user ${userId}`,
      ipAddress: getIp(req),
      details: JSON.stringify(req.body),
    });

    const updatedUser = await User.findByPk(userId);
    res.json(updatedUser);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error updating user' });
  }
});

router.delete('/users/:id', async (req, res) => {
  const userId = req.params.id;

  try {
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ message: 'User not found' });

    await Log.destroy({ where: { userId } });

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
    console.error('Error deleting user:', error);
    res.status(500).json({ message: 'Server error deleting user', error: error.message });
  }
});

// GET /admin/patient-records
router.get('/patient-records', async (req, res) => {
  try {
    const records = await PatientRecord.findAll({
      include: [
        { model: User, as: 'patient', attributes: ['id', 'username', 'email'] },
        { model: User, as: 'doctor', attributes: ['id', 'username', 'email'] }
      ]
    });

    res.json({ records });
  } catch (err) {
    console.error('Error fetching patient records:', err);
    res.status(500).json({ message: 'Server error' });
  }
});
// draft records 
router.put('/patient-records/:id/status', async (req, res) => {
  const { id: recordId } = req.params;
  const { status } = req.body;

  if (!['draft', 'active'].includes(status)) {
    return res.status(400).json({ message: 'Invalid status. Must be "draft" or "active".' });
  }

  try {
    const record = await PatientRecord.findByPk(recordId);
    if (!record) {
      return res.status(404).json({ message: 'Patient record not found' });
    }

    const oldStatus = record.status || 'undefined';
    record.status = status;
    await record.save();
    await Log.create({
      action: 'Patient Record Status Update',
      userId: req.user.id,
      details: `Status changed from ${oldStatus} to ${status} for record ID: ${record.id}`,
      ipAddress: req.ip,
      timestamp: new Date()
    });

    res.json({ message: 'Status updated', status: record.status });
  } catch (err) {
    console.error('Error updating patient record status:', err);
    res.status(500).json({ message: 'Server error updating record status' });
  }
});


export default router;
