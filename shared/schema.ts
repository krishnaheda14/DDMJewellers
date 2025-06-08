import {
  pgTable,
  text,
  varchar,
  timestamp,
  jsonb,
  index,
  serial,
  decimal,
  integer,
  boolean,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Session storage table for Replit Auth
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// User storage table for Replit Auth
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique(),
  firstName: varchar("first_name"),
  lastName: varchar("last_name"),
  profileImageUrl: varchar("profile_image_url"),
  role: varchar("role", { enum: ["customer", "wholesaler", "admin"] }).notNull().default("customer"),
  businessName: varchar("business_name"), // For wholesalers
  businessAddress: text("business_address"), // For wholesalers
  phoneNumber: varchar("phone_number"),
  isApproved: boolean("is_approved").default(true), // For wholesaler approval
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Product categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Products
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: varchar("image_url"),
  images: jsonb("images").$type<string[]>().default([]),
  material: varchar("material", { length: 100 }),
  weight: varchar("weight", { length: 50 }),
  dimensions: varchar("dimensions", { length: 100 }),
  inStock: boolean("in_stock").default(true),
  featured: boolean("featured").default(false),
  customizable: boolean("customizable").default(false),
  customizationOptions: jsonb("customization_options").$type<{
    metals?: string[];
    gemstones?: string[];
    sizes?: string[];
    engravingOptions?: {
      maxLength: number;
      fonts: string[];
    };
    priceAdjustments?: {
      [key: string]: number;
    };
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull().default(1),
  customizations: jsonb("customizations").$type<{
    metal?: string;
    gemstone?: string;
    size?: string;
    engraving?: string;
    font?: string;
    additionalPrice?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  total: decimal("total", { precision: 10, scale: 2 }).notNull(),
  status: varchar("status", { length: 50 }).notNull().default("pending"),
  shippingAddress: jsonb("shipping_address").$type<{
    name: string;
    address: string;
    city: string;
    state: string;
    postalCode: string;
    phone: string;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id),
  productId: integer("product_id").notNull().references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  customizations: jsonb("customizations").$type<{
    metal?: string;
    gemstone?: string;
    size?: string;
    engraving?: string;
    font?: string;
    additionalPrice?: number;
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
});

// User memories for Sunaarji chatbot
export const userMemories = pgTable("user_memories", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  age: varchar("age"),
  lifestyle: text("lifestyle"),
  preferences: jsonb("preferences").$type<{
    favoriteMetals?: string[];
    budgetRange?: string;
    occasions?: string[];
    stylePreferences?: string[];
    previousRecommendations?: string[];
    conversationHistory?: string[];
  }>(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations for context
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull(),
  sessionId: varchar("session_id").notNull(),
  messages: jsonb("messages").$type<Array<{
    type: 'bot' | 'user';
    content: string;
    timestamp: Date;
  }>>().notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wholesaler designs table
export const wholesalerDesigns = pgTable("wholesaler_designs", {
  id: serial("id").primaryKey(),
  wholesalerId: varchar("wholesaler_id").notNull().references(() => users.id),
  title: varchar("title").notNull(),
  description: text("description"),
  imageUrl: varchar("image_url").notNull(),
  additionalImages: jsonb("additional_images").$type<string[]>().default([]),
  category: varchar("category"),
  materials: text("materials"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  specifications: jsonb("specifications").$type<{
    dimensions?: string;
    weight?: string;
    metalType?: string;
    gemstones?: string;
    craftsmanship?: string;
  }>(),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).notNull().default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wishlist table for customers
export const wishlists = pgTable("wishlists", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  productId: integer("product_id").references(() => products.id),
  designId: integer("design_id").references(() => wholesalerDesigns.id),
  createdAt: timestamp("created_at").defaultNow(),
});

// Gullak (Gold Savings) Tables
export const gullakAccounts = pgTable("gullak_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name").notNull(), // e.g., "My First Gold Savings"
  metalType: varchar("metal_type").notNull().default("gold"), // gold, silver
  dailyAmount: varchar("daily_amount").notNull(), // Amount in rupees
  targetMetalWeight: varchar("target_metal_weight").notNull(), // In grams (renamed from targetGoldWeight)
  targetAmount: varchar("target_amount").notNull(), // Total target amount in rupees
  currentBalance: varchar("current_balance").default("0"), // Current saved amount
  status: varchar("status").default("active"), // active, paused, completed, cancelled
  autoPayEnabled: boolean("auto_pay_enabled").default(true),
  nextPaymentDate: timestamp("next_payment_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const gullakTransactions = pgTable("gullak_transactions", {
  id: serial("id").primaryKey(),
  gullakAccountId: integer("gullak_account_id").notNull().references(() => gullakAccounts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  amount: varchar("amount").notNull(),
  type: varchar("type").notNull(), // deposit, withdrawal, auto_pay, interest
  goldRate: varchar("gold_rate"), // Gold rate at time of transaction
  goldValue: varchar("gold_value"), // Gold weight equivalent
  description: text("description"),
  status: varchar("status").default("completed"), // pending, completed, failed
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const goldRates = pgTable("gold_rates", {
  id: serial("id").primaryKey(),
  rate24k: varchar("rate_24k").notNull(), // Per gram rate for 24k gold
  rate22k: varchar("rate_22k").notNull(), // Per gram rate for 22k gold
  rate18k: varchar("rate_18k").notNull(), // Per gram rate for 18k gold
  silverRate: varchar("silver_rate"), // Per gram rate for silver
  currency: varchar("currency").default("INR"),
  source: varchar("source"), // API source or manual
  effectiveDate: timestamp("effective_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
});

export const gullakOrders = pgTable("gullak_orders", {
  id: serial("id").primaryKey(),
  gullakAccountId: integer("gullak_account_id").notNull().references(() => gullakAccounts.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  goldWeight: varchar("gold_weight").notNull(), // Weight of gold ordered
  goldPurity: varchar("gold_purity").default("24k"), // 24k, 22k, 18k
  coinType: varchar("coin_type").notNull(), // coin, bar, jewelry
  amountUsed: varchar("amount_used").notNull(), // Amount deducted from Gullak
  deliveryAddress: text("delivery_address").notNull(),
  status: varchar("status").default("pending"), // pending, processing, shipped, delivered, cancelled
  orderDate: timestamp("order_date").defaultNow(),
  expectedDelivery: timestamp("expected_delivery"),
  trackingNumber: varchar("tracking_number"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Relations
export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  cartItems: many(cartItems),
  orderItems: many(orderItems),
}));

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const cartItemsRelations = relations(cartItems, ({ one }) => ({
  user: one(users, {
    fields: [cartItems.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [cartItems.productId],
    references: [products.id],
  }),
}));

export const ordersRelations = relations(orders, ({ one, many }) => ({
  user: one(users, {
    fields: [orders.userId],
    references: [users.id],
  }),
  orderItems: many(orderItems),
}));

export const orderItemsRelations = relations(orderItems, ({ one }) => ({
  order: one(orders, {
    fields: [orderItems.orderId],
    references: [orders.id],
  }),
  product: one(products, {
    fields: [orderItems.productId],
    references: [products.id],
  }),
}));

export const usersRelations = relations(users, ({ many }) => ({
  wholesalerDesigns: many(wholesalerDesigns),
  wishlists: many(wishlists),
  cartItems: many(cartItems),
  orders: many(orders),
  gullakAccounts: many(gullakAccounts),
  gullakTransactions: many(gullakTransactions),
  gullakOrders: many(gullakOrders),
}));

export const wholesalerDesignsRelations = relations(wholesalerDesigns, ({ one, many }) => ({
  wholesaler: one(users, {
    fields: [wholesalerDesigns.wholesalerId],
    references: [users.id],
  }),
  approver: one(users, {
    fields: [wholesalerDesigns.approvedBy],
    references: [users.id],
  }),
  wishlists: many(wishlists),
}));

export const wishlistsRelations = relations(wishlists, ({ one }) => ({
  user: one(users, {
    fields: [wishlists.userId],
    references: [users.id],
  }),
  product: one(products, {
    fields: [wishlists.productId],
    references: [products.id],
  }),
  design: one(wholesalerDesigns, {
    fields: [wishlists.designId],
    references: [wholesalerDesigns.id],
  }),
}));

// Gullak Relations
export const gullakAccountsRelations = relations(gullakAccounts, ({ one, many }) => ({
  user: one(users, {
    fields: [gullakAccounts.userId],
    references: [users.id],
  }),
  transactions: many(gullakTransactions),
  orders: many(gullakOrders),
}));

export const gullakTransactionsRelations = relations(gullakTransactions, ({ one }) => ({
  gullakAccount: one(gullakAccounts, {
    fields: [gullakTransactions.gullakAccountId],
    references: [gullakAccounts.id],
  }),
  user: one(users, {
    fields: [gullakTransactions.userId],
    references: [users.id],
  }),
}));

export const gullakOrdersRelations = relations(gullakOrders, ({ one }) => ({
  gullakAccount: one(gullakAccounts, {
    fields: [gullakOrders.gullakAccountId],
    references: [gullakAccounts.id],
  }),
  user: one(users, {
    fields: [gullakOrders.userId],
    references: [users.id],
  }),
}));

// Insert schemas
export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
});

export const insertProductSchema = createInsertSchema(products).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCartItemSchema = createInsertSchema(cartItems).omit({
  id: true,
  createdAt: true,
});

export const insertOrderSchema = createInsertSchema(orders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertOrderItemSchema = createInsertSchema(orderItems).omit({
  id: true,
  createdAt: true,
});

export const insertUserMemorySchema = createInsertSchema(userMemories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertChatConversationSchema = createInsertSchema(chatConversations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWholesalerDesignSchema = createInsertSchema(wholesalerDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlists).omit({
  id: true,
  createdAt: true,
});

export const insertGullakAccountSchema = createInsertSchema(gullakAccounts).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertGullakTransactionSchema = createInsertSchema(gullakTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertGoldRateSchema = createInsertSchema(goldRates).omit({
  id: true,
  createdAt: true,
});

export const insertGullakOrderSchema = createInsertSchema(gullakOrders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type UpsertUser = typeof users.$inferInsert;
export type User = typeof users.$inferSelect;
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategorySchema>;
export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;
export type CartItem = typeof cartItems.$inferSelect;
export type InsertCartItem = z.infer<typeof insertCartItemSchema>;
export type Order = typeof orders.$inferSelect;
export type InsertOrder = z.infer<typeof insertOrderSchema>;
export type OrderItem = typeof orderItems.$inferSelect;
export type InsertOrderItem = z.infer<typeof insertOrderItemSchema>;
export type UserMemory = typeof userMemories.$inferSelect;
export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;
export type ChatConversation = typeof chatConversations.$inferSelect;
export type InsertChatConversation = z.infer<typeof insertChatConversationSchema>;
export type WholesalerDesign = typeof wholesalerDesigns.$inferSelect;
export type InsertWholesalerDesign = z.infer<typeof insertWholesalerDesignSchema>;
export type Wishlist = typeof wishlists.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;
export type GullakAccount = typeof gullakAccounts.$inferSelect;
export type InsertGullakAccount = z.infer<typeof insertGullakAccountSchema>;
export type GullakTransaction = typeof gullakTransactions.$inferSelect;
export type InsertGullakTransaction = z.infer<typeof insertGullakTransactionSchema>;
export type GoldRate = typeof goldRates.$inferSelect;
export type InsertGoldRate = z.infer<typeof insertGoldRateSchema>;
export type GullakOrder = typeof gullakOrders.$inferSelect;
export type InsertGullakOrder = z.infer<typeof insertGullakOrderSchema>;
