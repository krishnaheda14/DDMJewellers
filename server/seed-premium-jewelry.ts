import { db } from "./db";
import { products, categories } from "../shared/schema";
import { eq } from "drizzle-orm";

export async function seedPremiumJewelry() {
  try {
    console.log("Starting premium jewelry seeding...");

    // First, ensure we have categories
    const existingCategories = await db.select().from(categories);
    console.log(`Found ${existingCategories.length} existing categories`);

    if (existingCategories.length === 0) {
      // Create basic categories if none exist
      const categoryData = [
        { name: "Necklaces", slug: "necklaces", description: "Elegant necklaces for every occasion", productType: "both" },
        { name: "Earrings", slug: "earrings", description: "Beautiful earrings to complement your style", productType: "both" },
        { name: "Rings", slug: "rings", description: "Stunning rings for special moments", productType: "both" },
        { name: "Bracelets", slug: "bracelets", description: "Graceful bracelets and bangles", productType: "both" },
        { name: "Anklets", slug: "anklets", description: "Delicate anklets for a charming look", productType: "both" },
        { name: "Mangalsutra", slug: "mangalsutra", description: "Sacred mangalsutra designs", productType: "real" },
      ];

      for (const category of categoryData) {
        await db.insert(categories).values(category);
      }
      console.log("Created basic categories");
    }

    // Get category IDs
    const categoryList = await db.select().from(categories);
    const necklaceCategory = categoryList.find(c => c.slug === "necklaces");
    const earringCategory = categoryList.find(c => c.slug === "earrings");
    const ringCategory = categoryList.find(c => c.slug === "rings");
    const braceletCategory = categoryList.find(c => c.slug === "bracelets");

    // Create premium jewelry products
    const jewelryProducts = [
      // Premium Gold Necklaces
      {
        name: "Classic Gold Chain Necklace",
        description: "Elegant 22K gold chain necklace perfect for daily wear and special occasions",
        categoryId: necklaceCategory?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
        imageUrls: [
          "https://images.unsplash.com/photo-1515562141207-7a88fb7ce338?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1506629905853-e325b36bee37?w=400&h=400&fit=crop"
        ],
        price: "45000",
        productType: "real" as const,
        material: "Gold",
        weight: 15.5,
        purity: "22K",
        stock: 5,
        isFeatured: true,
        tags: ["classic", "daily-wear", "gold", "chain"]
      },
      {
        name: "Diamond Studded Gold Necklace",
        description: "Luxurious 18K gold necklace adorned with brilliant cut diamonds",
        categoryId: necklaceCategory?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
        imageUrls: [
          "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
          "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop"
        ],
        price: "125000",
        productType: "real" as const,
        material: "Gold",
        weight: 12.3,
        purity: "18K",
        diamondsCost: "35000",
        stock: 2,
        isFeatured: true,
        tags: ["diamond", "luxury", "gold", "wedding"]
      },
      {
        name: "Temple Jewellery Necklace Set",
        description: "Traditional South Indian temple jewellery necklace with intricate designs",
        categoryId: necklaceCategory?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
        price: "85000",
        productType: "real" as const,
        material: "Gold",
        weight: 35.2,
        purity: "22K",
        makingCharges: "15000",
        stock: 3,
        isFeatured: true,
        tags: ["temple", "traditional", "south-indian", "set"]
      },

      // Premium Earrings
      {
        name: "Diamond Drop Earrings",
        description: "Elegant diamond drop earrings in 18K white gold setting",
        categoryId: earringCategory?.id || 2,
        imageUrl: "https://images.unsplash.com/photo-1535632066927-ab7c9ab60908?w=400&h=400&fit=crop",
        price: "75000",
        productType: "real" as const,
        material: "White Gold",
        weight: 6.8,
        purity: "18K",
        diamondsCost: "45000",
        stock: 4,
        isFeatured: true,
        tags: ["diamond", "drop", "white-gold", "elegant"]
      },
      {
        name: "Gold Jhumka Earrings",
        description: "Traditional gold jhumka earrings with pearl drops",
        categoryId: earringCategory?.id || 2,
        imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop",
        price: "25000",
        productType: "real" as const,
        material: "Gold",
        weight: 8.5,
        purity: "22K",
        gemstonesCost: "3000",
        stock: 6,
        tags: ["jhumka", "traditional", "pearls", "gold"]
      },
      {
        name: "Ruby Stud Earrings",
        description: "Beautiful ruby stud earrings set in 18K yellow gold",
        categoryId: earringCategory?.id || 2,
        imageUrl: "https://images.unsplash.com/photo-1617038260897-41a1f14a8ca0?w=400&h=400&fit=crop",
        price: "55000",
        productType: "real" as const,
        material: "Gold",
        weight: 4.2,
        purity: "18K",
        gemstonesCost: "25000",
        stock: 5,
        tags: ["ruby", "stud", "gold", "precious-stones"]
      },

      // Premium Rings
      {
        name: "Solitaire Diamond Ring",
        description: "Classic solitaire diamond engagement ring in platinum setting",
        categoryId: ringCategory?.id || 3,
        imageUrl: "https://images.unsplash.com/photo-1605100804763-247f67b3557e?w=400&h=400&fit=crop",
        price: "150000",
        productType: "real" as const,
        material: "Platinum",
        weight: 3.5,
        purity: "Platinum 950",
        diamondsCost: "120000",
        stock: 3,
        isFeatured: true,
        tags: ["solitaire", "diamond", "engagement", "platinum"]
      },
      {
        name: "Gold Band Ring",
        description: "Simple yet elegant 22K gold band ring for everyday wear",
        categoryId: ringCategory?.id || 3,
        imageUrl: "https://images.unsplash.com/photo-1588444837495-c6b8fb85bf1b?w=400&h=400&fit=crop",
        price: "18000",
        productType: "real" as const,
        material: "Gold",
        weight: 5.2,
        purity: "22K",
        stock: 8,
        tags: ["band", "simple", "daily-wear", "gold"]
      },

      // Bracelets
      {
        name: "Gold Tennis Bracelet",
        description: "Sparkling diamond tennis bracelet in 18K gold",
        categoryId: braceletCategory?.id || 4,
        imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop",
        price: "95000",
        productType: "real" as const,
        material: "Gold",
        weight: 12.8,
        purity: "18K",
        diamondsCost: "55000",
        stock: 2,
        isFeatured: true,
        tags: ["tennis", "diamond", "bracelet", "luxury"]
      },

      // Imitation Jewelry
      {
        name: "American Diamond Necklace Set",
        description: "Stunning American diamond necklace set with matching earrings",
        categoryId: necklaceCategory?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1599643478518-a784e5dc4c8f?w=400&h=400&fit=crop",
        price: "3500",
        productType: "imitation" as const,
        material: "Brass",
        stock: 15,
        tags: ["american-diamond", "set", "imitation", "affordable"]
      },
      {
        name: "Kundan Choker Set",
        description: "Beautiful kundan choker necklace with matching earrings",
        categoryId: necklaceCategory?.id || 1,
        imageUrl: "https://images.unsplash.com/photo-1611652022419-a9419f74343d?w=400&h=400&fit=crop",
        price: "4200",
        productType: "imitation" as const,
        material: "Brass",
        stock: 12,
        isFeatured: true,
        tags: ["kundan", "choker", "traditional", "set"]
      },
      {
        name: "Pearl Drop Earrings",
        description: "Elegant artificial pearl drop earrings for special occasions",
        categoryId: earringCategory?.id || 2,
        imageUrl: "https://images.unsplash.com/photo-1506630448388-4e683c67ddb0?w=400&h=400&fit=crop",
        price: "1800",
        productType: "imitation" as const,
        material: "Alloy",
        stock: 20,
        tags: ["pearl", "drop", "artificial", "elegant"]
      },
      {
        name: "Fashion Statement Ring",
        description: "Trendy fashion ring with colorful stones",
        categoryId: ringCategory?.id || 3,
        imageUrl: "https://images.unsplash.com/photo-1588444837495-c6b8fb85bf1b?w=400&h=400&fit=crop",
        price: "850",
        productType: "imitation" as const,
        material: "Alloy",
        stock: 25,
        tags: ["fashion", "statement", "colorful", "trendy"]
      },
      {
        name: "Silver-Plated Bangles Set",
        description: "Set of 4 silver-plated bangles with intricate patterns",
        categoryId: braceletCategory?.id || 4,
        imageUrl: "https://images.unsplash.com/photo-1611591437281-460bfbe1220a?w=400&h=400&fit=crop",
        price: "2200",
        productType: "imitation" as const,
        material: "Silver Plated",
        stock: 18,
        tags: ["silver-plated", "bangles", "set", "patterns"]
      }
    ];

    // Check if products already exist to avoid duplicates
    const existingProducts = await db.select().from(products);
    console.log(`Found ${existingProducts.length} existing products`);

    if (existingProducts.length < 5) {
      // Insert products
      for (const product of jewelryProducts) {
        try {
          await db.insert(products).values(product);
          console.log(`Added product: ${product.name}`);
        } catch (error) {
          console.error(`Error adding product ${product.name}:`, error);
        }
      }
      
      console.log(`Successfully seeded ${jewelryProducts.length} premium jewelry products`);
    } else {
      console.log("Products already exist, skipping seeding");
    }

    return { success: true, message: "Premium jewelry seeding completed" };
  } catch (error) {
    console.error("Error seeding premium jewelry:", error);
    return { success: false, error: error.message };
  }
}