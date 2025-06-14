import {
  users,
  categories,
  products,
  cartItems,
  orders,
  orderItems,
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
  type WholesalerDesign,
  type InsertWholesalerDesign,
  type Wishlist,
  type InsertWishlist,
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
    const [existingUser] = await db.select().from(users).where(eq(users.id, userData.id));
    
    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          ...userData,
          updatedAt: new Date(),
        })
        .where(eq(users.id, userData.id))
        .returning();
      return updatedUser;
    } else {
      const userInsertData = {
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        role: userData.role || 'customer',
        passwordHash: userData.passwordHash || null,
        profileImageUrl: userData.profileImageUrl || null,
        isEmailVerified: userData.isEmailVerified || false,
        emailVerificationToken: userData.emailVerificationToken || null,
        passwordResetToken: userData.passwordResetToken || null,
        passwordResetExpiresAt: userData.passwordResetExpiresAt || null,
        isApproved: userData.isApproved || false,
        lastLoginAt: userData.lastLoginAt || null,
        isActive: userData.isActive || true,
        businessName: userData.businessName || null,
        businessAddress: userData.businessAddress || null,
        gstNumber: userData.gstNumber || null,
      };
      
      const [newUser] = await db
        .insert(users)
        .values(userInsertData)
        .returning();
      return newUser;
    }
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
      query = query.where(eq(products.isFeatured, filters.featured)) as any;
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
      .where(and(eq(cartItems.userId, item.userId), eq(cartItems.productId, item.productId!)));

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
      .set({ status: status as any, updatedAt: new Date() })
      .where(eq(orders.id, id))
      .returning();
    return updatedOrder;
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
        id: wishlist.id,
        userId: wishlist.userId,
        productId: wishlist.productId,
        designId: wishlist.wholesalerDesignId,
        createdAt: wishlist.createdAt,
        product: products,
        design: wholesalerDesigns,
      })
      .from(wishlist)
      .leftJoin(products, eq(wishlist.productId, products.id))
      .leftJoin(wholesalerDesigns, eq(wishlist.wholesalerDesignId, wholesalerDesigns.id))
      .where(eq(wishlist.userId, userId))
      .orderBy(desc(wishlist.createdAt));

    return wishlistItems as any;
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    const [newWishlistItem] = await db.insert(wishlist).values(item).returning();
    return newWishlistItem;
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    const result = await db.delete(wishlist).where(eq(wishlist.id, id));
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
    const baseQuery = db.select().from(users);
    
    if (approved !== undefined) {
      return await baseQuery.where(and(eq(users.role, "wholesaler"), eq(users.isApproved, approved)));
    }
    
    return await baseQuery.where(eq(users.role, "wholesaler"));
  }

  // Market rates operations
  async createGoldRate(rates: {
    rate24k: string;
    rate22k: string;
    rate18k: string;
    silverRate: string;
    currency?: string;
    source?: string;
  }): Promise<void> {
    // Clear existing rates
    await db.delete(marketRates);
    
    // Insert new rates
    const rateData = [
      { metal: "gold_24k", unit: "gram", rate: rates.rate24k, currency: rates.currency || "INR", source: rates.source || "auto" },
      { metal: "gold_22k", unit: "gram", rate: rates.rate22k, currency: rates.currency || "INR", source: rates.source || "auto" },
      { metal: "gold_18k", unit: "gram", rate: rates.rate18k, currency: rates.currency || "INR", source: rates.source || "auto" },
      { metal: "silver", unit: "gram", rate: rates.silverRate, currency: rates.currency || "INR", source: rates.source || "auto" }
    ];
    
    await db.insert(marketRates).values(rateData);
  }

  async getCurrentRates(): Promise<any[]> {
    return await db.select().from(marketRates).orderBy(desc(marketRates.updatedAt));
  }
}

export const storage = new DatabaseStorage();