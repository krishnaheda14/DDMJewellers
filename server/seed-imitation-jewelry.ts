import { db } from "./db";
import { categories, products } from "@shared/schema";
import { eq } from "drizzle-orm";

// Seed imitation jewelry categories and products
export async function seedImitationJewelry() {
  try {
    console.log("Starting imitation jewelry seeding...");

    // Create imitation jewelry categories
    const imitationCategories = [
      {
        name: "Imitation Necklaces",
        slug: "imitation-necklaces",
        description: "Beautiful imitation necklaces with premium gold and silver plating",
        productType: "imitation" as const,
        sortOrder: 1,
        isActive: true
      },
      {
        name: "Imitation Earrings",
        slug: "imitation-earrings", 
        description: "Elegant imitation earrings crafted with finest materials",
        productType: "imitation" as const,
        sortOrder: 2,
        isActive: true
      },
      {
        name: "Imitation Bangles",
        slug: "imitation-bangles",
        description: "Stylish imitation bangles with durable base materials",
        productType: "imitation" as const,
        sortOrder: 3,
        isActive: true
      },
      {
        name: "Imitation Rings",
        slug: "imitation-rings",
        description: "Beautiful imitation rings with premium plating finishes",
        productType: "imitation" as const,
        sortOrder: 4,
        isActive: true
      },
      {
        name: "Imitation Anklets",
        slug: "imitation-anklets",
        description: "Delicate imitation anklets perfect for everyday wear",
        productType: "imitation" as const,
        sortOrder: 5,
        isActive: true
      },
      {
        name: "Imitation Accessories",
        slug: "imitation-accessories",
        description: "Other beautiful imitation jewelry accessories",
        productType: "imitation" as const,
        sortOrder: 6,
        isActive: true
      }
    ];

    // Insert categories
    const createdCategories = [];
    for (const categoryData of imitationCategories) {
      // Check if category already exists
      const existing = await db.select().from(categories).where(eq(categories.slug, categoryData.slug));
      
      if (existing.length === 0) {
        const [category] = await db.insert(categories).values(categoryData).returning();
        createdCategories.push(category);
        console.log(`Created category: ${category.name}`);
      } else {
        createdCategories.push(existing[0]);
        console.log(`Category already exists: ${categoryData.name}`);
      }
    }

    // Create sample imitation jewelry products
    const sampleProducts = [
      // Necklaces
      {
        name: "Gold Plated Kundan Necklace Set",
        description: "Elegant kundan necklace set with gold plating and beautiful stones",
        price: "1299.00",
        originalPrice: "1999.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-necklaces")?.id,
        productType: "imitation" as const,
        material: "Kundan",
        plating: "Gold Plated",
        baseMaterial: "Alloy",
        stock: 50,
        inStock: true,
        isActive: true,
        featured: true,
        imageUrl: "/api/placeholder/400/400"
      },
      {
        name: "Silver Plated Pearl Choker",
        description: "Beautiful pearl choker with silver plating for special occasions",
        price: "899.00",
        originalPrice: "1299.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-necklaces")?.id,
        productType: "imitation" as const,
        material: "Pearl",
        plating: "Silver Plated",
        baseMaterial: "Brass",
        stock: 30,
        inStock: true,
        isActive: true,
        featured: true,
        imageUrl: "/api/placeholder/400/400"
      },
      
      // Earrings
      {
        name: "Rose Gold Plated Jhumkas",
        description: "Traditional jhumka earrings with rose gold plating and intricate designs",
        price: "599.00",
        originalPrice: "899.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-earrings")?.id,
        productType: "imitation" as const,
        material: "Traditional",
        plating: "Rose Gold Plated",
        baseMaterial: "Copper",
        stock: 75,
        inStock: true,
        isActive: true,
        featured: true,
        imageUrl: "/api/placeholder/400/400"
      },
      {
        name: "Gold Plated Chandbali Earrings",
        description: "Elegant chandbali earrings with gold plating and stone work",
        price: "749.00",
        originalPrice: "1199.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-earrings")?.id,
        productType: "imitation" as const,
        material: "Stone Work",
        plating: "Gold Plated",
        baseMaterial: "Alloy",
        stock: 60,
        inStock: true,
        isActive: true,
        featured: false,
        imageUrl: "/api/placeholder/400/400"
      },

      // Bangles
      {
        name: "Gold Plated Kada Set",
        description: "Set of 2 traditional kadas with gold plating and beautiful patterns",
        price: "999.00",
        originalPrice: "1499.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-bangles")?.id,
        productType: "imitation" as const,
        material: "Traditional",
        plating: "Gold Plated",
        baseMaterial: "Brass",
        stock: 40,
        inStock: true,
        isActive: true,
        featured: true,
        imageUrl: "/api/placeholder/400/400"
      },
      {
        name: "Silver Plated Oxidized Bangles",
        description: "Set of 6 oxidized bangles with silver plating and antique finish",
        price: "449.00",
        originalPrice: "699.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-bangles")?.id,
        productType: "imitation" as const,
        material: "Oxidized",
        plating: "Silver Plated",
        baseMaterial: "Alloy",
        stock: 80,
        inStock: true,
        isActive: true,
        featured: false,
        imageUrl: "/api/placeholder/400/400"
      },

      // Rings
      {
        name: "Gold Plated Statement Ring",
        description: "Bold statement ring with gold plating and adjustable size",
        price: "299.00",
        originalPrice: "499.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-rings")?.id,
        productType: "imitation" as const,
        material: "Statement",
        plating: "Gold Plated",
        baseMaterial: "Copper",
        stock: 100,
        inStock: true,
        isActive: true,
        featured: true,
        imageUrl: "/api/placeholder/400/400"
      },

      // Anklets
      {
        name: "Silver Plated Payal",
        description: "Traditional payal with silver plating and delicate ghungroo",
        price: "549.00",
        originalPrice: "799.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-anklets")?.id,
        productType: "imitation" as const,
        material: "Traditional",
        plating: "Silver Plated",
        baseMaterial: "Brass",
        stock: 35,
        inStock: true,
        isActive: true,
        featured: true,
        imageUrl: "/api/placeholder/400/400"
      },

      // Accessories
      {
        name: "Gold Plated Hair Pin Set",
        description: "Set of decorative hair pins with gold plating and stone work",
        price: "399.00",
        originalPrice: "599.00",
        categoryId: createdCategories.find(c => c.slug === "imitation-accessories")?.id,
        productType: "imitation" as const,
        material: "Hair Accessory",
        plating: "Gold Plated",
        baseMaterial: "Alloy",
        stock: 25,
        inStock: true,
        isActive: true,
        featured: false,
        imageUrl: "/api/placeholder/400/400"
      }
    ];

    // Insert products
    for (const productData of sampleProducts) {
      if (productData.categoryId) {
        // Check if product already exists
        const existing = await db.select().from(products).where(eq(products.name, productData.name));
        
        if (existing.length === 0) {
          const [product] = await db.insert(products).values(productData).returning();
          console.log(`Created product: ${product.name}`);
        } else {
          console.log(`Product already exists: ${productData.name}`);
        }
      }
    }

    console.log("Imitation jewelry seeding completed successfully!");
    return { success: true, categoriesCount: createdCategories.length, productsCount: sampleProducts.length };

  } catch (error) {
    console.error("Error seeding imitation jewelry:", error);
    throw error;
  }
}

// Run seeding if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  seedImitationJewelry()
    .then(() => {
      console.log("Seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Seeding failed:", error);
      process.exit(1);
    });
}