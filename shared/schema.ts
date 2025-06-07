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
  isAdmin: boolean("is_admin").default(false),
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
