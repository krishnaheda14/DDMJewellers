import { Express } from "express";
import { Server } from "http";
import { isAuthenticated, isAdmin, isWholesaler, setupAuth, hashPassword } from "./auth";
// import { storage } from "./storage-simple"; // Disabled due to schema import errors
import { optimizedStorage } from "./optimized-storage";
import { fastStorage } from "./fast-storage";
import { marketRatesService } from "./market-rates";
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import fs from "fs";
import { db } from "./db";
import * as schema from "../shared/schema";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import {
  insertCategorySchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertWholesalerDesignSchema,
  insertWishlistSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { seedImitationJewelry } from "./seed-imitation-jewelry";
import { seedComprehensiveCategories } from "./seed-comprehensive-categories";
import { PricingCalculator } from "./pricing-calculator";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'test-key',
});

// Multer configuration for file uploads
const storage_config = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadPath = path.join(process.cwd(), 'uploads');
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage_config });

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Setup authentication routes first
  await setupAuth(app);
  
  // Basic health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  // Categories - using fast storage with caching
  app.get("/api/categories", async (req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=600'); // 10 minutes browser cache
      const categories = await fastStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const [category] = await db.insert(schema.categories).values(categoryData).returning();
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Products - using fast storage with caching
  app.get("/api/products", async (req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=300'); // 5 minutes browser cache
      
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        search: req.query.search as string,
        featured: req.query.featured === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const products = await fastStorage.getProducts(filters);
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

  app.post("/api/products", isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const [product] = await db.insert(schema.products).values(productData).returning();
      res.json(product);
    } catch (error) {
      console.error("Error creating product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  // Cart operations
  app.get("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const cartItems = await fastStorage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      console.error("Error fetching cart:", error);
      res.status(500).json({ error: "Failed to fetch cart" });
    }
  });

  app.post("/api/cart", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId
      });
      const cartItem = await storage.addToCart(cartItemData);
      res.json(cartItem);
    } catch (error) {
      console.error("Error adding to cart:", error);
      res.status(500).json({ error: "Failed to add to cart" });
    }
  });

  // Orders
  app.get("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const orders = await storage.getOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  app.post("/api/orders", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      const { items, ...orderData } = req.body;
      const order = await storage.createOrder(
        { ...orderData, userId },
        items.map((item: any) => ({ ...item, price: item.price || "0" }))
      );
      res.json(order);
    } catch (error) {
      console.error("Error creating order:", error);
      res.status(500).json({ error: "Failed to create order" });
    }
  });

  // Wholesaler designs
  app.get("/api/wholesaler-designs", async (req, res) => {
    try {
      const filters = {
        wholesalerId: req.query.wholesalerId as string,
        status: req.query.status as string,
        category: req.query.category as string,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      const designs = await storage.getWholesalerDesigns(filters);
      res.json(designs);
    } catch (error) {
      console.error("Error fetching wholesaler designs:", error);
      res.status(500).json({ error: "Failed to fetch wholesaler designs" });
    }
  });

  app.post("/api/wholesaler-designs", isWholesaler, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const designData = insertWholesalerDesignSchema.parse({
        ...req.body,
        wholesalerId: userId
      });
      const design = await storage.createWholesalerDesign(designData);
      res.json(design);
    } catch (error) {
      console.error("Error creating wholesaler design:", error);
      res.status(500).json({ error: "Failed to create wholesaler design" });
    }
  });

  // Market rates - using fast storage with caching
  app.get("/api/market-rates", async (req, res) => {
    try {
      res.set('Cache-Control', 'public, max-age=120'); // 2 minutes browser cache
      const rates = await fastStorage.getCurrentRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching market rates:", error);
      res.status(500).json({ error: "Failed to fetch market rates" });
    }
  });





  // Admin routes
  app.get("/api/admin/stats", isAuthenticated, isAdmin, async (req, res) => {
    try {
      // Get user counts from database
      const usersResult = await db.$client.query('SELECT role, COUNT(*) as count FROM users GROUP BY role');
      const totalUsersResult = await db.$client.query('SELECT COUNT(*) as total FROM users');
      
      // Get pending wholesaler approvals
      const pendingWholesalersResult = await db.$client.query('SELECT COUNT(*) as count FROM users WHERE role = \'wholesaler\' AND is_approved = false');
      
      // Get product count
      const productsResult = await db.$client.query('SELECT COUNT(*) as count FROM products');
      
      // Get order count and revenue
      const ordersResult = await db.$client.query('SELECT COUNT(*) as count, COALESCE(SUM(CAST(total AS DECIMAL)), 0) as revenue FROM orders');
      
      // Process user counts
      const userCounts = usersResult.rows.reduce((acc: any, row: any) => {
        acc[row.role] = parseInt(row.count);
        return acc;
      }, {});
      
      const stats = {
        totalUsers: parseInt(totalUsersResult.rows[0]?.total || '0'),
        totalCustomers: userCounts.customer || 0,
        totalWholesalers: userCounts.wholesaler || 0,
        totalCorporateUsers: userCounts.corporate || 0,
        pendingWholesalerApprovals: parseInt(pendingWholesalersResult.rows[0]?.count || '0'),
        pendingExchangeRequests: 0, // Placeholder for exchange requests
        totalProducts: parseInt(productsResult.rows[0]?.count || '0'),
        totalOrders: parseInt(ordersResult.rows[0]?.count || '0'),
        totalRevenue: parseFloat(ordersResult.rows[0]?.revenue || '0')
      };
      
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.$client.query(`
        SELECT id, email, first_name, last_name, role, is_active, 
               is_approved, is_email_verified, created_at, updated_at 
        FROM users 
        ORDER BY created_at DESC
      `);
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // Get pending wholesaler approvals
  app.get("/api/admin/wholesalers/pending", isAuthenticated, isAdmin, async (req, res) => {
    try {
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

  // Approve wholesaler
  app.post("/api/admin/wholesalers/:id/approve", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const adminId = (req.user as any)?.id;
      
      const result = await db.$client.query(`
        UPDATE users 
        SET is_approved = true, approved_by = $2, approved_at = NOW(), updated_at = NOW()
        WHERE id = $1 AND role = 'wholesaler'
        RETURNING id, email, first_name, last_name, business_name
      `, [id, adminId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Wholesaler not found" });
      }
      
      const wholesaler = result.rows[0];
      
      // TODO: Send approval email notification
      console.log(`Wholesaler approved: ${wholesaler.email}`);
      
      res.json({ 
        message: "Wholesaler approved successfully", 
        wholesaler 
      });
    } catch (error) {
      console.error("Error approving wholesaler:", error);
      res.status(500).json({ error: "Failed to approve wholesaler" });
    }
  });

  // Reject wholesaler
  app.post("/api/admin/wholesalers/:id/reject", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { id } = req.params;
      const { reason } = req.body;
      const adminId = (req.user as any)?.id;
      
      const result = await db.$client.query(`
        UPDATE users 
        SET is_approved = false, is_active = false, approved_by = $2, updated_at = NOW()
        WHERE id = $1 AND role = 'wholesaler'
        RETURNING id, email, first_name, last_name, business_name
      `, [id, adminId]);
      
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "Wholesaler not found" });
      }
      
      const wholesaler = result.rows[0];
      
      // TODO: Send rejection email notification
      console.log(`Wholesaler rejected: ${wholesaler.email}, Reason: ${reason}`);
      
      res.json({ 
        message: "Wholesaler application rejected", 
        wholesaler 
      });
    } catch (error) {
      console.error("Error rejecting wholesaler:", error);
      res.status(500).json({ error: "Failed to reject wholesaler" });
    }
  });

  app.get("/api/admin/orders", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  });

  // Admin category management routes
  app.get("/api/admin/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching admin categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/admin/categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating admin category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  app.put("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(categoryId, categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error updating admin category:", error);
      res.status(500).json({ error: "Failed to update category" });
    }
  });

  app.delete("/api/admin/categories/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const categoryId = parseInt(req.params.id);
      const success = await storage.deleteCategory(categoryId);
      if (success) {
        res.json({ message: "Category deleted successfully" });
      } else {
        res.status(404).json({ error: "Category not found" });
      }
    } catch (error) {
      console.error("Error deleting admin category:", error);
      res.status(500).json({ error: "Failed to delete category" });
    }
  });

  // Bulk delete all categories
  app.delete("/api/admin/categories/bulk-delete", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await db.$client.query('DELETE FROM categories');
      res.json({ 
        message: "All categories deleted successfully",
        deletedCount: result.rowCount || 0
      });
    } catch (error) {
      console.error("Error deleting all categories:", error);
      res.status(500).json({ error: "Failed to delete all categories" });
    }
  });

  // Admin product management routes
  app.get("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (error) {
      console.error("Error fetching admin products:", error);
      res.status(500).json({ error: "Failed to fetch products" });
    }
  });

  app.post("/api/admin/products", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.json(product);
    } catch (error) {
      console.error("Error creating admin product:", error);
      res.status(500).json({ error: "Failed to create product" });
    }
  });

  app.put("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(productId, productData);
      res.json(product);
    } catch (error) {
      console.error("Error updating admin product:", error);
      res.status(500).json({ error: "Failed to update product" });
    }
  });

  app.delete("/api/admin/products/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const productId = parseInt(req.params.id);
      const success = await storage.deleteProduct(productId);
      if (success) {
        res.json({ message: "Product deleted successfully" });
      } else {
        res.status(404).json({ error: "Product not found" });
      }
    } catch (error) {
      console.error("Error deleting admin product:", error);
      res.status(500).json({ error: "Failed to delete product" });
    }
  });

  // General signup route (handles both customer and wholesaler)
  app.post("/api/auth/signup", async (req, res) => {
    try {
      const { role, ...userData } = req.body;
      
      if (!role) {
        return res.status(400).json({ message: "Role is required" });
      }

      // Create user using storage layer (simplified approach)
      const userId = crypto.randomUUID();
      
      const newUser = {
        id: userId,
        email: userData.email,
        password: userData.password || 'temp123',
        firstName: userData.firstName,
        lastName: userData.lastName,
        phoneNumber: userData.phone || null,
        role: role,
        businessName: userData.businessName || null,
        businessAddress: userData.businessAddress || null,
        businessDescription: userData.businessDescription || null,
      };

      // Use storage to create user (this will handle duplicate checking)
      const createdUser = await storage.upsertUser(newUser);

      res.status(201).json({
        message: role === 'wholesaler' 
          ? 'Wholesaler account created successfully. Please wait for admin approval.'
          : 'Account created successfully!',
        user: {
          id: createdUser.id,
          email: createdUser.email,
          firstName: createdUser.firstName,
          lastName: createdUser.lastName,
          role: createdUser.role,
          isEmailVerified: false,
          isApproved: role === 'customer',
        }
      });

    } catch (error: any) {
      console.error('Signup error:', error);
      res.status(500).json({ message: 'Registration failed. Please try again.' });
    }
  });

  // Seed data endpoint
  app.post("/api/seed/imitation-jewelry", isAdmin, async (req, res) => {
    try {
      await seedImitationJewelry();
      res.json({ message: "Imitation jewelry seeded successfully" });
    } catch (error) {
      console.error("Error seeding imitation jewelry:", error);
      res.status(500).json({ error: "Failed to seed imitation jewelry" });
    }
  });

  // Gullak (Gold Savings) Routes
  app.get("/api/gullak/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const result = await db.$client.query(
        `SELECT * FROM gullak_accounts WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching Gullak accounts:", error);
      res.status(500).json({ error: "Failed to fetch Gullak accounts" });
    }
  });

  app.post("/api/gullak/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const { name, metalType, paymentAmount, paymentFrequency, targetMetalWeight, targetAmount, paymentDayOfMonth } = req.body;

      // Calculate next payment date
      const now = new Date();
      let nextPaymentDate = new Date(now);
      
      if (paymentFrequency === "weekly") {
        nextPaymentDate.setDate(now.getDate() + 7);
      } else if (paymentFrequency === "monthly") {
        const targetDate = paymentDayOfMonth || 1;
        nextPaymentDate.setMonth(now.getMonth() + 1);
        nextPaymentDate.setDate(Math.min(targetDate, new Date(nextPaymentDate.getFullYear(), nextPaymentDate.getMonth() + 1, 0).getDate()));
      } else {
        nextPaymentDate.setDate(now.getDate() + 1);
      }

      const result = await db.$client.query(`
        INSERT INTO gullak_accounts (
          user_id, name, daily_amount, target_gold_weight, target_amount, current_balance,
          status, auto_pay_enabled, next_payment_date, metal_type, target_metal_weight,
          payment_amount, payment_frequency, payment_day_of_month, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, NOW(), NOW())
        RETURNING *
      `, [
        userId, name, paymentAmount, targetMetalWeight, targetAmount, "0",
        "active", true, nextPaymentDate.toISOString(), metalType, targetMetalWeight,
        paymentAmount, paymentFrequency, paymentDayOfMonth
      ]);

      res.json(result.rows[0]);
    } catch (error) {
      console.error("Error creating Gullak account:", error);
      res.status(500).json({ error: "Failed to create Gullak account" });
    }
  });

  app.get("/api/gullak/transactions/:accountId", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const result = await db.$client.query(
        `SELECT * FROM gullak_transactions WHERE gullak_account_id = $1 ORDER BY transaction_date DESC`,
        [accountId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });

  app.post("/api/gullak/deposit", isAuthenticated, async (req, res) => {
    try {
      const { accountId, amount, paymentMethod = "manual" } = req.body;
      const userId = (req.user as any)?.id;
      
      // Get current gold rates
      const rates = await marketRatesService.getCurrentRates();
      const goldRate = rates.find((r: any) => r.metal === "gold")?.rate || "7200";
      const goldValue = (parseFloat(amount) / parseFloat(goldRate)).toFixed(6);

      // Create transaction
      const transactionResult = await db.$client.query(`
        INSERT INTO gullak_transactions (
          gullak_account_id, user_id, amount, type, gold_rate, gold_value, 
          description, status, transaction_date, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW(), NOW())
        RETURNING *
      `, [
        accountId, userId, amount, "deposit", goldRate, goldValue,
        `Manual deposit via ${paymentMethod}`, "completed"
      ]);

      // Update account balance
      await db.$client.query(`
        UPDATE gullak_accounts 
        SET current_balance = (CAST(current_balance AS DECIMAL) + $1)::TEXT, updated_at = NOW()
        WHERE id = $2
      `, [parseFloat(amount), accountId]);

      res.json(transactionResult.rows[0]);
    } catch (error) {
      console.error("Error processing deposit:", error);
      res.status(500).json({ error: "Failed to process deposit" });
    }
  });

  app.get("/api/gullak/accounts", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      const result = await db.$client.query(
        `SELECT * FROM gullak_accounts WHERE user_id = $1 ORDER BY created_at DESC`,
        [userId]
      );
      res.json(result.rows);
    } catch (error) {
      console.error("Error fetching Gullak accounts:", error);
      res.status(500).json({ error: "Failed to fetch Gullak accounts" });
    }
  });

  app.get("/api/gullak/gold-rates", async (req, res) => {
    try {
      // Use fixed rates for now until market rates service is fixed
      const goldRates = {
        rate24k: "7200",
        rate22k: "6600", 
        rate18k: "5400",
        silverRate: "85",
        effectiveDate: new Date().toISOString(),
      };
      res.json(goldRates);
    } catch (error) {
      console.error("Error fetching gold rates:", error);
      res.status(500).json({ error: "Failed to fetch gold rates" });
    }
  });

  // Store locations endpoints
  app.get("/api/store-locations", async (req, res) => {
    try {
      const locations = await db.select().from(schema.storeLocations)
        .where(eq(schema.storeLocations.isActive, true));
      res.json(locations);
    } catch (error) {
      console.error("Error fetching store locations:", error);
      res.status(500).json({ error: "Failed to fetch store locations" });
    }
  });

  app.get("/api/store-locations/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const location = await db.select().from(schema.storeLocations)
        .where(eq(schema.storeLocations.id, id));
      
      if (location.length === 0) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json(location[0]);
    } catch (error) {
      console.error("Error fetching store location:", error);
      res.status(500).json({ error: "Failed to fetch store location" });
    }
  });

  // Admin endpoints for store locations
  app.post("/api/admin/store-locations", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = schema.insertStoreLocationSchema.parse(req.body);
      const [location] = await db.insert(schema.storeLocations)
        .values(validatedData)
        .returning();
      res.json(location);
    } catch (error) {
      console.error("Error creating store location:", error);
      res.status(500).json({ error: "Failed to create store location" });
    }
  });

  app.put("/api/admin/store-locations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = schema.insertStoreLocationSchema.partial().parse(req.body);
      
      const [location] = await db.update(schema.storeLocations)
        .set(validatedData)
        .where(eq(schema.storeLocations.id, id))
        .returning();
      
      if (!location) {
        return res.status(404).json({ error: "Store location not found" });
      }
      
      res.json(location);
    } catch (error) {
      console.error("Error updating store location:", error);
      res.status(500).json({ error: "Failed to update store location" });
    }
  });

  app.delete("/api/admin/store-locations/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      await db.delete(schema.storeLocations)
        .where(eq(schema.storeLocations.id, id));
      res.json({ message: "Store location deleted successfully" });
    } catch (error) {
      console.error("Error deleting store location:", error);
      res.status(500).json({ error: "Failed to delete store location" });
    }
  });

  // Admin endpoint to seed comprehensive categories
  app.post("/api/admin/seed-categories", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const result = await seedComprehensiveCategories();
      res.json({
        message: "Comprehensive category structure created successfully",
        ...result
      });
    } catch (error) {
      console.error("Error seeding comprehensive categories:", error);
      res.status(500).json({ error: "Failed to seed categories" });
    }
  });

  // Return a dummy server object since the actual server is started in index.ts
  return {} as Server;
}