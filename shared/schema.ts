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

// User Activity Log table
export const userActivityLog = pgTable("user_activity_log", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  action: varchar("action", { length: 100 }).notNull(), // "login", "logout", "purchase", "exchange_request", etc.
  details: text("details"), // Additional details about the action
  ipAddress: varchar("ip_address"),
  userAgent: text("user_agent"),
  metadata: jsonb("metadata"), // Additional structured data
  createdAt: timestamp("created_at").defaultNow(),
});

// Enhanced user storage table with authentication
export const users = pgTable("users", {
  id: varchar("id").primaryKey().notNull(),
  email: varchar("email").unique().notNull(),
  passwordHash: varchar("password_hash"), // For local authentication
  firstName: varchar("first_name").notNull(),
  lastName: varchar("last_name").notNull(),
  profileImageUrl: varchar("profile_image_url"),
  phoneNumber: varchar("phone_number"),
  role: varchar("role", { enum: ["customer", "wholesaler", "admin"] }).notNull().default("customer"),
  
  // Business details for wholesalers
  businessName: varchar("business_name"),
  businessAddress: text("business_address"),
  businessRegistrationProof: varchar("business_registration_proof"), // File path
  
  // Account status
  isEmailVerified: boolean("is_email_verified").default(false),
  isApproved: boolean("is_approved").default(false), // Admin approval for wholesalers
  isActive: boolean("is_active").default(true),
  
  // Session management
  lastLoginAt: timestamp("last_login_at"),
  sessionToken: varchar("session_token"),
  sessionExpiresAt: timestamp("session_expires_at"),
  
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Email verification tokens
export const emailVerificationTokens = pgTable("email_verification_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});

// Password reset tokens
export const passwordResetTokens = pgTable("password_reset_tokens", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  token: varchar("token").notNull().unique(),
  expiresAt: timestamp("expires_at").notNull(),
  used: boolean("used").default(false),
  createdAt: timestamp("created_at").defaultNow(),
});

// Categories table

// Product categories with enhanced support for real and imitation jewellery
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull().unique(),
  description: text("description"),
  imageUrl: varchar("image_url"),
  parentId: integer("parent_id").references(() => categories.id), // For subcategories
  productType: varchar("product_type", { enum: ["real", "imitation", "both"] }).default("both"), // Category type
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
  price: decimal("price", { precision: 10, scale: 2 }).notNull(),
  originalPrice: decimal("original_price", { precision: 10, scale: 2 }),
  categoryId: integer("category_id").references(() => categories.id),
  imageUrl: varchar("image_url"),
  images: jsonb("images").$type<string[]>().default([]),
  
  // Product type classification
  productType: varchar("product_type", { enum: ["real", "imitation"] }).notNull().default("real"),
  
  // Common fields
  material: varchar("material", { length: 100 }),
  weight: varchar("weight", { length: 50 }),
  dimensions: varchar("dimensions", { length: 100 }),
  stock: integer("stock").default(0),
  
  // Imitation jewellery specific fields
  plating: varchar("plating", { length: 100 }), // Gold Plated, Silver Plated, Rose Gold, etc.
  baseMaterial: varchar("base_material", { length: 100 }), // Alloy, Copper, Brass, etc.
  
  // Real jewellery specific fields
  purity: varchar("purity", { length: 50 }), // 24k, 22k, 18k for gold
  certificationNumber: varchar("certification_number"),
  
  // Status fields
  inStock: boolean("in_stock").default(true),
  isActive: boolean("is_active").default(true),
  featured: boolean("featured").default(false),
  customizable: boolean("customizable").default(false),
  
  // Customization options
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
  
  // Admin fields
  createdBy: varchar("created_by").references(() => users.id),
  approvedBy: varchar("approved_by").references(() => users.id),
  approvedAt: timestamp("approved_at"),
  
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
  paymentAmount: varchar("payment_amount").notNull(), // Amount per payment cycle
  paymentFrequency: varchar("payment_frequency").notNull().default("daily"), // daily, weekly, monthly
  targetMetalWeight: varchar("target_metal_weight").notNull(), // In grams
  targetAmount: varchar("target_amount").notNull(), // Total target amount in rupees
  currentBalance: varchar("current_balance").default("0"), // Current saved amount
  status: varchar("status").default("active"), // active, paused, completed, cancelled
  autoPayEnabled: boolean("auto_pay_enabled").default(true),
  nextPaymentDate: timestamp("next_payment_date"),
  lastPaymentDate: timestamp("last_payment_date"),
  paymentDayOfWeek: integer("payment_day_of_week"), // 0=Sunday, 1=Monday, etc. for weekly
  paymentDayOfMonth: integer("payment_day_of_month"), // 1-28 for monthly
  totalPayments: integer("total_payments").default(0),
  missedPayments: integer("missed_payments").default(0),
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

// Jewelry care tutorials
export const careTutorials = pgTable("care_tutorials", {
  id: serial("id").primaryKey(),
  title: varchar("title", { length: 200 }).notNull(),
  description: text("description"),
  jewelryType: varchar("jewelry_type", { enum: ["rings", "necklaces", "earrings", "bracelets", "watches", "general"] }).notNull(),
  metalType: varchar("metal_type", { enum: ["gold", "silver", "platinum", "diamond", "gemstone", "pearl", "all"] }).notNull().default("all"),
  videoUrl: varchar("video_url"),
  thumbnailUrl: varchar("thumbnail_url"),
  duration: integer("duration"), // in seconds
  difficulty: varchar("difficulty", { enum: ["beginner", "intermediate", "advanced"] }).notNull().default("beginner"),
  steps: jsonb("steps"), // Array of step objects with text, images, tips
  materials: jsonb("materials"), // Array of required materials/tools
  tips: jsonb("tips"), // Array of expert tips
  warnings: jsonb("warnings"), // Array of important warnings
  frequency: varchar("frequency"), // How often to perform this care
  category: varchar("category", { enum: ["cleaning", "storage", "maintenance", "repair", "prevention"] }).notNull(),
  views: integer("views").notNull().default(0),
  likes: integer("likes").notNull().default(0),
  isActive: boolean("is_active").notNull().default(true),
  isFeatured: boolean("is_featured").notNull().default(false),
  createdBy: varchar("created_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// User tutorial progress
export const tutorialProgress = pgTable("tutorial_progress", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  tutorialId: integer("tutorial_id").notNull().references(() => careTutorials.id),
  isCompleted: boolean("is_completed").notNull().default(false),
  currentStep: integer("current_step").notNull().default(0),
  completedSteps: jsonb("completed_steps"), // Array of completed step indices
  notes: text("notes"), // User's personal notes
  rating: integer("rating"), // 1-5 star rating
  timeSpent: integer("time_spent").notNull().default(0), // in seconds
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Care reminders
export const careReminders = pgTable("care_reminders", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  jewelryType: varchar("jewelry_type").notNull(),
  metalType: varchar("metal_type"),
  careType: varchar("care_type", { enum: ["cleaning", "inspection", "storage_check", "professional_service"] }).notNull(),
  frequency: varchar("frequency", { enum: ["weekly", "monthly", "quarterly", "biannually", "annually"] }).notNull(),
  lastPerformed: timestamp("last_performed"),
  nextDue: timestamp("next_due").notNull(),
  isEnabled: boolean("is_enabled").notNull().default(true),
  reminderSent: boolean("reminder_sent").notNull().default(false),
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

// Jewelry Exchange tables
export const jewelryExchangeRequests = pgTable("jewelry_exchange_requests", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id),
  orderId: integer("order_id").references(() => orders.id),
  jewelryPhotoUrl: varchar("jewelry_photo_url").notNull(),
  billPhotoUrl: varchar("bill_photo_url").notNull(),
  description: text("description"),
  estimatedValue: decimal("estimated_value", { precision: 10, scale: 2 }),
  adminAssignedValue: decimal("admin_assigned_value", { precision: 10, scale: 2 }),
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending").notNull(),
  adminNotes: text("admin_notes"),
  rejectionReason: text("rejection_reason"),
  reviewedBy: varchar("reviewed_by").references(() => users.id),
  reviewedAt: timestamp("reviewed_at"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Exchange notifications table
export const exchangeNotifications = pgTable("exchange_notifications", {
  id: serial("id").primaryKey(),
  exchangeRequestId: integer("exchange_request_id").notNull().references(() => jewelryExchangeRequests.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  type: varchar("type", { enum: ["email", "sms", "both"] }).default("email").notNull(),
  status: varchar("status", { enum: ["pending", "sent", "failed"] }).default("pending").notNull(),
  sentAt: timestamp("sent_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Exchange Relations
export const jewelryExchangeRequestsRelations = relations(jewelryExchangeRequests, ({ one, many }) => ({
  user: one(users, {
    fields: [jewelryExchangeRequests.userId],
    references: [users.id],
  }),
  order: one(orders, {
    fields: [jewelryExchangeRequests.orderId],
    references: [orders.id],
  }),
  reviewer: one(users, {
    fields: [jewelryExchangeRequests.reviewedBy],
    references: [users.id],
  }),
  notifications: many(exchangeNotifications),
}));

export const exchangeNotificationsRelations = relations(exchangeNotifications, ({ one }) => ({
  exchangeRequest: one(jewelryExchangeRequests, {
    fields: [exchangeNotifications.exchangeRequestId],
    references: [jewelryExchangeRequests.id],
  }),
  user: one(users, {
    fields: [exchangeNotifications.userId],
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

export const insertCareTutorialSchema = createInsertSchema(careTutorials).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  views: true,
  likes: true,
});

export const insertTutorialProgressSchema = createInsertSchema(tutorialProgress).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCareReminderSchema = createInsertSchema(careReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reminderSent: true,
});

export const insertUserActivityLogSchema = createInsertSchema(userActivityLog).omit({
  id: true,
  createdAt: true,
});

export const insertJewelryExchangeRequestSchema = createInsertSchema(jewelryExchangeRequests).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reviewedAt: true,
});

export const insertExchangeNotificationSchema = createInsertSchema(exchangeNotifications).omit({
  id: true,
  createdAt: true,
  sentAt: true,
});

// Loyalty Program Tables

// Digital Jewelry Badges
export const loyaltyBadges = pgTable("loyalty_badges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  iconUrl: varchar("icon_url").notNull(), // SVG or image URL
  rarity: varchar("rarity", { enum: ["common", "rare", "epic", "legendary"] }).notNull().default("common"),
  category: varchar("category", { length: 50 }).notNull(), // "purchase", "engagement", "milestone", "seasonal"
  pointsRequired: integer("points_required").default(0),
  criteria: jsonb("criteria"), // Unlock conditions
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Badge Collection
export const userBadges = pgTable("user_badges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  badgeId: integer("badge_id").notNull().references(() => loyaltyBadges.id, { onDelete: "cascade" }),
  earnedAt: timestamp("earned_at").defaultNow(),
  level: integer("level").default(1), // Badge can be upgraded
  isNew: boolean("is_new").default(true), // For notification purposes
});

// Loyalty Points Transactions
export const loyaltyTransactions = pgTable("loyalty_transactions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  points: integer("points").notNull(),
  type: varchar("type", { enum: ["earned", "spent", "bonus", "expired"] }).notNull(),
  source: varchar("source", { length: 100 }).notNull(), // "purchase", "review", "referral", "daily_check", etc.
  description: text("description"),
  metadata: jsonb("metadata"), // Additional data like order_id, badge_id, etc.
  createdAt: timestamp("created_at").defaultNow(),
});

// User Loyalty Profile
export const loyaltyProfiles = pgTable("loyalty_profiles", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().unique().references(() => users.id, { onDelete: "cascade" }),
  totalPoints: integer("total_points").default(0),
  availablePoints: integer("available_points").default(0),
  tier: varchar("tier", { enum: ["bronze", "silver", "gold", "platinum", "diamond"] }).notNull().default("bronze"),
  tierProgress: integer("tier_progress").default(0), // Points toward next tier
  streak: integer("streak").default(0), // Daily login streak
  lastActivity: timestamp("last_activity").defaultNow(),
  joinedAt: timestamp("joined_at").defaultNow(),
  lifetimeSpent: decimal("lifetime_spent", { precision: 10, scale: 2 }).default("0.00"),
  preferences: jsonb("preferences"), // Notification settings, favorite categories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty Challenges/Quests
export const loyaltyChallenges = pgTable("loyalty_challenges", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { enum: ["daily", "weekly", "monthly", "seasonal", "milestone"] }).notNull(),
  criteria: jsonb("criteria").notNull(), // Completion requirements
  rewards: jsonb("rewards").notNull(), // Points, badges, discounts
  startDate: timestamp("start_date").notNull(),
  endDate: timestamp("end_date"),
  isActive: boolean("is_active").default(true),
  maxCompletions: integer("max_completions").default(1),
  createdAt: timestamp("created_at").defaultNow(),
});

// User Challenge Progress
export const userChallenges = pgTable("user_challenges", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  challengeId: integer("challenge_id").notNull().references(() => loyaltyChallenges.id, { onDelete: "cascade" }),
  progress: jsonb("progress").default({}), // Current progress data
  completedAt: timestamp("completed_at"),
  claimedAt: timestamp("claimed_at"),
  streak: integer("streak").default(0),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Loyalty Rewards Catalog
export const loyaltyRewards = pgTable("loyalty_rewards", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  description: text("description"),
  type: varchar("type", { enum: ["discount", "free_shipping", "exclusive_product", "early_access", "custom_design"] }).notNull(),
  pointsCost: integer("points_cost").notNull(),
  value: decimal("value", { precision: 10, scale: 2 }), // Monetary value
  tierRequired: varchar("tier_required", { enum: ["bronze", "silver", "gold", "platinum", "diamond"] }),
  stockLimit: integer("stock_limit"), // Limited quantity rewards
  currentStock: integer("current_stock"),
  validFrom: timestamp("valid_from").defaultNow(),
  validUntil: timestamp("valid_until"),
  isActive: boolean("is_active").default(true),
  metadata: jsonb("metadata"), // Additional reward data
  createdAt: timestamp("created_at").defaultNow(),
});

// User Reward Redemptions
export const userRedemptions = pgTable("user_redemptions", {
  id: serial("id").primaryKey(),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: "cascade" }),
  rewardId: integer("reward_id").notNull().references(() => loyaltyRewards.id, { onDelete: "cascade" }),
  pointsSpent: integer("points_spent").notNull(),
  status: varchar("status", { enum: ["pending", "active", "used", "expired"] }).notNull().default("pending"),
  couponCode: varchar("coupon_code"),
  usedAt: timestamp("used_at"),
  expiresAt: timestamp("expires_at"),
  createdAt: timestamp("created_at").defaultNow(),
});

// Relations
export const loyaltyBadgesRelations = relations(loyaltyBadges, ({ many }) => ({
  userBadges: many(userBadges),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(loyaltyBadges, { fields: [userBadges.badgeId], references: [loyaltyBadges.id] }),
}));

export const loyaltyTransactionsRelations = relations(loyaltyTransactions, ({ one }) => ({
  user: one(users, { fields: [loyaltyTransactions.userId], references: [users.id] }),
}));

export const loyaltyProfilesRelations = relations(loyaltyProfiles, ({ one }) => ({
  user: one(users, { fields: [loyaltyProfiles.userId], references: [users.id] }),
}));

export const loyaltyChallengesRelations = relations(loyaltyChallenges, ({ many }) => ({
  userChallenges: many(userChallenges),
}));

export const userChallengesRelations = relations(userChallenges, ({ one }) => ({
  user: one(users, { fields: [userChallenges.userId], references: [users.id] }),
  challenge: one(loyaltyChallenges, { fields: [userChallenges.challengeId], references: [loyaltyChallenges.id] }),
}));

export const loyaltyRewardsRelations = relations(loyaltyRewards, ({ many }) => ({
  userRedemptions: many(userRedemptions),
}));

export const userRedemptionsRelations = relations(userRedemptions, ({ one }) => ({
  user: one(users, { fields: [userRedemptions.userId], references: [users.id] }),
  reward: one(loyaltyRewards, { fields: [userRedemptions.rewardId], references: [loyaltyRewards.id] }),
}));

// Zod Schemas for Loyalty Program
export const insertLoyaltyBadgeSchema = createInsertSchema(loyaltyBadges).omit({
  id: true,
  createdAt: true,
});

export const insertUserBadgeSchema = createInsertSchema(userBadges).omit({
  id: true,
  earnedAt: true,
});

export const insertLoyaltyTransactionSchema = createInsertSchema(loyaltyTransactions).omit({
  id: true,
  createdAt: true,
});

export const insertLoyaltyProfileSchema = createInsertSchema(loyaltyProfiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyChallengeSchema = createInsertSchema(loyaltyChallenges).omit({
  id: true,
  createdAt: true,
});

export const insertUserChallengeSchema = createInsertSchema(userChallenges).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertLoyaltyRewardSchema = createInsertSchema(loyaltyRewards).omit({
  id: true,
  createdAt: true,
});

export const insertUserRedemptionSchema = createInsertSchema(userRedemptions).omit({
  id: true,
  createdAt: true,
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
export type LoyaltyBadge = typeof loyaltyBadges.$inferSelect;
export type InsertLoyaltyBadge = z.infer<typeof insertLoyaltyBadgeSchema>;
export type UserBadge = typeof userBadges.$inferSelect;
export type InsertUserBadge = z.infer<typeof insertUserBadgeSchema>;
export type LoyaltyTransaction = typeof loyaltyTransactions.$inferSelect;
export type InsertLoyaltyTransaction = z.infer<typeof insertLoyaltyTransactionSchema>;
export type LoyaltyProfile = typeof loyaltyProfiles.$inferSelect;
export type InsertLoyaltyProfile = z.infer<typeof insertLoyaltyProfileSchema>;
export type LoyaltyChallenge = typeof loyaltyChallenges.$inferSelect;
export type InsertLoyaltyChallenge = z.infer<typeof insertLoyaltyChallengeSchema>;

export type CareTutorial = typeof careTutorials.$inferSelect;
export type InsertCareTutorial = z.infer<typeof insertCareTutorialSchema>;

export type TutorialProgress = typeof tutorialProgress.$inferSelect;
export type InsertTutorialProgress = z.infer<typeof insertTutorialProgressSchema>;

export type CareReminder = typeof careReminders.$inferSelect;
export type InsertCareReminder = z.infer<typeof insertCareReminderSchema>;

export type JewelryExchangeRequest = typeof jewelryExchangeRequests.$inferSelect;
export type InsertJewelryExchangeRequest = z.infer<typeof insertJewelryExchangeRequestSchema>;
export type ExchangeNotification = typeof exchangeNotifications.$inferSelect;
export type InsertExchangeNotification = z.infer<typeof insertExchangeNotificationSchema>;
export type UserChallenge = typeof userChallenges.$inferSelect;
export type InsertUserChallenge = z.infer<typeof insertUserChallengeSchema>;
export type LoyaltyReward = typeof loyaltyRewards.$inferSelect;
export type InsertLoyaltyReward = z.infer<typeof insertLoyaltyRewardSchema>;
export type UserRedemption = typeof userRedemptions.$inferSelect;
export type InsertUserRedemption = z.infer<typeof insertUserRedemptionSchema>;

// Corporate Tie-up Tables
export const corporateRegistrations = pgTable("corporate_registrations", {
  id: serial("id").primaryKey(),
  companyName: varchar("company_name").notNull(),
  registrationNumber: varchar("registration_number").notNull(),
  gstin: varchar("gstin"),
  companyAddress: text("company_address").notNull(),
  contactPersonName: varchar("contact_person_name").notNull(),
  contactPersonPhone: varchar("contact_person_phone").notNull(),
  contactPersonEmail: varchar("contact_person_email").notNull(),
  companyEmail: varchar("company_email").notNull(),
  approximateEmployees: integer("approximate_employees").notNull(),
  purposeOfTieup: text("purpose_of_tieup").notNull(), // JSON array of purposes
  status: varchar("status", { enum: ["pending", "approved", "rejected"] }).default("pending"),
  corporateCode: varchar("corporate_code").unique(),
  discountPercentage: decimal("discount_percentage", { precision: 5, scale: 2 }).default("0"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  approvedAt: timestamp("approved_at"),
  approvedBy: varchar("approved_by").references(() => users.id),
});

export const corporateUsers = pgTable("corporate_users", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull().references(() => corporateRegistrations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  role: varchar("role", { enum: ["admin", "manager", "employee"] }).default("employee"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const corporateOrders = pgTable("corporate_orders", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull().references(() => corporateRegistrations.id),
  orderId: integer("order_id").notNull().references(() => orders.id),
  orderType: varchar("order_type", { enum: ["bulk_gifting", "corporate_event", "employee_reward"] }).notNull(),
  discountApplied: decimal("discount_applied", { precision: 5, scale: 2 }),
  specialInstructions: text("special_instructions"),
  createdAt: timestamp("created_at").defaultNow(),
});

export const employeeBenefits = pgTable("employee_benefits", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull().references(() => corporateRegistrations.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  employeeId: varchar("employee_id"),
  maintenanceEnrolled: boolean("maintenance_enrolled").default(false),
  lastMaintenanceDate: timestamp("last_maintenance_date"),
  maintenanceCount: integer("maintenance_count").default(0),
  maxMaintenancePerYear: integer("max_maintenance_per_year").default(1),
  enrolledAt: timestamp("enrolled_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const maintenanceSchedules = pgTable("maintenance_schedules", {
  id: serial("id").primaryKey(),
  benefitId: integer("benefit_id").notNull().references(() => employeeBenefits.id),
  userId: varchar("user_id").notNull().references(() => users.id),
  corporateId: integer("corporate_id").notNull().references(() => corporateRegistrations.id),
  serviceType: varchar("service_type", { enum: ["cleaning", "polishing", "minor_repair", "full_service"] }).notNull(),
  scheduledDate: timestamp("scheduled_date").notNull(),
  status: varchar("status", { enum: ["scheduled", "in_progress", "completed", "cancelled"] }).default("scheduled"),
  notes: text("notes"),
  completedAt: timestamp("completed_at"),
  completedBy: varchar("completed_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const corporateOffers = pgTable("corporate_offers", {
  id: serial("id").primaryKey(),
  corporateId: integer("corporate_id").notNull().references(() => corporateRegistrations.id),
  title: varchar("title").notNull(),
  description: text("description").notNull(),
  discountType: varchar("discount_type", { enum: ["percentage", "fixed_amount"] }).notNull(),
  discountValue: decimal("discount_value", { precision: 10, scale: 2 }).notNull(),
  minOrderAmount: decimal("min_order_amount", { precision: 10, scale: 2 }),
  maxDiscountAmount: decimal("max_discount_amount", { precision: 10, scale: 2 }),
  validFrom: timestamp("valid_from").notNull(),
  validUntil: timestamp("valid_until").notNull(),
  isActive: boolean("is_active").default(true),
  usageLimit: integer("usage_limit"),
  usageCount: integer("usage_count").default(0),
  applicableCategories: text("applicable_categories"), // JSON array
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Corporate Relations
export const corporateRegistrationsRelations = relations(corporateRegistrations, ({ one, many }) => ({
  approver: one(users, { fields: [corporateRegistrations.approvedBy], references: [users.id] }),
  corporateUsers: many(corporateUsers),
  corporateOrders: many(corporateOrders),
  employeeBenefits: many(employeeBenefits),
  maintenanceSchedules: many(maintenanceSchedules),
  corporateOffers: many(corporateOffers),
}));

export const corporateUsersRelations = relations(corporateUsers, ({ one }) => ({
  corporate: one(corporateRegistrations, { fields: [corporateUsers.corporateId], references: [corporateRegistrations.id] }),
  user: one(users, { fields: [corporateUsers.userId], references: [users.id] }),
}));

export const corporateOrdersRelations = relations(corporateOrders, ({ one }) => ({
  corporate: one(corporateRegistrations, { fields: [corporateOrders.corporateId], references: [corporateRegistrations.id] }),
  order: one(orders, { fields: [corporateOrders.orderId], references: [orders.id] }),
}));

export const employeeBenefitsRelations = relations(employeeBenefits, ({ one, many }) => ({
  corporate: one(corporateRegistrations, { fields: [employeeBenefits.corporateId], references: [corporateRegistrations.id] }),
  user: one(users, { fields: [employeeBenefits.userId], references: [users.id] }),
  maintenanceSchedules: many(maintenanceSchedules),
}));

export const maintenanceSchedulesRelations = relations(maintenanceSchedules, ({ one }) => ({
  benefit: one(employeeBenefits, { fields: [maintenanceSchedules.benefitId], references: [employeeBenefits.id] }),
  user: one(users, { fields: [maintenanceSchedules.userId], references: [users.id] }),
  corporate: one(corporateRegistrations, { fields: [maintenanceSchedules.corporateId], references: [corporateRegistrations.id] }),
  completedByUser: one(users, { fields: [maintenanceSchedules.completedBy], references: [users.id] }),
}));

export const corporateOffersRelations = relations(corporateOffers, ({ one }) => ({
  corporate: one(corporateRegistrations, { fields: [corporateOffers.corporateId], references: [corporateRegistrations.id] }),
}));

// Corporate Insert Schemas
export const insertCorporateRegistrationSchema = createInsertSchema(corporateRegistrations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  approvedAt: true,
  corporateCode: true,
});

export const insertCorporateUserSchema = createInsertSchema(corporateUsers).omit({
  id: true,
  createdAt: true,
});

export const insertCorporateOrderSchema = createInsertSchema(corporateOrders).omit({
  id: true,
  createdAt: true,
});

export const insertEmployeeBenefitSchema = createInsertSchema(employeeBenefits).omit({
  id: true,
  enrolledAt: true,
  updatedAt: true,
});

export const insertMaintenanceScheduleSchema = createInsertSchema(maintenanceSchedules).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  completedAt: true,
});

export const insertCorporateOfferSchema = createInsertSchema(corporateOffers).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  usageCount: true,
});

// Corporate Type exports
export type CorporateRegistration = typeof corporateRegistrations.$inferSelect;
export type InsertCorporateRegistration = z.infer<typeof insertCorporateRegistrationSchema>;
export type CorporateUser = typeof corporateUsers.$inferSelect;
export type InsertCorporateUser = z.infer<typeof insertCorporateUserSchema>;
export type CorporateOrder = typeof corporateOrders.$inferSelect;
export type InsertCorporateOrder = z.infer<typeof insertCorporateOrderSchema>;
export type EmployeeBenefit = typeof employeeBenefits.$inferSelect;
export type InsertEmployeeBenefit = z.infer<typeof insertEmployeeBenefitSchema>;
export type MaintenanceSchedule = typeof maintenanceSchedules.$inferSelect;
export type InsertMaintenanceSchedule = z.infer<typeof insertMaintenanceScheduleSchema>;
export type CorporateOffer = typeof corporateOffers.$inferSelect;
export type InsertCorporateOffer = z.infer<typeof insertCorporateOfferSchema>;

// Authentication schemas
export const insertEmailVerificationTokenSchema = createInsertSchema(emailVerificationTokens).omit({
  id: true,
  createdAt: true,
});

export const insertPasswordResetTokenSchema = createInsertSchema(passwordResetTokens).omit({
  id: true,
  createdAt: true,
});


// Enhanced user registration schemas
export const customerSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});

export const wholesalerSignupSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(10, "Phone number must be at least 10 digits"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
  businessName: z.string().min(2, "Business name is required"),
  businessAddress: z.string().min(10, "Business address is required"),
  businessRegistrationProof: z.string().optional(), // File path after upload
});

export const signinSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(1, "Password is required"),
});

export const forgotPasswordSchema = z.object({
  email: z.string().email("Invalid email address"),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(1, "Reset token is required"),
  password: z.string().min(8, "Password must be at least 8 characters")
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, "Password must contain at least one uppercase letter, one lowercase letter, and one number"),
});

// Authentication type exports
export type EmailVerificationToken = typeof emailVerificationTokens.$inferSelect;
export type InsertEmailVerificationToken = z.infer<typeof insertEmailVerificationTokenSchema>;
export type PasswordResetToken = typeof passwordResetTokens.$inferSelect;
export type InsertPasswordResetToken = z.infer<typeof insertPasswordResetTokenSchema>;
export type UserActivityLog = typeof userActivityLog.$inferSelect;
export type InsertUserActivityLog = z.infer<typeof insertUserActivityLogSchema>;

// Auth form types
export type CustomerSignup = z.infer<typeof customerSignupSchema>;
export type WholesalerSignup = z.infer<typeof wholesalerSignupSchema>;
export type Signin = z.infer<typeof signinSchema>;
export type ForgotPassword = z.infer<typeof forgotPasswordSchema>;
export type ResetPassword = z.infer<typeof resetPasswordSchema>;
