import { Express } from "express";
import { Server } from "http";
import { storage } from "./storage-mock";
import bcrypt from "bcrypt";

// Simple in-memory user storage for authentication
const authUsers = new Map<string, any>();
const sessions = new Map<string, any>();

function generateToken() {
  return Math.random().toString(36).substring(2) + Date.now().toString(36);
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Basic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Categories routes
  app.get("/api/categories", async (req, res) => {
    try {
      const { productType } = req.query;
      const categories = await storage.getCategories();
      
      let filtered = categories;
      if (productType && productType !== 'both') {
        filtered = categories.filter(cat => 
          cat.productType === productType || cat.productType === 'both'
        );
      }
      
      res.json(filtered);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  // Products routes
  app.get("/api/products", async (req, res) => {
    try {
      const { 
        categoryId, 
        search, 
        featured, 
        productType, 
        limit = 20, 
        offset = 0 
      } = req.query;

      const filters: any = {};
      
      if (categoryId) filters.categoryId = parseInt(categoryId as string);
      if (search) filters.search = search as string;
      if (featured !== undefined) filters.featured = featured === 'true';
      if (productType) filters.productType = productType as string;
      if (limit) filters.limit = parseInt(limit as string);
      if (offset) filters.offset = parseInt(offset as string);

      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      console.error("Error fetching products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.get("/api/products/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const product = await storage.getProduct(id);
      
      if (!product) {
        return res.status(404).json({ error: "Product not found" });
      }
      
      res.json(product);
    } catch (error) {
      console.error("Error fetching product:", error);
      res.status(500).json({ error: "Failed to fetch product" });
    }
  });

  // Market rates routes
  app.get("/api/market-rates", async (req, res) => {
    try {
      const rates = await storage.getCurrentRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching market rates:", error);
      res.status(500).json({ error: "Failed to fetch market rates" });
    }
  });

  // Authentication routes
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { email, password, firstName, lastName } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      if (authUsers.has(email)) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `user_${Date.now()}`;
      
      const user = {
        id: userId,
        email,
        firstName: firstName || null,
        lastName: lastName || null,
        passwordHash,
        role: "customer",
        createdAt: new Date(),
      };

      authUsers.set(email, user);

      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json({
        message: "User created successfully",
        user: userResponse
      });
    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/signin", async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      const user = authUsers.get(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.passwordHash);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const sessionToken = generateToken();
      const sessionExpiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      sessions.set(sessionToken, {
        userId: user.id,
        email: user.email,
        expiresAt: sessionExpiresAt
      });

      const { passwordHash: _, ...userResponse } = user;
      res.json({
        message: "Signed in successfully",
        user: userResponse,
        sessionToken,
        expiresAt: sessionExpiresAt
      });
    } catch (error) {
      console.error("Signin error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get("/api/auth/user", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");

      if (!sessionToken) {
        return res.status(401).json({ message: "No session token provided" });
      }

      const session = sessions.get(sessionToken);
      if (!session || new Date() > session.expiresAt) {
        return res.status(401).json({ message: "Invalid or expired session" });
      }

      const user = authUsers.get(session.email);
      if (!user) {
        return res.status(401).json({ message: "User not found" });
      }

      const { passwordHash: _, ...userResponse } = user;
      res.json(userResponse);
    } catch (error) {
      console.error("Get user error:", error);
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.post("/api/auth/signout", (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");

      if (sessionToken && sessions.has(sessionToken)) {
        sessions.delete(sessionToken);
      }

      res.json({ message: "Signed out successfully" });
    } catch (error) {
      console.error("Signout error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  // Legacy user route for compatibility
  app.get("/api/user", (req, res) => {
    res.status(401).json({ error: "Not authenticated" });
  });

  // Cart routes (if authenticated)
  app.get("/api/cart", async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: "Not authenticated" });
      }
      
      const cartItems = await storage.getCartItems((req.user as any).id);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  // Static placeholder endpoints for development
  app.get("/api/placeholder/:width/:height", (req, res) => {
    const { width, height } = req.params;
    const placeholderUrl = `https://via.placeholder.com/${width}x${height}/D4AF37/FFFFFF?text=Jewelry`;
    res.redirect(placeholderUrl);
  });

  // Don't start server here - let index.ts handle it
  return Promise.resolve(null as any);
}