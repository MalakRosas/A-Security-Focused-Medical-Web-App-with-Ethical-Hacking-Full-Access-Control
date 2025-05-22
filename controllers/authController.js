import bcrypt from 'bcrypt';
import speakeasy from 'speakeasy';
import qrcode from 'qrcode';
import User from '../models/User.js';
import Log from '../models/Log.js';
import generateTokenAndSetCookie from '../utils/generateTokenAndSetCookie.js';
import { Op } from 'sequelize';

export const signup = async (req, res) => {
  try {
    const { username, password, email, role } = req.body;

    if (!username || !email || !password || !role) {
      await Log.create({
        action: 'Signup_Failed',
        details: 'Missing fields',
        ipAddress: req.ip || 'unknown'
      });
      return res.status(400).json({ message: 'All fields are required' });
    }

    const existingUser = await User.findOne({
      where: {
        [Op.or]: [{ username }, { email }]
      }
    });

    if (existingUser) {
      const message = existingUser.username === username ? 'Username already in use' : 'Email already in use';
      await Log.create({
        action: 'Signup_Failed',
        details: message,
        ipAddress: req.ip || 'unknown'
      });
      return res.status(400).json({ message });
    }

    const secret = speakeasy.generateSecret({ name: email });
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await User.create({
      username,
      email,
      password: hashedPassword,
      role,
      twoFASecret: secret.base32,
      twoFAEnabled: false,
      isActive: true
    });

    newUser.password = undefined;
    newUser.twoFASecret = undefined;

    const payload = {
      userId: newUser.id,
      userRole: newUser.role,
      username: newUser.username
    };

    const token = generateTokenAndSetCookie(payload, res);

    await Log.create({
      action: 'Signup_Success',
      details: `New user registered: ${newUser.email}`,
      userId: newUser.id,
      ipAddress: req.ip || 'unknown'
    });

    res.status(201).json({
      success: true,
      message: "User signed up successfully",
      data: { user: newUser, token }
    });

  } catch (error) {
    console.error(error);
    await Log.create({
      action: 'Signup_Error',
      details: error.message,
      ipAddress: req.ip || 'unknown'
    });
    res.status(500).json({ message: 'Signup failed', error: error.message });
  }
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      await Log.create({
        action: 'Login_Failed',
        details: 'Missing email or password',
        ipAddress: req.ip || 'unknown'
      });
      return res.status(400).json({ message: "Please provide email and password" });
    }

    const user = await User.findOne({
      where: { email },
      attributes: ['id', 'username', 'email', 'password', 'role', 'twoFAEnabled', 'twoFASecret', 'isActive']
    });

    if (!user) {
      await Log.create({
        action: 'Login_Failed',
        details: 'Email not found',
        ipAddress: req.ip || 'unknown'
      });
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    if (!user.isActive) {
      await Log.create({
        action: 'Login_Blocked',
        details: 'Account disabled',
        userId: user.id,
        ipAddress: req.ip || 'unknown'
      });
      return res.status(403).json({ message: "Account is disabled" });
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      await Log.create({
        action: 'Login_Failed',
        details: 'Incorrect password',
        userId: user.id,
        ipAddress: req.ip || 'unknown'
      });
      return res.status(401).json({ message: "Incorrect email or password" });
    }

    if (!user.twoFAEnabled) {
      const otpauth_url = speakeasy.otpauthURL({
        secret: user.twoFASecret,
        label: user.username || user.email,
        issuer: "auth-system",
        encoding: "base32",
      });

      const qrCodeData = await qrcode.toDataURL(otpauth_url);

      await Log.create({
        action: 'Login_2FA_Pending',
        details: '2FA setup required',
        userId: user.id,
        ipAddress: req.ip || 'unknown'
      });

      return res.status(200).json({
        success: true,
        message: "2FA not enabled yet. Please scan the QR code and verify OTP to enable 2FA.",
        data: {
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role,
            twoFAEnabled: user.twoFAEnabled
          },
          qr_code: qrCodeData,
          otpauth_url: otpauth_url
        }
      });
    }

    const payload = {
      userId: user.id.toString(),
      username: user.username,
      userRole: user.role,
      twoFARequired: true
    };

    const tempToken = generateTokenAndSetCookie(payload, res, { expiresIn: '5m' });

    await Log.create({
      action: 'Login_2FA_Required',
      details: '2FA enabled, OTP required',
      userId: user.id,
      ipAddress: req.ip || 'unknown'
    });

    return res.status(200).json({
      success: true,
      message: "2FA is enabled. Please provide the OTP to complete login.",
      data: {
        token: tempToken,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role,
          twoFAEnabled: user.twoFAEnabled
        }
      }
    });

  } catch (error) {
    console.error(error);
    await Log.create({
      action: 'Login_Error',
      details: error.message,
      ipAddress: req.ip || 'unknown'
    });
    res.status(500).json({ message: "Login failed", error: error.message });
  }
};

export const verify2FA = async (req, res) => {
  try {
    const { token } = req.body;
    const userId = req.userId;

    if (!userId || !token) {
      await Log.create({
        action: '2FA_Verification_Failed',
        details: 'Missing token or userId',
        ipAddress: req.ip || 'unknown'
      });
      return res.status(400).json({ message: "User ID and token are required" });
    }

    const user = await User.findByPk(userId);

    if (!user) {
      await Log.create({
        action: '2FA_Verification_Failed',
        details: 'User not found',
        userId,
        ipAddress: req.ip || 'unknown'
      });
      return res.status(404).json({ message: "User not found" });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFASecret,
      encoding: "base32",
      token,
      window: 2,
    });

    if (!verified) {
      await Log.create({
        action: '2FA_Verification_Failed',
        details: 'Invalid OTP',
        userId,
        ipAddress: req.ip || 'unknown'
      });
      return res.status(401).json({ message: "2FA authentication failed" });
    }

    if (!user.twoFAEnabled) {
      user.twoFAEnabled = true;
      await user.save();
    }

    const payload = {
      userId: user.id.toString(),
      username: user.username,
      userRole: user.role
    };

    const authToken = generateTokenAndSetCookie(payload, res);

    await Log.create({
      action: '2FA_Verification_Success',
      details: '2FA successful',
      userId: user.id,
      ipAddress: req.ip || 'unknown'
    });

    res.status(200).json({
      success: true,
      message: "2FA authentication successful",
      data: { token: authToken }
    });

  } catch (error) {
    console.error(error);
    await Log.create({
      action: '2FA_Verification_Error',
      details: error.message,
      userId: req.userId,
      ipAddress: req.ip || 'unknown'
    });
    res.status(500).json({ message: "2FA verification failed" });
  }
};

export const logout = async (req, res) => {
  try {
    res.clearCookie("token");
    await Log.create({
      action: 'Logout',
      details: 'User logged out',
      userId: req.userId || null,
      ipAddress: req.ip || 'unknown'
    });
    res.status(200).json({
      success: true,
      message: "User logged out, cookie cleared",
    });
  } catch (error) {
    console.error(error);
    await Log.create({
      action: 'Logout_Error',
      details: error.message,
      userId: req.userId,
      ipAddress: req.ip || 'unknown'
    });
    res.status(500).json({ message: "Logout failed" });
  }
};

export const disableCache = (req, res, next) => {
  res.set('Cache-Control', 'no-store');
  next();
};
