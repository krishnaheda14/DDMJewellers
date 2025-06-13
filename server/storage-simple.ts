import { db } from "./db";
import { 
  users, 
  categories, 
  products, 
  cartItems, 
  orders, 
  orderItems,
  wholesalerDesigns,
  wishlist,
  userMemory,
  chatConversations,
  marketRates
} from "../shared/schema";
import { eq, and, desc, asc, like, sql, count } from "drizzle-orm";
import type {
  User,
  UpsertUser,
  Category,
  InsertCategory,
  Product,
  InsertProduct,
  CartItem,
  InsertCartItem,
  Order,
  InsertOrder,
  OrderItem,
  InsertOrderItem,
  WholesalerDesign,
  InsertWholesalerDesign,
  Wishlist,
  InsertWishlist,
  UserMemory,
  InsertUserMemory,
  ChatConversation,
  MarketRate
} from "../shared/schema";

export interface IStorage {
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  getCategories(): Promise<Category[]>;
  getCategoryBySlug(slug: string): Promise<Category | undefined>;
  createCategory(category: InsertCategory): Promise<Category>;
  updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category>;
  deleteCategory(id: number): Promise<boolean>;
  getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    productType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]>;
  getProduct(id: number): Promise<Product | undefined>;
  createProduct(product: InsertProduct): Promise<Product>;
  updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product>;
  deleteProduct(id: number): Promise<boolean>;
  getCartItems(userId: string): Promise<(CartItem & { product: Product })[]>;
  addToCart(item: InsertCartItem): Promise<CartItem>;
  updateCartItem(id: number, quantity: number): Promise<CartItem>;
  removeFromCart(id: number): Promise<boolean>;
  clearCart(userId: string): Promise<boolean>;
  getOrders(userId?: string): Promise<Order[]>;
  getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined>;
  createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order>;
  updateOrderStatus(id: number, status: string): Promise<Order>;
  getUserMemory(userId: string): Promise<UserMemory | undefined>;
  upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory>;
  saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation>;
  getChatHistory(userId: string, limit?: number): Promise<ChatConversation[]>;
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
  getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]>;
  addToWishlist(item: InsertWishlist): Promise<Wishlist>;
  removeFromWishlist(id: number): Promise<boolean>;
  updateUserRole(userId: string, role: string): Promise<User>;
  getWholesalers(approved?: boolean): Promise<User[]>;
  getCurrentRates(): Promise<MarketRate[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existing = await this.getUser(userData.id);
    
    if (existing) {
      const [updated] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(users).values({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();
      return created;
    }
  }

  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).where(eq(categories.isActive, true)).orderBy(categories.sortOrder);
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    const result = await db.select().from(categories).where(eq(categories.slug, slug)).limit(1);
    return result[0];
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const [created] = await db.insert(categories).values(category).returning();
    return created;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const [updated] = await db
      .update(categories)
      .set({ ...category, updatedAt: new Date() })
      .where(eq(categories.id, id))
      .returning();
    return updated;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    productType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let query = db.select().from(products);
    
    const conditions = [eq(products.isActive, true)];
    
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    
    if (filters?.search) {
      conditions.push(like(products.name, `%${filters.search}%`));
    }
    
    if (filters?.featured !== undefined) {
      conditions.push(eq(products.isFeatured, filters.featured));
    }
    
    if (filters?.productType) {
      conditions.push(eq(products.productType, filters.productType as any));
    }
    
    query = query.where(and(...conditions));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getProduct(id: number): Promise<Product | undefined> {
    const result = await db.select().from(products).where(eq(products.id, id)).limit(1);
    return result[0];
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const [created] = await db.insert(products).values(product).returning();
    return created;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const [updated] = await db
      .update(products)
      .set({ ...product, updatedAt: new Date() })
      .where(eq(products.id, id))
      .returning();
    return updated;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const result = await db
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        customizations: cartItems.customizations,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
    
    return result;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    const [created] = await db.insert(cartItems).values(item).returning();
    return created;
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    const [updated] = await db
      .update(cartItems)
      .set({ quantity })
      .where(eq(cartItems.id, id))
      .returning();
    return updated;
  }

  async removeFromCart(id: number): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.id, id));
    return (result.rowCount || 0) > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return (result.rowCount || 0) >= 0;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.userId, userId));
    }
    
    return await query.orderBy(desc(orders.createdAt));
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id)).limit(1);
    
    if (!order) return undefined;
    
    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        makingCharges: orderItems.makingCharges,
        gemstonesCost: orderItems.gemstonesCost,
        diamondsCost: orderItems.diamondsCost,
        weightInGrams: orderItems.weightInGrams,
        ratePerGram: orderItems.ratePerGram,
        metalCost: orderItems.metalCost,
        gstAmount: orderItems.gstAmount,
        customizations: orderItems.customizations,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .leftJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));
    
    return { ...order, orderItems: items };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [created] = await db.insert(orders).values(order).returning();
    
    const orderItemsWithOrderId = items.map(item => ({
      ...item,
      orderId: created.id,
    }));
    
    await db.insert(orderItems).values(orderItemsWithOrderId);
    
    return created;
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    const [updated] = await db
      .update(orders)
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updated;
  }

  async getUserMemory(userId: string): Promise<UserMemory | undefined> {
    const result = await db.select().from(userMemory).where(eq(userMemory.userId, userId)).limit(1);
    return result[0];
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    const existing = await this.getUserMemory(userId);
    
    if (existing) {
      const [updated] = await db
        .update(userMemory)
        .set({ ...memory, updatedAt: new Date() })
        .where(eq(userMemory.userId, userId))
        .returning();
      return updated;
    } else {
      const [created] = await db.insert(userMemory).values({
        userId,
        ...memory,
      }).returning();
      return created;
    }
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    const [created] = await db.insert(chatConversations).values({
      userId,
      sessionId,
      messages,
    }).returning();
    return created;
  }

  async getChatHistory(userId: string, limit: number = 5): Promise<ChatConversation[]> {
    return await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.createdAt))
      .limit(limit);
  }

  async getWholesalerDesigns(filters?: {
    wholesalerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<(WholesalerDesign & { wholesaler: User })[]> {
    let query = db
      .select({
        id: wholesalerDesigns.id,
        wholesalerId: wholesalerDesigns.wholesalerId,
        title: wholesalerDesigns.title,
        description: wholesalerDesigns.description,
        imageUrl: wholesalerDesigns.imageUrl,
        additionalImages: wholesalerDesigns.additionalImages,
        category: wholesalerDesigns.category,
        materials: wholesalerDesigns.materials,
        dimensions: wholesalerDesigns.dimensions,
        estimatedPrice: wholesalerDesigns.estimatedPrice,
        status: wholesalerDesigns.status,
        approvedBy: wholesalerDesigns.approvedBy,
        approvedAt: wholesalerDesigns.approvedAt,
        isActive: wholesalerDesigns.isActive,
        createdAt: wholesalerDesigns.createdAt,
        updatedAt: wholesalerDesigns.updatedAt,
        wholesaler: users,
      })
      .from(wholesalerDesigns)
      .innerJoin(users, eq(wholesalerDesigns.wholesalerId, users.id));
    
    const conditions = [eq(wholesalerDesigns.isActive, true)];
    
    if (filters?.wholesalerId) {
      conditions.push(eq(wholesalerDesigns.wholesalerId, filters.wholesalerId));
    }
    
    if (filters?.status) {
      conditions.push(eq(wholesalerDesigns.status, filters.status as any));
    }
    
    if (filters?.category) {
      conditions.push(eq(wholesalerDesigns.category, filters.category));
    }
    
    query = query.where(and(...conditions));
    
    if (filters?.limit) {
      query = query.limit(filters.limit);
    }
    
    if (filters?.offset) {
      query = query.offset(filters.offset);
    }
    
    return await query;
  }

  async getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined> {
    const result = await db
      .select({
        id: wholesalerDesigns.id,
        wholesalerId: wholesalerDesigns.wholesalerId,
        title: wholesalerDesigns.title,
        description: wholesalerDesigns.description,
        imageUrl: wholesalerDesigns.imageUrl,
        additionalImages: wholesalerDesigns.additionalImages,
        category: wholesalerDesigns.category,
        materials: wholesalerDesigns.materials,
        dimensions: wholesalerDesigns.dimensions,
        estimatedPrice: wholesalerDesigns.estimatedPrice,
        status: wholesalerDesigns.status,
        approvedBy: wholesalerDesigns.approvedBy,
        approvedAt: wholesalerDesigns.approvedAt,
        isActive: wholesalerDesigns.isActive,
        createdAt: wholesalerDesigns.createdAt,
        updatedAt: wholesalerDesigns.updatedAt,
        wholesaler: users,
      })
      .from(wholesalerDesigns)
      .innerJoin(users, eq(wholesalerDesigns.wholesalerId, users.id))
      .where(eq(wholesalerDesigns.id, id))
      .limit(1);
    
    return result[0];
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    const [created] = await db.insert(wholesalerDesigns).values(design).returning();
    return created;
  }

  async updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign> {
    const [updated] = await db
      .update(wholesalerDesigns)
      .set({ ...design, updatedAt: new Date() })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return updated;
  }

  async approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [updated] = await db
      .update(wholesalerDesigns)
      .set({ 
        status: 'approved', 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return updated;
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [updated] = await db
      .update(wholesalerDesigns)
      .set({ 
        status: 'rejected', 
        approvedBy, 
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return updated;
  }

  async deleteWholesalerDesign(id: number): Promise<boolean> {
    const result = await db.delete(wholesalerDesigns).where(eq(wholesalerDesigns.id, id));
    return (result.rowCount || 0) > 0;
  }

  async getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]> {
    const result = await db
      .select({
        id: wishlist.id,
        userId: wishlist.userId,
        productId: wishlist.productId,
        wholesalerDesignId: wishlist.wholesalerDesignId,
        createdAt: wishlist.createdAt,
        product: products,
        design: wholesalerDesigns,
      })
      .from(wishlist)
      .leftJoin(products, eq(wishlist.productId, products.id))
      .leftJoin(wholesalerDesigns, eq(wishlist.wholesalerDesignId, wholesalerDesigns.id))
      .where(eq(wishlist.userId, userId));
    
    return result;
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [created] = await db.insert(wishlist).values(item).returning();
    return created;
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    const result = await db.delete(wishlist).where(eq(wishlist.id, id));
    return (result.rowCount || 0) > 0;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updated] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updated;
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    let query = db.select().from(users).where(eq(users.role, 'wholesaler'));
    
    if (approved !== undefined) {
      query = query.where(and(eq(users.role, 'wholesaler'), eq(users.isApproved, approved)));
    }
    
    return await query;
  }

  async getCurrentRates(): Promise<MarketRate[]> {
    return await db.select().from(marketRates).orderBy(desc(marketRates.updatedAt));
  }
}

export const storage = new DatabaseStorage();