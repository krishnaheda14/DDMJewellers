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
  sessionToken: varchar("session_token"),
  sessionExpiresAt: timestamp("session_expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User Activity Log table
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(),
  details: text("details"),
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow(),
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

// Corporate registrations storage
export const corporateRegistrations = pgTable("corporate_registrations", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name", { length: 255 }).notNull(),
  registrationNumber: varchar("registration_number", { length: 100 }),
  gstin: varchar("gstin", { length: 15 }),
  companyAddress: text("company_address"),
  contactPersonName: varchar("contact_person_name", { length: 100 }).notNull(),
  contactPersonPhone: varchar("contact_person_phone", { length: 20 }),
  contactPersonEmail: varchar("contact_person_email", { length: 255 }).notNull(),
  companyEmail: varchar("company_email", { length: 255 }),
  approximateEmployees: integer("approximate_employees").default(0),
  purposeOfTieup: text("purpose_of_tieup"),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  approvedBy: varchar("approved_by"),
  approvedAt: timestamp("approved_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gullak accounts storage
export const gullakAccounts = pgTable("gullak_accounts", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  name: varchar("name", { length: 255 }).notNull(),
  metalType: varchar("metal_type", { enum: ["gold", "silver"] }).notNull(),
  metalPurity: varchar("metal_purity", { enum: ["24k", "22k", "18k", "silver"] }).notNull(),
  paymentAmount: decimal("payment_amount", { precision: 10, scale: 2 }).notNull(),
  paymentFrequency: varchar("payment_frequency", { enum: ["daily", "weekly", "monthly"] }).notNull(),
  paymentDayOfWeek: integer("payment_day_of_week"), // 0-6 for weekly
  paymentDayOfMonth: integer("payment_day_of_month"), // 1-28 for monthly
  targetMetalWeight: decimal("target_metal_weight", { precision: 10, scale: 3 }).notNull(),
  targetAmount: decimal("target_amount", { precision: 10, scale: 2 }).notNull(),
  currentBalance: decimal("current_balance", { precision: 10, scale: 2 }).default("0"),
  status: varchar("status", { enum: ["active", "paused", "completed", "cancelled"] }).default("active"),
  autoPayEnabled: boolean("auto_pay_enabled").default(true),
  nextPaymentDate: timestamp("next_payment_date"),
  completedAt: timestamp("completed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Gullak transactions storage
export const gullakTransactions = pgTable("gullak_transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id").notNull().references(() => gullakAccounts.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  type: varchar("type", { enum: ["deposit", "withdrawal", "autopay", "manual"] }).notNull(),
  goldRate: decimal("gold_rate", { precision: 10, scale: 2 }),
  goldValue: decimal("gold_value", { precision: 10, scale: 6 }),
  description: text("description"),
  paymentMethod: varchar("payment_method", { length: 50 }),
  transactionId: varchar("transaction_id", { length: 255 }),
  status: varchar("status", { enum: ["pending", "completed", "failed"] }).default("completed"),
  transactionDate: timestamp("transaction_date").defaultNow(),
  createdAt: timestamp("created_at").defaultNow(),
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

export const insertCorporateRegistrationSchema = createInsertSchema(corporateRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  status: true,
  approvedBy: true,
  approvedAt: true,
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

// Authentication schemas
export const customerSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phone: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const wholesalerSignupSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
  phone: z.string().optional(),
  businessName: z.string().min(1, "Business name is required"),
  businessAddress: z.string().optional(),
  businessPhone: z.string().optional(),
  gstNumber: z.string().optional(),
  yearsInBusiness: z.number().min(0, "Years in business must be positive"),
  averageOrderValue: z.string().optional(),
  references: z.string().optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
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

export type CorporateRegistration = typeof corporateRegistrations.$inferSelect;
export type InsertCorporateRegistration = z.infer<typeof insertCorporateRegistrationSchema>;

export type GullakAccount = typeof gullakAccounts.$inferSelect;
export type InsertGullakAccount = z.infer<typeof insertGullakAccountSchema>;

export type GullakTransaction = typeof gullakTransactions.$inferSelect;
export type InsertGullakTransaction = z.infer<typeof insertGullakTransactionSchema>;

// Authentication types
export type CustomerSignup = z.infer<typeof customerSignupSchema>;
export type WholesalerSignup = z.infer<typeof wholesalerSignupSchema>;
export type Signin = z.infer<typeof signinSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;