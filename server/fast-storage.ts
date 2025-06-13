import { db } from "./db";
import { sql } from "drizzle-orm";

// In-memory cache for frequently accessed data
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

interface CacheEntry {
  data: any;
  timestamp: number;
}

function getCacheKey(type: string, params?: any): string {
  return `${type}_${JSON.stringify(params || {})}`;
}

function setCache(key: string, data: any): void {
  cache.set(key, {
    data,
    timestamp: Date.now()
  });
}

function getCache(key: string): any | null {
  const entry = cache.get(key) as CacheEntry;
  if (!entry) return null;
  
  if (Date.now() - entry.timestamp > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  
  return entry.data;
}

export class FastStorage {
  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }) {
    const cacheKey = getCacheKey('products', filters);
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const limit = Math.min(filters?.limit || 20, 50);
      const offset = filters?.offset || 0;
      
      let whereClause = 'WHERE in_stock = true';
      const params: any[] = [];
      let paramCount = 1;
      
      if (filters?.categoryId) {
        whereClause += ` AND category_id = $${paramCount}`;
        params.push(filters.categoryId);
        paramCount++;
      }
      
      if (filters?.featured) {
        whereClause += ` AND featured = true`;
      }
      
      if (filters?.search) {
        whereClause += ` AND name ILIKE $${paramCount}`;
        params.push(`%${filters.search}%`);
        paramCount++;
      }
      
      const query = `
        SELECT id, name, description, price, category_id, image_url, 
               material, weight, featured, product_type, created_at
        FROM products 
        ${whereClause}
        ORDER BY featured DESC, created_at DESC 
        LIMIT $${paramCount} OFFSET $${paramCount + 1}
      `;
      
      params.push(limit, offset);
      
      const result = await db.execute(sql.raw(query, ...params));
      const products = result.rows;
      
      setCache(cacheKey, products);
      return products;
      
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async getCategories() {
    const cacheKey = getCacheKey('categories');
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await db.execute(sql`
        SELECT id, name, slug, description, image_url, product_type
        FROM categories 
        ORDER BY name 
        LIMIT 50
      `);
      
      const categories = result.rows;
      setCache(cacheKey, categories);
      return categories;
      
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  async getCartItems(userId: string) {
    try {
      const result = await db.execute(sql`
        SELECT c.id, c.user_id, c.product_id, c.quantity, c.created_at,
               p.id as product_id, p.name, p.price, p.image_url, p.material, p.weight
        FROM cart_items c
        JOIN products p ON c.product_id = p.id
        WHERE c.user_id = ${userId} AND p.in_stock = true
        LIMIT 100
      `);
      
      return result.rows.map(row => ({
        id: row.id,
        userId: row.user_id,
        productId: row.product_id,
        quantity: row.quantity,
        createdAt: row.created_at,
        product: {
          id: row.product_id,
          name: row.name,
          price: row.price,
          imageUrl: row.image_url,
          material: row.material,
          weight: row.weight
        }
      }));
      
    } catch (error) {
      console.error("Error getting cart items:", error);
      return [];
    }
  }

  async getCurrentRates() {
    const cacheKey = getCacheKey('market_rates');
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await db.execute(sql`
        SELECT * FROM market_rates 
        ORDER BY updated_at DESC 
        LIMIT 10
      `);
      
      const rates = result.rows;
      setCache(cacheKey, rates);
      return rates;
      
    } catch (error) {
      console.error("Error getting market rates:", error);
      return [];
    }
  }

  async getUser(id: string) {
    const cacheKey = getCacheKey('user', { id });
    const cached = getCache(cacheKey);
    if (cached) return cached;

    try {
      const result = await db.execute(sql`
        SELECT * FROM users WHERE id = ${id} LIMIT 1
      `);
      
      const user = result.rows[0] || null;
      if (user) {
        setCache(cacheKey, user);
      }
      return user;
      
    } catch (error) {
      console.error("Error getting user:", error);
      return null;
    }
  }

  // Clear cache when data is modified
  clearCache(pattern?: string) {
    if (pattern) {
      const keys = Array.from(cache.keys());
      for (const key of keys) {
        if (key.includes(pattern)) {
          cache.delete(key);
        }
      }
    } else {
      cache.clear();
    }
  }
}

export const fastStorage = new FastStorage();