import { db } from "./db";
import { categories } from "@shared/schema";

export async function seedComprehensiveCategories() {
  console.log("Starting comprehensive category seeding...");

  try {
    // Clear existing categories
    await db.delete(categories);
    console.log("Cleared existing categories");

    // Define the comprehensive category structure
    const categoryStructure = [
      {
        name: "Neck Jewelry",
        slug: "neck-jewelry",
        subcategories: [
          "Chains",
          "Chokers", 
          "Pendant Necklaces",
          "Layered Necklaces",
          "Lockets",
          "Mangalsutras",
          "Haars / Rani Haars",
          "Collar & Bib Necklaces"
        ]
      },
      {
        name: "Earrings",
        slug: "earrings",
        subcategories: [
          "Stud Earrings",
          "Hoop Earrings",
          "Jhumkas",
          "Danglers",
          "Ear Cuffs",
          "Drop Earrings",
          "Chandbalis",
          "Balis"
        ]
      },
      {
        name: "Hand Jewelry",
        slug: "hand-jewelry",
        subcategories: [
          "Bracelets (Chain, Cuff, Kada)",
          "Bangles (Single / Pair / Sets)",
          "Haath Phool / Hand Harness",
          "Armlets (Bajuband)",
          "Watch Bracelets"
        ]
      },
      {
        name: "Finger Jewelry",
        slug: "finger-jewelry",
        subcategories: [
          "Solitaire Rings",
          "Engagement Rings",
          "Stackable Rings",
          "Cocktail Rings",
          "Adjustable Rings"
        ]
      },
      {
        name: "Foot Jewelry",
        slug: "foot-jewelry",
        subcategories: [
          "Anklets (Payal)",
          "Toe Rings (Bichhiya)"
        ]
      },
      {
        name: "Nose Jewelry",
        slug: "nose-jewelry",
        subcategories: [
          "Nose Pins",
          "Nath / Nose Rings",
          "Septum Rings"
        ]
      },
      {
        name: "Waist Jewelry",
        slug: "waist-jewelry",
        subcategories: [
          "Kamarbandh / Waist Belts",
          "Bridal Waist Chains",
          "Pearl / Gold / Silver Waist Jewelry"
        ]
      },
      {
        name: "Hair Jewelry",
        slug: "hair-jewelry",
        subcategories: [
          "Maang Tikkas",
          "Juda Pins",
          "Hair Clips / Pins",
          "Passas (Side Headpiece)"
        ]
      },
      {
        name: "Bridal & Traditional Sets",
        slug: "bridal-traditional-sets",
        subcategories: [
          "Bridal Jewelry Sets",
          "Engagement Sets",
          "Temple Jewelry Sets",
          "Kundan / Polki / Meenakari Sets"
        ]
      },
      {
        name: "Men's Jewelry",
        slug: "mens-jewelry",
        subcategories: [
          "Chains",
          "Bracelets / Kadas",
          "Rings",
          "Stud Earrings",
          "Cufflinks",
          "Brooches",
          "Tie Pins"
        ]
      },
      {
        name: "Kids Jewelry",
        slug: "kids-jewelry",
        subcategories: [
          "Baby Bangles",
          "Nazariya Bracelets",
          "Kids Rings",
          "Pendants"
        ]
      },
      {
        name: "Body Jewelry (Modern)",
        slug: "body-jewelry-modern",
        subcategories: [
          "Belly Rings",
          "Lip / Eyebrow Rings",
          "Body Chains"
        ]
      }
    ];

    // Insert main categories and their subcategories
    for (const mainCat of categoryStructure) {
      console.log(`Creating main category: ${mainCat.name}`);
      
      // Insert main category
      const [parentCategory] = await db
        .insert(categories)
        .values({
          name: mainCat.name,
          slug: mainCat.slug,
          parentId: null,
        })
        .returning();

      console.log(`Created main category: ${parentCategory.name} (ID: ${parentCategory.id})`);

      // Insert subcategories
      for (const subCatName of mainCat.subcategories) {
        const subCatSlug = subCatName
          .toLowerCase()
          .replace(/[^a-z0-9\s]/g, '')
          .replace(/\s+/g, '-')
          .replace(/--+/g, '-')
          .trim();

        const [subCategory] = await db
          .insert(categories)
          .values({
            name: subCatName,
            slug: subCatSlug,
            parentId: parentCategory.id,
          })
          .returning();

        console.log(`  Created subcategory: ${subCategory.name} (ID: ${subCategory.id})`);
      }
    }

    console.log("✅ Comprehensive category structure created successfully!");
    
    // Get final count
    const finalCategories = await db.select().from(categories);
    const mainCategories = finalCategories.filter(cat => !cat.parentId);
    const subcategories = finalCategories.filter(cat => cat.parentId);
    
    console.log(`📊 Final counts:`);
    console.log(`   Main categories: ${mainCategories.length}`);
    console.log(`   Subcategories: ${subcategories.length}`);
    console.log(`   Total categories: ${finalCategories.length}`);

    return {
      success: true,
      mainCategories: mainCategories.length,
      subcategories: subcategories.length,
      total: finalCategories.length
    };

  } catch (error) {
    console.error("❌ Error seeding comprehensive categories:", error);
    throw error;
  }
}