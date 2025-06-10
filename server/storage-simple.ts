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

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  createEmailVerificationToken(token: any): Promise<any>;

  // Category operations
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;

  // Product operations
  getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;

  // Cart operations
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;

  // Order operations
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;

  // Chatbot memory operations
  getUserMemory(userId: string): Promise<UserMemory | undefined>;
  upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory>;
  saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation>;
  getChatHistory(userId: string, limit?: number): Promise<ChatConversation[]>;

  // Wholesaler design operations
  getWholesalerDesigns(filters?: {
    wholesalerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<(WholesalerDesign & { wholesaler: User })[]>;
  getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined>;
  createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign>;
  updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign>;
  approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign>;
  rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign>;
  deleteWholesalerDesign(id: number): Promise<boolean>;

  // Wishlist operations
  getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]>;
  addToWishlist(item: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(id: number): Promise<boolean>;

  // User role operations
  updateUserRole(userId: string, role: string): Promise<User>;
  getWholesalers(approved?: boolean): Promise<User[]>;

  // Market rates operations
  getCurrentRates(): Promise<MarketRate[]>;
  updateMarketRate(metal: string, rate: number): Promise<MarketRate>;

  // Authentication session operations
  updateUserSession(userId: string, sessionToken: string | null, sessionExpiresAt: Date | null): Promise<void>;
}

export class SimpleStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const result = await db.insert(users).values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'customer'
      }).onConflictDoUpdate({
        target: users.email,
        set: {
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role
        }
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const result = await db.select().from(users).where(eq(users.email, email)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<User> {
    try {
      const result = await db.insert(users).values(userData).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async createEmailVerificationToken(tokenData: any): Promise<any> {
    try {
      // Store verification token in the user record
      await db
        .update(users)
        .set({ 
          emailVerificationToken: tokenData.token,
          updatedAt: new Date()
        })
        .where(eq(users.id, tokenData.userId));
      return { userId: tokenData.userId, token: tokenData.token, expiresAt: tokenData.expiresAt };
    } catch (error) {
      console.error("Error creating email verification token:", error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories);
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting category by slug:", error);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const result = await db.insert(categories).values(category).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    try {
      const result = await db.update(categories).set(category).where(eq(categories.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      await db.delete(categories).where(eq(categories.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    try {
      let query = db.select().from(products);
      
      if (filters?.categoryId) {
        query = query.where(eq(products.categoryId, filters.categoryId));
      }
      
      if (filters?.featured) {
        query = query.where(eq(products.featured, true));
      }
      
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }
      
      return await query;
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting product:", error);
      return undefined;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const result = await db.insert(products).values(product).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    try {
      const result = await db.update(products).set(product).where(eq(products.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      await db.delete(products).where(eq(products.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    try {
      const result = await db.select().from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId));
      
      return result.map(row => ({
        ...row.cart_items,
        product: row.products!
      }));
    } catch (error) {
      console.error("Error getting cart items:", error);
      return [];
    }
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    try {
      const result = await db.insert(cartItems).values(item).returning();
      return result[0];
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    try {
      const result = await db.update(cartItems).set({ quantity }).where(eq(cartItems.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  async removeFromCart(id: number): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.id, id));
      return true;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return false;
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      await db.delete(cartItems).where(eq(cartItems.userId, userId));
      return true;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }

  async getOrders(userId?: string): Promise<Order[]> {
    try {
      let query = db.select().from(orders);
      if (userId) {
        query = query.where(eq(orders.userId, userId));
      }
      return await query;
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    try {
      const orderResult = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
      if (!orderResult[0]) return undefined;

      const itemsResult = await db.select().from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id));

      return {
        ...orderResult[0],
        orderItems: itemsResult.map(row => ({
          ...row.order_items,
          product: row.products!
        }))
      };
    } catch (error) {
      console.error("Error getting order:", error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    try {
      const orderResult = await db.insert(orders).values(order).returning();
      const createdOrder = orderResult[0];

      if (items.length > 0) {
        const orderItemsData = items.map(item => ({
          ...item,
          orderId: createdOrder.id
        }));
        await db.insert(orderItems).values(orderItemsData);
      }

      return createdOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    try {
      const result = await db.update(orders).set({ status }).where(eq(orders.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  async getUserMemory(userId: string): Promise<UserMemory | undefined> {
    try {
      const result = await db.select().from(userMemory).where(eq(userMemory.userId, userId)).limit(1);
      return result[0];
    } catch (error) {
      console.error("Error getting user memory:", error);
      return undefined;
    }
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    try {
      const result = await db.insert(userMemory).values({
        userId,
        ...memory
      }).onConflictDoUpdate({
        target: userMemory.userId,
        set: memory
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error upserting user memory:", error);
      throw error;
    }
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    try {
      const result = await db.insert(chatConversations).values({
        userId,
        sessionId,
        messages
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error saving chat conversation:", error);
      throw error;
    }
  }

  async getChatHistory(userId: string, limit: number = 5): Promise<ChatConversation[]> {
    try {
      return await db.select().from(chatConversations)
        .where(eq(chatConversations.userId, userId))
        .orderBy(desc(chatConversations.createdAt))
        .limit(limit);
    } catch (error) {
      console.error("Error getting chat history:", error);
      return [];
    }
  }

  async getWholesalerDesigns(filters?: {
    wholesalerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<(WholesalerDesign & { wholesaler: User })[]> {
    try {
      const result = await db.select().from(wholesalerDesigns)
        .leftJoin(users, eq(wholesalerDesigns.wholesalerId, users.id));
      
      return result.map(row => ({
        ...row.wholesaler_designs,
        wholesaler: row.users!
      }));
    } catch (error) {
      console.error("Error getting wholesaler designs:", error);
      return [];
    }
  }

  async getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined> {
    try {
      const result = await db.select().from(wholesalerDesigns)
        .leftJoin(users, eq(wholesalerDesigns.wholesalerId, users.id))
        .where(eq(wholesalerDesigns.id, id))
        .limit(1);
      
      if (!result[0]) return undefined;
      
      return {
        ...result[0].wholesaler_designs,
        wholesaler: result[0].users!
      };
    } catch (error) {
      console.error("Error getting wholesaler design:", error);
      return undefined;
    }
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    try {
      const result = await db.insert(wholesalerDesigns).values(design).returning();
      return result[0];
    } catch (error) {
      console.error("Error creating wholesaler design:", error);
      throw error;
    }
  }

  async updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign> {
    try {
      const result = await db.update(wholesalerDesigns).set(design).where(eq(wholesalerDesigns.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating wholesaler design:", error);
      throw error;
    }
  }

  async approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    try {
      const result = await db.update(wholesalerDesigns).set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }).where(eq(wholesalerDesigns.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error approving wholesaler design:", error);
      throw error;
    }
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    try {
      const result = await db.update(wholesalerDesigns).set({
        status: 'rejected',
        approvedBy,
        approvedAt: new Date()
      }).where(eq(wholesalerDesigns.id, id)).returning();
      return result[0];
    } catch (error) {
      console.error("Error rejecting wholesaler design:", error);
      throw error;
    }
  }

  async deleteWholesalerDesign(id: number): Promise<boolean> {
    try {
      await db.delete(wholesalerDesigns).where(eq(wholesalerDesigns.id, id));
      return true;
    } catch (error) {
      console.error("Error deleting wholesaler design:", error);
      return false;
    }
  }

  async getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]> {
    try {
      const result = await db.select().from(wishlist)
        .leftJoin(products, eq(wishlist.productId, products.id))
        .leftJoin(wholesalerDesigns, eq(wishlist.designId, wholesalerDesigns.id))
        .where(eq(wishlist.userId, userId));
      
      return result.map(row => ({
        ...row.wishlist,
        product: row.products || undefined,
        design: row.wholesaler_designs || undefined
      }));
    } catch (error) {
      console.error("Error getting wishlist:", error);
      return [];
    }
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    try {
      const result = await db.insert(wishlist).values(item).returning();
      return result[0];
    } catch (error) {
      console.error("Error adding to wishlist:", error);
      throw error;
    }
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    try {
      await db.delete(wishlist).where(eq(wishlist.id, id));
      return true;
    } catch (error) {
      console.error("Error removing from wishlist:", error);
      return false;
    }
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    try {
      const result = await db.update(users).set({ role }).where(eq(users.id, userId)).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating user role:", error);
      throw error;
    }
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    try {
      let query = db.select().from(users).where(eq(users.role, 'wholesaler'));
      if (approved !== undefined) {
        query = query.where(eq(users.isApproved, approved));
      }
      return await query;
    } catch (error) {
      console.error("Error getting wholesalers:", error);
      return [];
    }
  }

  async getCurrentRates(): Promise<MarketRate[]> {
    try {
      return await db.select().from(marketRates);
    } catch (error) {
      console.error("Error getting market rates:", error);
      return [];
    }
  }

  async updateMarketRate(metal: string, rate: number): Promise<MarketRate> {
    try {
      const result = await db.insert(marketRates).values({
        metal,
        rate,
        currency: 'INR'
      }).onConflictDoUpdate({
        target: marketRates.metal,
        set: { rate, updatedAt: new Date() }
      }).returning();
      return result[0];
    } catch (error) {
      console.error("Error updating market rate:", error);
      throw error;
    }
  }

  async updateUserSession(userId: string, sessionToken: string | null, sessionExpiresAt: Date | null): Promise<void> {
    try {
      // Use raw SQL to avoid Drizzle schema issues
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
}

export const storage = new SimpleStorage();