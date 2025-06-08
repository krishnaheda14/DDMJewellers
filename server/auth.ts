import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { Express, Request, Response, NextFunction } from 'express';
import session from 'express-session';
import { storage } from './storage';
import { 
  customerSignupSchema, 
  wholesalerSignupSchema, 
  signinSchema, 
  forgotPasswordSchema, 
  resetPasswordSchema,
  User 
} from '@shared/schema';
import { sendVerificationEmail, sendPasswordResetEmail } from './email-service';

declare global {
  namespace Express {
    interface Request {
      user?: User & { 
        sessionToken?: string;
        sessionExpiresAt?: Date;
      };
    }
  }
}

const SALT_ROUNDS = 12;
const SESSION_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days
const TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

// Password security utilities
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// Token generation utilities
export function generateSecureToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function generateUserId(): string {
  return crypto.randomUUID();
}

// Session management
export function generateSessionToken(): string {
  return crypto.randomBytes(64).toString('hex');
}

export function getSessionExpiryDate(): Date {
  return new Date(Date.now() + SESSION_DURATION);
}

// Activity logging
export async function logUserActivity(
  userId: string | null,
  action: string,
  details?: any,
  req?: Request
): Promise<void> {
  try {
    await storage.createUserActivityLog({
      userId,
      action,
      details,
      ipAddress: req?.ip || null,
      userAgent: req?.get('User-Agent') || null,
    });
  } catch (error) {
    console.error('Failed to log user activity:', error);
  }
}

// Middleware for authentication
export function isAuthenticated(req: Request, res: Response, next: NextFunction): void {
  const sessionUser = (req as any).session?.user;
  
  if (!sessionUser || !sessionUser.sessionToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // Check if session has expired
  if (sessionUser.sessionExpiresAt && new Date() > new Date(sessionUser.sessionExpiresAt)) {
    (req as any).session.destroy();
    return res.status(401).json({ message: 'Session expired' });
  }

  req.user = sessionUser;
  next();
}

// Role-based middleware
export function requireRole(roles: string[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    next();
  };
}

export function isAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(['admin'])(req, res, next);
}

export function isWholesaler(req: Request, res: Response, next: NextFunction): void {
  return requireRole(['wholesaler', 'admin'])(req, res, next);
}

// Email verification middleware
export function requireEmailVerification(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (!req.user.isEmailVerified) {
    return res.status(403).json({ 
      message: 'Email verification required',
      code: 'EMAIL_NOT_VERIFIED'
    });
  }

  next();
}

// Account approval middleware (for wholesalers)
export function requireApproval(req: Request, res: Response, next: NextFunction): void {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  if (req.user.role === 'wholesaler' && !req.user.isApproved) {
    return res.status(403).json({ 
      message: 'Account pending approval',
      code: 'ACCOUNT_NOT_APPROVED'
    });
  }

  next();
}

