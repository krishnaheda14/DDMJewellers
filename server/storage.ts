import {
  users,
  categories,
  products,
  cartItems,
  orders,
  orderItems,
  userMemory,
  chatConversations,
  wholesalerDesigns,
  wishlist,
  marketRates,
  type User,
  type UpsertUser,
  type Category,
  type InsertCategory,
  type Product,
  type InsertProduct,
  type CartItem,
  type InsertCartItem,
  type Order,
  type InsertOrder,
  type OrderItem,
  type InsertOrderItem,
  type UserMemory,
  type InsertUserMemory,
  type ChatConversation,
  type WholesalerDesign,
  type InsertWholesalerDesign,
  type Wishlist,
  type InsertWishlist,
  type MarketRate,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values([userData])
      .onConflictDoUpdate({
        target: users.id,
        set: {
          email: userData.email,
          firstName: userData.firstName,
          lastName: userData.lastName,
          profileImageUrl: userData.profileImageUrl,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: any): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async createEmailVerificationToken(tokenData: any): Promise<any> {
    // For now, we'll store the verification token in the user record
    // In a production app, you might want a separate tokens table
    const [user] = await db
      .update(users)
      .set({ 
        emailVerificationToken: tokenData.token,
        updatedAt: new Date()
      })
      .where(eq(users.id, tokenData.userId))
      .returning();
    return { userId: tokenData.userId, token: tokenData.token, expiresAt: tokenData.expiresAt };
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
    return category;
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [newCategory] = await db.insert(categories).values(category).returning();
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updatedCategory] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return result.rowCount > 0;
  }

  // Product operations
  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let query = db.select().from(products).where(eq(products.isActive, true));

    if (filters?.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId));
    }

    if (filters?.search) {
      query = query.where(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`)
        )
      );
    }

    if (filters?.featured) {
      query = query.where(eq(products.isFeatured, true));
    }

    query = query.orderBy(desc(products.createdAt));

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const [product] = await db.select().from(products).where(eq(products.id, id));
    return product;
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [newProduct] = await db.insert(products).values(product).returning();
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updatedProduct] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return result.rowCount > 0;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return await db
      .select()
      .from(cartItems)
      .leftJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId))
      .then(rows => 
        rows.map(row => ({
          ...row.cart_items,
          product: row.products!
        }))
      );
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [cartItem] = await db.insert(cartItems).values(item).returning();
    return cartItem;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updatedItem] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updatedItem;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return result.rowCount > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount > 0;
  }

  // Order operations
  async getOrders(userId?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.userId, userId));
    }
    
    return await query.orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;

    const items = await db
      .select()
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id))
      .then(rows => 
        rows.map(row => ({
          ...row.order_items,
          product: row.products!
        }))
      );

    return { ...order, orderItems: items };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    const orderItemsWithOrderId = items.map(item => ({
      ...item,
      orderId: newOrder.id,
    }));
    
    await db.insert(orderItems).values(orderItemsWithOrderId);
    
    return newOrder;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updatedOrder] = await db
      .update(orders)
      .set({ status, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
  }

  // User memory operations
  async getUserMemory(userId: string): Promise<UserMemory | undefined> {
    const [memory] = await db.select().from(userMemory).where(eq(userMemory.userId, userId));
    return memory;
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    const [userMem] = await db
      .insert(userMemory)
      .values({ userId, ...memory })
      .onConflictDoUpdate({
        target: userMemory.userId,
        set: { ...memory, updatedAt: new Date() },
      })
      .returning();
    return userMem;
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    const [conversation] = await db
      .insert(chatConversations)
      .values({ userId, sessionId, messages })
      .returning();
    return conversation;
  }

  async getChatHistory(userId: string, limit: number = 5): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.createdAt))
      .limit(limit);
  }

  // Wholesaler design operations
  async getWholesalerDesigns(filters?: {
    wholesalerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<(WholesalerDesign & { wholesaler: User })[]> {
    let query = db
      .select()
      .from(wholesalerDesigns)
      .leftJoin(users, eq(wholesalerDesigns.wholesalerId, users.id));

    if (filters?.wholesalerId) {
      query = query.where(eq(wholesalerDesigns.wholesalerId, filters.wholesalerId));
    }

    if (filters?.status) {
      query = query.where(eq(wholesalerDesigns.status, filters.status));
    }

    if (filters?.category) {
      query = query.where(eq(wholesalerDesigns.category, filters.category));
    }

    if (filters?.limit) {
      query = query.limit(filters.limit);
    }

    if (filters?.offset) {
      query = query.offset(filters.offset);
    }

    return await query.then(rows => 
      rows.map(row => ({
        ...row.wholesaler_designs,
        wholesaler: row.users!
      }))
    );
  }

  async getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined> {
    const [result] = await db
      .select()
      .from(wholesalerDesigns)
      .leftJoin(users, eq(wholesalerDesigns.wholesalerId, users.id))
      .where(eq(wholesalerDesigns.id, id));

    if (!result) return undefined;

    return {
      ...result.wholesaler_designs,
      wholesaler: result.users!
    };
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    const [newDesign] = await db.insert(wholesalerDesigns).values(design).returning();
    return newDesign;
  }

  async updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign> {
    const [updatedDesign] = await db
      .update(wholesalerDesigns)
      .set({ ...design, updatedAt: new Date() })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return updatedDesign;
  }

  async approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [approvedDesign] = await db
      .update(wholesalerDesigns)
      .set({ 
        status: "approved", 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return approvedDesign;
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [rejectedDesign] = await db
      .update(wholesalerDesigns)
      .set({ 
        status: "rejected", 
        approvedBy, 
        updatedAt: new Date() 
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return rejectedDesign;
  }

  async deleteWholesalerDesign(id: number): Promise<boolean> {
    const result = await db.delete(wholesalerDesigns).where(eq(wholesalerDesigns.id, id));
    return result.rowCount > 0;
  }

  // Wishlist operations
  async getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]> {
    return await db
      .select()
      .from(wishlist)
      .leftJoin(products, eq(wishlist.productId, products.id))
      .leftJoin(wholesalerDesigns, eq(wishlist.wholesalerDesignId, wholesalerDesigns.id))
      .where(eq(wishlist.userId, userId))
      .then(rows => 
        rows.map(row => ({
          ...row.wishlist,
          product: row.products || undefined,
          design: row.wholesaler_designs || undefined
        }))
      );
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [wishlistItem] = await db.insert(wishlist).values(item).returning();
    return wishlistItem;
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    const result = await db.delete(wishlist).where(eq(wishlist.id, id));
    return result.rowCount > 0;
  }

  // User role operations
  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    let query = db.select().from(users).where(eq(users.role, "wholesaler"));
    
    if (approved !== undefined) {
      query = query.where(eq(users.isApproved, approved));
    }
    
    return await query;
  }

  // Market rates operations
  async getCurrentRates(): Promise<MarketRate[]> {
    return await db.select().from(marketRates).orderBy(desc(marketRates.updatedAt));
  }

  async updateMarketRate(metal: string, rate: number): Promise<MarketRate> {
    const [updatedRate] = await db
      .insert(marketRates)
      .values({ metal, unit: "gram", rate, updatedAt: new Date() })
      .onConflictDoUpdate({
        target: [marketRates.metal, marketRates.unit],
        set: { rate, updatedAt: new Date() }
      })
      .returning();
    return updatedRate;
  }
}

export const storage = new DatabaseStorage();