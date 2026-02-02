import bcrypt from 'bcrypt';
import { validationResult } from 'express-validator';
import prisma from '../config/database.js';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOAD_DIR = path.join(__dirname, '../../uploads/profiles');

// Ensure upload directory exists
fs.mkdir(UPLOAD_DIR, { recursive: true }).catch(console.error);

export const updateProfile = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { name, email, currency } = req.body;
    const userId = req.user.id;

    // Check if email is being changed and if it's already taken
    if (email) {
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser && existingUser.id !== userId) {
        return res.status(400).json({ error: 'Email already in use' });
      }
    }

    // Validate currency code (3 letters)
    if (currency && !/^[A-Z]{3}$/.test(currency)) {
      return res.status(400).json({ error: 'Invalid currency code. Must be 3 uppercase letters (e.g., USD, EUR, GBP)' });
    }

    const updateData = {};
    if (name) updateData.name = name;
    if (email) updateData.email = email;
    if (currency) updateData.currency = currency.toUpperCase();

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        currency: true,
        createdAt: true,
      },
    });

    res.json({ user, message: 'Profile updated successfully' });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const updatePassword = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Get user with password hash
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Verify current password
    const isValid = await bcrypt.compare(currentPassword, user.passwordHash);

    if (!isValid) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(newPassword, 10);

    // Update password
    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash },
    });

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Update password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const uploadProfilePhoto = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const userId = req.user.id;

    // Get current user to check for existing photo
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });

    // Delete old photo if exists
    if (user?.profilePhoto) {
      const oldPhotoPath = path.join(UPLOAD_DIR, user.profilePhoto);
      try {
        await fs.unlink(oldPhotoPath);
      } catch (err) {
        console.error('Error deleting old photo:', err);
      }
    }

    // Save new photo path (relative to uploads directory)
    const photoPath = `/uploads/profiles/${req.file.filename}`;

    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: photoPath },
      select: {
        id: true,
        name: true,
        email: true,
        profilePhoto: true,
        currency: true,
        createdAt: true,
      },
    });

    res.json({ user: updatedUser, message: 'Profile photo updated successfully' });
  } catch (error) {
    console.error('Upload profile photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const deleteProfilePhoto = async (req, res) => {
  try {
    const userId = req.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { profilePhoto: true },
    });

    if (user?.profilePhoto) {
      const photoPath = path.join(UPLOAD_DIR, path.basename(user.profilePhoto));
      try {
        await fs.unlink(photoPath);
      } catch (err) {
        console.error('Error deleting photo:', err);
      }
    }

    await prisma.user.update({
      where: { id: userId },
      data: { profilePhoto: null },
    });

    res.json({ message: 'Profile photo deleted successfully' });
  } catch (error) {
    console.error('Delete profile photo error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
