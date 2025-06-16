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
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
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
  approveWholesaler(userId: string, approvedBy: string): Promise<User>;
  rejectWholesaler(userId: string, approvedBy: string): Promise<User>;
  getCurrentRates(): Promise<MarketRate[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.id, id));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user:", error);
      return undefined;
    }
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    try {
      const [user] = await db.select().from(users).where(eq(users.email, email));
      return user || undefined;
    } catch (error) {
      console.error("Error getting user by email:", error);
      return undefined;
    }
  }

  async createUser(userData: any): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          id: userData.id,
          email: userData.email,
          firstName: userData.firstName || null,
          lastName: userData.lastName || null,
          passwordHash: userData.passwordHash || null,
          role: userData.role || "customer",
          isEmailVerified: userData.isEmailVerified || false,
          isApproved: userData.isApproved || true,
          profileImageUrl: userData.profileImageUrl || null,
          phone: userData.phone || null,
          address: userData.address || null,
          city: userData.city || null,
          state: userData.state || null,
          zipCode: userData.zipCode || null,
          country: userData.country || null,
          dateOfBirth: userData.dateOfBirth || null,
          gender: userData.gender || null,
          preferences: userData.preferences || {},
          lastLoginAt: new Date(),
          sessionToken: userData.sessionToken || null,
          sessionExpiresAt: userData.sessionExpiresAt || null,
          emailVerificationToken: userData.emailVerificationToken || null,
          passwordResetToken: userData.passwordResetToken || null,
          passwordResetExpiresAt: userData.passwordResetExpiresAt || null,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error creating user:", error);
      throw error;
    }
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    try {
      const [user] = await db
        .insert(users)
        .values({
          ...userData,
          updatedAt: new Date(),
        })
        .onConflictDoUpdate({
          target: users.id,
          set: {
            ...userData,
            updatedAt: new Date(),
          },
        })
        .returning();
      return user;
    } catch (error) {
      console.error("Error upserting user:", error);
      throw error;
    }
  }

  async getCategories(): Promise<Category[]> {
    try {
      return await db.select().from(categories).orderBy(asc(categories.sortOrder));
    } catch (error) {
      console.error("Error getting categories:", error);
      return [];
    }
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    try {
      const [category] = await db.select().from(categories).where(eq(categories.slug, slug));
      return category || undefined;
    } catch (error) {
      console.error("Error getting category by slug:", error);
      return undefined;
    }
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    try {
      const [newCategory] = await db
        .insert(categories)
        .values({
          ...category,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newCategory;
    } catch (error) {
      console.error("Error creating category:", error);
      throw error;
    }
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    try {
      const [updatedCategory] = await db
        .update(categories)
        .set({
          ...category,
          updatedAt: new Date()
        })
        .where(eq(categories.id, id))
        .returning();
      return updatedCategory;
    } catch (error) {
      console.error("Error updating category:", error);
      throw error;
    }
  }

  async deleteCategory(id: number): Promise<boolean> {
    try {
      const result = await db.delete(categories).where(eq(categories.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting category:", error);
      return false;
    }
  }

  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    productType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    try {
      let query = db.select().from(products);

      if (filters?.categoryId) {
        query = query.where(eq(products.categoryId, filters.categoryId)) as any;
      }

      if (filters?.search) {
        const searchTerm = `%${filters.search}%`;
        query = query.where(like(products.name, searchTerm)) as any;
      }

      if (filters?.featured !== undefined) {
        query = query.where(eq(products.featured, filters.featured)) as any;
      }

      if (filters?.productType) {
        query = query.where(eq(products.productType, filters.productType as any)) as any;
      }

      query = query.orderBy(desc(products.createdAt)) as any;

      if (filters?.limit) {
        query = query.limit(filters.limit) as any;
      }

      if (filters?.offset) {
        query = query.offset(filters.offset) as any;
      }

      return await query;
    } catch (error) {
      console.error("Error getting products:", error);
      return [];
    }
  }

  async getProduct(id: number): Promise<Product | undefined> {
    try {
      const [product] = await db.select().from(products).where(eq(products.id, id));
      return product || undefined;
    } catch (error) {
      console.error("Error getting product:", error);
      return undefined;
    }
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    try {
      const [newProduct] = await db
        .insert(products)
        .values({
          ...product,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      return newProduct;
    } catch (error) {
      console.error("Error creating product:", error);
      throw error;
    }
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    try {
      const [updatedProduct] = await db
        .update(products)
        .set({
          ...product,
          updatedAt: new Date()
        })
        .where(eq(products.id, id))
        .returning();
      return updatedProduct;
    } catch (error) {
      console.error("Error updating product:", error);
      throw error;
    }
  }

  async deleteProduct(id: number): Promise<boolean> {
    try {
      const result = await db.delete(products).where(eq(products.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error deleting product:", error);
      return false;
    }
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    try {
      const items = await db
        .select({
          id: cartItems.id,
          userId: cartItems.userId,
          productId: cartItems.productId,
          quantity: cartItems.quantity,
          customizations: cartItems.customizations,
          createdAt: cartItems.createdAt,
          product: products
        })
        .from(cartItems)
        .leftJoin(products, eq(cartItems.productId, products.id))
        .where(eq(cartItems.userId, userId));

      return items.filter(item => item.product) as (CartItem & { product: Product })[];
    } catch (error) {
      console.error("Error getting cart items:", error);
      return [];
    }
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    try {
      const [cartItem] = await db
        .insert(cartItems)
        .values({
          ...item,
          createdAt: new Date()
        })
        .returning();
      return cartItem;
    } catch (error) {
      console.error("Error adding to cart:", error);
      throw error;
    }
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    try {
      const [updatedItem] = await db
        .update(cartItems)
        .set({ quantity })
        .where(eq(cartItems.id, id))
        .returning();
      return updatedItem;
    } catch (error) {
      console.error("Error updating cart item:", error);
      throw error;
    }
  }

  async removeFromCart(id: number): Promise<boolean> {
    try {
      const result = await db.delete(cartItems).where(eq(cartItems.id, id));
      return (result.rowCount || 0) > 0;
    } catch (error) {
      console.error("Error removing from cart:", error);
      return false;
    }
  }

  async clearCart(userId: string): Promise<boolean> {
    try {
      const result = await db.delete(cartItems).where(eq(cartItems.userId, userId));
      return (result.rowCount || 0) >= 0;
    } catch (error) {
      console.error("Error clearing cart:", error);
      return false;
    }
  }

  async getOrders(userId?: string): Promise<Order[]> {
    try {
      let query = db.select().from(orders);
      
      if (userId) {
        query = query.where(eq(orders.userId, userId)) as any;
      }
      
      return await query.orderBy(desc(orders.createdAt));
    } catch (error) {
      console.error("Error getting orders:", error);
      return [];
    }
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    try {
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
          product: products
        })
        .from(orderItems)
        .leftJoin(products, eq(orderItems.productId, products.id))
        .where(eq(orderItems.orderId, id));

      return {
        ...order,
        orderItems: items.filter(item => item.product) as (OrderItem & { product: Product })[]
      };
    } catch (error) {
      console.error("Error getting order:", error);
      return undefined;
    }
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    try {
      const [newOrder] = await db
        .insert(orders)
        .values({
          ...order,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();

      // Insert order items
      if (items.length > 0) {
        await db.insert(orderItems).values(
          items.map(item => ({
            ...item,
            orderId: newOrder.id
          }))
        );
      }

      return newOrder;
    } catch (error) {
      console.error("Error creating order:", error);
      throw error;
    }
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    try {
      const [updatedOrder] = await db
        .update(orders)
        .set({
          status: status as any,
          updatedAt: new Date()
        })
        .where(eq(orders.id, id))
        .returning();
      return updatedOrder;
    } catch (error) {
      console.error("Error updating order status:", error);
      throw error;
    }
  }

  // Placeholder implementations for other methods
  async getUserMemory(userId: string): Promise<UserMemory | undefined> {
    return undefined;
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    throw new Error("Not implemented");
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    throw new Error("Not implemented");
  }

  async getChatHistory(userId: string, limit: number = 5): Promise<ChatConversation[]> {
    return [];
  }

  async getWholesalerDesigns(filters?: any): Promise<(WholesalerDesign & { wholesaler: User })[]> {
    return [];
  }

  async getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined> {
    return undefined;
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    throw new Error("Not implemented");
  }

  async updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign> {
    throw new Error("Not implemented");
  }

  async approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    throw new Error("Not implemented");
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    throw new Error("Not implemented");
  }

  async deleteWholesalerDesign(id: number): Promise<boolean> {
    return false;
  }

  async getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]> {
    return [];
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    throw new Error("Not implemented");
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    return false;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    throw new Error("Not implemented");
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    try {
      let query = db.select().from(users).where(eq(users.role, "wholesaler"));
      
      if (approved !== undefined) {
        query = query.where(eq(users.isApproved, approved));
      }
      
      return await query;
    } catch (error) {
      console.error("Error getting wholesalers:", error);
      return [];
    }
  }

  async approveWholesaler(userId: string, approvedBy: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isApproved: true, 
        approvedBy,
        approvedAt: new Date(),
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async rejectWholesaler(userId: string, approvedBy: string): Promise<User> {
    const [updatedUser] = await db
      .update(users)
      .set({ 
        isApproved: false,
        isActive: false,
        approvedBy,
        updatedAt: new Date() 
      })
      .where(eq(users.id, userId))
      .returning();
    return updatedUser;
  }

  async getCurrentRates(): Promise<MarketRate[]> {
    try {
      return await db.select().from(marketRates).orderBy(desc(marketRates.lastUpdated));
    } catch (error) {
      console.error("Error getting market rates:", error);
      return [];
    }
  }
}

export const storage = new DatabaseStorage();