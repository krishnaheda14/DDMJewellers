import { Express } from "express";
import { Server } from "http";
import { storage } from "./storage-mock";

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

  // User routes (basic)
  app.get("/api/user", (req, res) => {
    if (req.user) {
      res.json(req.user);
    } else {
      res.status(401).json({ error: "Not authenticated" });
    }
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