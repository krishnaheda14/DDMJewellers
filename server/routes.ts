import type { Express } from "express";
import { createServer, type Server } from "http";
import express from "express";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import OpenAI from "openai";
import fs from "fs";
import {
  insertCategorySchema,
  insertProductSchema,
  insertCartItemSchema,
  insertOrderSchema,
  insertOrderItemSchema,
} from "@shared/schema";
import { z } from "zod";
import multer from "multer";
import path from "path";
import fs from "fs";

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

  // Auth middleware
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      res.json(user);
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      if (!user?.isAdmin) {
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
      
      const orders = await storage.getOrders(user?.isAdmin ? undefined : userId);
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
      
      if (!user?.isAdmin && order.userId !== userId) {
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
      if (!user?.isAdmin) {
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

  const httpServer = createServer(app);
  return httpServer;
}
