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
  goldRates,
  gullakOrders,
  loyaltyBadges,
  userBadges,
  loyaltyTransactions,
  loyaltyProfiles,
  loyaltyChallenges,
  userChallenges,
  loyaltyRewards,
  userRedemptions,
  careTutorials,
  tutorialProgress,
  careReminders,
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
  type GullakAccount,
  type InsertGullakAccount,
  type GullakTransaction,
  type InsertGullakTransaction,
  type GoldRate,
  type InsertGoldRate,
  type GullakOrder,
  type InsertGullakOrder,
  type LoyaltyBadge,
  type InsertLoyaltyBadge,
  type UserBadge,
  type InsertUserBadge,
  type LoyaltyTransaction,
  type InsertLoyaltyTransaction,
  type LoyaltyProfile,
  type InsertLoyaltyProfile,
  type LoyaltyChallenge,
  type InsertLoyaltyChallenge,
  type UserChallenge,
  type InsertUserChallenge,
  type LoyaltyReward,
  type InsertLoyaltyReward,
  type UserRedemption,
  type InsertUserRedemption,
  type CareTutorial,
  type InsertCareTutorial,
  type TutorialProgress,
  type InsertTutorialProgress,
  type CareReminder,
  type InsertCareReminder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, ilike, desc, asc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations (required for Replit Auth)
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;

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
  createGullakAccount(account: InsertGullakAccount): Promise<GullakAccount>;
  getGullakAccounts(userId: string): Promise<GullakAccount[]>;
  getGullakAccount(id: number): Promise<GullakAccount | undefined>;
  updateGullakAccount(id: number, account: Partial<InsertGullakAccount>): Promise<GullakAccount>;
  deleteGullakAccount(id: number): Promise<boolean>;
  
  // Gullak transactions
  createGullakTransaction(transaction: InsertGullakTransaction): Promise<GullakTransaction>;
  getGullakTransactions(gullakAccountId: number): Promise<GullakTransaction[]>;
  getUserGullakTransactions(userId: string): Promise<GullakTransaction[]>;
  
  // Gold rates
  getCurrentGoldRates(): Promise<GoldRate | undefined>;
  createGoldRate(rate: InsertGoldRate): Promise<GoldRate>;
  getGoldRateHistory(limit?: number): Promise<GoldRate[]>;
  
  // Gullak orders
  createGullakOrder(order: InsertGullakOrder): Promise<GullakOrder>;
  getGullakOrders(userId?: string): Promise<GullakOrder[]>;
  getGullakOrder(id: number): Promise<GullakOrder | undefined>;
  updateGullakOrderStatus(id: number, status: string): Promise<GullakOrder>;

  // Loyalty Program operations
  // Badge operations
  getLoyaltyBadges(filters?: { category?: string; rarity?: string; isActive?: boolean }): Promise<LoyaltyBadge[]>;
  getLoyaltyBadge(id: number): Promise<LoyaltyBadge | undefined>;
  createLoyaltyBadge(badge: InsertLoyaltyBadge): Promise<LoyaltyBadge>;
  updateLoyaltyBadge(id: number, badge: Partial<InsertLoyaltyBadge>): Promise<LoyaltyBadge>;
  
  // User badge operations
  getUserBadges(userId: string): Promise<(UserBadge & { badge: LoyaltyBadge })[]>;
  awardBadge(userId: string, badgeId: number, level?: number): Promise<UserBadge>;
  markBadgeAsViewed(userId: string, badgeId: number): Promise<boolean>;
  
  // Loyalty profile operations
  getLoyaltyProfile(userId: string): Promise<LoyaltyProfile | undefined>;
  createLoyaltyProfile(profile: InsertLoyaltyProfile): Promise<LoyaltyProfile>;
  updateLoyaltyProfile(userId: string, updates: Partial<InsertLoyaltyProfile>): Promise<LoyaltyProfile>;
  
  // Points operations
  addLoyaltyPoints(userId: string, points: number, source: string, description?: string, metadata?: any): Promise<LoyaltyTransaction>;
  spendLoyaltyPoints(userId: string, points: number, source: string, description?: string, metadata?: any): Promise<LoyaltyTransaction>;
  getLoyaltyTransactions(userId: string, limit?: number): Promise<LoyaltyTransaction[]>;
  
  // Challenge operations
  getLoyaltyChallenges(filters?: { type?: string; isActive?: boolean }): Promise<LoyaltyChallenge[]>;
  getUserChallenges(userId: string): Promise<(UserChallenge & { challenge: LoyaltyChallenge })[]>;
  updateChallengeProgress(userId: string, challengeId: number, progress: any): Promise<UserChallenge>;
  completeChallengeProgress(userId: string, challengeId: number): Promise<UserChallenge>;
  
  // Reward operations
  getLoyaltyRewards(filters?: { type?: string; tierRequired?: string; isActive?: boolean }): Promise<LoyaltyReward[]>;
  redeemReward(userId: string, rewardId: number): Promise<UserRedemption>;
  getUserRedemptions(userId: string): Promise<(UserRedemption & { reward: LoyaltyReward })[]>;
  useRedemption(redemptionId: number): Promise<UserRedemption>;
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
      .set({ ...category, updatedAt: new Date() })
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
      query = query.where(eq(users.isApproved, approved));
    }
    
    return await query;
  }

  // Gullak operations
  async createGullakAccount(account: InsertGullakAccount): Promise<GullakAccount> {
    const [newAccount] = await db
      .insert(gullakAccounts)
      .values(account)
      .returning();
    return newAccount;
  }

  async getGullakAccounts(userId: string): Promise<GullakAccount[]> {
    return await db
      .select()
      .from(gullakAccounts)
      .where(eq(gullakAccounts.userId, userId))
      .orderBy(desc(gullakAccounts.createdAt));
  }

  async getGullakAccount(id: number): Promise<GullakAccount | undefined> {
    const [account] = await db
      .select()
      .from(gullakAccounts)
      .where(eq(gullakAccounts.id, id));
    return account;
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
    const result = await db
      .delete(gullakAccounts)
      .where(eq(gullakAccounts.id, id));
    return result.rowCount > 0;
  }

  // Gullak transactions
  async createGullakTransaction(transaction: InsertGullakTransaction): Promise<GullakTransaction> {
    const [newTransaction] = await db
      .insert(gullakTransactions)
      .values(transaction)
      .returning();
    return newTransaction;
  }

  async getGullakTransactions(gullakAccountId: number): Promise<GullakTransaction[]> {
    return await db
      .select()
      .from(gullakTransactions)
      .where(eq(gullakTransactions.gullakAccountId, gullakAccountId))
      .orderBy(desc(gullakTransactions.transactionDate));
  }

  async getUserGullakTransactions(userId: string): Promise<GullakTransaction[]> {
    return await db
      .select()
      .from(gullakTransactions)
      .where(eq(gullakTransactions.userId, userId))
      .orderBy(desc(gullakTransactions.transactionDate));
  }

  // Gold rates
  async getCurrentGoldRates(): Promise<GoldRate | undefined> {
    const [rate] = await db
      .select()
      .from(goldRates)
      .orderBy(desc(goldRates.effectiveDate))
      .limit(1);
    return rate;
  }

  async createGoldRate(rate: InsertGoldRate): Promise<GoldRate> {
    const [newRate] = await db
      .insert(goldRates)
      .values(rate)
      .returning();
    return newRate;
  }

  async getGoldRateHistory(limit: number = 10): Promise<GoldRate[]> {
    return await db
      .select()
      .from(goldRates)
      .orderBy(desc(goldRates.effectiveDate))
      .limit(limit);
  }

  // Gullak orders
  async createGullakOrder(order: InsertGullakOrder): Promise<GullakOrder> {
    const [newOrder] = await db
      .insert(gullakOrders)
      .values(order)
      .returning();
    return newOrder;
  }

  async getGullakOrders(userId?: string): Promise<GullakOrder[]> {
    let query = db.select().from(gullakOrders);
    
    if (userId) {
      query = query.where(eq(gullakOrders.userId, userId));
    }
    
    return await query.orderBy(desc(gullakOrders.orderDate));
  }

  async getGullakOrder(id: number): Promise<GullakOrder | undefined> {
    const [order] = await db
      .select()
      .from(gullakOrders)
      .where(eq(gullakOrders.id, id));
    return order;
  }

  async updateGullakOrderStatus(id: number, status: string): Promise<GullakOrder> {
    const [updatedOrder] = await db
      .update(gullakOrders)
      .set({ status, updatedAt: new Date() })
      .where(eq(gullakOrders.id, id))
      .returning();
    return updatedOrder;
  }

  // Loyalty Program Implementation
  
  // Badge operations
  async getLoyaltyBadges(filters?: { category?: string; rarity?: string; isActive?: boolean }): Promise<LoyaltyBadge[]> {
    let query = db.select().from(loyaltyBadges);
    
    if (filters?.category) {
      query = query.where(eq(loyaltyBadges.category, filters.category)) as any;
    }
    if (filters?.rarity) {
      query = query.where(eq(loyaltyBadges.rarity, filters.rarity as any)) as any;
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(loyaltyBadges.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(loyaltyBadges.pointsRequired);
  }

  async getLoyaltyBadge(id: number): Promise<LoyaltyBadge | undefined> {
    const [badge] = await db.select().from(loyaltyBadges).where(eq(loyaltyBadges.id, id));
    return badge;
  }

  async createLoyaltyBadge(badge: InsertLoyaltyBadge): Promise<LoyaltyBadge> {
    const [newBadge] = await db.insert(loyaltyBadges).values(badge).returning();
    return newBadge;
  }

  async updateLoyaltyBadge(id: number, badge: Partial<InsertLoyaltyBadge>): Promise<LoyaltyBadge> {
    const [updatedBadge] = await db
      .update(loyaltyBadges)
      .set(badge)
      .where(eq(loyaltyBadges.id, id))
      .returning();
    return updatedBadge;
  }

  // User badge operations
  async getUserBadges(userId: string): Promise<(UserBadge & { badge: LoyaltyBadge })[]> {
    return await db
      .select({
        id: userBadges.id,
        userId: userBadges.userId,
        badgeId: userBadges.badgeId,
        earnedAt: userBadges.earnedAt,
        level: userBadges.level,
        isNew: userBadges.isNew,
        badge: loyaltyBadges,
      })
      .from(userBadges)
      .innerJoin(loyaltyBadges, eq(userBadges.badgeId, loyaltyBadges.id))
      .where(eq(userBadges.userId, userId))
      .orderBy(desc(userBadges.earnedAt));
  }

  async awardBadge(userId: string, badgeId: number, level: number = 1): Promise<UserBadge> {
    const [existingBadge] = await db
      .select()
      .from(userBadges)
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));

    if (existingBadge) {
      // Upgrade existing badge level
      const [updatedBadge] = await db
        .update(userBadges)
        .set({ level: Math.max(existingBadge.level, level), isNew: true })
        .where(eq(userBadges.id, existingBadge.id))
        .returning();
      return updatedBadge;
    } else {
      // Award new badge
      const [newBadge] = await db
        .insert(userBadges)
        .values({ userId, badgeId, level, isNew: true })
        .returning();
      return newBadge;
    }
  }

  async markBadgeAsViewed(userId: string, badgeId: number): Promise<boolean> {
    const result = await db
      .update(userBadges)
      .set({ isNew: false })
      .where(and(eq(userBadges.userId, userId), eq(userBadges.badgeId, badgeId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Loyalty profile operations
  async getLoyaltyProfile(userId: string): Promise<LoyaltyProfile | undefined> {
    const [profile] = await db
      .select()
      .from(loyaltyProfiles)
      .where(eq(loyaltyProfiles.userId, userId));
    return profile;
  }

  async createLoyaltyProfile(profile: InsertLoyaltyProfile): Promise<LoyaltyProfile> {
    const [newProfile] = await db
      .insert(loyaltyProfiles)
      .values(profile)
      .returning();
    return newProfile;
  }

  async updateLoyaltyProfile(userId: string, updates: Partial<InsertLoyaltyProfile>): Promise<LoyaltyProfile> {
    const [updatedProfile] = await db
      .update(loyaltyProfiles)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(loyaltyProfiles.userId, userId))
      .returning();
    return updatedProfile;
  }

  // Points operations
  async addLoyaltyPoints(userId: string, points: number, source: string, description?: string, metadata?: any): Promise<LoyaltyTransaction> {
    // Create transaction record
    const [transaction] = await db
      .insert(loyaltyTransactions)
      .values({
        userId,
        points,
        type: "earned",
        source,
        description,
        metadata,
      })
      .returning();

    // Update user profile
    const profile = await this.getLoyaltyProfile(userId);
    if (profile) {
      await this.updateLoyaltyProfile(userId, {
        totalPoints: profile.totalPoints + points,
        availablePoints: profile.availablePoints + points,
        lastActivity: new Date(),
      });
    } else {
      await this.createLoyaltyProfile({
        userId,
        totalPoints: points,
        availablePoints: points,
        tier: "bronze",
        tierProgress: points,
        streak: 1,
        lastActivity: new Date(),
        joinedAt: new Date(),
        lifetimeSpent: "0.00",
      });
    }

    return transaction;
  }

  async spendLoyaltyPoints(userId: string, points: number, source: string, description?: string, metadata?: any): Promise<LoyaltyTransaction> {
    const profile = await this.getLoyaltyProfile(userId);
    if (!profile || profile.availablePoints < points) {
      throw new Error("Insufficient points");
    }

    // Create transaction record
    const [transaction] = await db
      .insert(loyaltyTransactions)
      .values({
        userId,
        points: -points,
        type: "spent",
        source,
        description,
        metadata,
      })
      .returning();

    // Update user profile
    await this.updateLoyaltyProfile(userId, {
      availablePoints: profile.availablePoints - points,
      lastActivity: new Date(),
    });

    return transaction;
  }

  async getLoyaltyTransactions(userId: string, limit: number = 50): Promise<LoyaltyTransaction[]> {
    return await db
      .select()
      .from(loyaltyTransactions)
      .where(eq(loyaltyTransactions.userId, userId))
      .orderBy(desc(loyaltyTransactions.createdAt))
      .limit(limit);
  }

  // Challenge operations
  async getLoyaltyChallenges(filters?: { type?: string; isActive?: boolean }): Promise<LoyaltyChallenge[]> {
    let query = db.select().from(loyaltyChallenges);
    
    if (filters?.type) {
      query = query.where(eq(loyaltyChallenges.type, filters.type as any)) as any;
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(loyaltyChallenges.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(loyaltyChallenges.startDate);
  }

  async getUserChallenges(userId: string): Promise<(UserChallenge & { challenge: LoyaltyChallenge })[]> {
    return await db
      .select({
        id: userChallenges.id,
        userId: userChallenges.userId,
        challengeId: userChallenges.challengeId,
        progress: userChallenges.progress,
        completedAt: userChallenges.completedAt,
        claimedAt: userChallenges.claimedAt,
        streak: userChallenges.streak,
        createdAt: userChallenges.createdAt,
        updatedAt: userChallenges.updatedAt,
        challenge: loyaltyChallenges,
      })
      .from(userChallenges)
      .innerJoin(loyaltyChallenges, eq(userChallenges.challengeId, loyaltyChallenges.id))
      .where(eq(userChallenges.userId, userId))
      .orderBy(desc(userChallenges.updatedAt));
  }

  async updateChallengeProgress(userId: string, challengeId: number, progress: any): Promise<UserChallenge> {
    const [existingChallenge] = await db
      .select()
      .from(userChallenges)
      .where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId)));

    if (existingChallenge) {
      const [updatedChallenge] = await db
        .update(userChallenges)
        .set({ progress, updatedAt: new Date() })
        .where(eq(userChallenges.id, existingChallenge.id))
        .returning();
      return updatedChallenge;
    } else {
      const [newChallenge] = await db
        .insert(userChallenges)
        .values({ userId, challengeId, progress })
        .returning();
      return newChallenge;
    }
  }

  async completeChallengeProgress(userId: string, challengeId: number): Promise<UserChallenge> {
    const [updatedChallenge] = await db
      .update(userChallenges)
      .set({ completedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(userChallenges.userId, userId), eq(userChallenges.challengeId, challengeId)))
      .returning();
    return updatedChallenge;
  }

  // Reward operations
  async getLoyaltyRewards(filters?: { type?: string; tierRequired?: string; isActive?: boolean }): Promise<LoyaltyReward[]> {
    let query = db.select().from(loyaltyRewards);
    
    if (filters?.type) {
      query = query.where(eq(loyaltyRewards.type, filters.type as any)) as any;
    }
    if (filters?.tierRequired) {
      query = query.where(eq(loyaltyRewards.tierRequired, filters.tierRequired as any)) as any;
    }
    if (filters?.isActive !== undefined) {
      query = query.where(eq(loyaltyRewards.isActive, filters.isActive)) as any;
    }
    
    return await query.orderBy(loyaltyRewards.pointsCost);
  }

  async redeemReward(userId: string, rewardId: number): Promise<UserRedemption> {
    const [reward] = await db.select().from(loyaltyRewards).where(eq(loyaltyRewards.id, rewardId));
    if (!reward) {
      throw new Error("Reward not found");
    }

    const profile = await this.getLoyaltyProfile(userId);
    if (!profile || profile.availablePoints < reward.pointsCost) {
      throw new Error("Insufficient points");
    }

    // Spend points
    await this.spendLoyaltyPoints(userId, reward.pointsCost, "reward_redemption", `Redeemed: ${reward.name}`, { rewardId });

    // Create redemption record
    const [redemption] = await db
      .insert(userRedemptions)
      .values({
        userId,
        rewardId,
        pointsSpent: reward.pointsCost,
        status: "active",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      })
      .returning();

    return redemption;
  }

  async getUserRedemptions(userId: string): Promise<(UserRedemption & { reward: LoyaltyReward })[]> {
    return await db
      .select({
        id: userRedemptions.id,
        userId: userRedemptions.userId,
        rewardId: userRedemptions.rewardId,
        pointsSpent: userRedemptions.pointsSpent,
        status: userRedemptions.status,
        couponCode: userRedemptions.couponCode,
        usedAt: userRedemptions.usedAt,
        expiresAt: userRedemptions.expiresAt,
        createdAt: userRedemptions.createdAt,
        reward: loyaltyRewards,
      })
      .from(userRedemptions)
      .innerJoin(loyaltyRewards, eq(userRedemptions.rewardId, loyaltyRewards.id))
      .where(eq(userRedemptions.userId, userId))
      .orderBy(desc(userRedemptions.createdAt));
  }

  async useRedemption(redemptionId: number): Promise<UserRedemption> {
    const [updatedRedemption] = await db
      .update(userRedemptions)
      .set({ status: "used", usedAt: new Date() })
      .where(eq(userRedemptions.id, redemptionId))
      .returning();
    return updatedRedemption;
  }

  // Jewelry Care Tutorial operations
  async getCareTutorials(filters?: {
    category?: string;
    jewelryType?: string;
    difficulty?: string;
    search?: string;
    userId?: string;
  }): Promise<any[]> {
    const tutorials = await db.execute(sql`
      SELECT * FROM care_tutorials 
      WHERE is_active = true 
      ORDER BY is_featured DESC, views DESC
    `);
    return tutorials.rows;
  }

  async getCareTutorial(id: number): Promise<any> {
    const tutorial = await db.execute(sql`
      SELECT * FROM care_tutorials 
      WHERE id = ${id} AND is_active = true
    `);
    
    if (tutorial.rows.length > 0) {
      // Increment view count
      await db.execute(sql`
        UPDATE care_tutorials 
        SET views = views + 1 
        WHERE id = ${id}
      `);
      
      return tutorial.rows[0];
    }
    
    return undefined;
  }

  async updateTutorialProgress(
    userId: string,
    tutorialId: number,
    updates: any
  ): Promise<any> {
    const existing = await db.execute(sql`
      SELECT * FROM tutorial_progress 
      WHERE user_id = ${userId} AND tutorial_id = ${tutorialId}
    `);

    if (existing.rows.length > 0) {
      const updated = await db.execute(sql`
        UPDATE tutorial_progress 
        SET current_step = ${updates.currentStep || 0}, 
            is_completed = ${updates.isCompleted || false},
            updated_at = NOW()
        WHERE user_id = ${userId} AND tutorial_id = ${tutorialId}
        RETURNING *
      `);
      return updated.rows[0];
    } else {
      const created = await db.execute(sql`
        INSERT INTO tutorial_progress (user_id, tutorial_id, current_step, is_completed)
        VALUES (${userId}, ${tutorialId}, ${updates.currentStep || 0}, ${updates.isCompleted || false})
        RETURNING *
      `);
      return created.rows[0];
    }
  }

  async likeTutorial(tutorialId: number): Promise<any> {
    const updated = await db.execute(sql`
      UPDATE care_tutorials 
      SET likes = likes + 1 
      WHERE id = ${tutorialId}
      RETURNING *
    `);

    if (updated.rows.length === 0) {
      throw new Error("Tutorial not found");
    }

    return updated.rows[0];
  }

  async getCareReminders(userId: string): Promise<any[]> {
    const reminders = await db.execute(sql`
      SELECT * FROM care_reminders 
      WHERE user_id = ${userId} AND is_enabled = true
      ORDER BY next_due
    `);
    return reminders.rows;
  }

  async createCareReminder(reminder: any): Promise<any> {
    const created = await db.execute(sql`
      INSERT INTO care_reminders (user_id, jewelry_name, jewelry_type, care_frequency, next_due, reminder_message)
      VALUES (${reminder.userId}, ${reminder.jewelryName}, ${reminder.jewelryType}, ${reminder.careFrequency}, ${reminder.nextDue}, ${reminder.reminderMessage})
      RETURNING *
    `);
    return created.rows[0];
  }

  async updateCareReminder(id: number, updates: any): Promise<any> {
    const updated = await db.execute(sql`
      UPDATE care_reminders 
      SET jewelry_name = COALESCE(${updates.jewelryName}, jewelry_name),
          jewelry_type = COALESCE(${updates.jewelryType}, jewelry_type),
          care_frequency = COALESCE(${updates.careFrequency}, care_frequency),
          next_due = COALESCE(${updates.nextDue}, next_due),
          reminder_message = COALESCE(${updates.reminderMessage}, reminder_message),
          updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `);
    return updated.rows[0];
  }

  async deleteCareReminder(id: number): Promise<boolean> {
    const result = await db.execute(sql`
      DELETE FROM care_reminders WHERE id = ${id}
    `);
    return result.rowCount > 0;
  }
}

export const storage = new DatabaseStorage();