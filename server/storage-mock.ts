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
  getCurrentRates(): Promise<MarketRate[]>;
}

// Mock storage implementation with basic data
export class MockStorage implements IStorage {
  private mockCategories: Category[] = [
    {
      id: 1,
      name: "Gold Jewelry",
      slug: "gold-jewelry",
      description: "Premium gold jewelry collection",
      imageUrl: "https://via.placeholder.com/300x200/D4AF37/FFFFFF?text=Gold+Jewelry",
      isActive: true,
      productType: "real",
      parentId: null,
      sortOrder: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "Silver Jewelry",
      slug: "silver-jewelry", 
      description: "Elegant silver jewelry pieces",
      imageUrl: "https://via.placeholder.com/300x200/C0C0C0/FFFFFF?text=Silver+Jewelry",
      isActive: true,
      productType: "real",
      parentId: null,
      sortOrder: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "Fashion Jewelry",
      slug: "fashion-jewelry",
      description: "Trendy imitation jewelry",
      imageUrl: "https://via.placeholder.com/300x200/FF6B6B/FFFFFF?text=Fashion+Jewelry",
      isActive: true,
      productType: "imitation",
      parentId: null,
      sortOrder: 3,
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockProducts: Product[] = [
    {
      id: 1,
      name: "Gold Diamond Ring",
      description: "Elegant 18K gold ring with diamonds",
      categoryId: 1,
      imageUrl: "https://via.placeholder.com/400x400/D4AF37/FFFFFF?text=Gold+Ring",
      imageUrls: [],
      price: "45000",
      productType: "real",
      material: "18K Gold",
      purity: "18k",
      weight: "5.2",
      size: "7",
      gemstone: "Diamond",
      occasion: "Wedding",
      gender: "Female",
      brand: "DDM Jewellers",
      sku: "GDR001",
      stockQuantity: 5,
      featured: true,
      isActive: true,
      tags: [],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 2,
      name: "Silver Chain Necklace",
      description: "Beautiful sterling silver chain",
      categoryId: 2,
      imageUrl: "https://via.placeholder.com/400x400/C0C0C0/FFFFFF?text=Silver+Chain",
      imageUrls: [],
      price: "8500",
      productType: "real",
      material: "Sterling Silver",
      purity: "925",
      weight: "12.5",
      size: "18 inch",
      gemstone: null,
      occasion: "Daily Wear",
      gender: "Unisex",
      brand: "DDM Jewellers",
      sku: "SCN001",
      stockQuantity: 10,
      featured: false,
      isActive: true,
      tags: [],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 3,
      name: "Fashion Earrings",
      description: "Trendy fashion earrings for everyday wear",
      categoryId: 3,
      imageUrl: "https://via.placeholder.com/400x400/FF6B6B/FFFFFF?text=Fashion+Earrings",
      imageUrls: [],
      price: "1200",
      productType: "imitation",
      material: "Alloy",
      purity: null,
      weight: "8",
      size: "Medium",
      gemstone: "Artificial Stones",
      occasion: "Casual",
      gender: "Female",
      brand: "DDM Jewellers",
      sku: "FE001",
      stockQuantity: 25,
      featured: true,
      isActive: true,
      tags: [],
      specifications: {},
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  private mockRates: MarketRate[] = [
    {
      id: 1,
      metalType: "gold",
      purity: "24k",
      buyPrice: "6800",
      sellPrice: "6850",
      currency: "INR",
      unit: "gram",
      lastUpdated: new Date(),
      source: "local"
    },
    {
      id: 2,
      metalType: "gold",
      purity: "22k",
      buyPrice: "6200",
      sellPrice: "6250",
      currency: "INR",
      unit: "gram",
      lastUpdated: new Date(),
      source: "local"
    },
    {
      id: 3,
      metalType: "silver",
      purity: "925",
      buyPrice: "85",
      sellPrice: "88",
      currency: "INR",
      unit: "gram",
      lastUpdated: new Date(),
      source: "local"
    }
  ];

  async getUser(id: string): Promise<User | undefined> {
    // Return undefined for now - auth not implemented in mock
    return undefined;
  }

  async upsertUser(user: UpsertUser): Promise<User> {
    throw new Error("User operations not implemented in mock storage");
  }

  async getCategories(): Promise<Category[]> {
    return this.mockCategories;
  }

  async getCategoryBySlug(slug: string): Promise<Category | undefined> {
    return this.mockCategories.find(cat => cat.slug === slug);
  }

  async createCategory(category: InsertCategory): Promise<Category> {
    const newCategory: Category = {
      id: this.mockCategories.length + 1,
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockCategories.push(newCategory);
    return newCategory;
  }

  async updateCategory(id: number, category: Partial<InsertCategory>): Promise<Category> {
    const index = this.mockCategories.findIndex(cat => cat.id === id);
    if (index === -1) throw new Error("Category not found");
    
    this.mockCategories[index] = {
      ...this.mockCategories[index],
      ...category,
      updatedAt: new Date()
    };
    return this.mockCategories[index];
  }

  async deleteCategory(id: number): Promise<boolean> {
    const index = this.mockCategories.findIndex(cat => cat.id === id);
    if (index === -1) return false;
    
    this.mockCategories.splice(index, 1);
    return true;
  }

  async getProducts(filters?: {
    categoryId?: number;
    search?: string;
    featured?: boolean;
    productType?: string;
    limit?: number;
    offset?: number;
  }): Promise<Product[]> {
    let filtered = [...this.mockProducts];

    if (filters?.categoryId) {
      filtered = filtered.filter(p => p.categoryId === filters.categoryId);
    }

    if (filters?.search) {
      const search = filters.search.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(search) ||
        p.description?.toLowerCase().includes(search)
      );
    }

    if (filters?.featured !== undefined) {
      filtered = filtered.filter(p => p.featured === filters.featured);
    }

    if (filters?.productType) {
      filtered = filtered.filter(p => p.productType === filters.productType);
    }

    const offset = filters?.offset || 0;
    const limit = filters?.limit || 20;
    
    return filtered.slice(offset, offset + limit);
  }

  async getProduct(id: number): Promise<Product | undefined> {
    return this.mockProducts.find(p => p.id === id);
  }

  async createProduct(product: InsertProduct): Promise<Product> {
    const newProduct: Product = {
      id: this.mockProducts.length + 1,
      ...product,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.mockProducts.push(newProduct);
    return newProduct;
  }

  async updateProduct(id: number, product: Partial<InsertProduct>): Promise<Product> {
    const index = this.mockProducts.findIndex(p => p.id === id);
    if (index === -1) throw new Error("Product not found");
    
    this.mockProducts[index] = {
      ...this.mockProducts[index],
      ...product,
      updatedAt: new Date()
    };
    return this.mockProducts[index];
  }

  async deleteProduct(id: number): Promise<boolean> {
    const index = this.mockProducts.findIndex(p => p.id === id);
    if (index === -1) return false;
    
    this.mockProducts.splice(index, 1);
    return true;
  }

  async getCartItems(userId: string): Promise<(CartItem & { product: Product })[]> {
    return [];
  }

  async addToCart(item: InsertCartItem): Promise<CartItem> {
    throw new Error("Cart operations not implemented in mock storage");
  }

  async updateCartItem(id: number, quantity: number): Promise<CartItem> {
    throw new Error("Cart operations not implemented in mock storage");
  }

  async removeFromCart(id: number): Promise<boolean> {
    return false;
  }

  async clearCart(userId: string): Promise<boolean> {
    return true;
  }

  async getOrders(userId?: string): Promise<Order[]> {
    return [];
  }

  async getOrder(id: number): Promise<(Order & { orderItems: (OrderItem & { product: Product })[] }) | undefined> {
    return undefined;
  }

  async createOrder(order: InsertOrder, items: InsertOrderItem[]): Promise<Order> {
    throw new Error("Order operations not implemented in mock storage");
  }

  async updateOrderStatus(id: number, status: string): Promise<Order> {
    throw new Error("Order operations not implemented in mock storage");
  }

  async getUserMemory(userId: string): Promise<UserMemory | undefined> {
    return undefined;
  }

  async upsertUserMemory(userId: string, memory: Partial<InsertUserMemory>): Promise<UserMemory> {
    throw new Error("User memory operations not implemented in mock storage");
  }

  async saveChatConversation(userId: string, sessionId: string, messages: any[]): Promise<ChatConversation> {
    throw new Error("Chat operations not implemented in mock storage");
  }

  async getChatHistory(userId: string, limit: number = 5): Promise<ChatConversation[]> {
    return [];
  }

  async getWholesalerDesigns(filters?: {
    wholesalerId?: string;
    status?: string;
    category?: string;
    limit?: number;
    offset?: number;
  }): Promise<(WholesalerDesign & { wholesaler: User })[]> {
    return [];
  }

  async getWholesalerDesign(id: number): Promise<(WholesalerDesign & { wholesaler: User }) | undefined> {
    return undefined;
  }

  async createWholesalerDesign(design: InsertWholesalerDesign): Promise<WholesalerDesign> {
    throw new Error("Wholesaler design operations not implemented in mock storage");
  }

  async updateWholesalerDesign(id: number, design: Partial<InsertWholesalerDesign>): Promise<WholesalerDesign> {
    throw new Error("Wholesaler design operations not implemented in mock storage");
  }

  async approveWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    throw new Error("Wholesaler design operations not implemented in mock storage");
  }

  async rejectWholesalerDesign(id: number, approvedBy: string): Promise<WholesalerDesign> {
    throw new Error("Wholesaler design operations not implemented in mock storage");
  }

  async deleteWholesalerDesign(id: number): Promise<boolean> {
    return false;
  }

  async getWishlist(userId: string): Promise<(Wishlist & { product?: Product; design?: WholesalerDesign })[]> {
    return [];
  }

  async addToWishlist(item: InsertWishlist): Promise<Wishlist> {
    throw new Error("Wishlist operations not implemented in mock storage");
  }

  async removeFromWishlist(id: number): Promise<boolean> {
    return false;
  }

  async updateUserRole(userId: string, role: string): Promise<User> {
    throw new Error("User role operations not implemented in mock storage");
  }

  async getWholesalers(approved?: boolean): Promise<User[]> {
    return [];
  }

  async getCurrentRates(): Promise<MarketRate[]> {
    return this.mockRates;
  }
}

export const storage = new MockStorage();