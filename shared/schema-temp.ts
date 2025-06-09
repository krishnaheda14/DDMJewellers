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

// Enhanced user storage table with authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  passwordHash: varchar("password_hash"),
  firstName: varchar("first_name", { length: 100 }).notNull(),
  lastName: varchar("last_name", { length: 100 }).notNull(),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number", { length: 20 }),
  role: varchar("role", { enum: ["customer", "wholesaler", "admin"] }).default("customer"),
  isActive: boolean("is_active").default(true),
  isEmailVerified: boolean("is_email_verified").default(false),
  isApproved: boolean("is_approved").default(false),
  businessName: varchar("business_name"),
  businessAddress: text("business_address"),
  gstNumber: varchar("gst_number"),
  lastLoginAt: timestamp("last_login_at"),
  emailVerificationToken: varchar("email_verification_token"),
  passwordResetToken: varchar("password_reset_token"),
  passwordResetExpiresAt: timestamp("password_reset_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  parentId: integer("parent_id"),
  productType: varchar("product_type", { enum: ["real", "imitation", "both"] }).default("both"),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Products with enhanced support for both real and imitation jewellery
export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: varchar("image_url"),
  imageUrls: jsonb("image_urls"),
  price: decimal("price", { precision: 10, scale: 2 }),
  productType: varchar("product_type", { enum: ["real", "imitation"] }).notNull(),
  material: varchar("material"),
  weight: decimal("weight", { precision: 8, scale: 3 }),
  makingCharges: decimal("making_charges", { precision: 10, scale: 2 }),
  gemstonesCost: decimal("gemstones_cost", { precision: 10, scale: 2 }),
  diamondsCost: decimal("diamonds_cost", { precision: 10, scale: 2 }),
  silverBillingMode: varchar("silver_billing_mode", { enum: ["live_rate", "fixed_rate"] }),
  fixedRatePerGram: decimal("fixed_rate_per_gram", { precision: 10, scale: 2 }),
  purity: varchar("purity"),
  size: varchar("size"),
  stock: integer("stock").default(0),
  isFeatured: boolean("is_featured").default(false),
  isActive: boolean("is_active").default(true),
  metaTitle: varchar("meta_title"),
  metaDescription: text("meta_description"),
  tags: jsonb("tags"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Cart items
export const cartItems = pgTable("cart_items", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  quantity: integer("quantity").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// Orders
export const orders = pgTable("orders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  status: varchar("status", { enum: ["pending", "confirmed", "processing", "shipped", "delivered", "cancelled"] }).default("pending"),
  totalAmount: decimal("total_amount", { precision: 10, scale: 2 }).notNull(),
  paymentStatus: varchar("payment_status", { enum: ["pending", "paid", "failed", "refunded"] }).default("pending"),
  paymentMethod: varchar("payment_method"),
  shippingAddress: jsonb("shipping_address"),
  billingAddress: jsonb("billing_address"),
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Order items
export const orderItems = pgTable("order_items", {
  id: serial("id").primaryKey(),
  orderId: integer("order_id").notNull().references(() => orders.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id),
  quantity: integer("quantity").notNull(),
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  makingCharges: decimal("making_charges", { precision: 10, scale: 2 }),
  gemstonesCost: decimal("gemstones_cost", { precision: 10, scale: 2 }),
  diamondsCost: decimal("diamonds_cost", { precision: 10, scale: 2 }),
  weightInGrams: decimal("weight_in_grams", { precision: 8, scale: 3 }),
  ratePerGram: decimal("rate_per_gram", { precision: 10, scale: 2 }),
  metalCost: decimal("metal_cost", { precision: 10, scale: 2 }),
  gstAmount: decimal("gst_amount", { precision: 10, scale: 2 }),
  createdAt: timestamp("created_at").defaultNow(),
});

// Wholesaler designs
export const wholesalerDesigns = pgTable("wholesaler_designs", {
  id: serial("id").primaryKey(),
  wholesalerId: varchar("wholesaler_id").notNull().references(() => users.id),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  category: varchar("category"),
  estimatedPrice: decimal("estimated_price", { precision: 10, scale: 2 }),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Wishlist
export const wishlist = pgTable("wishlist", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  productId: integer("product_id").references(() => products.id, { onDelete: "cascade" }),
  wholesalerDesignId: integer("wholesaler_design_id").references(() => wholesalerDesigns.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").defaultNow(),
});

// User memory for chatbot
export const userMemory = pgTable("user_memory", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  age: varchar("age"),
  lifestyle: varchar("lifestyle"),
  preferences: jsonb("preferences"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Chat conversations
export const chatConversations = pgTable("chat_conversations", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  sessionId: varchar("session_id").notNull(),
  messages: jsonb("messages").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Market rates storage
export const marketRates = pgTable("market_rates", {
  id: serial("id").primaryKey(),
  metal: varchar("metal").notNull(),
  unit: varchar("unit").notNull(),
  rate: decimal("rate", { precision: 10, scale: 2 }).notNull(),
  currency: varchar("currency").default("INR"),
  source: varchar("source"),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Create insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategorySchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
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

export const insertWholesalerDesignSchema = createInsertSchema(wholesalerDesigns).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertWishlistSchema = createInsertSchema(wishlist).omit({
  id: true,
  createdAt: true,
});

export const insertUserMemorySchema = createInsertSchema(userMemory).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type UpsertUser = Partial<User> & Pick<User, "id" | "email">;

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

export type WholesalerDesign = typeof wholesalerDesigns.$inferSelect;
export type InsertWholesalerDesign = z.infer<typeof insertWholesalerDesignSchema>;

export type Wishlist = typeof wishlist.$inferSelect;
export type InsertWishlist = z.infer<typeof insertWishlistSchema>;

export type UserMemory = typeof userMemory.$inferSelect;
export type InsertUserMemory = z.infer<typeof insertUserMemorySchema>;

export type ChatConversation = typeof chatConversations.$inferSelect;

export type MarketRate = typeof marketRates.$inferSelect;