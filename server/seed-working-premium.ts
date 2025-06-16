import { db } from './db';
import { products, categories } from '../shared/schema';

export async function seedWorkingPremiumJewelry() {
  try {
    console.log('Starting working premium jewelry seeding...');

    // Get existing categories
    const allCategories = await db.select().from(categories);
    console.log('Found', allCategories.length, 'existing categories');

    // Create premium jewelry products with only existing columns
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
        name: "Designer Gold Bracelet",
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
      },
      {
        name: "Emerald Statement Ring",
        description: "Bold emerald statement ring in yellow gold",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('ring'))?.id || 2,
        imageUrl: "https://images.unsplash.com/photo-1602751584552-8ba73aad10e2?w=400&h=400&fit=crop",
        price: "110000",
        productType: "real" as const,
        material: "18K Gold",
        weight: 14.7,
        gemstonesCost: "55000",
        stock: 3,
        isFeatured: true,
        tags: ["emerald", "statement", "bold", "yellow-gold"]
      },
      {
        name: "Silver Oxidized Jhumkas",
        description: "Traditional oxidized silver jhumka earrings",
        categoryId: allCategories.find(c => c.name.toLowerCase().includes('earring'))?.id || 4,
        imageUrl: "https://images.unsplash.com/photo-1571018965693-1b1a8dcb4dd4?w=400&h=400&fit=crop",
        price: "15000",
        productType: "real" as const,
        material: "Silver",
        weight: 25.3,
        makingCharges: "3000",
        stock: 8,
        isFeatured: false,
        tags: ["silver", "oxidized", "jhumka", "traditional"]
      }
    ];

    // Insert products one by one to handle any issues
    const insertedProducts = [];
    for (const product of premiumProducts) {
      try {
        const [inserted] = await db.insert(products).values(product).returning();
        insertedProducts.push(inserted);
        console.log(`✓ Inserted: ${product.name}`);
      } catch (error) {
        console.error(`✗ Failed to insert ${product.name}:`, error.message);
      }
    }
    
    console.log(`Successfully seeded ${insertedProducts.length} premium jewelry products`);
    return { success: true, count: insertedProducts.length };

  } catch (error) {
    console.error('Error seeding premium jewelry:', error);
    return { success: false, error: error.message };
  }
}