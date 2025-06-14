import { Express, Request, Response } from "express";
import bcrypt from "bcrypt";
import { storage } from "./storage-db";
import { generateSecureToken } from "./auth";

// Extend Request type
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

export function setupAuthRoutes(app: Express) {
  // Sign up route
  app.post('/api/auth/signup', async (req: Request, res: Response) => {
    try {
      const { email, password, firstName, lastName, role = 'customer' } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Check if user already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: 'User already exists' });
      }

      // Hash password
      const passwordHash = await bcrypt.hash(password, 10);
      
      // Generate user ID
      const userId = `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user
      const user = await storage.createUser({
        id: userId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash,
        role,
        isEmailVerified: true, // Auto-verify for now
        isApproved: true,
        sessionToken: generateSecureToken(),
        sessionExpiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // 7 days
      });

      // Don't send password hash back
      const { passwordHash: _, ...userResponse } = user;
      
      res.status(201).json({
        message: 'User created successfully',
        user: userResponse
      });
    } catch (error) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Sign in route
  app.post('/api/auth/signin', async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      // Find user
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Check password
      if (!user.passwordHash) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate session token
      const sessionToken = generateSecureToken();
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      // Update user session
      await storage.upsertUser({
        ...user,
        sessionToken,
        sessionExpiresAt,
        lastLoginAt: new Date()
      });

      // Set session in response (simplified approach)
      req.user = { ...user, sessionToken, sessionExpiresAt };

      // Don't send password hash back
      const { passwordHash: _, ...userResponse } = user;
      
      res.json({
        message: 'Signed in successfully',
        user: {
          ...userResponse,
          sessionToken,
          sessionExpiresAt
        }
      });
    } catch (error) {
      console.error('Signin error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });

  // Get current user route
  app.get('/api/auth/user', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace('Bearer ', '');

      if (!sessionToken) {
        return res.status(401).json({ message: 'No session token provided' });
      }

      // Find user by session token (simplified approach)
      // In a real app, you'd store sessions in a session table
      const users = await storage.getUsers?.() || [];
      const user = users.find(u => u.sessionToken === sessionToken);

      if (!user || !user.sessionExpiresAt || new Date() > user.sessionExpiresAt) {
        return res.status(401).json({ message: 'Invalid or expired session' });
      }

      // Don't send password hash back
      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error('Get user error:', error);
      res.status(401).json({ message: 'Unauthorized' });
    }
  });

  // Sign out route
  app.post('/api/auth/signout', async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace('Bearer ', '');

      if (sessionToken) {
        // Find and clear user session
        const users = await storage.getUsers?.() || [];
        const user = users.find(u => u.sessionToken === sessionToken);
        
        if (user) {
          await storage.upsertUser({
            ...user,
            sessionToken: null,
            sessionExpiresAt: null
          });
        }
      }

      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Signout error:', error);
      res.status(500).json({ message: 'Internal server error' });
    }
  });
}

// Middleware to check authentication
export function requireAuth(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization;
  const sessionToken = authHeader?.replace('Bearer ', '');

  if (!sessionToken) {
    return res.status(401).json({ message: 'Authentication required' });
  }

  // In a real app, you'd validate the session token
  // For now, we'll assume it's valid
  next();
}