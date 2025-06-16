import { db } from './db';
import { products, categories } from '../shared/schema';

export async function seedSimplePremiumJewelry() {
  try {
    console.log('Starting simple premium jewelry seeding...');

    // Get existing categories
    const allCategories = await db.select().from(categories);
    console.log('Found', allCategories.length, 'existing categories');

    // Create premium jewelry products
    const premiumProducts = [
      {
        name: "Royal Gold Chain",
        description: "Elegant 22K gold chain perfect for daily wear",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('necklace'))?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1506629905853-e325b36bee37?w=400&h=400&fit=crop",
        price: "45000",
        productType: "real" as const,
        material: "22K Gold",
        weight: 15.5,
        stock: 5,
        isFeatured: true,
        tags: ["classic", "daily-wear", "gold", "chain"]
      },
      {
        name: "Diamond Solitaire Ring",
        description: "Stunning diamond solitaire ring in 18K white gold",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('ring'))?.id || 2,
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop",
        price: "125000",
        productType: "real" as const,
        material: "18K White Gold",
        weight: 12.3,
        diamondsCost: "35000",
        stock: 2,
        isFeatured: true,
        tags: ["diamond", "luxury", "white-gold", "wedding"]
      },
      {
        name: "Temple Jewelry Set",
        description: "Traditional South Indian temple jewelry set",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('set'))?.id || 3,
        imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
        price: "85000",
        productType: "real" as const,
        material: "22K Gold",
        weight: 35.2,
        makingCharges: "15000",
        stock: 3,
        isFeatured: true,
        tags: ["temple", "traditional", "south-indian", "set"]
      },
      {
        name: "Pearl Drop Earrings",
        description: "Elegant pearl drop earrings in white gold",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('earring'))?.id || 4,
        imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
        price: "75000",
        productType: "real" as const,
        material: "18K White Gold",
        weight: 6.8,
        gemstonesCost: "25000",
        stock: 4,
        isFeatured: true,
        tags: ["pearl", "drop", "white-gold", "elegant"]
      },
      {
        name: "Antique Kundan Necklace",
        description: "Handcrafted antique kundan necklace with emeralds",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('necklace'))?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        price: "95000",
        productType: "real" as const,
        material: "22K Gold",
        weight: 28.5,
        gemstonesCost: "40000",
        makingCharges: "20000",
        stock: 2,
        isFeatured: true,
        tags: ["kundan", "antique", "emerald", "handcrafted"]
      },
      {
        name: "Modern Designer Bracelet",
        description: "Contemporary gold bracelet with modern design",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('bracelet'))?.id || 5,
        imageUrl: "https://images.unsplash.com/photo-1584302179602-e4412d7d9e7b?w=400&h=400&fit=crop",
        price: "65000",
        productType: "real" as const,
        material: "18K Gold",
        weight: 18.2,
        makingCharges: "12000",
        stock: 6,
        isFeatured: false,
        tags: ["modern", "designer", "bracelet", "contemporary"]
      }
    ];

    // Insert products
    const insertedProducts = await db.insert(products).values(premiumProducts).returning();
    
    console.log(`Successfully seeded ${insertedProducts.length} premium jewelry products`);
    return { success: true, count: insertedProducts.length };

  } catch (error) {
    console.error('Error seeding premium jewelry:', error);
    return { success: false, error: error.message };
  }
}