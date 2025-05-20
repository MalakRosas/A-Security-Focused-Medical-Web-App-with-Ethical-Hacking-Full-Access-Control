// server.js
import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js'; 

import { authenticateToken, authorizeRoles } from './middlewares/authMiddleware.js';
import { rolesPermissions } from './config/rolesPermissions.js';
import patientRoutes from './authRoutes/patientRoutes.js';
import doctorRoutes from './authRoutes/doctorRoutes.js';
import adminRoutes from './authRoutes/adminRoutes.js';
import logs from './authRoutes/logs.js';
import { signup, login, verify2FA} from './controllers/authController.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Connect Sequelize to PostgreSQL
sequelize.authenticate()
  .then(() => {
    console.log('Connected to PostgreSQL via Sequelize');
    return sequelize.sync(); 
  })
  .then(() => {
    console.log('All models synced with the database');
  })
  .catch(err => {
    console.error('Sequelize connection error:', err);
  });

app.use(express.json());

app.get('/', async (req, res) => {
  res.send('Welcome to Secure Health API');
});

app.use('/auth/patient', patientRoutes);
app.use('/auth/doctor', doctorRoutes);
app.use('/auth/admin', adminRoutes);
app.use('/auth/log', logs);

app.post('/signup', signup);
app.post('/login', login);
app.post('/verify-2FA', verify2FA)

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
