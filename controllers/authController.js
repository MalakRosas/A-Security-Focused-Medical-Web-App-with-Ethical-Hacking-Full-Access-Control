import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import Log from '../models/Log.js';
import { Op } from 'sequelize';

export const signup = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;
    const validRoles = ['Admin', 'Doctor', 'Patient'];

    if (!validRoles.includes(role)) {
      return res.status(400).json({ message: 'Invalid role' });
    }

    const existingUser = await User.findOne({
      where: { [Op.or]: [{ username }, { email }] }
    });

    if (existingUser) {
      return res.status(400).json({ message: 'Username or email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const twoFASecret = speakeasy.generateSecret({
      name: `SecureHealth (${username})`
    });

    const newUser = await User.create({
      username,
      password: hashedPassword,
      email,
      role,
      twoFASecret: twoFASecret.base32,
      twoFAEnabled: false,
      isActive: true
    });

    const qrCodeUrl = await qrcode.toDataURL(twoFASecret.otpauth_url);

    await Log.create({
      action: 'User Signup',
      userId: newUser.id,
      details: `${username} signed up with role ${role}`,
      ipAddress: req.ip
    });

    return res.status(201).json({
      message: 'User registered. Please scan QR and verify 2FA.',
      twoFASetup: {
        secret: twoFASecret.base32,
        qrCodeUrl
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Signup failed' });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { username, token } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) return res.status(404).json({ message: 'User not found' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token,
      window: 1
    });

    if (!verified) {
      await Log.create({
        action: 'Failed 2FA Verification',
        userId: user.id,
        details: 'Invalid 2FA token',
        ipAddress: req.ip
      });
      return res.status(401).json({ message: 'Invalid 2FA token' });
    }

    user.twoFAEnabled = true;
    await user.save();

    const payload = { id: user.id.toString(), username: user.username, role: user.role };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    await Log.create({
      action: '2FA Verified',
      userId: user.id,
      details: '2FA verified and user logged in',
      ipAddress: req.ip
    });

    return res.status(200).json({
      message: '2FA verified. Login complete.',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role,
        twoFAEnabled: user.twoFAEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Error verifying 2FA' });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password, twoFAToken } = req.body;

    const user = await User.findOne({ where: { username } });
    if (!user) {
      await Log.create({
        action: 'Failed Login',
        details: `Username "${username}" not found`,
        ipAddress: req.ip
      });
      return res.status(401).json({ message: 'Invalid username' });
    }

    if (!user.isActive) return res.status(403).json({ message: 'Account is disabled' });

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) return res.status(401).json({ message: 'Invalid password' });

    if (!user.twoFAEnabled) return res.status(403).json({ message: '2FA not enabled. Please verify first.' });

    if (!twoFAToken) return res.status(400).json({ message: '2FA token required' });

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: 'base32',
      token: twoFAToken,
      window: 1
    });

    if (!verified) return res.status(401).json({ message: 'Invalid 2FA token' });

    const payload = { id: user.id.toString(), username: user.username, role: user.role };
    const jwtToken = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '1d' });

    await Log.create({
      action: 'User Login',
      userId: user.id,
      details: `${username} logged in successfully`,
      ipAddress: req.ip
    });

    return res.json({
      message: 'Login successful',
      token: jwtToken,
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        email: user.email,
        twoFAEnabled: user.twoFAEnabled
      }
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Login failed' });
  }
};
