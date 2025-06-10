import { Express } from "express";
import { Server } from "http";
import { isAuthenticated, isAdmin, isWholesaler, setupAuth } from "./auth";
import { storage } from "./storage-simple";
import { optimizedStorage } from "./optimized-storage";
import { marketRatesService } from "./market-rates";
import OpenAI from "openai";
import Anthropic from '@anthropic-ai/sdk';
import fs from "fs";
import {
  insertCategorySchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
  insertUserMemorySchema,
  insertWholesalerDesignSchema,
  insertWishlistSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import { seedImitationJewelry } from "./seed-imitation-jewelry";
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

  // Categories - using optimized storage
  app.get("/api/categories", async (req, res) => {
    try {
      const categories = await optimizedStorage.getCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      res.status(500).json({ error: "Failed to fetch categories" });
    }
  });

  app.post("/api/categories", isAdmin, async (req, res) => {
    try {
      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.json(category);
    } catch (error) {
      console.error("Error creating category:", error);
      res.status(500).json({ error: "Failed to create category" });
    }
  });

  // Products - using optimized storage
  app.get("/api/products", async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        search: req.query.search as string,
        featured: req.query.featured === 'true',
        limit: req.query.limit ? parseInt(req.query.limit as string) : 20,
        offset: req.query.offset ? parseInt(req.query.offset as string) : 0,
      };
      const products = await optimizedStorage.getProducts(filters);
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
      const product = await storage.createProduct(productData);
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
      const cartItems = await storage.getCartItems(userId);
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

  // Market rates
  app.get("/api/market-rates", async (req, res) => {
    try {
      const rates = await storage.getCurrentRates();
      res.json(rates);
    } catch (error) {
      console.error("Error fetching market rates:", error);
      res.status(500).json({ error: "Failed to fetch market rates" });
    }
  });

  // User memory and chatbot
  app.get("/api/user-memory", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const memory = await storage.getUserMemory(userId);
      res.json(memory || {});
    } catch (error) {
      console.error("Error fetching user memory:", error);
      res.status(500).json({ error: "Failed to fetch user memory" });
    }
  });

  app.post("/api/user-memory", isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any)?.id;
      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }
      const memoryData = insertUserMemorySchema.parse(req.body);
      const memory = await storage.upsertUserMemory(userId, memoryData);
      res.json(memory);
    } catch (error) {
      console.error("Error updating user memory:", error);
      res.status(500).json({ error: "Failed to update user memory" });
    }
  });

  // Chatbot endpoint
  app.post("/api/chat", isAuthenticated, async (req, res) => {
    try {
      const { message, sessionId } = req.body;
      const userId = (req.user as any)?.id;

      if (!userId) {
        return res.status(401).json({ error: "User not authenticated" });
      }

      // Get user memory for context
      const userMemory = await storage.getUserMemory(userId);
      
      // Simple response for now
      const response = {
        message: "Thank you for your message. This is a basic response from the jewelry assistant.",
        suggestions: [
          "Tell me about gold jewelry",
          "Show me ring collections",
          "What are current gold rates?"
        ]
      };

      // Save conversation
      await storage.saveChatConversation(userId, sessionId, [
        { role: "user", content: message },
        { role: "assistant", content: response.message }
      ]);

      res.json(response);
    } catch (error) {
      console.error("Error in chat:", error);
      res.status(500).json({ error: "Failed to process chat message" });
    }
  });

  // Admin routes
  app.get("/api/admin/stats", isAdmin, async (req, res) => {
    try {
      // Basic stats
      const stats = {
        totalUsers: 0,
        totalProducts: 0,
        totalOrders: 0,
        totalRevenue: 0
      };
      res.json(stats);
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      res.status(500).json({ error: "Failed to fetch admin stats" });
    }
  });

  app.get("/api/admin/users", isAdmin, async (req, res) => {
    try {
      res.json([]);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.get("/api/admin/orders", isAdmin, async (req, res) => {
    try {
      const orders = await storage.getOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      res.status(500).json({ error: "Failed to fetch orders" });
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

  // Return a dummy server object since the actual server is started in index.ts
  return {} as Server;
}