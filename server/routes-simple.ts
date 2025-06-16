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

// Create some test users on startup
async function createTestUsers() {
  
  // Admin user
  const adminHash = await bcrypt.hash("admin123", 10);
  authUsers.set("admin@ddmjewellers.com", {
    id: "admin_001",
    email: "admin@ddmjewellers.com",
    firstName: "Admin",
    lastName: "User",
    passwordHash: adminHash,
    role: "admin",
    createdAt: new Date(),
  });

  // Test customer
  const customerHash = await bcrypt.hash("customer123", 10);
  authUsers.set("customer@test.com", {
    id: "customer_001", 
    email: "customer@test.com",
    firstName: "Test",
    lastName: "Customer",
    passwordHash: customerHash,
    role: "customer",
    createdAt: new Date(),
  });

  // Test wholesaler
  const wholesalerHash = await bcrypt.hash("wholesaler123", 10);
  authUsers.set("wholesaler@test.com", {
    id: "wholesaler_001",
    email: "wholesaler@test.com", 
    firstName: "Test",
    lastName: "Wholesaler",
    passwordHash: wholesalerHash,
    role: "wholesaler",
    createdAt: new Date(),
  });

  console.log("Test users created:");
  console.log("Admin: admin@ddmjewellers.com / admin123");
  console.log("Customer: customer@test.com / customer123");
  console.log("Wholesaler: wholesaler@test.com / wholesaler123");
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Initialize test users
  await createTestUsers();

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

  // Debug route to see all registered users (remove in production)
  app.get("/api/debug/users", (req, res) => {
    const userList = Array.from(authUsers.values()).map(user => {
      const { passwordHash, ...safeUser } = user;
      return {
        ...safeUser,
        hasPassword: !!passwordHash
      };
    });
    res.json({
      totalUsers: userList.length,
      users: userList,
      activeSessions: sessions.size
    });
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

  // Store locations endpoints
  app.get("/api/store-locations", async (req, res) => {
    try {
      const { db } = await import("./db");
      const { storeLocations } = await import("../shared/schema");
      const { eq } = await import("drizzle-orm");
      
      const locations = await db.select().from(storeLocations)
        .where(eq(storeLocations.isActive, true));
      res.json(locations);
    } catch (error) {
      console.error("Error fetching store locations:", error);
      res.status(500).json({ error: "Failed to fetch store locations" });
    }
  });

  // Admin wholesaler approval endpoints
  app.get("/api/admin/wholesalers/pending", async (req, res) => {
    try {
      // Check authentication via token in Authorization header
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const user = sessions.get(sessionToken);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      const { db } = await import("./db");
      const result = await db.$client.query(`
        SELECT id, email, first_name, last_name, business_name, business_address, 
               business_phone, gst_number, years_in_business, average_order_value, 
               business_references, created_at
        FROM users 
        WHERE role = 'wholesaler' AND is_approved = false AND is_active = true
        ORDER BY created_at ASC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching pending wholesalers:", error);
      res.status(500).json({ error: "Failed to fetch pending wholesalers" });
    }
  });

  app.post("/api/admin/wholesalers/:id/approve", async (req, res) => {
    try {
      // Check authentication via token in Authorization header
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const user = sessions.get(sessionToken);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      const { db } = await import("./db");
      const userId = req.params.id;
      const adminId = user.id;

      const result = await db.$client.query(`
        UPDATE users 
        SET is_approved = true, approved_by = $1, approved_at = NOW()
        WHERE id = $2 AND role = 'wholesaler'
        RETURNING id, email, first_name, last_name, business_name
      `, [adminId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Wholesaler not found" });
      }

      res.json({ 
        message: "Wholesaler approved successfully", 
        wholesaler: result.rows[0] 
      });
    } catch (error) {
      console.error("Error approving wholesaler:", error);
      res.status(500).json({ error: "Failed to approve wholesaler" });
    }
  });

  app.post("/api/admin/wholesalers/:id/reject", async (req, res) => {
    try {
      // Check authentication via token in Authorization header
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const user = sessions.get(sessionToken);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      const { db } = await import("./db");
      const userId = req.params.id;
      const adminId = user.id;

      const result = await db.$client.query(`
        UPDATE users 
        SET is_active = false, approved_by = $1, approved_at = NOW()
        WHERE id = $2 AND role = 'wholesaler'
        RETURNING id, email, first_name, last_name, business_name
      `, [adminId, userId]);

      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Wholesaler not found" });
      }

      res.json({ 
        message: "Wholesaler rejected successfully", 
        wholesaler: result.rows[0] 
      });
    } catch (error) {
      console.error("Error rejecting wholesaler:", error);
      res.status(500).json({ error: "Failed to reject wholesaler" });
    }
  });

  // Admin stats endpoint
  app.get("/api/admin/stats", async (req, res) => {
    try {
      // Check authentication via token in Authorization header
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const user = sessions.get(sessionToken);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      const { db } = await import("./db");
      
      // Get various counts from database
      const totalUsersResult = await db.$client.query('SELECT COUNT(*) as total FROM users');
      const totalProductsResult = await db.$client.query('SELECT COUNT(*) as total FROM products');
      const totalOrdersResult = await db.$client.query('SELECT COUNT(*) as total FROM orders');
      const totalRevenueResult = await db.$client.query('SELECT COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue FROM orders');
      const pendingWholesalersResult = await db.$client.query('SELECT COUNT(*) as count FROM users WHERE role = \'wholesaler\' AND is_approved = false AND is_active = true');
      
      const stats = {
        totalUsers: parseInt(totalUsersResult.rows[0]?.total || '0'),
        totalProducts: parseInt(totalProductsResult.rows[0]?.total || '0'),
        totalOrders: parseInt(totalOrdersResult.rows[0]?.total || '0'),
        totalRevenue: parseFloat(totalRevenueResult.rows[0]?.revenue || '0'),
        pendingWholesalerApprovals: parseInt(pendingWholesalersResult.rows[0]?.count || '0'),
        pendingExchangeRequests: 0 // Placeholder for now
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
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