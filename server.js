import express from 'express';
import dotenv from 'dotenv';
import sequelize from './config/db.js'; 
import { authenticateToken } from './middlewares/authMiddleware.js';
import patientRoutes from './authRoutes/patientRoutes.js';
import doctorRoutes from './authRoutes/doctorRoutes.js';
import adminRoutes from './authRoutes/adminRoutes.js';
import logs from './authRoutes/logs.js';
import { signup, login, verify2FA, logout, disableCache} from './controllers/authController.js';
import cookieParser from 'cookie-parser';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json());
app.use(cookieParser());

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


app.get('/', async (req, res) => {
  res.send('Welcome to Secure Health API');
});

app.use('/auth/patient', patientRoutes);
app.use('/auth/doctor', doctorRoutes);
app.use('/auth/admin', adminRoutes);
app.use('/auth/log', logs);
app.use(disableCache);

app.post('/signup', signup);
app.post('/login', login);
app.post('/verify-2FA', authenticateToken, verify2FA);
app.post('/logout', logout)
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
