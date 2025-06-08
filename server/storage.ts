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
  type InsertGullakTransaction,
  type GoldRate,
  type InsertGoldRate,
  type GullakOrder,
  type InsertGullakOrder,
} from "@shared/schema";
import { db } from "./db";
import { eq, and, or, like, desc, asc, sql } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();