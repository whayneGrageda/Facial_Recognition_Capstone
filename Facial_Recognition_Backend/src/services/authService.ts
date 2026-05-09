import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
import { AuthModel } from '../models/authModel.js';
import { LoginRequest, LoginResponse } from '../types/authEntity.js';
import { NotificationService } from './notificationService.js';

// In-memory store for verification codes (in production, use Redis or database)
const verificationCodes = new Map<string, { code: string; expiresAt: Date; attempts: number }>();

// Configure nodemailer transporter (requires GMAIL_EMAIL and GMAIL_APP_PASSWORD env vars)
const gmailEmail = process.env.GMAIL_EMAIL;
const gmailAppPassword = process.env.GMAIL_APP_PASSWORD;

if (!gmailEmail || !gmailAppPassword) {
  console.warn('⚠️ WARNING: GMAIL_EMAIL or GMAIL_APP_PASSWORD not set. Email features will be disabled.');
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: gmailEmail || '',
    pass: gmailAppPassword || ''
  }
});

export const AuthService = {
  login: async (loginData: LoginRequest): Promise<LoginResponse> => {
    const { username, email, password, userType = 'college' } = loginData;

    let user: any = null;
    let actualUserType = userType;
    let role = 'student';

    // Try admin login (by username or email)
    if (username || email) {
      user = await AuthModel.findAdminByUsername(username || email!);
      if (user) {
        actualUserType = 'admin';
        role = 'admin';
      }
    }

    // Try moderator login (by username or email)
    if (!user && (username || email)) {
      user = await AuthModel.findModeratorByUsername(username || email!);
      if (user) {
        actualUserType = 'moderator';
        role = 'moderator';
      }
    }

    // Try user login (college, shs, faculty) - only if email is provided
    if (!user && email) {
      user = await AuthModel.findUserByEmail(email, userType);
      if (user) {
        actualUserType = userType;
        role = user.role || 'student';
      }
    }

    if (!user) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Verify password
    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      throw new Error('INVALID_CREDENTIALS');
    }

    // Generate JWT token
    const tokenPayload = {
      userId: user.id,
      email: user.email || username,
      role: role,
      userType: actualUserType,
    };

    const token = jwt.sign(
      tokenPayload,
      process.env.JWT_SECRET!,
      { expiresIn: process.env.REFRESH_TOKEN_EXPIRATION || '1d' } as jwt.SignOptions
    );

    // Store token in database
    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24);
    await AuthModel.storeToken(user.id.toString(), token, actualUserType, role, expiresAt);

    // Remove password from response
    const { password: _, ...userWithoutPassword } = user;

    return {
      token,
      user: {
        id: user.id,
        name: user.name || user.username,
        email: user.email || '',
        role: role,
        userType: actualUserType,
      },
    };
  },

  logout: async (token: string): Promise<void> => {
    await AuthModel.invalidateToken(token);
  },

  verifyToken: async (token: string) => {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!);
      const tokenData = await AuthModel.verifyToken(token);
      
      if (!tokenData) {
        throw new Error('INVALID_TOKEN');
      }

      return decoded;
    } catch (error) {
      throw new Error('INVALID_TOKEN');
    }
  },

  registerCollegeUser: async (userData: {
    first_name: string;
    middle_initial?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    student_id: string;
    password: string;
    course_id?: number;
    year_id?: number;
  }) => {
    // Check if email already exists
    const existingUser = await AuthModel.findUserByEmail(userData.email, 'college');
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Check if student ID already exists
    const { UserModel } = await import('../models/userModel.js');
    const existingStudentId = await UserModel.findByStudentId(userData.student_id);
    if (existingStudentId) {
      throw new Error('STUDENT_ID_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const newUser = await UserModel.create({
      ...userData,
      password: hashedPassword,
      role: 'student'
    });

    // Send welcome notification
    try {
      const fullName = `${userData.first_name} ${userData.last_name}`;
      await NotificationService.notifyRegistrationSuccess(newUser.id, 'college', fullName);
    } catch (notifError) {
      console.error('Failed to send registration notification:', notifError);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      message: 'Registration successful',
      user: userWithoutPassword
    };
  },

  registerShsUser: async (userData: {
    first_name: string;
    middle_initial?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    student_id: string;
    password: string;
    strand_id?: number;
    grade_id?: number;
  }) => {
    // Check if email already exists
    const existingUser = await AuthModel.findUserByEmail(userData.email, 'shs');
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Check if student ID already exists
    const { ShsUserModel } = await import('../models/shsUserModel.js');
    const existingStudentId = await ShsUserModel.findByStudentId(userData.student_id);
    if (existingStudentId) {
      throw new Error('STUDENT_ID_EXISTS');
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const newUser = await ShsUserModel.create({
      ...userData,
      password: hashedPassword,
      role: 'student'
    });

    // Send welcome notification
    try {
      const fullName = `${userData.first_name} ${userData.last_name}`;
      await NotificationService.notifyRegistrationSuccess(newUser.id, 'shs', fullName);
    } catch (notifError) {
      console.error('Failed to send registration notification:', notifError);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      message: 'Registration successful',
      user: userWithoutPassword
    };
  },

  registerFacultyUser: async (userData: {
    first_name: string;
    middle_initial?: string;
    last_name: string;
    email: string;
    contact_number?: string;
    employee_id?: string;
    password: string;
    department_id?: number;
  }) => {
    // Check if email already exists
    const existingUser = await AuthModel.findUserByEmail(userData.email, 'faculty');
    if (existingUser) {
      throw new Error('EMAIL_EXISTS');
    }

    // Note: employee_id is not stored in faculty_users table, it's just accepted for compatibility

    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);

    // Create user
    const { FacultyUserModel } = await import('../models/facultyUserModel.js');
    const newUser = await FacultyUserModel.create({
      ...userData,
      password: hashedPassword,
      role: 'faculty'
    });

    // Send welcome notification
    try {
      const fullName = `${userData.first_name} ${userData.last_name}`;
      await NotificationService.notifyRegistrationSuccess(newUser.id, 'faculty', fullName);
    } catch (notifError) {
      console.error('Failed to send registration notification:', notifError);
    }

    // Remove password from response
    const { password: _, ...userWithoutPassword } = newUser;

    return {
      message: 'Registration successful',
      user: userWithoutPassword
    };
  },

  // Send email verification code
  sendVerificationCode: async (email: string): Promise<{ message: string }> => {
    // Validate NU email domain
    const validDomains = ['@students.nu-dasma.edu.ph', '@shs.nu-dasma.edu.ph', '@nu-dasma.edu.ph'];
    const isValidDomain = validDomains.some(domain => email.endsWith(domain));
    
    if (!isValidDomain) {
      throw new Error('INVALID_EMAIL_DOMAIN');
    }

    // Check if email already exists in database
    const existingCollegeUser = await AuthModel.findUserByEmail(email, 'college');
    const existingShsUser = await AuthModel.findUserByEmail(email, 'shs');
    const existingFacultyUser = await AuthModel.findUserByEmail(email, 'faculty');

    if (existingCollegeUser || existingShsUser || existingFacultyUser) {
      throw new Error('EMAIL_ALREADY_REGISTERED');
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store code with 5-minute expiration and attempt tracking
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 5);
    verificationCodes.set(email, { code, expiresAt, attempts: 0 });

    // Log code to console for development
    console.log('=' .repeat(60));
    console.log(`📧 VERIFICATION CODE GENERATED`);
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Expires: ${expiresAt.toLocaleTimeString()}`);
    console.log('='.repeat(60));

    // Determine user type based on email domain
    const domain = email.split('@')[1];
    let userType = 'User';
    if (domain === 'students.nu-dasma.edu.ph') {
      userType = 'College Student';
    } else if (domain === 'shs.nu-dasma.edu.ph') {
      userType = 'Senior High School Student';
    } else if (domain === 'nu-dasma.edu.ph') {
      userType = 'Staff/Faculty';
    }

    // Extract name from email
    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Send email
    try {
      await transporter.sendMail({
        from: `"NU Dasmariñas Registration" <${process.env.GMAIL_EMAIL || 'teamjarvis.technologies@gmail.com'}>`,
        to: email,
        subject: 'Your NU Dasmariñas Account Verification Code',
        text: `Dear ${nameFromEmail},

Thank you for registering with the NU Dasmariñas Face Recognition Attendance System.

To complete your account verification, please use the following code:

VERIFICATION CODE: ${code}

This verification code will expire in 5 minutes for security purposes.
Account Type: ${userType}

Please enter this code in the registration form to proceed with your account setup.

If you did not initiate this registration, please disregard this email.

For technical support, please contact the NU Dasmariñas IT Department.

Best regards,
NU Dasmariñas IT Department
National University - Dasmariñas

---
This is an automated message. Please do not reply to this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4f46e5;">NU Dasmariñas Account Verification</h2>
            <p>Dear ${nameFromEmail},</p>
            <p>Thank you for registering with the NU Dasmariñas Face Recognition Attendance System.</p>
            <p>To complete your account verification, please use the following code:</p>
            <div style="background-color: #f3f4f6; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px;">
              <h1 style="color: #4f46e5; margin: 0; font-size: 32px; letter-spacing: 8px;">${code}</h1>
            </div>
            <p style="color: #ef4444; font-weight: bold;">⏰ This verification code will expire in 5 minutes.</p>
            <p><strong>Account Type:</strong> ${userType}</p>
            <p>Please enter this code in the registration form to proceed with your account setup.</p>
            <p style="color: #6b7280; font-size: 14px;">If you did not initiate this registration, please disregard this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Best regards,<br>
              NU Dasmariñas IT Department<br>
              National University - Dasmariñas
            </p>
            <p style="color: #9ca3af; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `
      });

      console.log(`✅ Email sent successfully to ${email}`);
      return {
        message: 'Verification code sent successfully'
      };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      // Remove verification code if email fails
      verificationCodes.delete(email);
      throw new Error('FAILED_TO_SEND_EMAIL');
    }
  },

  // Verify email code
  verifyEmailCode: async (email: string, code: string): Promise<{ valid: boolean }> => {
    const storedData = verificationCodes.get(email);
    
    if (!storedData) {
      return { valid: false };
    }

    // Check if code expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(email);
      return { valid: false };
    }

    // Check attempt limit (3 attempts)
    if (storedData.attempts >= 3) {
      verificationCodes.delete(email);
      return { valid: false };
    }

    // Check if code matches
    if (storedData.code !== code) {
      // Increment attempts
      storedData.attempts += 1;
      verificationCodes.set(email, storedData);
      return { valid: false };
    }

    // Code is valid, remove it
    verificationCodes.delete(email);
    return { valid: true };
  },

  // Request password reset
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    // Check if email exists in any user table
    let userExists = false;
    
    const collegeUser = await AuthModel.findUserByEmail(email, 'college');
    const shsUser = await AuthModel.findUserByEmail(email, 'shs');
    const facultyUser = await AuthModel.findUserByEmail(email, 'faculty');
    
    if (collegeUser || shsUser || facultyUser) {
      userExists = true;
    }

    if (!userExists) {
      throw new Error('EMAIL_NOT_FOUND');
    }

    // Generate 6-digit code
    const code = crypto.randomInt(100000, 999999).toString();
    
    // Store code with 10-minute expiration and attempt tracking
    const expiresAt = new Date();
    expiresAt.setMinutes(expiresAt.getMinutes() + 10);
    verificationCodes.set(`reset_${email}`, { code, expiresAt, attempts: 0 });

    // Log code to console for development
    console.log('=' .repeat(60));
    console.log(`🔐 PASSWORD RESET CODE GENERATED`);
    console.log(`Email: ${email}`);
    console.log(`Code: ${code}`);
    console.log(`Expires: ${expiresAt.toLocaleTimeString()}`);
    console.log('='.repeat(60));

    // Extract name from email
    const nameFromEmail = email.split('@')[0].replace(/[._]/g, ' ').replace(/\b\w/g, l => l.toUpperCase());

    // Send email
    try {
      await transporter.sendMail({
        from: `"NU Dasmariñas Security" <${process.env.GMAIL_EMAIL || 'teamjarvis.technologies@gmail.com'}>`,
        to: email,
        subject: 'Password Reset Request - NU Dasmariñas',
        text: `Dear ${nameFromEmail},

We received a request to reset your password for the NU Dasmariñas Face Recognition Attendance System.

To reset your password, please use the following code:

RESET CODE: ${code}

This reset code will expire in 10 minutes for security purposes.

If you did not request a password reset, please ignore this email and your password will remain unchanged.

For security concerns, please contact the NU Dasmariñas IT Department immediately.

Best regards,
NU Dasmariñas IT Department
National University - Dasmariñas

---
This is an automated message. Please do not reply to this email.`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #ef4444;">Password Reset Request</h2>
            <p>Dear ${nameFromEmail},</p>
            <p>We received a request to reset your password for the NU Dasmariñas Face Recognition Attendance System.</p>
            <p>To reset your password, please use the following code:</p>
            <div style="background-color: #fef2f2; padding: 20px; text-align: center; margin: 20px 0; border-radius: 8px; border: 2px solid #ef4444;">
              <h1 style="color: #ef4444; margin: 0; font-size: 32px; letter-spacing: 8px;">${code}</h1>
            </div>
            <p style="color: #ef4444; font-weight: bold;">⏰ This reset code will expire in 10 minutes.</p>
            <p style="color: #6b7280; font-size: 14px;">If you did not request a password reset, please ignore this email and your password will remain unchanged.</p>
            <p style="color: #ef4444; font-size: 14px; font-weight: bold;">⚠️ For security concerns, please contact the NU Dasmariñas IT Department immediately.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="color: #6b7280; font-size: 12px;">
              Best regards,<br>
              NU Dasmariñas IT Department<br>
              National University - Dasmariñas
            </p>
            <p style="color: #9ca3af; font-size: 11px;">This is an automated message. Please do not reply to this email.</p>
          </div>
        `
      });

      console.log(`✅ Password reset email sent successfully to ${email}`);
      return {
        message: 'Password reset code sent successfully'
      };
    } catch (error) {
      console.error('❌ Email sending error:', error);
      // Remove verification code if email fails
      verificationCodes.delete(`reset_${email}`);
      throw new Error('FAILED_TO_SEND_EMAIL');
    }
  },

  // Verify password reset code
  verifyPasswordResetCode: async (email: string, code: string): Promise<{ valid: boolean }> => {
    const storedData = verificationCodes.get(`reset_${email}`);
    
    if (!storedData) {
      return { valid: false };
    }

    // Check if code expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(`reset_${email}`);
      return { valid: false };
    }

    // Check attempt limit (3 attempts)
    if (storedData.attempts >= 3) {
      verificationCodes.delete(`reset_${email}`);
      return { valid: false };
    }

    // Check if code matches
    if (storedData.code !== code) {
      // Increment attempts
      storedData.attempts += 1;
      verificationCodes.set(`reset_${email}`, storedData);
      return { valid: false };
    }

    // Code is valid, but don't remove it yet (needed for password update)
    return { valid: true };
  },

  // Update password after reset
  updatePassword: async (email: string, code: string, newPassword: string): Promise<{ message: string }> => {
    // Verify code one more time
    const storedData = verificationCodes.get(`reset_${email}`);
    
    if (!storedData || storedData.code !== code) {
      throw new Error('INVALID_CODE');
    }

    // Check if code expired
    if (new Date() > storedData.expiresAt) {
      verificationCodes.delete(`reset_${email}`);
      throw new Error('CODE_EXPIRED');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Find user and update password
    let updated = false;
    
    // Try college user
    const collegeUser = await AuthModel.findUserByEmail(email, 'college');
    if (collegeUser) {
      const { UserModel } = await import('../models/userModel.js');
      await UserModel.updatePassword(collegeUser.id, hashedPassword);
      updated = true;
    }

    // Try SHS user
    if (!updated) {
      const shsUser = await AuthModel.findUserByEmail(email, 'shs');
      if (shsUser) {
        const { ShsUserModel } = await import('../models/shsUserModel.js');
        await ShsUserModel.updatePassword(shsUser.id, hashedPassword);
        updated = true;
      }
    }

    // Try faculty user
    if (!updated) {
      const facultyUser = await AuthModel.findUserByEmail(email, 'faculty');
      if (facultyUser) {
        const { FacultyUserModel } = await import('../models/facultyUserModel.js');
        await FacultyUserModel.updatePassword(facultyUser.id, hashedPassword);
        updated = true;
      }
    }

    if (!updated) {
      throw new Error('USER_NOT_FOUND');
    }

    // Remove the reset code
    verificationCodes.delete(`reset_${email}`);

    // Send password reset confirmation notification
    try {
      // Find user to get their ID and user type
      const collegeUser = await AuthModel.findUserByEmail(email, 'college');
      const shsUser = await AuthModel.findUserByEmail(email, 'shs');
      const facultyUser = await AuthModel.findUserByEmail(email, 'faculty');
      
      if (collegeUser) {
        await NotificationService.notifyPasswordReset(collegeUser.id, 'college');
      } else if (shsUser) {
        await NotificationService.notifyPasswordReset(shsUser.id, 'shs');
      } else if (facultyUser) {
        await NotificationService.notifyPasswordReset(facultyUser.id, 'faculty');
      }
    } catch (notifError) {
      console.error('Failed to send password reset notification:', notifError);
    }

    console.log(`✅ Password updated successfully for ${email}`);
    return {
      message: 'Password updated successfully'
    };
  },
};
