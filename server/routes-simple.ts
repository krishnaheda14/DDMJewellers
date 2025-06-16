import { Express } from "express";
import { Server } from "http";
import { storage } from "./storage-mock";
import bcrypt from "bcrypt";

// Simple in-memory user storage for authentication
const authUsers = new Map<string, any>();
const sessions = new Map<string, any>();
const pendingWholesalerApplications = new Map<string, any>();

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

  // Test wholesaler (pending approval)
  const wholesalerHash = await bcrypt.hash("wholesaler123", 10);
  authUsers.set("wholesaler@test.com", {
    id: "wholesaler_001",
    email: "wholesaler@test.com", 
    firstName: "Test",
    lastName: "Wholesaler",
    passwordHash: wholesalerHash,
    role: "wholesaler",
    businessName: "Test Jewelry Wholesale",
    businessAddress: "123 Business St, Mumbai",
    businessPhone: "+91 9876543210",
    gstNumber: "27ABCDE1234F1Z5",
    isActive: true,
    isApproved: false, // Pending approval
    isEmailVerified: true,
    createdAt: new Date(),
  });

  // Create 10 additional pending wholesaler applications
  const wholesalerApplications = [
    {
      email: "rajesh.gems@example.com",
      firstName: "Rajesh",
      lastName: "Kumar",
      businessName: "Kumar Gems & Jewels",
      businessAddress: "45 Zaveri Bazaar, Mumbai, Maharashtra 400003",
      businessPhone: "+91 9876543211",
      gstNumber: "27ABCDE1234F2Z6"
    },
    {
      email: "priya.diamonds@example.com",
      firstName: "Priya",
      lastName: "Sharma",
      businessName: "Sharma Diamond House",
      businessAddress: "12 Karol Bagh, New Delhi, Delhi 110005",
      businessPhone: "+91 9876543212",
      gstNumber: "07BCDEF2345G3Z7"
    },
    {
      email: "amit.jewelers@example.com",
      firstName: "Amit",
      lastName: "Patel",
      businessName: "Patel Gold & Silver",
      businessAddress: "78 Commercial Street, Bangalore, Karnataka 560001",
      businessPhone: "+91 9876543213",
      gstNumber: "29CDEFG3456H4Z8"
    },
    {
      email: "sunita.ornaments@example.com",
      firstName: "Sunita",
      lastName: "Agarwal",
      businessName: "Agarwal Ornaments Pvt Ltd",
      businessAddress: "23 Johari Bazaar, Jaipur, Rajasthan 302003",
      businessPhone: "+91 9876543214",
      gstNumber: "08DEFGH4567I5Z9"
    },
    {
      email: "vikram.jewelry@example.com",
      firstName: "Vikram",
      lastName: "Singh",
      businessName: "Singh Jewelry Mart",
      businessAddress: "56 Park Street, Kolkata, West Bengal 700016",
      businessPhone: "+91 9876543215",
      gstNumber: "19EFGHI5678J6Z0"
    },
    {
      email: "meera.pearls@example.com",
      firstName: "Meera",
      lastName: "Reddy",
      businessName: "Reddy Pearls & Gems",
      businessAddress: "34 Abids Road, Hyderabad, Telangana 500001",
      businessPhone: "+91 9876543216",
      gstNumber: "36FGHIJ6789K7Z1"
    },
    {
      email: "karan.exports@example.com",
      firstName: "Karan",
      lastName: "Gupta",
      businessName: "Gupta Jewelry Exports",
      businessAddress: "67 Sarafa Bazaar, Indore, Madhya Pradesh 452001",
      businessPhone: "+91 9876543217",
      gstNumber: "23GHIJK7890L8Z2"
    },
    {
      email: "pooja.crafts@example.com",
      firstName: "Pooja",
      lastName: "Jain",
      businessName: "Jain Handicrafts & Jewelry",
      businessAddress: "89 Lal Bazaar, Lucknow, Uttar Pradesh 226001",
      businessPhone: "+91 9876543218",
      gstNumber: "09HIJKL8901M9Z3"
    },
    {
      email: "rohit.metals@example.com",
      firstName: "Rohit",
      lastName: "Mehta",
      businessName: "Mehta Precious Metals",
      businessAddress: "12 Opera House, Mumbai, Maharashtra 400004",
      businessPhone: "+91 9876543219",
      gstNumber: "27IJKLM9012N0Z4"
    },
    {
      email: "anjali.designs@example.com",
      firstName: "Anjali",
      lastName: "Chopra",
      businessName: "Chopra Designer Jewelry",
      businessAddress: "45 Connaught Place, New Delhi, Delhi 110001",
      businessPhone: "+91 9876543220",
      gstNumber: "07JKLMN0123O1Z5"
    }
  ];

  // Add all pending wholesaler applications
  for (let i = 0; i < wholesalerApplications.length; i++) {
    const app = wholesalerApplications[i];
    const hash = await bcrypt.hash("wholesaler123", 10);
    authUsers.set(app.email, {
      id: `wholesaler_${String(i + 2).padStart(3, '0')}`,
      ...app,
      passwordHash: hash,
      role: "wholesaler",
      isActive: true,
      isApproved: false, // Pending approval
      isEmailVerified: true,
      createdAt: new Date(),
    });
  }

  console.log("Test users created:");
  console.log("Admin: admin@ddmjewellers.com / admin123");
  console.log("Customer: customer@test.com / customer123");
  console.log("Wholesaler: wholesaler@test.com / wholesaler123");
  console.log(`Created ${wholesalerApplications.length + 1} pending wholesaler applications`);
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

  // Wholesaler signup endpoint
  app.post("/api/auth/signup/wholesaler", async (req, res) => {
    try {
      const { 
        email, 
        password, 
        firstName, 
        lastName, 
        businessName, 
        businessAddress, 
        businessPhone, 
        gstNumber, 
        yearsInBusiness, 
        averageOrderValue, 
        references 
      } = req.body;

      // Validate required fields
      if (!email || !password || !firstName || !lastName || !businessName) {
        return res.status(400).json({ 
          message: "Email, password, name, and business name are required" 
        });
      }

      if (authUsers.has(email)) {
        return res.status(400).json({ message: "User already exists" });
      }

      const passwordHash = await bcrypt.hash(password, 10);
      const userId = `wholesaler_${Date.now()}`;
      
      const user = {
        id: userId,
        email,
        firstName,
        lastName,
        businessName,
        businessAddress: businessAddress || null,
        businessPhone: businessPhone || null,
        gstNumber: gstNumber || null,
        yearsInBusiness: yearsInBusiness || null,
        averageOrderValue: averageOrderValue || null,
        references: references || null,
        passwordHash,
        role: "wholesaler",
        isApproved: false, // Requires admin approval
        isEmailVerified: false,
        createdAt: new Date(),
      };

      authUsers.set(email, user);

      // Add to pending wholesaler applications
      const applicationId = `app_${Date.now()}`;
      const application = {
        id: applicationId,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        businessName: user.businessName,
        businessAddress: user.businessAddress,
        businessPhone: user.businessPhone,
        gstNumber: user.gstNumber,
        yearsInBusiness: user.yearsInBusiness,
        averageOrderValue: user.averageOrderValue,
        references: user.references,
        appliedAt: new Date(),
        status: 'pending'
      };

      pendingWholesalerApplications.set(applicationId, application);

      console.log('Wholesaler application created:', {
        email: user.email,
        businessName: user.businessName,
        applicationId
      });

      const { passwordHash: _, ...userResponse } = user;
      res.status(201).json({
        message: "Wholesaler application submitted successfully. Please wait for admin approval.",
        user: userResponse
      });
    } catch (error) {
      console.error("Wholesaler signup error:", error);
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

      const sessionData = sessions.get(sessionToken);
      if (!sessionData || !sessionData.userId) {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Get the full user data to check role
      const user = authUsers.get(sessionData.email);
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Get pending wholesalers from authUsers Map (where test data is stored)
      const pendingWholesalers = [];
      authUsers.forEach((user, email) => {
        if (user.role === 'wholesaler' && user.isApproved === false) {
          pendingWholesalers.push({
            id: user.id,
            email: user.email,
            first_name: user.firstName,
            last_name: user.lastName,
            business_name: user.businessName,
            business_address: user.businessAddress,
            business_phone: user.businessPhone,
            gst_number: user.gstNumber,
            created_at: user.createdAt
          });
        }
      });

      res.json(pendingWholesalers);
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
      
      console.log('Approve auth check:', { 
        authHeader: authHeader?.substring(0, 20) + '...', 
        sessionToken: sessionToken?.substring(0, 20) + '...',
        hasSession: sessions.has(sessionToken || '')
      });
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Admin access required - invalid session" });
      }

      const sessionData = sessions.get(sessionToken);
      if (!sessionData || !sessionData.userId) {
        return res.status(401).json({ message: "Admin access required - no session data" });
      }

      console.log('Session data:', { userId: sessionData.userId, email: sessionData.email });

      // Get the full user data to check role - try both email and userId
      let user = authUsers.get(sessionData.email);
      if (!user && sessionData.userId) {
        // Try to find user by userId if email lookup fails
        for (const [email, userData] of authUsers) {
          if (userData.id === sessionData.userId) {
            user = userData;
            break;
          }
        }
      }
      
      console.log('User lookup:', { email: sessionData.email, user: user ? { id: user.id, email: user.email, role: user.role } : null });
      
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required - not admin user" });
      }

      const userId = req.params.id;
      console.log('Attempting to approve user:', userId);

      // Debug: List all available users
      console.log('Available users:');
      for (const [email, userData] of authUsers) {
        console.log(`- ID: ${userData.id}, Email: ${email}, Role: ${userData.role}, Approved: ${userData.isApproved}`);
      }

      // Since we're using in-memory storage, let's update the authUsers map directly
      let wholesalerToApprove = null;
      for (const [email, userData] of authUsers) {
        if (userData.id === userId && userData.role === 'wholesaler') {
          wholesalerToApprove = userData;
          break;
        }
      }

      if (!wholesalerToApprove) {
        console.log('Wholesaler not found:', userId);
        console.log('Searching for wholesaler with ID:', userId);
        return res.status(404).json({ error: "Wholesaler not found" });
      }

      // Update the user's approval status
      wholesalerToApprove.isApproved = true;
      wholesalerToApprove.approvedBy = user.id;
      wholesalerToApprove.approvedAt = new Date();

      console.log('Wholesaler approved successfully:', {
        id: wholesalerToApprove.id,
        email: wholesalerToApprove.email,
        businessName: wholesalerToApprove.businessName
      });

      res.json({ 
        message: "Wholesaler approved successfully", 
        wholesaler: {
          id: wholesalerToApprove.id,
          email: wholesalerToApprove.email,
          firstName: wholesalerToApprove.firstName,
          lastName: wholesalerToApprove.lastName,
          businessName: wholesalerToApprove.businessName
        }
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

      const sessionData = sessions.get(sessionToken);
      if (!sessionData || !sessionData.userId) {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Get the full user data to check role - try both email and userId
      let user = authUsers.get(sessionData.email);
      if (!user && sessionData.userId) {
        for (const [email, userData] of authUsers) {
          if (userData.id === sessionData.userId) {
            user = userData;
            break;
          }
        }
      }
      
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Admin access required" });
      }

      const userId = req.params.id;

      // Since we're using in-memory storage, let's update the authUsers map directly
      let wholesalerToReject = null;
      for (const [email, userData] of authUsers) {
        if (userData.id === userId && userData.role === 'wholesaler') {
          wholesalerToReject = userData;
          break;
        }
      }

      if (!wholesalerToReject) {
        return res.status(404).json({ error: "Wholesaler not found" });
      }

      // Update the user's rejection status
      wholesalerToReject.isActive = false;
      wholesalerToReject.approvedBy = user.id;
      wholesalerToReject.approvedAt = new Date();

      res.json({ 
        message: "Wholesaler rejected successfully", 
        wholesaler: {
          id: wholesalerToReject.id,
          email: wholesalerToReject.email,
          firstName: wholesalerToReject.firstName,
          lastName: wholesalerToReject.lastName,
          businessName: wholesalerToReject.businessName
        }
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
      
      console.log("Admin stats auth check:", { authHeader, sessionToken, hasSession: !!sessionToken && sessions.has(sessionToken) });
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Admin access required" });
      }

      const sessionData = sessions.get(sessionToken);
      console.log("Session data:", sessionData);
      
      if (!sessionData || !sessionData.userId) {
        return res.status(401).json({ message: "Admin access required" });
      }

      // Get the full user data to check role - using email as key since that's how authUsers is structured
      const user = authUsers.get(sessionData.email);
      console.log("User lookup:", { email: sessionData.email, user: user ? { id: user.id, email: user.email, role: user.role } : null });
      
      if (!user || user.role !== 'admin') {
        console.log("Auth failed - user role check:", { userExists: !!user, userRole: user?.role });
        return res.status(401).json({ message: "Admin access required" });
      }

      const { db } = await import("./db");
      
      // Get various counts from database
      const totalUsersResult = await db.$client.query('SELECT COUNT(*) as total FROM users');
      const totalProductsResult = await db.$client.query('SELECT COUNT(*) as total FROM products');
      const totalOrdersResult = await db.$client.query('SELECT COUNT(*) as total FROM orders');
      const totalRevenueResult = await db.$client.query('SELECT COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue FROM orders');
      
      // Count users by role from authUsers Map (where test data is stored)
      let customerCount = 0;
      let wholesalerCount = 0;
      let adminCount = 0;
      let pendingWholesalerCount = 0;
      let totalInMemoryUsers = 0;
      
      authUsers.forEach((user, email) => {
        totalInMemoryUsers++;
        if (user.role === 'customer') {
          customerCount++;
        } else if (user.role === 'wholesaler') {
          wholesalerCount++;
          if (user.isApproved === false) {
            pendingWholesalerCount++;
          }
        } else if (user.role === 'admin') {
          adminCount++;
        }
      });
      
      const stats = {
        totalUsers: Math.max(parseInt(totalUsersResult.rows[0]?.total || '0'), totalInMemoryUsers),
        totalCustomers: customerCount,
        totalWholesalers: wholesalerCount,
        totalCorporateUsers: 0, // Not implemented yet
        totalProducts: parseInt(totalProductsResult.rows[0]?.total || '0'),
        totalOrders: parseInt(totalOrdersResult.rows[0]?.total || '0'),
        totalRevenue: parseFloat(totalRevenueResult.rows[0]?.revenue || '0'),
        pendingWholesalerApprovals: pendingWholesalerCount,
        pendingExchangeRequests: 0 // Placeholder for now
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  // Wholesaler product upload endpoint
  app.post("/api/wholesaler/products/upload", async (req, res) => {
    try {
      // Check authentication
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionData = sessions.get(sessionToken);
      if (!sessionData || !sessionData.userId) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Get user and verify wholesaler role
      let user = authUsers.get(sessionData.email);
      if (!user && sessionData.userId) {
        for (const [email, userData] of authUsers) {
          if (userData.id === sessionData.userId) {
            user = userData;
            break;
          }
        }
      }

      if (!user || user.role !== 'wholesaler') {
        return res.status(403).json({ message: "Wholesaler access required" });
      }

      if (!user.isApproved) {
        return res.status(403).json({ message: "Account not approved yet" });
      }

      // Parse form data (note: this is a simple implementation)
      // In production, you'd use multer for file handling
      const productData = {
        id: Date.now(), // Simple ID generation
        wholesalerId: user.id,
        name: req.body.name,
        description: req.body.description,
        category: req.body.category,
        productType: req.body.productType || 'real',
        material: req.body.material,
        weight: parseFloat(req.body.weight) || 0,
        purity: req.body.purity,
        price: req.body.price ? parseFloat(req.body.price) : null,
        makingCharges: req.body.makingCharges ? parseFloat(req.body.makingCharges) : null,
        gemstonesCost: req.body.gemstonesCost ? parseFloat(req.body.gemstonesCost) : null,
        diamondsCost: req.body.diamondsCost ? parseFloat(req.body.diamondsCost) : null,
        tags: req.body.tags ? JSON.parse(req.body.tags) : [],
        status: 'pending_approval',
        uploadedAt: new Date(),
        images: [] // Would handle file uploads in production
      };

      console.log('Product upload:', {
        wholesaler: user.email,
        product: productData.name,
        category: productData.category
      });

      res.json({
        message: "Product uploaded successfully",
        productId: productData.id,
        status: "pending_approval"
      });

    } catch (error) {
      console.error("Error uploading product:", error);
      res.status(500).json({ error: "Failed to upload product" });
    }
  });

  // Wholesaler stats endpoint
  app.get("/api/wholesaler/stats", async (req, res) => {
    try {
      // Check authentication
      const authHeader = req.headers.authorization;
      const sessionToken = authHeader?.replace("Bearer ", "");
      
      if (!sessionToken || !sessions.has(sessionToken)) {
        return res.status(401).json({ message: "Authentication required" });
      }

      const sessionData = sessions.get(sessionToken);
      if (!sessionData || !sessionData.userId) {
        return res.status(401).json({ message: "Invalid session" });
      }

      // Get user and verify wholesaler role
      let user = authUsers.get(sessionData.email);
      if (!user && sessionData.userId) {
        for (const [email, userData] of authUsers) {
          if (userData.id === sessionData.userId) {
            user = userData;
            break;
          }
        }
      }

      if (!user || user.role !== 'wholesaler') {
        return res.status(403).json({ message: "Wholesaler access required" });
      }

      // Return placeholder stats for now
      res.json({
        totalProducts: 0,
        pendingProducts: 0,
        approvedProducts: 0,
        rejectedProducts: 0,
        totalOrders: 0,
        totalRevenue: 0,
        recentUploads: []
      });

    } catch (error) {
      console.error("Error fetching wholesaler stats:", error);
      res.status(500).json({ error: "Failed to fetch stats" });
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