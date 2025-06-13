import { db } from "./db";
import { 
  users, categories, products, cartItems, orders, orderItems, 
  wholesalerDesigns, wishlist, userMemory, chatConversations, marketRates,
  type User, type UpsertUser, type Category, type InsertCategory,
  type Product, type InsertProduct, type CartItem, type InsertCartItem,
  type Order, type InsertOrder, type OrderItem, type InsertOrderItem,
  type WholesalerDesign, type InsertWholesalerDesign,
  type Wishlist, type InsertWishlist, type UserMemory, type InsertUserMemory,
  type ChatConversation, type MarketRate
} from "@shared/schema";
import { eq, and, ilike, desc, sql } from "drizzle-orm";

export class OptimizedStorage {
  // Fast product queries with proper pagination
  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    try {
      const limit = Math.min(filters?.limit || 20, 100); // Cap at 100 items
      const offset = filters?.offset || 0;
      
      let query = db.select().from(products);

      const whereConditions = [];
      
      if (filters?.categoryId) {
        whereConditions.push(eq(products.categoryId, filters.categoryId));
      }
      
      if (filters?.featured) {
        whereConditions.push(eq(products.featured, true));
      }
      
      if (filters?.search) {
        whereConditions.push(ilike(products.name, `%${filters.search}%`));
      }
      
      // Always filter in-stock products
      whereConditions.push(eq(products.inStock, true));
      
      if (whereConditions.length > 0) {
        query = query.where(and(...whereConditions));
      }
      
      return await query
        .orderBy(desc(products.featured), desc(products.createdAt))
        .limit(limit)
        .offset(offset);
        
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  // Fast categories with minimal data
  async getCategories(): Promise<Category[]> {
    try {
      return await db.select({
        id: categories.id,
        name: categories.name,
        slug: categories.slug,
        description: categories.description,
        imageUrl: categories.imageUrl,
        parentId: categories.parentId,
        productType: categories.productType,
        sortOrder: categories.sortOrder,
        isActive: categories.isActive,
        createdAt: categories.createdAt,
        updatedAt: categories.updatedAt
      })
      .from(categories)
      .where(eq(categories.isActive, true))
      .orderBy(categories.sortOrder, categories.name)
      .limit(50); // Reasonable limit for categories
      
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  // Optimized cart items query
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    try {
      const result = await db.select({
        // Cart item fields
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        // Essential product fields only
        product: {
          id: products.id,
          name: products.name,
          imageUrl: products.imageUrl,
          price: products.price,
          productType: products.productType,
          material: products.material,
          weight: products.weight,
          isActive: products.isActive
        }
      })
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(and(
        eq(cartItems.userId, userId),
        eq(products.isActive, true)
      ))
      .limit(100); // Reasonable cart limit

      return result.map(row => ({
        id: row.id,
        userId: row.userId,
        productId: row.productId,
        quantity: row.quantity,
        createdAt: row.createdAt,
        product: row.product as Product
      }));
      
    } catch (error) {
      console.error("Error getting cart items:", error);
      return [];
    }
  }

  // Fast market rates
  async getCurrentRates(): Promise<MarketRate[]> {
    try {
      return await db.select()
        .from(marketRates)
        .orderBy(desc(marketRates.updatedAt))
        .limit(10); // Most recent rates only
        
    } catch (error) {
      console.error("Error getting market rates:", error);
      return [];
    }
  }

  // Fast user lookup
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select()
        .from(users)
        .where(eq(users.id, id))
        .limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  // Session update with raw SQL for speed
  async updateUserSession(userId: string, sessionToken: string | null, sessionExpiresAt: Date | null): Promise<void> {
    try {
      await db.execute(sql`
        UPDATE users 
        SET session_token = ${sessionToken}, session_expires_at = ${sessionExpiresAt}
        WHERE id = ${userId}
      `);
    } catch (error) {
      console.error("Error updating user session:", error);
      throw error;
    }
  }

  // Bulk operations for better performance
  async bulkCreateProducts(productList: InsertProduct[]): Promise<Product[]> {
    try {
      return await db.insert(products)
        .values(productList)
        .returning();
    } catch (error) {
      console.error("Error bulk creating products:", error);
      throw error;
    }
  }
}

export const optimizedStorage = new OptimizedStorage();