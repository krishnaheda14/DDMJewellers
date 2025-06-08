import {
  users,
  categories,
  products,
  cartItems,
  orders,
  orderItems,
  userMemories,
  chatConversations,
  wholesalerDesigns,
  wishlists,
  gullakAccounts,
  gullakTransactions,
  gullakOrders,
  goldRates,
  emailVerificationTokens,
  passwordResetTokens,
  userActivityLog,
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
  type InsertChatConversation,
  type WholesalerDesign,
  type InsertWholesalerDesign,
  type Wishlist,
  type InsertWishlist,
  type EmailVerificationToken,
  type InsertEmailVerificationToken,
  type PasswordResetToken,
  type InsertPasswordResetToken,
  type UserActivityLog,
  type InsertUserActivityLog,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Enhanced authentication operations
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: Partial<User>): Promise<User>;
  updateUserPassword(userId: string, passwordHash: string): Promise<void>;
  updateUserSession(userId: string, sessionToken: string | null, sessionExpiresAt: Date | null): Promise<void>;
  verifyUserEmail(userId: string): Promise<void>;
  
  // Email verification tokens
  createEmailVerificationToken(token: InsertEmailVerificationToken): Promise<EmailVerificationToken>;
  getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined>;
  deleteEmailVerificationToken(id: number): Promise<void>;
  deleteEmailVerificationTokensByUserId(userId: string): Promise<void>;
  
  // Password reset tokens
  createPasswordResetToken(token: InsertPasswordResetToken): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenUsed(id: number): Promise<void>;
  
  // User activity logging
  createUserActivityLog(log: InsertUserActivityLog): Promise<UserActivityLog>;

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

  // Gullak operations
  getGullakAccounts(userId?: string): Promise<GullakAccount[]>;
  getGullakAccount(id: number): Promise<GullakAccount | undefined>;
  createGullakAccount(account: InsertGullakAccount): Promise<GullakAccount>;
  updateGullakAccount(id: number, account: Partial<InsertGullakAccount>): Promise<GullakAccount>;
  deleteGullakAccount(id: number): Promise<boolean>;
  
  // Gullak transactions
  getGullakTransactions(gullakAccountId: number, limit?: number): Promise<GullakTransaction[]>;
  createGullakTransaction(transaction: InsertGullakTransaction): Promise<GullakTransaction>;
  
  // Gullak orders
  getGullakOrders(userId?: string): Promise<GullakOrder[]>;
  createGullakOrder(order: InsertGullakOrder): Promise<GullakOrder>;
  updateGullakOrderStatus(id: number, status: string): Promise<GullakOrder>;
  
  // Gold rates
  createGoldRate(rate: any): Promise<any>;
  getCurrentGoldRates(): Promise<any | undefined>;

  // Corporate operations
  createCorporateRegistration(registration: InsertCorporateRegistration): Promise<CorporateRegistration>;
  getCorporateRegistrations(): Promise<CorporateRegistration[]>;
  getCorporateRegistration(id: number): Promise<CorporateRegistration | undefined>;
  updateCorporateRegistration(id: number, updates: Partial<InsertCorporateRegistration>): Promise<CorporateRegistration>;
  approveCorporateRegistration(id: number, approvedBy: string): Promise<CorporateRegistration>;
  rejectCorporateRegistration(id: number): Promise<CorporateRegistration>;
  
  // Corporate user operations
  createCorporateUser(corporateUser: InsertCorporateUser): Promise<CorporateUser>;
  getCorporateUsersByCompany(corporateId: number): Promise<CorporateUser[]>;
  getCorporateUserByUserId(userId: string): Promise<CorporateUser | undefined>;
  
  // Employee benefits operations
  createEmployeeBenefit(benefit: InsertEmployeeBenefit): Promise<EmployeeBenefit>;
  getEmployeeBenefit(userId: string, corporateId: number): Promise<EmployeeBenefit | undefined>;
  updateEmployeeBenefit(id: number, updates: Partial<InsertEmployeeBenefit>): Promise<EmployeeBenefit>;
  getEmployeeBenefitsByCorporate(corporateId: number): Promise<EmployeeBenefit[]>;
  
  // Maintenance operations
  createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule>;
  getMaintenanceSchedules(): Promise<MaintenanceSchedule[]>;
  getMaintenanceSchedulesByUser(userId: string): Promise<MaintenanceSchedule[]>;
  getMaintenanceSchedulesByCorporate(corporateId: number): Promise<MaintenanceSchedule[]>;
  updateMaintenanceSchedule(id: number, updates: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule>;
  
  // Corporate offers operations
  createCorporateOffer(offer: InsertCorporateOffer): Promise<CorporateOffer>;
  getCorporateOffers(corporateId: number): Promise<CorporateOffer[]>;
  getActiveCorporateOffers(corporateId: number): Promise<CorporateOffer[]>;
  updateCorporateOffer(id: number, updates: Partial<InsertCorporateOffer>): Promise<CorporateOffer>;
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
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Enhanced authentication operations
  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: Partial<User>): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUserPassword(userId: string, passwordHash: string): Promise<void> {
    await db
      .update(users)
      .set({ passwordHash, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  async updateUserSession(userId: string, sessionToken: string | null, sessionExpiresAt: Date | null): Promise<void> {
    await db
      .update(users)
      .set({ 
        sessionToken, 
        sessionExpiresAt, 
        lastLoginAt: sessionToken ? new Date() : undefined,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId));
  }

  async verifyUserEmail(userId: string): Promise<void> {
    await db
      .update(users)
      .set({ isEmailVerified: true, updatedAt: new Date() })
      .where(eq(users.id, userId));
  }

  // Email verification tokens
  async createEmailVerificationToken(tokenData: InsertEmailVerificationToken): Promise<EmailVerificationToken> {
    const [token] = await db.insert(emailVerificationTokens).values(tokenData).returning();
    return token;
  }

  async getEmailVerificationToken(token: string): Promise<EmailVerificationToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(emailVerificationTokens)
      .where(eq(emailVerificationTokens.token, token));
    return tokenData;
  }

  async deleteEmailVerificationToken(id: number): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.id, id));
  }

  async deleteEmailVerificationTokensByUserId(userId: string): Promise<void> {
    await db.delete(emailVerificationTokens).where(eq(emailVerificationTokens.userId, userId));
  }

  // Password reset tokens
  async createPasswordResetToken(tokenData: InsertPasswordResetToken): Promise<PasswordResetToken> {
    const [token] = await db.insert(passwordResetTokens).values(tokenData).returning();
    return token;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const [tokenData] = await db
      .select()
      .from(passwordResetTokens)
      .where(eq(passwordResetTokens.token, token));
    return tokenData;
  }

  async markPasswordResetTokenUsed(id: number): Promise<void> {
    await db
      .update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, id));
  }

  // User activity logging
  async createUserActivityLog(logData: InsertUserActivityLog): Promise<UserActivityLog> {
    const [log] = await db.insert(userActivityLog).values(logData).returning();
    return log;
  }

  // Category operations
  async getCategories(): Promise<Category[]> {
    return await db.select().from(categories).orderBy(asc(categories.name));
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
      .set(category)
      .where(eq(categories.id, id))
      .returning();
    return updatedCategory;
  }

  async deleteCategory(id: number): Promise<boolean> {
    const result = await db.delete(categories).where(eq(categories.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Product operations
  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let query = db.select().from(products);

    if (filters?.categoryId) {
      query = query.where(eq(products.categoryId, filters.categoryId)) as any;
    }

    if (filters?.search) {
      query = query.where(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`)
        )
      ) as any;
    }

    if (filters?.featured !== undefined) {
      query = query.where(eq(products.featured, filters.featured)) as any;
    }

    query = query.orderBy(desc(products.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
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
    const updateData: any = { ...product };
    if (updateData.updatedAt) {
      delete updateData.updatedAt;
    }
    updateData.updatedAt = new Date();

    const [updatedProduct] = await db
      .update(products)
      .set(updateData)
      .where(eq(products.id, id))
      .returning();
    return updatedProduct;
  }

  async deleteProduct(id: number): Promise<boolean> {
    const result = await db.delete(products).where(eq(products.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Cart operations
  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    const items = await db
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
    
    return items as any;
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    // Check if item already exists in cart
    const [existingItem] = await db
      .select()
      .from(cartItems)
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId)));

    if (existingItem) {
      // Update quantity
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity: existingItem.quantity + (item.quantity || 1) })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const cartData: any = {
        userId: item.userId,
        productId: item.productId,
        quantity: item.quantity || 1,
        customizations: item.customizations || null
      };

      const [newItem] = await db.insert(cartItems).values(cartData).returning();
      return newItem;
    }
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
    return (result.rowCount ?? 0) > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return (result.rowCount ?? 0) >= 0;
  }

  // Order operations
  async getOrders(userId?: string): Promise<Order[]> {
    let query = db.select().from(orders);
    
    if (userId) {
      query = query.where(eq(orders.userId, userId)) as any;
    }
    
    query = query.orderBy(desc(orders.createdAt)) as any;
    return await query;
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    const [order] = await db.select().from(orders).where(eq(orders.id, id));
    
    if (!order) return undefined;

    const items = await db
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        customizations: orderItems.customizations,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, orderItems: items as any };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    const orderItemsData = items.map(item => ({
      orderId: newOrder.id,
      productId: item.productId,
      quantity: item.quantity,
      price: item.price,
      customizations: item.customizations || null
    }));
    
    await db.insert(orderItems).values(orderItemsData);
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

  // Chatbot memory operations
  async getUserMemory(userId: string): Promise<UserMemory | undefined> {
    const [memory] = await db.select().from(userMemories).where(eq(userMemories.userId, userId));
    return memory;
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    const memoryData: any = {
      userId,
      age: memory.age,
      lifestyle: memory.lifestyle,
      preferences: memory.preferences
    };

    const [existingMemory] = await db.select().from(userMemories).where(eq(userMemories.userId, userId));
    
    if (existingMemory) {
      const [updatedMemory] = await db
        .update(userMemories)
        .set({ ...memoryData, updatedAt: new Date() })
        .where(eq(userMemories.userId, userId))
        .returning();
      return updatedMemory;
    } else {
      const [newMemory] = await db.insert(userMemories).values(memoryData).returning();
      return newMemory;
    }
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    const conversationData: any = {
      userId,
      sessionId,
      messages: { conversation: messages }
    };

    const [conversation] = await db.insert(chatConversations).values(conversationData).returning();
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
      .select({
        id: wholesalerDesigns.id,
        wholesalerId: wholesalerDesigns.wholesalerId,
        title: wholesalerDesigns.title,
        description: wholesalerDesigns.description,
        imageUrl: wholesalerDesigns.imageUrl,
        additionalImages: wholesalerDesigns.additionalImages,
        category: wholesalerDesigns.category,
        estimatedPrice: wholesalerDesigns.estimatedPrice,
        materials: wholesalerDesigns.materials,
        dimensions: wholesalerDesigns.dimensions,
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

    if (filters?.wholesalerId) {
      query = query.where(eq(wholesalerDesigns.wholesalerId, filters.wholesalerId)) as any;
    }

    if (filters?.status) {
      query = query.where(eq(wholesalerDesigns.status, filters.status as any)) as any;
    }

    if (filters?.category) {
      query = query.where(eq(wholesalerDesigns.category, filters.category)) as any;
    }

    query = query.orderBy(desc(wholesalerDesigns.createdAt)) as any;

    if (filters?.limit) {
      query = query.limit(filters.limit) as any;
    }

    if (filters?.offset) {
      query = query.offset(filters.offset) as any;
    }

    return await query as any;
  }

  async getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined> {
    const [design] = await db
      .select({
        id: wholesalerDesigns.id,
        wholesalerId: wholesalerDesigns.wholesalerId,
        title: wholesalerDesigns.title,
        description: wholesalerDesigns.description,
        imageUrl: wholesalerDesigns.imageUrl,
        additionalImages: wholesalerDesigns.additionalImages,
        category: wholesalerDesigns.category,
        estimatedPrice: wholesalerDesigns.estimatedPrice,
        materials: wholesalerDesigns.materials,
        dimensions: wholesalerDesigns.dimensions,
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
      .where(eq(wholesalerDesigns.id, id));

    return design as any;
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    const [newDesign] = await db.insert(wholesalerDesigns).values(design).returning();
    return newDesign;
  }

  async updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign> {
    const updateData: any = { ...design };
    if (updateData.updatedAt) {
      delete updateData.updatedAt;
    }
    updateData.updatedAt = new Date();

    const [updatedDesign] = await db
      .update(wholesalerDesigns)
      .set(updateData)
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return updatedDesign;
  }

  async approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [approvedDesign] = await db
      .update(wholesalerDesigns)
      .set({
        status: "approved" as any,
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return approvedDesign;
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [rejectedDesign] = await db
      .update(wholesalerDesigns)
      .set({
        status: "rejected" as any,
        approvedBy,
        updatedAt: new Date(),
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return rejectedDesign;
  }

  async deleteWholesalerDesign(id: number): Promise<boolean> {
    const result = await db.delete(wholesalerDesigns).where(eq(wholesalerDesigns.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // Wishlist operations
  async getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]> {
    const wishlistItems = await db
      .select({
        id: wishlists.id,
        userId: wishlists.userId,
        productId: wishlists.productId,
        designId: wishlists.designId,
        createdAt: wishlists.createdAt,
        product: products,
        design: wholesalerDesigns,
      })
      .from(wishlists)
      .leftJoin(products, eq(wishlists.productId, products.id))
      .leftJoin(wholesalerDesigns, eq(wishlists.designId, wholesalerDesigns.id))
      .where(eq(wishlists.userId, userId))
      .orderBy(desc(wishlists.createdAt));

    return wishlistItems as any;
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [newWishlistItem] = await db.insert(wishlists).values(item).returning();
    return newWishlistItem;
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    const result = await db.delete(wishlists).where(eq(wishlists.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User role operations
  async updateUserRole(userId: string, role: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ role: role as any, updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    let query = db.select().from(users).where(eq(users.role, "wholesaler"));
    
    if (approved !== undefined) {
      // Assuming approved wholesalers have a specific status or field
      query = query.where(and(eq(users.role, "wholesaler"), eq(users.isActive, approved))) as any;
    }
    
    return await query;
  }

  async createGoldRate(rate: any): Promise<any> {
    const [newRate] = await db.insert(goldRates).values(rate).returning();
    return newRate;
  }

  async getCurrentGoldRates(): Promise<any> {
    // Get the most recent gold rates
    const [latestRates] = await db
      .select()
      .from(goldRates)
      .orderBy(desc(goldRates.effectiveDate))
      .limit(1);
    
    return latestRates || null;
  }

  // Gullak operations
  async getGullakAccounts(userId?: string): Promise<GullakAccount[]> {
    if (userId) {
      return await db.select().from(gullakAccounts).where(eq(gullakAccounts.userId, userId));
    }
    return await db.select().from(gullakAccounts);
  }

  async getGullakAccount(id: number): Promise<GullakAccount | undefined> {
    const [account] = await db.select().from(gullakAccounts).where(eq(gullakAccounts.id, id));
    return account;
  }

  async createGullakAccount(account: InsertGullakAccount): Promise<GullakAccount> {
    const [newAccount] = await db.insert(gullakAccounts).values(account).returning();
    return newAccount;
  }

  async updateGullakAccount(id: number, account: Partial<InsertGullakAccount>): Promise<GullakAccount> {
    const [updatedAccount] = await db
      .update(gullakAccounts)
      .set({ ...account, updatedAt: new Date() })
      .where(eq(gullakAccounts.id, id))
      .returning();
    return updatedAccount;
  }

  async deleteGullakAccount(id: number): Promise<boolean> {
    const result = await db.delete(gullakAccounts).where(eq(gullakAccounts.id, id));
    return result.rowCount > 0;
  }

  async getGullakTransactions(gullakAccountId: number, limit: number = 50): Promise<GullakTransaction[]> {
    return await db
      .select()
      .from(gullakTransactions)
      .where(eq(gullakTransactions.gullakAccountId, gullakAccountId))
      .orderBy(desc(gullakTransactions.createdAt))
      .limit(limit);
  }

  async createGullakTransaction(transaction: InsertGullakTransaction): Promise<GullakTransaction> {
    const [newTransaction] = await db.insert(gullakTransactions).values(transaction).returning();
    return newTransaction;
  }

  async getGullakOrders(userId?: string): Promise<GullakOrder[]> {
    if (userId) {
      return await db.select().from(gullakOrders).where(eq(gullakOrders.userId, userId));
    }
    return await db.select().from(gullakOrders);
  }

  async createGullakOrder(order: InsertGullakOrder): Promise<GullakOrder> {
    const [newOrder] = await db.insert(gullakOrders).values(order).returning();
    return newOrder;
  }

  async updateGullakOrderStatus(id: number, status: string): Promise<GullakOrder> {
    const [updatedOrder] = await db
      .update(gullakOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(gullakOrders.id, id))
      .returning();
    return updatedOrder;
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    const [newRate] = await db.insert(goldRates).values(rate).returning();
    return newRate;
  }

  // Corporate operations
  async createCorporateRegistration(registration: InsertCorporateRegistration): Promise<CorporateRegistration> {
    // Generate unique corporate code
    const corporateCode = `CORP${Date.now()}`;
    
    const [corporate] = await db
      .insert(corporateRegistrations)
      .values({
        ...registration,
        corporateCode
      })
      .returning();
    return corporate;
  }

  async getCorporateRegistrations(): Promise<CorporateRegistration[]> {
    return await db.select().from(corporateRegistrations).orderBy(desc(corporateRegistrations.createdAt));
  }

  async getCorporateRegistration(id: number): Promise<CorporateRegistration | undefined> {
    const [corporate] = await db.select().from(corporateRegistrations).where(eq(corporateRegistrations.id, id));
    return corporate;
  }

  async updateCorporateRegistration(id: number, updates: Partial<InsertCorporateRegistration>): Promise<CorporateRegistration> {
    const [corporate] = await db
      .update(corporateRegistrations)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(corporateRegistrations.id, id))
      .returning();
    return corporate;
  }

  async approveCorporateRegistration(id: number, approvedBy: string): Promise<CorporateRegistration> {
    const [corporate] = await db
      .update(corporateRegistrations)
      .set({
        status: "approved",
        approvedAt: new Date(),
        approvedBy,
        updatedAt: new Date()
      })
      .where(eq(corporateRegistrations.id, id))
      .returning();
    return corporate;
  }

  async rejectCorporateRegistration(id: number): Promise<CorporateRegistration> {
    const [corporate] = await db
      .update(corporateRegistrations)
      .set({
        status: "rejected",
        updatedAt: new Date()
      })
      .where(eq(corporateRegistrations.id, id))
      .returning();
    return corporate;
  }

  // Corporate user operations
  async createCorporateUser(corporateUser: InsertCorporateUser): Promise<CorporateUser> {
    const [user] = await db
      .insert(corporateUsers)
      .values(corporateUser)
      .returning();
    return user;
  }

  async getCorporateUsersByCompany(corporateId: number): Promise<CorporateUser[]> {
    return await db.select().from(corporateUsers).where(eq(corporateUsers.corporateId, corporateId));
  }

  async getCorporateUserByUserId(userId: string): Promise<CorporateUser | undefined> {
    const [user] = await db.select().from(corporateUsers).where(eq(corporateUsers.userId, userId));
    return user;
  }

  // Employee benefits operations
  async createEmployeeBenefit(benefit: InsertEmployeeBenefit): Promise<EmployeeBenefit> {
    const [employeeBenefit] = await db
      .insert(employeeBenefits)
      .values(benefit)
      .returning();
    return employeeBenefit;
  }

  async getEmployeeBenefit(userId: string, corporateId: number): Promise<EmployeeBenefit | undefined> {
    const [benefit] = await db
      .select()
      .from(employeeBenefits)
      .where(and(eq(employeeBenefits.userId, userId), eq(employeeBenefits.corporateId, corporateId)));
    return benefit;
  }

  async updateEmployeeBenefit(id: number, updates: Partial<InsertEmployeeBenefit>): Promise<EmployeeBenefit> {
    const [benefit] = await db
      .update(employeeBenefits)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(employeeBenefits.id, id))
      .returning();
    return benefit;
  }

  async getEmployeeBenefitsByCorporate(corporateId: number): Promise<EmployeeBenefit[]> {
    return await db.select().from(employeeBenefits).where(eq(employeeBenefits.corporateId, corporateId));
  }

  // Maintenance operations
  async createMaintenanceSchedule(schedule: InsertMaintenanceSchedule): Promise<MaintenanceSchedule> {
    const [maintenanceSchedule] = await db
      .insert(maintenanceSchedules)
      .values(schedule)
      .returning();
    return maintenanceSchedule;
  }

  async getMaintenanceSchedules(): Promise<MaintenanceSchedule[]> {
    return await db.select().from(maintenanceSchedules).orderBy(desc(maintenanceSchedules.scheduledDate));
  }

  async getMaintenanceSchedulesByUser(userId: string): Promise<MaintenanceSchedule[]> {
    return await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.userId, userId));
  }

  async getMaintenanceSchedulesByCorporate(corporateId: number): Promise<MaintenanceSchedule[]> {
    return await db.select().from(maintenanceSchedules).where(eq(maintenanceSchedules.corporateId, corporateId));
  }

  async updateMaintenanceSchedule(id: number, updates: Partial<InsertMaintenanceSchedule>): Promise<MaintenanceSchedule> {
    const [schedule] = await db
      .update(maintenanceSchedules)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(maintenanceSchedules.id, id))
      .returning();
    return schedule;
  }

  // Corporate offers operations
  async createCorporateOffer(offer: InsertCorporateOffer): Promise<CorporateOffer> {
    const [corporateOffer] = await db
      .insert(corporateOffers)
      .values(offer)
      .returning();
    return corporateOffer;
  }

  async getCorporateOffers(corporateId: number): Promise<CorporateOffer[]> {
    return await db.select().from(corporateOffers).where(eq(corporateOffers.corporateId, corporateId));
  }

  async getActiveCorporateOffers(corporateId: number): Promise<CorporateOffer[]> {
    const now = new Date();
    return await db
      .select()
      .from(corporateOffers)
      .where(
        and(
          eq(corporateOffers.corporateId, corporateId),
          eq(corporateOffers.isActive, true),
          lte(corporateOffers.validFrom, now),
          gte(corporateOffers.validUntil, now)
        )
      );
  }

  async updateCorporateOffer(id: number, updates: Partial<InsertCorporateOffer>): Promise<CorporateOffer> {
    const [offer] = await db
      .update(corporateOffers)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(corporateOffers.id, id))
      .returning();
    return offer;
  }

  // Admin-specific methods
  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users);
  }

  async getAllExchangeRequests(): Promise<any[]> {
    try {
      return await db.select().from(jewelryExchangeRequests);
    } catch (error) {
      console.log("Exchange requests table not available");
      return [];
    }
  }

  async getExchangeRequests(userId?: string): Promise<any[]> {
    try {
      if (userId) {
        return await db.select().from(jewelryExchangeRequests).where(eq(jewelryExchangeRequests.userId, userId));
      }
      return await db.select().from(jewelryExchangeRequests);
    } catch (error) {
      console.log("Exchange requests table not available");
      return [];
    }
  }

  async getExchangeRequest(id: number): Promise<any | undefined> {
    try {
      const [request] = await db.select().from(jewelryExchangeRequests).where(eq(jewelryExchangeRequests.id, id));
      return request;
    } catch (error) {
      console.log("Exchange requests table not available");
      return undefined;
    }
  }

  async createExchangeRequest(data: any): Promise<any> {
    try {
      const [request] = await db.insert(jewelryExchangeRequests).values(data).returning();
      return request;
    } catch (error) {
      console.log("Exchange requests table not available");
      throw error;
    }
  }

  async updateExchangeRequest(id: number, data: any): Promise<any> {
    try {
      const [request] = await db.update(jewelryExchangeRequests).set(data).where(eq(jewelryExchangeRequests.id, id)).returning();
      return request;
    } catch (error) {
      console.log("Exchange requests table not available");
      throw error;
    }
  }

  async approveExchangeRequest(id: number, approvedBy: string): Promise<any> {
    try {
      const [request] = await db.update(jewelryExchangeRequests).set({
        status: 'approved',
        approvedBy,
        approvedAt: new Date()
      }).where(eq(jewelryExchangeRequests.id, id)).returning();
      return request;
    } catch (error) {
      console.log("Exchange requests table not available");
      throw error;
    }
  }

  async rejectExchangeRequest(id: number, approvedBy: string): Promise<any> {
    try {
      const [request] = await db.update(jewelryExchangeRequests).set({
        status: 'rejected',
        approvedBy,
        approvedAt: new Date()
      }).where(eq(jewelryExchangeRequests.id, id)).returning();
      return request;
    } catch (error) {
      console.log("Exchange requests table not available");
      throw error;
    }
  }

  async deleteExchangeRequest(id: number): Promise<boolean> {
    try {
      const result = await db.delete(jewelryExchangeRequests).where(eq(jewelryExchangeRequests.id, id));
      return (result.rowCount ?? 0) > 0;
    } catch (error) {
      console.log("Exchange requests table not available");
      return false;
    }
  }

  async createExchangeNotification(data: any): Promise<any> {
    try {
      // Placeholder for notification system
      console.log("Exchange notification:", data);
      return data;
    } catch (error) {
      console.log("Notification system not available");
      return null;
    }
  }

  async getAllCorporateRequests(): Promise<any[]> {
    try {
      return await db.select().from(corporateRegistrations);
    } catch (error) {
      console.log("Corporate registrations table not available");
      return [];
    }
  }
}

export const storage = new DatabaseStorage();