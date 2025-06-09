import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated, isAdmin } from "./auth";
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
  insertChatConversationSchema,
  insertWholesalerDesignSchema,
  insertWishlistSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // Create uploads directory if it doesn't exist
  const uploadsDir = path.join(process.cwd(), 'uploads');
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Configure multer for file uploads
  const storage_multer = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, uploadsDir);
    },
    filename: (req, file, cb) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
    }
  });

  const upload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB limit
    },
    fileFilter: (req, file, cb) => {
      const allowedTypes = /jpeg|jpg|png|gif/;
      const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
      const mimetype = allowedTypes.test(file.mimetype);
      
      if (mimetype && extname) {
        return cb(null, true);
      } else {
        cb(new Error('Only image files are allowed'));
      }
    }
  });

  // Audio upload configuration for chatbot voice messages
  const audioUpload = multer({
    storage: storage_multer,
    limits: {
      fileSize: 25 * 1024 * 1024, // 25MB limit for audio
    },
    fileFilter: (req, file, cb) => {
      // Accept audio files and webm format for voice messages
      if (file.mimetype.startsWith('audio/') || file.mimetype === 'video/webm') {
        return cb(null, true);
      } else {
        cb(new Error('Only audio files are allowed'));
      }
    }
  });

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // Initialize AI clients
  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  // the newest Anthropic model is "claude-sonnet-4-20250514" which was released after your knowledge cutoff. Use this by default unless user has already selected claude-3-7-sonnet-20250219
  const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });

  // Auth middleware - use enhanced authentication system
  await setupAuth(app);

  // User signup endpoint
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const { email, firstName, lastName, role, businessName, businessAddress, businessDescription } = req.body;

      // Validate required fields
      if (!email || !firstName || !lastName || !role) {
        return res.status(400).json({ message: "Email, first name, last name, and role are required" });
      }

      // Validate role
      if (!['customer', 'wholesaler'].includes(role)) {
        return res.status(400).json({ message: "Invalid role. Must be 'customer' or 'wholesaler'" });
      }

      // For wholesaler accounts, business name is required
      if (role === 'wholesaler' && !businessName) {
        return res.status(400).json({ message: "Business name is required for wholesaler accounts" });
      }

      // Generate a temporary user ID for registration (will be replaced by Replit Auth)
      const tempUserId = `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      // Create user record
      const userData = {
        id: tempUserId,
        email,
        firstName,
        lastName,
        role,
        businessName: role === 'wholesaler' ? businessName : null,
        businessAddress: role === 'wholesaler' ? businessAddress : null,
        businessDescription: role === 'wholesaler' ? businessDescription : null,
        isActive: role === 'customer', // Customers are active immediately, wholesalers need approval
      };

      const user = await storage.upsertUser(userData);

      res.status(201).json({
        message: role === 'wholesaler' 
          ? "Wholesaler account created successfully. Pending approval."
          : "Customer account created successfully.",
        user: {
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName,
          role: user.role,
        }
      });

    } catch (error) {
      console.error("Signup error:", error);
      res.status(500).json({ message: "Failed to create account" });
    }
  });

  // Market rates routes
  app.get('/api/market-rates', async (req, res) => {
    try {
      const rates = await marketRatesService.getCurrentRates();
      if (!rates) {
        return res.status(404).json({ message: "Market rates not available" });
      }
      res.json(rates);
    } catch (error) {
      console.error("Error fetching market rates:", error);
      res.status(500).json({ message: "Failed to fetch market rates" });
    }
  });

  app.post('/api/market-rates/update', isAdmin, async (req, res) => {
    try {
      await marketRatesService.updateRates();
      res.json({ message: "Market rates updated successfully" });
    } catch (error) {
      console.error("Error updating market rates:", error);
      res.status(500).json({ message: "Failed to update market rates" });
    }
  });

  app.post('/api/market-rates/calculate-price', async (req, res) => {
    try {
      const { weight, purity, markup } = req.body;
      
      if (!weight || !purity) {
        return res.status(400).json({ message: "Weight and purity are required" });
      }

      console.log("Calculating price for:", { weight, purity, markup });
      
      const price = await marketRatesService.calculateJewelryPrice(
        parseFloat(weight),
        purity,
        markup ? parseFloat(markup) : 1.3
      );
      
      console.log("Calculated price:", price);
      
      res.json({ 
        price: price ? parseFloat(price) : null,
        weight: parseFloat(weight),
        purity,
        markup: markup ? parseFloat(markup) : 1.3
      });
    } catch (error) {
      console.error("Error calculating jewelry price:", error);
      res.status(500).json({ message: "Failed to calculate price", error: error.message });
    }
  });

  // Admin routes
  app.get('/api/admin/users', isAdmin, async (req: any, res) => {
    try {
      const users = await storage.getAllUsers();
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.get('/api/admin/exchange-requests', isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllExchangeRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching exchange requests:", error);
      res.status(500).json({ message: "Failed to fetch exchange requests" });
    }
  });

  app.get('/api/admin/corporate-requests', isAdmin, async (req: any, res) => {
    try {
      const requests = await storage.getAllCorporateRequests();
      res.json(requests);
    } catch (error) {
      console.error("Error fetching corporate requests:", error);
      res.status(500).json({ message: "Failed to fetch corporate requests" });
    }
  });

  // Category routes
  app.get('/api/categories', async (req, res) => {
    try {
      const categories = await storage.getCategories();
      res.json(categories);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch categories" });
    }
  });

  app.get('/api/categories/:slug', async (req, res) => {
    try {
      const category = await storage.getCategoryBySlug(req.params.slug);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post('/api/categories', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryData = insertCategorySchema.parse(req.body);
      const category = await storage.createCategory(categoryData);
      res.status(201).json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const categoryData = insertCategorySchema.partial().parse(req.body);
      const category = await storage.updateCategory(parseInt(req.params.id), categoryData);
      res.json(category);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete('/api/categories/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await storage.deleteCategory(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }
      res.json({ message: "Category deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Product routes
  app.get('/api/products', async (req, res) => {
    try {
      const filters = {
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        search: req.query.search as string,
        featured: req.query.featured === 'true' ? true : req.query.featured === 'false' ? false : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };
      
      const products = await storage.getProducts(filters);
      res.json(products);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch products" });
    }
  });

  app.get('/api/products/:id', async (req, res) => {
    try {
      const product = await storage.getProduct(parseInt(req.params.id));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json(product);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch product" });
    }
  });

  app.post('/api/products', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const productData = insertProductSchema.parse(req.body);
      const product = await storage.createProduct(productData);
      res.status(201).json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create product" });
    }
  });

  app.put('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const productData = insertProductSchema.partial().parse(req.body);
      const product = await storage.updateProduct(parseInt(req.params.id), productData);
      res.json(product);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update product" });
    }
  });

  app.delete('/api/products/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.role === "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const success = await storage.deleteProduct(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Product not found" });
      }
      res.json({ message: "Product deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete product" });
    }
  });

  // Cart routes
  app.get('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItems = await storage.getCartItems(userId);
      res.json(cartItems);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch cart items" });
    }
  });

  app.post('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const cartItemData = insertCartItemSchema.parse({
        ...req.body,
        userId,
      });
      
      const cartItem = await storage.addToCart(cartItemData);
      res.status(201).json(cartItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to cart" });
    }
  });

  app.put('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const { quantity } = req.body;
      if (!quantity || quantity < 1) {
        return res.status(400).json({ message: "Invalid quantity" });
      }
      
      const cartItem = await storage.updateCartItem(parseInt(req.params.id), quantity);
      res.json(cartItem);
    } catch (error) {
      res.status(500).json({ message: "Failed to update cart item" });
    }
  });

  app.delete('/api/cart/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.removeFromCart(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Cart item not found" });
      }
      res.json({ message: "Item removed from cart" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from cart" });
    }
  });

  app.delete('/api/cart', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      await storage.clearCart(userId);
      res.json({ message: "Cart cleared" });
    } catch (error) {
      res.status(500).json({ message: "Failed to clear cart" });
    }
  });

  // Order routes
  app.get('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      const orders = await storage.getOrders(user?.role === "admin" ? undefined : userId);
      res.json(orders);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.get('/api/orders/:id', isAuthenticated, async (req: any, res) => {
    try {
      const order = await storage.getOrder(parseInt(req.params.id));
      if (!order) {
        return res.status(404).json({ message: "Order not found" });
      }
      
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user?.role === "admin" && order.userId !== userId) {
        return res.status(403).json({ message: "Access denied" });
      }
      
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch order" });
    }
  });

  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { shippingAddress, orderItems } = req.body;
      
      if (!orderItems || !Array.isArray(orderItems) || orderItems.length === 0) {
        return res.status(400).json({ message: "Order items are required" });
      }
      
      // Calculate total
      let total = 0;
      const validatedItems = [];
      
      for (const item of orderItems) {
        const product = await storage.getProduct(item.productId);
        if (!product) {
          return res.status(400).json({ message: `Product ${item.productId} not found` });
        }
        
        const itemTotal = parseFloat(product.price) * item.quantity;
        total += itemTotal;
        
        validatedItems.push({
          productId: item.productId,
          quantity: item.quantity,
          price: product.price,
        });
      }
      
      const orderData = insertOrderSchema.parse({
        userId,
        total: total.toString(),
        shippingAddress,
        status: "pending",
      });
      
      const order = await storage.createOrder(orderData, validatedItems);
      
      // Clear cart after successful order
      await storage.clearCart(userId);
      
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user?.role === "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }
      
      const { status } = req.body;
      if (!status) {
        return res.status(400).json({ message: "Status is required" });
      }
      
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Custom Jewelry Design Upload
  app.post('/api/custom-jewelry/upload', isAuthenticated, upload.single('design'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = req.user.claims.sub;
      const { description, contactInfo } = req.body;
      
      const designRequest = {
        userId,
        fileName: req.file.filename,
        originalName: req.file.originalname,
        filePath: `/uploads/${req.file.filename}`,
        description: description || '',
        contactInfo: contactInfo || '',
        status: 'pending',
        createdAt: new Date()
      };

      // Store design request (you can add this to your database schema later)
      res.status(201).json({
        message: "Design uploaded successfully! Our team will review your request and contact you soon.",
        designId: Date.now(), // temporary ID
        fileName: req.file.filename,
        filePath: `/uploads/${req.file.filename}`
      });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Failed to upload design" });
    }
  });

  // AI Try-On Photo Upload
  app.post('/api/ai-tryon/upload', isAuthenticated, upload.single('photo'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No photo uploaded" });
      }

      const userId = req.user.claims.sub;
      const { productId } = req.body;
      
      if (!productId) {
        return res.status(400).json({ message: "Product ID is required" });
      }

      // Get product details
      const product = await storage.getProduct(parseInt(productId));
      if (!product) {
        return res.status(404).json({ message: "Product not found" });
      }

      const tryOnResult = {
        userId,
        productId: parseInt(productId),
        userPhotoPath: `/uploads/${req.file.filename}`,
        productName: product.name,
        productImage: product.imageUrl,
        // In a real implementation, you would process the image with AI here
        processedImagePath: `/uploads/${req.file.filename}`, // For now, return original
        createdAt: new Date()
      };

      res.status(201).json({
        message: "Photo processed successfully!",
        result: tryOnResult,
        note: "AI try-on feature is in beta. The processed image will be available shortly."
      });
    } catch (error) {
      console.error("Try-on upload error:", error);
      res.status(500).json({ message: "Failed to process photo" });
    }
  });

  // Chatbot memory routes
  app.get('/api/chatbot/memory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memory = await storage.getUserMemory(userId);
      res.json(memory || null);
    } catch (error) {
      console.error('Error fetching user memory:', error);
      res.status(500).json({ message: 'Failed to fetch user memory' });
    }
  });

  app.post('/api/chatbot/memory', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const memoryData = req.body;
      const memory = await storage.upsertUserMemory(userId, memoryData);
      res.json(memory);
    } catch (error) {
      console.error('Error saving user memory:', error);
      res.status(500).json({ message: 'Failed to save user memory' });
    }
  });

  app.post('/api/chatbot/conversation', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { sessionId, messages } = req.body;
      const conversation = await storage.saveChatConversation(userId, sessionId, messages);
      res.json(conversation);
    } catch (error) {
      console.error('Error saving conversation:', error);
      res.status(500).json({ message: 'Failed to save conversation' });
    }
  });

  // AI-powered chat endpoint
  app.post('/api/chatbot/chat', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { message, userProfile } = req.body;
      
      // Get user memory
      const memory = await storage.getUserMemory(userId);
      
      // Create OpenAI client
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      // Build context from memory
      let context = "You are Sunaarji, a warm and friendly Indian jewelry consultant at DDM_Jewellers. ";
      context += "You use occasional Indian phrases like 'ji', 'beta', 'baisaheb' but remain professional. ";
      context += "Give tasteful, practical jewelry advice - not pushy or salesy. ";
      
      if (memory) {
        if (memory.age) context += `The customer is ${memory.age} years old. `;
        if (memory.lifestyle) context += `Their lifestyle: ${memory.lifestyle}. `;
        if (memory.preferences?.favoriteMetals?.length) {
          context += `They prefer ${memory.preferences.favoriteMetals.join(', ')} metals. `;
        }
        if (memory.preferences?.budgetRange) {
          context += `Their budget range: ${memory.preferences.budgetRange}. `;
        }
      }
      
      const response = await openai.chat.completions.create({
        model: "gpt-4o", // the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
        messages: [
          { role: "system", content: context },
          { role: "user", content: message }
        ],
        max_tokens: 300,
        temperature: 0.7
      });
      
      const aiResponse = response.choices[0].message.content;
      
      // Update memory if new information is provided
      if (userProfile) {
        const updatedMemory = {
          ...memory,
          age: userProfile.age || memory?.age,
          lifestyle: userProfile.lifestyle || memory?.lifestyle,
          preferences: {
            ...memory?.preferences,
            ...userProfile.preferences
          }
        };
        await storage.upsertUserMemory(userId, updatedMemory);
      }
      
      res.json({ response: aiResponse });
    } catch (error) {
      console.error('Error in AI chat:', error);
      res.status(500).json({ message: 'Failed to process chat request' });
    }
  });

  // Speech-to-text endpoint
  app.post('/api/chatbot/speech-to-text', isAuthenticated, audioUpload.single('audio'), async (req: any, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No audio file uploaded' });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const transcription = await openai.audio.transcriptions.create({
        file: fs.createReadStream(req.file.path),
        model: "whisper-1",
      });

      // Clean up the uploaded file
      fs.unlinkSync(req.file.path);

      res.json({ text: transcription.text });
    } catch (error) {
      console.error('Error in speech-to-text:', error);
      res.status(500).json({ message: 'Failed to transcribe audio' });
    }
  });

  // Text-to-speech endpoint
  app.post('/api/chatbot/text-to-speech', isAuthenticated, async (req: any, res) => {
    try {
      const { text } = req.body;
      
      if (!text) {
        return res.status(400).json({ message: 'Text is required' });
      }

      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: "nova", // Female voice that sounds warm and friendly
        input: text,
      });

      const buffer = Buffer.from(await mp3.arrayBuffer());
      
      res.set({
        'Content-Type': 'audio/mpeg',
        'Content-Length': buffer.length.toString(),
      });
      
      res.send(buffer);
    } catch (error) {
      console.error('Error in text-to-speech:', error);
      res.status(500).json({ message: 'Failed to generate speech' });
    }
  });

  // Face Shape Analysis endpoint
  app.post('/api/chatbot/analyze-face', isAuthenticated, async (req: any, res) => {
    try {
      const { image } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: 'Image data is required' });
      }

      // Extract base64 data from data URL
      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are Sunaarji, a warm Indian jewelry consultant. Analyze this person's face shape and provide personalized jewelry recommendations. Identify their face shape (oval, round, square, heart, diamond, oblong) and suggest specific jewelry pieces that would enhance their features. Be warm and use terms like "beta" and "ji" naturally. Focus on earrings, necklaces, and traditional Indian jewelry that would complement their face shape.`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      });

      const analysis = response.content[0].text;
      
      // Extract face shape from analysis (simple pattern matching)
      const faceShapeMatch = analysis.match(/(oval|round|square|heart|diamond|oblong)/i);
      const faceShape = faceShapeMatch ? faceShapeMatch[1].toLowerCase() : 'oval';

      res.json({
        faceShape,
        recommendations: analysis
      });
    } catch (error) {
      console.error('Error in face analysis:', error);
      res.status(500).json({ message: 'Failed to analyze face shape' });
    }
  });

  // Fashion Styling Analysis endpoint
  app.post('/api/chatbot/analyze-outfit', isAuthenticated, async (req: any, res) => {
    try {
      const { image, occasion } = req.body;
      
      if (!image) {
        return res.status(400).json({ message: 'Image data is required' });
      }

      const base64Data = image.replace(/^data:image\/[a-z]+;base64,/, '');
      const occasionContext = occasion ? ` for a ${occasion}` : '';

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'text',
              text: `You are Sunaarji, a fashion-forward Indian jewelry consultant. Analyze this outfit${occasionContext} and suggest jewelry that would perfectly complement it. Consider the outfit's style, colors, neckline, and overall aesthetic. Recommend specific pieces like earrings, necklaces, bangles, or rings that would enhance the look. Be warm and friendly, using "beta" and "ji" naturally while providing expert fashion advice.`
            },
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: 'image/jpeg',
                data: base64Data
              }
            }
          ]
        }]
      });

      const analysis = response.content[0].text;
      
      // Extract style analysis
      const styleMatch = analysis.match(/(traditional|modern|contemporary|ethnic|western|fusion|elegant|casual|formal)/i);
      const styleAnalysis = styleMatch ? styleMatch[1].toLowerCase() : 'elegant';

      res.json({
        styleAnalysis,
        suggestions: analysis
      });
    } catch (error) {
      console.error('Error in outfit analysis:', error);
      res.status(500).json({ message: 'Failed to analyze outfit' });
    }
  });

  // Occasion-based Recommendations endpoint
  app.post('/api/chatbot/recommend-occasion', isAuthenticated, async (req: any, res) => {
    try {
      const { occasion, style, budget } = req.body;
      
      if (!occasion) {
        return res.status(400).json({ message: 'Occasion is required' });
      }

      const userId = req.user.claims.sub;
      const userMemory = await storage.getUserMemory(userId);
      
      // Build context from user profile
      let userContext = '';
      if (userMemory) {
        userContext = `The customer is ${userMemory.age} years old with a ${userMemory.lifestyle} lifestyle. `;
        if (userMemory.faceShape) {
          userContext += `They have a ${userMemory.faceShape} face shape. `;
        }
      }

      const styleContext = style ? ` They prefer ${style} style jewelry.` : '';
      const budgetContext = budget ? ` Their budget consideration is ${budget}.` : '';

      const prompt = `You are Sunaarji, an expert Indian jewelry consultant. ${userContext}${styleContext}${budgetContext}

The customer is asking for jewelry recommendations for: ${occasion}

Provide comprehensive jewelry suggestions including:
1. Essential pieces for this occasion
2. Traditional Indian jewelry options
3. Modern/contemporary alternatives
4. Specific styling tips
5. How to layer or combine pieces

Be warm, friendly, and knowledgeable. Use "beta" and "ji" naturally. Focus on pieces that would be culturally appropriate and stunning for this occasion.`;

      const response = await anthropic.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 600,
        messages: [{
          role: 'user',
          content: prompt
        }]
      });

      const recommendations = response.content[0].text;

      // Get relevant products from our catalog
      const products = await storage.getProducts({ limit: 6, featured: true });

      res.json({
        recommendations,
        products: products.slice(0, 3) // Return top 3 featured products
      });
    } catch (error) {
      console.error('Error in occasion recommendations:', error);
      res.status(500).json({ message: 'Failed to generate recommendations' });
    }
  });

  // Wholesaler Design Routes
  app.get('/api/wholesaler-designs', async (req, res) => {
    try {
      const { wholesalerId, status, category, limit, offset } = req.query;
      const designs = await storage.getWholesalerDesigns({
        wholesalerId: wholesalerId as string,
        status: status as string,
        category: category as string,
        limit: limit ? parseInt(limit as string) : undefined,
        offset: offset ? parseInt(offset as string) : undefined,
      });
      res.json(designs);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wholesaler designs" });
    }
  });

  app.get('/api/wholesaler-designs/:id', async (req, res) => {
    try {
      const design = await storage.getWholesalerDesign(parseInt(req.params.id));
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json(design);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch design" });
    }
  });

  app.post('/api/wholesaler-designs', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'wholesaler' && user?.role !== 'admin') {
        return res.status(403).json({ message: "Wholesaler or admin access required" });
      }

      const designData = insertWholesalerDesignSchema.parse({
        ...req.body,
        wholesalerId: req.user.claims.sub,
      });
      const design = await storage.createWholesalerDesign(designData);
      res.status(201).json(design);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create design" });
    }
  });

  app.put('/api/wholesaler-designs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const design = await storage.getWholesalerDesign(parseInt(req.params.id));
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Only the design owner or admin can update
      if (design.wholesalerId !== req.user.claims.sub && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const designData = insertWholesalerDesignSchema.partial().parse(req.body);
      const updatedDesign = await storage.updateWholesalerDesign(parseInt(req.params.id), designData);
      res.json(updatedDesign);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to update design" });
    }
  });

  app.post('/api/wholesaler-designs/:id/approve', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const design = await storage.approveWholesalerDesign(parseInt(req.params.id), req.user.claims.sub);
      res.json(design);
    } catch (error) {
      res.status(500).json({ message: "Failed to approve design" });
    }
  });

  app.post('/api/wholesaler-designs/:id/reject', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const design = await storage.rejectWholesalerDesign(parseInt(req.params.id), req.user.claims.sub);
      res.json(design);
    } catch (error) {
      res.status(500).json({ message: "Failed to reject design" });
    }
  });

  app.delete('/api/wholesaler-designs/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      const design = await storage.getWholesalerDesign(parseInt(req.params.id));
      
      if (!design) {
        return res.status(404).json({ message: "Design not found" });
      }

      // Only the design owner or admin can delete
      if (design.wholesalerId !== req.user.claims.sub && user?.role !== 'admin') {
        return res.status(403).json({ message: "Access denied" });
      }

      const success = await storage.deleteWholesalerDesign(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Design not found" });
      }
      res.json({ message: "Design deleted successfully" });
    } catch (error) {
      res.status(500).json({ message: "Failed to delete design" });
    }
  });

  // Wishlist Routes
  app.get('/api/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const wishlist = await storage.getWishlist(req.user.claims.sub);
      res.json(wishlist);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wishlist" });
    }
  });

  app.post('/api/wishlist', isAuthenticated, async (req: any, res) => {
    try {
      const wishlistData = insertWishlistSchema.parse({
        ...req.body,
        userId: req.user.claims.sub,
      });
      const wishlistItem = await storage.addToWishlist(wishlistData);
      res.status(201).json(wishlistItem);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to add to wishlist" });
    }
  });

  app.delete('/api/wishlist/:id', isAuthenticated, async (req: any, res) => {
    try {
      const success = await storage.removeFromWishlist(parseInt(req.params.id));
      if (!success) {
        return res.status(404).json({ message: "Wishlist item not found" });
      }
      res.json({ message: "Item removed from wishlist" });
    } catch (error) {
      res.status(500).json({ message: "Failed to remove from wishlist" });
    }
  });

  // User Role Management Routes
  app.put('/api/users/:id/role', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { role } = req.body;
      if (!['customer', 'wholesaler', 'admin'].includes(role)) {
        return res.status(400).json({ message: "Invalid role" });
      }

      const updatedUser = await storage.updateUserRole(req.params.id, role);
      res.json(updatedUser);
    } catch (error) {
      res.status(500).json({ message: "Failed to update user role" });
    }
  });

  app.get('/api/wholesalers', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const { approved } = req.query;
      const wholesalers = await storage.getWholesalers(
        approved !== undefined ? approved === 'true' : undefined
      );
      res.json(wholesalers);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch wholesalers" });
    }
  });

  // Shingaar Guru Routes
  app.post("/api/shingaar-guru/recommendations", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const {
        occasion,
        budget,
        style,
        metalPreference,
        gemstonePreference,
        ageGroup,
        relationship,
        seasonalPreference,
        additionalDetails
      } = req.body;

      // Get all products for filtering
      const allProducts = await storage.getProducts();
      
      // Filter products based on budget range
      const budgetMin = budget[0];
      const budgetMax = budget[1];
      const productsInBudget = allProducts.filter(product => {
        const price = parseFloat(product.price);
        return price >= budgetMin && price <= budgetMax;
      });

      // AI-powered recommendation logic
      let recommendations = [];
      let occasionTips = [];
      let stylingAdvice = "";
      let culturalSignificance = "";
      let confidenceScore = 0.85;

      // Occasion-based filtering and recommendations
      switch (occasion) {
        case 'wedding':
          recommendations = productsInBudget.filter(p => 
            p.name.toLowerCase().includes('ring') || 
            p.name.toLowerCase().includes('necklace') ||
            p.name.toLowerCase().includes('earring')
          );
          occasionTips = [
            "Choose traditional designs with cultural significance",
            "Gold jewelry is considered auspicious for weddings",
            "Consider matching sets for a coordinated look",
            "Intricate craftsmanship adds to the ceremonial value"
          ];
          stylingAdvice = "For weddings, opt for statement pieces that complement traditional attire. Heavy gold jewelry with intricate designs works best for bridal wear, while lighter pieces suit wedding guests.";
          culturalSignificance = "In Indian culture, gold jewelry symbolizes prosperity and good fortune. Wedding jewelry often features traditional motifs like peacocks, lotus, and paisleys that represent beauty, purity, and fertility.";
          break;

        case 'engagement':
          recommendations = productsInBudget.filter(p => 
            p.name.toLowerCase().includes('ring') || 
            p.name.toLowerCase().includes('diamond')
          );
          occasionTips = [
            "Solitaire rings are classic choices for engagements",
            "Consider the recipient's daily lifestyle",
            "Diamond quality matters more than size",
            "Choose a timeless design that won't go out of style"
          ];
          stylingAdvice = "Engagement rings should be elegant yet practical for daily wear. Choose a setting that protects the stone and complements the wearer's hand shape and lifestyle.";
          culturalSignificance = "The engagement ring symbolizes eternal love and commitment. In many cultures, the circular shape represents infinity and the unending bond between partners.";
          break;

        case 'festival':
          recommendations = productsInBudget.filter(p => 
            p.name.toLowerCase().includes('necklace') || 
            p.name.toLowerCase().includes('earring') ||
            p.name.toLowerCase().includes('gold')
          );
          occasionTips = [
            "Bright colors and traditional designs work well",
            "Layer different pieces for a festive look",
            "Temple jewelry adds cultural authenticity",
            "Consider comfort for long celebration hours"
          ];
          stylingAdvice = "Festival jewelry should be vibrant and traditional. Mix different textures and metals, and don't be afraid to layer necklaces or stack bangles for a celebratory look.";
          culturalSignificance = "Festival jewelry often features religious motifs and is believed to bring good luck. Each festival has its traditional jewelry customs that connect us to our heritage.";
          break;

        case 'office':
          recommendations = productsInBudget.filter(p => 
            !p.name.toLowerCase().includes('heavy') &&
            (p.name.toLowerCase().includes('subtle') || 
             p.name.toLowerCase().includes('elegant') ||
             parseFloat(p.price) < 50000)
          );
          occasionTips = [
            "Keep it minimal and professional",
            "Avoid chunky or noisy pieces",
            "Stick to neutral metals like silver or white gold",
            "Choose pieces that won't interfere with work"
          ];
          stylingAdvice = "Office jewelry should be understated and professional. Choose delicate pieces that add elegance without being distracting in a workplace environment.";
          culturalSignificance = "Professional jewelry reflects confidence and attention to detail. It should enhance your professional image while respecting workplace culture.";
          break;

        default:
          recommendations = productsInBudget.slice(0, 3);
          occasionTips = [
            "Consider your personal style preferences",
            "Think about when and where you'll wear the piece",
            "Quality craftsmanship ensures longevity",
            "Choose pieces that complement your wardrobe"
          ];
          stylingAdvice = "Select jewelry that reflects your personality and complements your lifestyle. Consider versatile pieces that can transition from day to evening wear.";
          culturalSignificance = "Jewelry is a form of personal expression that connects us to our culture, traditions, and individual style preferences.";
      }

      // Style-based refinement
      if (style === 'minimalist') {
        recommendations = recommendations.filter(p => 
          !p.name.toLowerCase().includes('heavy') && 
          !p.name.toLowerCase().includes('elaborate')
        );
        stylingAdvice += " Focus on clean lines and simple designs that make a subtle statement.";
      } else if (style === 'statement') {
        recommendations = recommendations.filter(p => 
          p.name.toLowerCase().includes('heavy') || 
          p.name.toLowerCase().includes('bold') ||
          parseFloat(p.price) > 75000
        );
        stylingAdvice += " Bold, eye-catching pieces that become the focal point of your outfit work best.";
      }

      // Metal preference filtering
      if (metalPreference !== 'mixed') {
        recommendations = recommendations.filter(p => 
          p.name.toLowerCase().includes(metalPreference) ||
          p.description?.toLowerCase().includes(metalPreference)
        );
      }

      // Gemstone preference filtering
      if (gemstonePreference && gemstonePreference !== 'none' && gemstonePreference !== 'mixed') {
        recommendations = recommendations.filter(p => 
          p.name.toLowerCase().includes(gemstonePreference) ||
          p.description?.toLowerCase().includes(gemstonePreference)
        );
      }

      // Age group adjustments
      if (ageGroup === 'teen' || ageGroup === 'young-adult') {
        occasionTips.push("Consider trendy designs that reflect your personality");
        stylingAdvice += " Young wearers can experiment with contemporary designs and mixed metals.";
      } else if (ageGroup === 'mature') {
        occasionTips.push("Classic, timeless designs offer the best long-term value");
        stylingAdvice += " Mature wearers often prefer classic designs with superior craftsmanship and heritage value.";
      }

      // Seasonal considerations
      if (seasonalPreference === 'summer') {
        occasionTips.push("Lighter pieces are more comfortable in warm weather");
      } else if (seasonalPreference === 'winter') {
        occasionTips.push("Layering jewelry works well with winter clothing");
      }

      // Ensure we have at least some recommendations
      if (recommendations.length === 0) {
        recommendations = productsInBudget.slice(0, 3);
      }

      // Limit to top 6 recommendations
      recommendations = recommendations.slice(0, 6);

      // Calculate confidence score based on available matches
      if (recommendations.length >= 3) confidenceScore = 0.9;
      else if (recommendations.length >= 2) confidenceScore = 0.75;
      else confidenceScore = 0.6;

      res.json({
        recommendations,
        occasionTips,
        stylingAdvice,
        culturalSignificance,
        confidenceScore
      });

    } catch (error) {
      console.error("Error generating recommendations:", error);
      res.status(500).json({ message: "Failed to generate recommendations" });
    }
  });

  // Gullak Routes
  
  // Get current gold rates
  app.get("/api/gullak/gold-rates", async (req, res) => {
    try {
      const currentRates = await storage.getCurrentGoldRates();
      if (!currentRates) {
        const defaultRates = {
          rate24k: "7200",
          rate22k: "6600", 
          rate18k: "5400",
          currency: "INR",
          source: "manual",
        };
        const newRates = await storage.createGoldRate(defaultRates);
        return res.json(newRates);
      }
      res.json(currentRates);
    } catch (error) {
      console.error("Error fetching gold rates:", error);
      res.status(500).json({ message: "Failed to fetch gold rates" });
    }
  });

  // Get user's Gullak accounts
  app.get("/api/gullak/accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accounts = await storage.getGullakAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching Gullak accounts:", error);
      res.status(500).json({ message: "Failed to fetch Gullak accounts" });
    }
  });

  // Create Gullak account
  app.post("/api/gullak/accounts", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const accountData = {
        ...req.body,
        userId,
        nextPaymentDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
      };
      
      const account = await storage.createGullakAccount(accountData);
      res.json(account);
    } catch (error) {
      console.error("Error creating Gullak account:", error);
      res.status(500).json({ message: "Failed to create Gullak account" });
    }
  });

  // Update Gullak account
  app.patch("/api/gullak/accounts/:id", isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const userId = req.user.claims.sub;
      
      const account = await storage.getGullakAccount(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Gullak account not found" });
      }

      const updatedAccount = await storage.updateGullakAccount(accountId, req.body);
      res.json(updatedAccount);
    } catch (error) {
      console.error("Error updating Gullak account:", error);
      res.status(500).json({ message: "Failed to update Gullak account" });
    }
  });

  // Get Gullak transactions
  app.get("/api/gullak/transactions/:accountId", isAuthenticated, async (req: any, res) => {
    try {
      const accountId = parseInt(req.params.accountId);
      const userId = req.user.claims.sub;
      
      const account = await storage.getGullakAccount(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Gullak account not found" });
      }

      const transactions = await storage.getGullakTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching Gullak transactions:", error);
      res.status(500).json({ message: "Failed to fetch Gullak transactions" });
    }
  });

  // Create Gullak transaction
  app.post("/api/gullak/transactions", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gullakAccountId, amount, type, description } = req.body;
      
      const account = await storage.getGullakAccount(gullakAccountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Gullak account not found" });
      }

      const goldRates = await storage.getCurrentGoldRates();
      const goldRate = goldRates?.rate24k || "7200";
      const goldValue = (parseFloat(amount) / parseFloat(goldRate)).toFixed(3);

      const transactionData = {
        gullakAccountId,
        userId,
        amount,
        type,
        description,
        goldRate,
        goldValue,
      };

      const transaction = await storage.createGullakTransaction(transactionData);
      
      const newBalance = (parseFloat(account.currentBalance || "0") + parseFloat(amount)).toString();
      await storage.updateGullakAccount(gullakAccountId, { 
        currentBalance: newBalance,
        updatedAt: new Date()
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error creating Gullak transaction:", error);
      res.status(500).json({ message: "Failed to create transaction" });
    }
  });

  // Get Gullak orders
  app.get("/api/gullak/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const orders = await storage.getGullakOrders(userId);
      res.json(orders);
    } catch (error) {
      console.error("Error fetching Gullak orders:", error);
      res.status(500).json({ message: "Failed to fetch Gullak orders" });
    }
  });

  // Create Gullak order
  app.post("/api/gullak/orders", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { gullakAccountId, goldWeight, goldPurity, coinType, deliveryAddress } = req.body;
      
      const account = await storage.getGullakAccount(gullakAccountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Gullak account not found" });
      }

      if (parseFloat(account.currentBalance || "0") < parseFloat(account.targetAmount)) {
        return res.status(400).json({ message: "Insufficient balance to place order" });
      }

      const orderData = {
        gullakAccountId,
        userId,
        goldWeight,
        goldPurity,
        coinType,
        deliveryAddress,
        amountUsed: account.targetAmount,
      };

      const order = await storage.createGullakOrder(orderData);
      
      await storage.updateGullakAccount(gullakAccountId, {
        status: "completed",
        completedAt: new Date(),
        updatedAt: new Date()
      });

      res.json(order);
    } catch (error) {
      console.error("Error creating Gullak order:", error);
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  // Admin Gullak management
  app.get("/api/admin/gullak/orders", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orders = await storage.getGullakOrders();
      res.json(orders);
    } catch (error) {
      console.error("Error fetching all Gullak orders:", error);
      res.status(500).json({ message: "Failed to fetch orders" });
    }
  });

  app.patch("/api/admin/gullak/orders/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const orderId = parseInt(req.params.id);
      const updatedOrder = await storage.updateGullakOrderStatus(orderId, req.body.status);
      res.json(updatedOrder);
    } catch (error) {
      console.error("Error updating Gullak order:", error);
      res.status(500).json({ message: "Failed to update order" });
    }
  });

  app.post("/api/gullak/gold-rates", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== "admin") {
        return res.status(403).json({ message: "Admin access required" });
      }

      const goldRate = await storage.createGoldRate(req.body);
      res.json(goldRate);
    } catch (error) {
      console.error("Error creating gold rate:", error);
      res.status(500).json({ message: "Failed to create gold rate" });
    }
  });

  // Orders - Admin exclusive execution
  app.post('/api/orders', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can execute orders" });
      }

      const { orderData, items } = req.body;
      const orderDataParsed = insertOrderSchema.parse(orderData);
      const itemsParsed = items.map((item: any) => insertOrderItemSchema.parse(item));
      
      const order = await storage.createOrder(orderDataParsed, itemsParsed);
      res.status(201).json(order);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      res.status(500).json({ message: "Failed to create order" });
    }
  });

  app.put('/api/orders/:id/status', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can update order status" });
      }

      const { status } = req.body;
      const order = await storage.updateOrderStatus(parseInt(req.params.id), status);
      res.json(order);
    } catch (error) {
      res.status(500).json({ message: "Failed to update order status" });
    }
  });

  // Loyalty System API Routes
  
  // Get all loyalty badges
  app.get('/api/loyalty/badges', isAuthenticated, async (req: any, res) => {
    try {
      const { category, rarity, isActive } = req.query;
      const filters: any = {};
      if (category) filters.category = category;
      if (rarity) filters.rarity = rarity;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const badges = await storage.getLoyaltyBadges(filters);
      res.json(badges);
    } catch (error) {
      console.error("Error fetching loyalty badges:", error);
      res.status(500).json({ message: "Failed to fetch loyalty badges" });
    }
  });

  // Get user's badge collection
  app.get('/api/loyalty/user-badges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userBadges = await storage.getUserBadges(userId);
      res.json(userBadges);
    } catch (error) {
      console.error("Error fetching user badges:", error);
      res.status(500).json({ message: "Failed to fetch user badges" });
    }
  });

  // Get user's loyalty profile
  app.get('/api/loyalty/profile', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      let profile = await storage.getLoyaltyProfile(userId);
      
      // Create profile if it doesn't exist
      if (!profile) {
        profile = await storage.createLoyaltyProfile({
          userId,
          totalPoints: 0,
          availablePoints: 0,
          tier: "bronze",
          tierProgress: 0,
          streak: 0,
          lastActivity: new Date(),
          joinedAt: new Date(),
          lifetimeSpent: "0.00",
        });
      }
      
      res.json(profile);
    } catch (error) {
      console.error("Error fetching loyalty profile:", error);
      res.status(500).json({ message: "Failed to fetch loyalty profile" });
    }
  });

  // Get loyalty transactions
  app.get('/api/loyalty/transactions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const limit = req.query.limit ? parseInt(req.query.limit) : 50;
      const transactions = await storage.getLoyaltyTransactions(userId, limit);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching loyalty transactions:", error);
      res.status(500).json({ message: "Failed to fetch loyalty transactions" });
    }
  });

  // Award points (admin only)
  app.post('/api/loyalty/award-points', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can award points" });
      }

      const { userId, points, source, description, metadata } = req.body;
      const transaction = await storage.addLoyaltyPoints(userId, points, source, description, metadata);
      res.json(transaction);
    } catch (error) {
      console.error("Error awarding points:", error);
      res.status(500).json({ message: "Failed to award points" });
    }
  });

  // Award badge (admin only)
  app.post('/api/loyalty/award-badge', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can award badges" });
      }

      const { userId, badgeId, level } = req.body;
      const userBadge = await storage.awardBadge(userId, badgeId, level);
      res.json(userBadge);
    } catch (error) {
      console.error("Error awarding badge:", error);
      res.status(500).json({ message: "Failed to award badge" });
    }
  });

  // Mark badge as viewed
  app.post('/api/loyalty/mark-badge-viewed', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { badgeId } = req.body;
      const success = await storage.markBadgeAsViewed(userId, badgeId);
      res.json({ success });
    } catch (error) {
      console.error("Error marking badge as viewed:", error);
      res.status(500).json({ message: "Failed to mark badge as viewed" });
    }
  });

  // Get loyalty challenges
  app.get('/api/loyalty/challenges', isAuthenticated, async (req: any, res) => {
    try {
      const { type, isActive } = req.query;
      const filters: any = {};
      if (type) filters.type = type;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const challenges = await storage.getLoyaltyChallenges(filters);
      res.json(challenges);
    } catch (error) {
      console.error("Error fetching loyalty challenges:", error);
      res.status(500).json({ message: "Failed to fetch loyalty challenges" });
    }
  });

  // Get user challenges
  app.get('/api/loyalty/user-challenges', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const userChallenges = await storage.getUserChallenges(userId);
      res.json(userChallenges);
    } catch (error) {
      console.error("Error fetching user challenges:", error);
      res.status(500).json({ message: "Failed to fetch user challenges" });
    }
  });

  // Get loyalty rewards
  app.get('/api/loyalty/rewards', isAuthenticated, async (req: any, res) => {
    try {
      const { type, tierRequired, isActive } = req.query;
      const filters: any = {};
      if (type) filters.type = type;
      if (tierRequired) filters.tierRequired = tierRequired;
      if (isActive !== undefined) filters.isActive = isActive === 'true';
      
      const rewards = await storage.getLoyaltyRewards(filters);
      res.json(rewards);
    } catch (error) {
      console.error("Error fetching loyalty rewards:", error);
      res.status(500).json({ message: "Failed to fetch loyalty rewards" });
    }
  });

  // Redeem reward
  app.post('/api/loyalty/redeem-reward', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const { rewardId } = req.body;
      const redemption = await storage.redeemReward(userId, rewardId);
      res.json(redemption);
    } catch (error) {
      console.error("Error redeeming reward:", error);
      if (error instanceof Error) {
        res.status(400).json({ message: error.message });
      } else {
        res.status(500).json({ message: "Failed to redeem reward" });
      }
    }
  });

  // Get user redemptions
  app.get('/api/loyalty/user-redemptions', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const redemptions = await storage.getUserRedemptions(userId);
      res.json(redemptions);
    } catch (error) {
      console.error("Error fetching user redemptions:", error);
      res.status(500).json({ message: "Failed to fetch user redemptions" });
    }
  });

  // Admin: Create loyalty badge
  app.post('/api/loyalty/badges', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can create badges" });
      }

      const badge = await storage.createLoyaltyBadge(req.body);
      res.status(201).json(badge);
    } catch (error) {
      console.error("Error creating loyalty badge:", error);
      res.status(500).json({ message: "Failed to create loyalty badge" });
    }
  });

  // Admin: Update loyalty badge
  app.put('/api/loyalty/badges/:id', isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (user?.role !== 'admin') {
        return res.status(403).json({ message: "Only admin can update badges" });
      }

      const badgeId = parseInt(req.params.id);
      const badge = await storage.updateLoyaltyBadge(badgeId, req.body);
      res.json(badge);
    } catch (error) {
      console.error("Error updating loyalty badge:", error);
      res.status(500).json({ message: "Failed to update loyalty badge" });
    }
  });

  // Jewelry Care Tutorial routes
  app.get("/api/jewelry-care/tutorials", async (req, res) => {
    try {
      const { category, jewelryType, difficulty, search } = req.query;
      const userId = req.user?.claims?.sub;
      
      const tutorials = await storage.getCareTutorials({
        category: category as string,
        jewelryType: jewelryType as string,
        difficulty: difficulty as string,
        search: search as string,
        userId,
      });
      
      res.json(tutorials);
    } catch (error) {
      console.error("Error fetching care tutorials:", error);
      res.status(500).json({ message: "Failed to fetch tutorials" });
    }
  });

  app.get("/api/jewelry-care/tutorials/:id", async (req, res) => {
    try {
      const tutorialId = parseInt(req.params.id);
      const tutorial = await storage.getCareTutorial(tutorialId);
      
      if (!tutorial) {
        return res.status(404).json({ message: "Tutorial not found" });
      }
      
      res.json(tutorial);
    } catch (error) {
      console.error("Error fetching tutorial:", error);
      res.status(500).json({ message: "Failed to fetch tutorial" });
    }
  });

  app.post("/api/jewelry-care/progress", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const { tutorialId, currentStep, isCompleted } = req.body;
      
      const progress = await storage.updateTutorialProgress(userId, tutorialId, {
        currentStep,
        isCompleted,
      });
      
      res.json(progress);
    } catch (error) {
      console.error("Error updating tutorial progress:", error);
      res.status(500).json({ message: "Failed to update progress" });
    }
  });

  app.post("/api/jewelry-care/tutorials/:id/like", async (req, res) => {
    try {
      const tutorialId = parseInt(req.params.id);
      const tutorial = await storage.likeTutorial(tutorialId);
      res.json(tutorial);
    } catch (error) {
      console.error("Error liking tutorial:", error);
      res.status(500).json({ message: "Failed to like tutorial" });
    }
  });

  app.get("/api/jewelry-care/reminders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminders = await storage.getCareReminders(userId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching care reminders:", error);
      res.status(500).json({ message: "Failed to fetch reminders" });
    }
  });

  app.post("/api/jewelry-care/reminders", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.claims.sub;
      const reminderData = { ...req.body, userId };
      
      const reminder = await storage.createCareReminder(reminderData);
      res.json(reminder);
    } catch (error) {
      console.error("Error creating care reminder:", error);
      res.status(500).json({ message: "Failed to create reminder" });
    }
  });

  // Admin tutorial management routes
  app.post("/api/admin/jewelry-care/tutorials", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tutorial = await storage.createCareTutorial(req.body);
      res.json(tutorial);
    } catch (error) {
      console.error("Error creating tutorial:", error);
      res.status(500).json({ message: "Failed to create tutorial" });
    }
  });

  app.put("/api/admin/jewelry-care/tutorials/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tutorialId = parseInt(req.params.id);
      const tutorial = await storage.updateCareTutorial(tutorialId, req.body);
      res.json(tutorial);
    } catch (error) {
      console.error("Error updating tutorial:", error);
      res.status(500).json({ message: "Failed to update tutorial" });
    }
  });

  app.delete("/api/admin/jewelry-care/tutorials/:id", isAuthenticated, async (req, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const tutorialId = parseInt(req.params.id);
      const success = await storage.deleteCareTutorial(tutorialId);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting tutorial:", error);
      res.status(500).json({ message: "Failed to delete tutorial" });
    }
  });

  // Jewelry Exchange routes
  app.get("/api/exchange/requests", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const filters: any = {};
      
      // Regular users can only see their own requests
      if (user.role !== 'admin') {
        filters.userId = user.id;
      }

      // Add query filters
      if (req.query.status) {
        filters.status = req.query.status;
      }
      if (req.query.limit) {
        filters.limit = parseInt(req.query.limit as string);
      }
      if (req.query.offset) {
        filters.offset = parseInt(req.query.offset as string);
      }

      const requests = await storage.getExchangeRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching exchange requests:", error);
      res.status(500).json({ message: "Failed to fetch exchange requests" });
    }
  });

  app.get("/api/exchange/requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestId = parseInt(req.params.id);
      const exchangeRequest = await storage.getExchangeRequest(requestId);
      
      if (!exchangeRequest) {
        return res.status(404).json({ message: "Exchange request not found" });
      }

      // Users can only view their own requests, admins can view all
      if (user.role !== 'admin' && exchangeRequest.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      res.json(exchangeRequest);
    } catch (error) {
      console.error("Error fetching exchange request:", error);
      res.status(500).json({ message: "Failed to fetch exchange request" });
    }
  });

  app.post("/api/exchange/requests", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestData = {
        userId: user.id,
        orderId: req.body.orderId,
        jewelryPhotoUrl: req.body.jewelryPhotoUrl,
        billPhotoUrl: req.body.billPhotoUrl,
        description: req.body.description,
        estimatedValue: req.body.estimatedValue,
        status: "pending" as const,
      };

      const exchangeRequest = await storage.createExchangeRequest(requestData);
      
      // Create notification for admin
      await storage.createExchangeNotification({
        userId: user.id,
        type: "request_submitted",
        message: `New jewelry exchange request submitted by ${user.firstName || user.email}`,
        metadata: { exchangeRequestId: exchangeRequest.id },
      });

      res.status(201).json(exchangeRequest);
    } catch (error) {
      console.error("Error creating exchange request:", error);
      res.status(500).json({ message: "Failed to create exchange request" });
    }
  });

  app.patch("/api/exchange/requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestId = parseInt(req.params.id);
      const exchangeRequest = await storage.getExchangeRequest(requestId);
      
      if (!exchangeRequest) {
        return res.status(404).json({ message: "Exchange request not found" });
      }

      // Users can only edit their own pending requests
      if (user.role !== 'admin' && exchangeRequest.userId !== user.id) {
        return res.status(403).json({ message: "Access denied" });
      }

      if (user.role !== 'admin' && exchangeRequest.status !== 'pending') {
        return res.status(400).json({ message: "Cannot edit request that has been reviewed" });
      }

      const updatedRequest = await storage.updateExchangeRequest(requestId, req.body);
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating exchange request:", error);
      res.status(500).json({ message: "Failed to update exchange request" });
    }
  });

  app.post("/api/exchange/requests/:id/approve", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const requestId = parseInt(req.params.id);
      const { adminAssignedValue, adminNotes } = req.body;

      if (!adminAssignedValue) {
        return res.status(400).json({ message: "Admin assigned value is required" });
      }

      const exchangeRequest = await storage.approveExchangeRequest(
        requestId,
        adminAssignedValue,
        user.id,
        adminNotes
      );

      // Create notification for user
      await storage.createExchangeNotification({
        userId: exchangeRequest.userId,
        type: "request_approved",
        message: `Your jewelry exchange request has been approved with a value of ₹${adminAssignedValue}`,
        metadata: { exchangeRequestId: exchangeRequest.id, approvedValue: adminAssignedValue },
      });

      res.json(exchangeRequest);
    } catch (error) {
      console.error("Error approving exchange request:", error);
      res.status(500).json({ message: "Failed to approve exchange request" });
    }
  });

  app.post("/api/exchange/requests/:id/reject", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ message: "Admin access required" });
      }

      const requestId = parseInt(req.params.id);
      const { rejectionReason } = req.body;

      if (!rejectionReason) {
        return res.status(400).json({ message: "Rejection reason is required" });
      }

      const exchangeRequest = await storage.rejectExchangeRequest(
        requestId,
        rejectionReason,
        user.id
      );

      // Create notification for user
      await storage.createExchangeNotification({
        userId: exchangeRequest.userId,
        type: "request_rejected",
        message: `Your jewelry exchange request has been rejected: ${rejectionReason}`,
        metadata: { exchangeRequestId: exchangeRequest.id, rejectionReason },
      });

      res.json(exchangeRequest);
    } catch (error) {
      console.error("Error rejecting exchange request:", error);
      res.status(500).json({ message: "Failed to reject exchange request" });
    }
  });

  app.delete("/api/exchange/requests/:id", isAuthenticated, async (req: any, res) => {
    try {
      const user = await storage.getUser(req.user.claims.sub);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      const requestId = parseInt(req.params.id);
      const exchangeRequest = await storage.getExchangeRequest(requestId);
      
      if (!exchangeRequest) {
        return res.status(404).json({ message: "Exchange request not found" });
      }

      // Users can only delete their own pending requests, admins can delete any
      if (user.role !== 'admin') {
        if (exchangeRequest.userId !== user.id || exchangeRequest.status !== 'pending') {
          return res.status(403).json({ message: "Access denied" });
        }
      }

      const success = await storage.deleteExchangeRequest(requestId);
      res.json({ success });
    } catch (error) {
      console.error("Error deleting exchange request:", error);
      res.status(500).json({ message: "Failed to delete exchange request" });
    }
  });

  // Real-time Currency Converter API
  app.get('/api/currency/rates', async (req, res) => {
    try {
      const { base = 'INR', currencies = 'USD,EUR,GBP,AED' } = req.query;
      
      // Use ExchangeRate-API for live exchange rates
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${base}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      
      // Filter to only requested currencies
      const requestedCurrencies = currencies.toString().split(',');
      const filteredRates = Object.fromEntries(
        Object.entries(data.rates).filter(([key]) => 
          requestedCurrencies.includes(key) || key === base
        )
      );
      
      res.json({
        base: data.base,
        date: data.date,
        rates: filteredRates,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error fetching exchange rates:', error);
      
      // Fallback rates for development
      const fallbackRates = {
        base: 'INR',
        date: new Date().toISOString().split('T')[0],
        rates: {
          INR: 1,
          USD: 0.012,
          EUR: 0.011,
          GBP: 0.0095,
          AED: 0.044
        },
        timestamp: new Date().toISOString(),
        fallback: true
      };
      
      res.json(fallbackRates);
    }
  });

  // Convert currency amounts
  app.post('/api/currency/convert', async (req, res) => {
    try {
      const { amount, from, to } = req.body;
      
      if (!amount || !from || !to) {
        return res.status(400).json({ 
          message: 'Amount, from currency, and to currency are required' 
        });
      }
      
      const response = await fetch(`https://api.exchangerate-api.com/v4/latest/${from}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch exchange rates');
      }
      
      const data = await response.json();
      const rate = data.rates[to];
      
      if (!rate) {
        return res.status(400).json({ 
          message: `Exchange rate not found for ${from} to ${to}` 
        });
      }
      
      const convertedAmount = parseFloat(amount) * rate;
      
      res.json({
        amount: parseFloat(amount),
        from,
        to,
        rate,
        convertedAmount: Math.round(convertedAmount * 100) / 100,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      console.error('Error converting currency:', error);
      res.status(500).json({ message: 'Failed to convert currency' });
    }
  });

  // Get historical rates (last 7 days)
  app.get('/api/currency/historical/:base', async (req, res) => {
    try {
      const { base } = req.params;
      const { currencies = 'USD,EUR,GBP,AED' } = req.query;
      
      const historicalData = [];
      const requestedCurrencies = currencies.toString().split(',');
      
      // Get data for last 7 days
      for (let i = 0; i < 7; i++) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dateStr = date.toISOString().split('T')[0];
        
        try {
          const response = await fetch(`https://api.exchangerate-api.com/v4/history/${base}/${dateStr}`);
          
          if (response.ok) {
            const data = await response.json();
            const filteredRates = Object.fromEntries(
              Object.entries(data.rates).filter(([key]) => 
                requestedCurrencies.includes(key)
              )
            );
            
            historicalData.push({
              date: dateStr,
              rates: filteredRates
            });
          }
        } catch (error) {
          console.error(`Error fetching historical data for ${dateStr}:`, error);
        }
      }
      
      res.json({
        base,
        data: historicalData.reverse() // Oldest first
      });
    } catch (error) {
      console.error('Error fetching historical rates:', error);
      res.status(500).json({ message: 'Failed to fetch historical rates' });
    }
  });

  // Gullak API endpoints
  app.post("/api/gullak", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const accountData = {
        ...req.body,
        userId,
        currentBalance: "0",
        status: "active",
        totalPayments: 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      const newAccount = await storage.createGullakAccount(accountData);
      res.json(newAccount);
    } catch (error) {
      console.error("Error creating Gullak account:", error);
      res.status(500).json({ message: "Failed to create Gullak account" });
    }
  });

  app.get("/api/gullak", isAuthenticated, async (req, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!userId) {
        return res.status(401).json({ message: "User not authenticated" });
      }

      const accounts = await storage.getGullakAccounts(userId);
      res.json(accounts);
    } catch (error) {
      console.error("Error fetching Gullak accounts:", error);
      res.status(500).json({ message: "Failed to fetch Gullak accounts" });
    }
  });

  app.get("/api/gullak/:id/transactions", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const transactions = await storage.getGullakTransactions(accountId);
      res.json(transactions);
    } catch (error) {
      console.error("Error fetching transactions:", error);
      res.status(500).json({ message: "Failed to fetch transactions" });
    }
  });

  app.post("/api/gullak/:id/manual-payment", isAuthenticated, async (req, res) => {
    try {
      const accountId = parseInt(req.params.id);
      const { amount } = req.body;
      const userId = req.user?.claims?.sub;

      const account = await storage.getGullakAccount(accountId);
      if (!account || account.userId !== userId) {
        return res.status(404).json({ message: "Account not found" });
      }

      const goldRates = await storage.getCurrentGoldRates();
      const metalRate = account.metalType === "gold" ? goldRates.rate24k : goldRates.silverRate || "85";
      const goldValue = (parseFloat(amount) / parseFloat(metalRate)).toFixed(6);

      const transaction = await storage.createGullakTransaction({
        gullakAccountId: accountId,
        userId,
        amount,
        type: "manual_pay",
        goldRate: metalRate,
        goldValue,
        description: "Manual payment",
        status: "completed",
        transactionDate: new Date()
      });

      const currentBalance = parseFloat(account.currentBalance || "0");
      const newBalance = currentBalance + parseFloat(amount);
      
      await storage.updateGullakAccount(accountId, {
        currentBalance: newBalance.toString(),
        lastPaymentDate: new Date(),
        totalPayments: (account.totalPayments || 0) + 1
      });

      res.json(transaction);
    } catch (error) {
      console.error("Error processing manual payment:", error);
      res.status(500).json({ message: "Failed to process payment" });
    }
  });

  // Corporate Tie-up API Routes
  
  // Corporate registration endpoints
  app.post('/api/corporate/register', async (req, res) => {
    try {
      const validatedData = insertCorporateRegistrationSchema.parse(req.body);
      const registration = await storage.createCorporateRegistration(validatedData);
      res.json(registration);
    } catch (error) {
      console.error("Error creating corporate registration:", error);
      res.status(400).json({ message: "Failed to create corporate registration" });
    }
  });

  app.get('/api/corporate/registrations', isAuthenticated, async (req, res) => {
    try {
      const registrations = await storage.getCorporateRegistrations();
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching corporate registrations:", error);
      res.status(500).json({ message: "Failed to fetch corporate registrations" });
    }
  });

  app.get('/api/corporate/registrations/:id', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.getCorporateRegistration(id);
      if (!registration) {
        return res.status(404).json({ message: "Corporate registration not found" });
      }
      res.json(registration);
    } catch (error) {
      console.error("Error fetching corporate registration:", error);
      res.status(500).json({ message: "Failed to fetch corporate registration" });
    }
  });

  app.patch('/api/corporate/registrations/:id/approve', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const userId = (req.user as any).claims.sub;
      const registration = await storage.approveCorporateRegistration(id, userId);
      res.json(registration);
    } catch (error) {
      console.error("Error approving corporate registration:", error);
      res.status(500).json({ message: "Failed to approve corporate registration" });
    }
  });

  app.patch('/api/corporate/registrations/:id/reject', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const registration = await storage.rejectCorporateRegistration(id);
      res.json(registration);
    } catch (error) {
      console.error("Error rejecting corporate registration:", error);
      res.status(500).json({ message: "Failed to reject corporate registration" });
    }
  });

  // Corporate user management
  app.post('/api/corporate/users', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertCorporateUserSchema.parse(req.body);
      const corporateUser = await storage.createCorporateUser(validatedData);
      res.json(corporateUser);
    } catch (error) {
      console.error("Error creating corporate user:", error);
      res.status(400).json({ message: "Failed to create corporate user" });
    }
  });

  app.get('/api/corporate/:corporateId/users', isAuthenticated, async (req, res) => {
    try {
      const corporateId = parseInt(req.params.corporateId);
      const users = await storage.getCorporateUsersByCompany(corporateId);
      res.json(users);
    } catch (error) {
      console.error("Error fetching corporate users:", error);
      res.status(500).json({ message: "Failed to fetch corporate users" });
    }
  });

  // Employee benefits endpoints
  app.post('/api/corporate/benefits', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertEmployeeBenefitSchema.parse(req.body);
      const benefit = await storage.createEmployeeBenefit(validatedData);
      res.json(benefit);
    } catch (error) {
      console.error("Error creating employee benefit:", error);
      res.status(400).json({ message: "Failed to create employee benefit" });
    }
  });

  app.get('/api/corporate/benefits/user/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const corporateId = parseInt(req.query.corporateId as string);
      const benefit = await storage.getEmployeeBenefit(userId, corporateId);
      res.json(benefit);
    } catch (error) {
      console.error("Error fetching employee benefit:", error);
      res.status(500).json({ message: "Failed to fetch employee benefit" });
    }
  });

  app.get('/api/corporate/:corporateId/benefits', isAuthenticated, async (req, res) => {
    try {
      const corporateId = parseInt(req.params.corporateId);
      const benefits = await storage.getEmployeeBenefitsByCorporate(corporateId);
      res.json(benefits);
    } catch (error) {
      console.error("Error fetching corporate benefits:", error);
      res.status(500).json({ message: "Failed to fetch corporate benefits" });
    }
  });

  // Corporate code verification for employees
  app.post('/api/corporate/verify-code', async (req, res) => {
    try {
      const { corporateCode } = req.body;
      const registration = await db.select()
        .from(corporateRegistrations)
        .where(and(
          eq(corporateRegistrations.corporateCode, corporateCode),
          eq(corporateRegistrations.status, "approved")
        ));
      
      if (!registration.length) {
        return res.status(404).json({ message: "Invalid or inactive corporate code" });
      }
      
      res.json({ 
        valid: true, 
        corporate: registration[0],
        benefits: {
          discountPercentage: registration[0].discountPercentage,
          maintenanceEnabled: true
        }
      });
    } catch (error) {
      console.error("Error verifying corporate code:", error);
      res.status(500).json({ message: "Failed to verify corporate code" });
    }
  });

  // Employee maintenance enrollment
  app.post('/api/corporate/maintenance/enroll', isAuthenticated, async (req, res) => {
    try {
      const userId = (req.user as any).claims.sub;
      const { corporateCode, employeeId } = req.body;
      
      // Verify corporate code
      const [corporate] = await db.select()
        .from(corporateRegistrations)
        .where(and(
          eq(corporateRegistrations.corporateCode, corporateCode),
          eq(corporateRegistrations.status, "approved")
        ));
      
      if (!corporate) {
        return res.status(404).json({ message: "Invalid corporate code" });
      }

      // Create or update employee benefit
      const existingBenefit = await storage.getEmployeeBenefit(userId, corporate.id);
      
      if (existingBenefit) {
        const updatedBenefit = await storage.updateEmployeeBenefit(existingBenefit.id, {
          maintenanceEnrolled: true,
          employeeId
        });
        res.json(updatedBenefit);
      } else {
        const benefit = await storage.createEmployeeBenefit({
          corporateId: corporate.id,
          userId,
          employeeId,
          maintenanceEnrolled: true
        });
        res.json(benefit);
      }
    } catch (error) {
      console.error("Error enrolling in maintenance:", error);
      res.status(500).json({ message: "Failed to enroll in maintenance program" });
    }
  });

  // Maintenance scheduling endpoints
  app.post('/api/corporate/maintenance/schedule', isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertMaintenanceScheduleSchema.parse(req.body);
      const schedule = await storage.createMaintenanceSchedule(validatedData);
      res.json(schedule);
    } catch (error) {
      console.error("Error creating maintenance schedule:", error);
      res.status(400).json({ message: "Failed to create maintenance schedule" });
    }
  });

  app.get('/api/corporate/maintenance/schedules', isAuthenticated, async (req, res) => {
    try {
      const schedules = await storage.getMaintenanceSchedules();
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching maintenance schedules:", error);
      res.status(500).json({ message: "Failed to fetch maintenance schedules" });
    }
  });

  app.get('/api/corporate/maintenance/user/:userId', isAuthenticated, async (req, res) => {
    try {
      const userId = req.params.userId;
      const schedules = await storage.getMaintenanceSchedulesByUser(userId);
      res.json(schedules);
    } catch (error) {
      console.error("Error fetching user maintenance schedules:", error);
      res.status(500).json({ message: "Failed to fetch user maintenance schedules" });
    }
  });

  app.patch('/api/corporate/maintenance/:id/complete', isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const completedBy = (req.user as any).claims.sub;
      const { notes } = req.body;
      
      const schedule = await storage.updateMaintenanceSchedule(id, {
        status: "completed",
        completedAt: new Date(),
        completedBy,
        notes
      });
      
      res.json(schedule);
    } catch (error) {
      console.error("Error completing maintenance:", error);
      res.status(500).json({ message: "Failed to complete maintenance" });
    }
  });

  // Corporate offers management
  app.post('/api/corporate/:corporateId/offers', isAuthenticated, async (req, res) => {
    try {
      const corporateId = parseInt(req.params.corporateId);
      const validatedData = insertCorporateOfferSchema.parse({
        ...req.body,
        corporateId
      });
      const offer = await storage.createCorporateOffer(validatedData);
      res.json(offer);
    } catch (error) {
      console.error("Error creating corporate offer:", error);
      res.status(400).json({ message: "Failed to create corporate offer" });
    }
  });

  app.get('/api/corporate/:corporateId/offers', async (req, res) => {
    try {
      const corporateId = parseInt(req.params.corporateId);
      const offers = await storage.getCorporateOffers(corporateId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching corporate offers:", error);
      res.status(500).json({ message: "Failed to fetch corporate offers" });
    }
  });

  app.get('/api/corporate/:corporateId/offers/active', async (req, res) => {
    try {
      const corporateId = parseInt(req.params.corporateId);
      const offers = await storage.getActiveCorporateOffers(corporateId);
      res.json(offers);
    } catch (error) {
      console.error("Error fetching active corporate offers:", error);
      res.status(500).json({ message: "Failed to fetch active corporate offers" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
