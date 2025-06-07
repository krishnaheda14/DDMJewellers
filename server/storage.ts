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
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, like, or } from "drizzle-orm";

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
    return await db.select().from(categories).orderBy(categories.name);
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
    let query = db.select().from(products);

    const conditions = [];
    if (filters?.categoryId) {
      conditions.push(eq(products.categoryId, filters.categoryId));
    }
    if (filters?.search) {
      conditions.push(
        or(
          like(products.name, `%${filters.search}%`),
          like(products.description, `%${filters.search}%`)
        )
      );
    }
    if (filters?.featured !== undefined) {
      conditions.push(eq(products.featured, filters.featured));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
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
      .select({
        id: cartItems.id,
        userId: cartItems.userId,
        productId: cartItems.productId,
        quantity: cartItems.quantity,
        createdAt: cartItems.createdAt,
        product: products,
      })
      .from(cartItems)
      .innerJoin(products, eq(cartItems.productId, products.id))
      .where(eq(cartItems.userId, userId));
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
        .set({ quantity: existingItem.quantity + item.quantity })
        .where(eq(cartItems.id, existingItem.id))
        .returning();
      return updatedItem;
    } else {
      // Create new cart item
      const [newItem] = await db.insert(cartItems).values(item).returning();
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
    return result.rowCount > 0;
  }

  async clearCart(userId: string): Promise<boolean> {
    const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
    return result.rowCount >= 0;
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
      .select({
        id: orderItems.id,
        orderId: orderItems.orderId,
        productId: orderItems.productId,
        quantity: orderItems.quantity,
        price: orderItems.price,
        createdAt: orderItems.createdAt,
        product: products,
      })
      .from(orderItems)
      .innerJoin(products, eq(orderItems.productId, products.id))
      .where(eq(orderItems.orderId, id));

    return { ...order, orderItems: items };
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    const [newOrder] = await db.insert(orders).values(order).returning();
    
    const orderItemsData = items.map(item => ({
      ...item,
      orderId: newOrder.id,
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
    const [memory] = await db
      .select()
      .from(userMemories)
      .where(eq(userMemories.userId, userId));
    return memory;
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    const [upsertedMemory] = await db
      .insert(userMemories)
      .values({
        userId,
        ...memory,
      })
      .onConflictDoUpdate({
        target: userMemories.userId,
        set: {
          ...memory,
          updatedAt: new Date(),
        },
      })
      .returning();
    return upsertedMemory;
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    const [conversation] = await db
      .insert(chatConversations)
      .values({
        userId,
        sessionId,
        messages,
      })
      .onConflictDoUpdate({
        target: [chatConversations.userId, chatConversations.sessionId],
        set: {
          messages,
          updatedAt: new Date(),
        },
      })
      .returning();
    return conversation;
  }

  async getChatHistory(userId: string, limit: number = 5): Promise<ChatConversation[]> {
    const history = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, userId))
      .orderBy(desc(chatConversations.updatedAt))
      .limit(limit);
    return history;
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
        materials: wholesalerDesigns.materials,
        estimatedPrice: wholesalerDesigns.estimatedPrice,
        specifications: wholesalerDesigns.specifications,
        status: wholesalerDesigns.status,
        approvedBy: wholesalerDesigns.approvedBy,
        approvedAt: wholesalerDesigns.approvedAt,
        isActive: wholesalerDesigns.isActive,
        createdAt: wholesalerDesigns.createdAt,
        updatedAt: wholesalerDesigns.updatedAt,
        wholesaler: users,
      })
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

    const designs = await query.orderBy(desc(wholesalerDesigns.createdAt));
    return designs.map(design => ({
      ...design,
      wholesaler: design.wholesaler!,
    }));
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
        materials: wholesalerDesigns.materials,
        estimatedPrice: wholesalerDesigns.estimatedPrice,
        specifications: wholesalerDesigns.specifications,
        status: wholesalerDesigns.status,
        approvedBy: wholesalerDesigns.approvedBy,
        approvedAt: wholesalerDesigns.approvedAt,
        isActive: wholesalerDesigns.isActive,
        createdAt: wholesalerDesigns.createdAt,
        updatedAt: wholesalerDesigns.updatedAt,
        wholesaler: users,
      })
      .from(wholesalerDesigns)
      .leftJoin(users, eq(wholesalerDesigns.wholesalerId, users.id))
      .where(eq(wholesalerDesigns.id, id));

    if (!design) return undefined;
    return {
      ...design,
      wholesaler: design.wholesaler!,
    };
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    const [newDesign] = await db
      .insert(wholesalerDesigns)
      .values(design)
      .returning();
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
    const [design] = await db
      .update(wholesalerDesigns)
      .set({
        status: "approved",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return design;
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    const [design] = await db
      .update(wholesalerDesigns)
      .set({
        status: "rejected",
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(wholesalerDesigns.id, id))
      .returning();
    return design;
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

    return wishlistItems.map(item => ({
      ...item,
      product: item.product || undefined,
      design: item.design || undefined,
    }));
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [wishlistItem] = await db
      .insert(wishlists)
      .values(item)
      .returning();
    return wishlistItem;
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    const result = await db.delete(wishlists).where(eq(wishlists.id, id));
    return (result.rowCount ?? 0) > 0;
  }

  // User role operations
  async updateUserRole(userId: string, role: string): Promise<User> {
    const [user] = await db
      .update(users)
      .set({ role: role as "customer" | "wholesaler" | "admin", updatedAt: new Date() })
      .where(eq(users.id, userId))
      .returning();
    return user;
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    let query = db
      .select()
      .from(users)
      .where(eq(users.role, "wholesaler"));

    if (approved !== undefined) {
      query = query.where(eq(users.isApproved, approved));
    }

    return await query.orderBy(users.createdAt);
  }
}

export const storage = new DatabaseStorage();