// Setup authentication routes
export async function setupAuth(app: Express): Promise<void> {
  // Configure session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'ddm-jewellers-session-secret',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: process.env.NODE_ENV === 'production',
      maxAge: SESSION_DURATION,
      httpOnly: true,
      sameSite: 'strict'
    }
  }));

  // Customer signup
  app.post('/api/auth/signup/customer', async (req: Request, res: Response) => {
    try {
      const validatedData = customerSignupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);
      const userId = generateUserId();

      // Create user
      const user = await storage.createUser({
        id: userId,
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phoneNumber,
        role: 'customer',
        isEmailVerified: false,
        isApproved: true, // Customers are auto-approved
        isActive: true,
      });

      // Generate email verification token
      const verificationToken = generateSecureToken();
      await storage.createEmailVerificationToken({
        userId,
        token: verificationToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY),
      });

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken, user.firstName);

      // Log activity
      await logUserActivity(userId, 'signup', { role: 'customer' }, req);

      res.status(201).json({
        message: 'Account created successfully. Please check your email to verify your account.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
        }
      });

    } catch (error: any) {
      console.error('Customer signup error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Wholesaler signup
  app.post('/api/auth/signup/wholesaler', async (req: Request, res: Response) => {
    try {
      const validatedData = wholesalerSignupSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(validatedData.email);
      if (existingUser) {
        return res.status(400).json({ message: 'Email already registered' });
      }

      // Hash password
      const passwordHash = await hashPassword(validatedData.password);
      const userId = generateUserId();

      // Create user
      const user = await storage.createUser({
        id: userId,
        email: validatedData.email,
        passwordHash,
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        phoneNumber: validatedData.phoneNumber,
        businessName: validatedData.businessName,
        businessAddress: validatedData.businessAddress,
        businessRegistrationProof: validatedData.businessRegistrationProof,
        role: 'wholesaler',
        isEmailVerified: false,
        isApproved: false, // Wholesalers need admin approval
        isActive: true,
      });

      // Generate email verification token
      const verificationToken = generateSecureToken();
      await storage.createEmailVerificationToken({
        userId,
        token: verificationToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY),
      });

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken, user.firstName);

      // Log activity
      await logUserActivity(userId, 'signup', { role: 'wholesaler' }, req);

      res.status(201).json({
        message: 'Wholesaler account created successfully. Please verify your email and wait for admin approval.',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          businessName: user.businessName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isApproved: user.isApproved,
        }
      });

    } catch (error: any) {
      console.error('Wholesaler signup error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Registration failed' });
    }
  });

  // Sign in
  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    try {
      const validatedData = signinSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user || !user.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Verify password
      const isValidPassword = await verifyPassword(validatedData.password, user.passwordHash);
      if (!isValidPassword) {
        await logUserActivity(user.id, 'failed_login', { reason: 'invalid_password' }, req);
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check if account is active
      if (!user.isActive) {
        return res.status(403).json({ message: 'Account is deactivated' });
      }

      // Generate session token
      const sessionToken = generateSessionToken();
      const sessionExpiresAt = getSessionExpiryDate();

      // Update user's session info
      await storage.updateUserSession(user.id, sessionToken, sessionExpiresAt);

      // Store in session
      const sessionUser = {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        isApproved: user.isApproved,
        sessionToken,
        sessionExpiresAt,
      };

      (req as any).session.user = sessionUser;

      // Log activity
      await logUserActivity(user.id, 'login', { sessionToken }, req);

      // Determine redirect based on role
      let redirectTo = '/';
      if (user.role === 'admin') {
        redirectTo = '/admin';
      } else if (user.role === 'wholesaler') {
        redirectTo = '/wholesaler-dashboard';
      }

      res.json({
        message: 'Sign in successful',
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
          isEmailVerified: user.isEmailVerified,
          isApproved: user.isApproved,
        },
        redirectTo
      });

    } catch (error: any) {
      console.error('Sign in error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Sign in failed' });
    }
  });

  // Sign out
  app.post('/api/auth/signout', isAuthenticated, async (req: Request, res: Response) => {
    try {
      if (req.user) {
        // Clear session token in database
        await storage.updateUserSession(req.user.id, null, null);
        
        // Log activity
        await logUserActivity(req.user.id, 'logout', {}, req);
      }

      // Destroy session
      (req as any).session.destroy((err: any) => {
        if (err) {
          console.error('Session destruction error:', err);
        }
      });

      res.json({ message: 'Signed out successfully' });

    } catch (error) {
      console.error('Sign out error:', error);
      res.status(500).json({ message: 'Sign out failed' });
    }
  });

  // Verify email
  app.get('/api/auth/verify-email/:token', async (req: Request, res: Response) => {
    try {
      const { token } = req.params;
      
      const verificationToken = await storage.getEmailVerificationToken(token);
      if (!verificationToken || verificationToken.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired verification token' });
      }

      // Mark user as verified
      await storage.verifyUserEmail(verificationToken.userId);
      
      // Delete used token
      await storage.deleteEmailVerificationToken(verificationToken.id);

      // Log activity
      await logUserActivity(verificationToken.userId, 'email_verified', {}, req);

      res.json({ message: 'Email verified successfully' });

    } catch (error) {
      console.error('Email verification error:', error);
      res.status(500).json({ message: 'Email verification failed' });
    }
  });

  // Forgot password
  app.post('/api/auth/forgot-password', async (req: Request, res: Response) => {
    try {
      const validatedData = forgotPasswordSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(validatedData.email);
      if (!user) {
        // Don't reveal if email exists
        return res.json({ message: 'If the email exists, a reset link has been sent.' });
      }

      // Generate reset token
      const resetToken = generateSecureToken();
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY),
        used: false,
      });

      // Send reset email
      await sendPasswordResetEmail(user.email, resetToken, user.firstName);

      // Log activity
      await logUserActivity(user.id, 'password_reset_requested', {}, req);

      res.json({ message: 'If the email exists, a reset link has been sent.' });

    } catch (error: any) {
      console.error('Forgot password error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Password reset request failed' });
    }
  });

  // Reset password
  app.post('/api/auth/reset-password', async (req: Request, res: Response) => {
    try {
      const validatedData = resetPasswordSchema.parse(req.body);
      
      const resetToken = await storage.getPasswordResetToken(validatedData.token);
      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: 'Invalid or expired reset token' });
      }

      // Hash new password
      const passwordHash = await hashPassword(validatedData.password);

      // Update user password
      await storage.updateUserPassword(resetToken.userId, passwordHash);

      // Mark token as used
      await storage.markPasswordResetTokenUsed(resetToken.id);

      // Invalidate all sessions for this user
      await storage.updateUserSession(resetToken.userId, null, null);

      // Log activity
      await logUserActivity(resetToken.userId, 'password_reset_completed', {}, req);

      res.json({ message: 'Password reset successfully' });

    } catch (error: any) {
      console.error('Reset password error:', error);
      if (error.name === 'ZodError') {
        return res.status(400).json({ 
          message: 'Validation error', 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: 'Password reset failed' });
    }
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: Request, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ message: 'Not authenticated' });
    }

    res.json({
      id: req.user.id,
      email: req.user.email,
      firstName: req.user.firstName,
      lastName: req.user.lastName,
      role: req.user.role,
      isEmailVerified: req.user.isEmailVerified,
      isApproved: req.user.isApproved,
      businessName: req.user.businessName,
    });
  });

  // Resend verification email
  app.post('/api/auth/resend-verification', async (req: Request, res: Response) => {
    try {
      const { email } = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.isEmailVerified) {
        return res.status(400).json({ message: 'Email already verified' });
      }

      // Delete existing tokens
      await storage.deleteEmailVerificationTokensByUserId(user.id);

      // Generate new token
      const verificationToken = generateSecureToken();
      await storage.createEmailVerificationToken({
        userId: user.id,
        token: verificationToken,
        expiresAt: new Date(Date.now() + TOKEN_EXPIRY),
      });

      // Send verification email
      await sendVerificationEmail(user.email, verificationToken, user.firstName);

      res.json({ message: 'Verification email sent' });

    } catch (error) {
      console.error('Resend verification error:', error);
      res.status(500).json({ message: 'Failed to resend verification email' });
    }
  });
}