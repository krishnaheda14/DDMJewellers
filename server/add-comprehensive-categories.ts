import { db } from "./db";
import { categories } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function addComprehensiveJewelryCategories() {
  try {
    console.log("Adding comprehensive jewelry categories...");
    
    // Check existing categories
    const existingCategories = await db.select().from(categories);
    const existingSlugs = new Set(existingCategories.map(cat => cat.slug));
    console.log(`Found ${existingCategories.length} existing categories`);

    // New main categories to add (avoiding duplicates)
    const newMainCategories = [
      { name: "Neck Jewelry", slug: "neck-jewelry", description: "Beautiful necklaces, chains, and pendants", parentId: null, sortOrder: 1 },
      { name: "Hand Jewelry", slug: "hand-jewelry", description: "Bracelets, bangles, and hand accessories", parentId: null, sortOrder: 3 },
      { name: "Finger Jewelry", slug: "finger-jewelry", description: "Rings for every occasion", parentId: null, sortOrder: 4 },
      { name: "Foot Jewelry", slug: "foot-jewelry", description: "Anklets and toe rings", parentId: null, sortOrder: 5 },
      { name: "Nose Jewelry", slug: "nose-jewelry", description: "Traditional and modern nose jewelry", parentId: null, sortOrder: 6 },
      { name: "Waist Jewelry", slug: "waist-jewelry", description: "Elegant waist accessories", parentId: null, sortOrder: 7 },
      { name: "Hair Jewelry", slug: "hair-jewelry", description: "Beautiful hair ornaments and accessories", parentId: null, sortOrder: 8 },
      { name: "Bridal & Special Jewelry Sets", slug: "bridal-special-sets", description: "Complete jewelry sets for special occasions", parentId: null, sortOrder: 9 },
      { name: "Men's Jewelry", slug: "mens-jewelry", description: "Stylish jewelry for men", parentId: null, sortOrder: 10 },
      { name: "Kids Jewelry", slug: "kids-jewelry", description: "Safe and beautiful jewelry for children", parentId: null, sortOrder: 11 },
      { name: "Body Jewelry", slug: "body-jewelry", description: "Contemporary body jewelry", parentId: null, sortOrder: 12 },
    ].filter(cat => !existingSlugs.has(cat.slug));

    // Insert new main categories
    let insertedMainCategories = [];
    if (newMainCategories.length > 0) {
      insertedMainCategories = await db.insert(categories)
        .values(newMainCategories)
        .returning({ id: categories.id, name: categories.name, slug: categories.slug });
      console.log(`Added ${insertedMainCategories.length} new main categories`);
    }

    // Create category map including existing ones
    const allCategories = await db.select().from(categories);
    const categoryMap = new Map(allCategories.map(cat => [cat.slug, cat.id]));

    // Comprehensive subcategories
    const allSubCategories = [
      // Neck Jewelry subcategories
      { name: "Necklace", slug: "necklace", description: "Classic necklaces", parentId: categoryMap.get("neck-jewelry"), sortOrder: 1 },
      { name: "Chain", slug: "chain", description: "Simple and elegant chains", parentId: categoryMap.get("neck-jewelry"), sortOrder: 2 },
      { name: "Choker", slug: "choker", description: "Short necklaces that sit close to the neck", parentId: categoryMap.get("neck-jewelry"), sortOrder: 3 },
      { name: "Pendant Necklace", slug: "pendant-necklace", description: "Necklaces with decorative pendants", parentId: categoryMap.get("neck-jewelry"), sortOrder: 4 },
      { name: "Layered Necklace", slug: "layered-necklace", description: "Multiple strand necklaces", parentId: categoryMap.get("neck-jewelry"), sortOrder: 5 },
      { name: "Locket", slug: "locket", description: "Necklaces with photo lockets", parentId: categoryMap.get("neck-jewelry"), sortOrder: 6 },
      { name: "Mangalsutra", slug: "mangalsutra", description: "Traditional Indian married women's necklace", parentId: categoryMap.get("neck-jewelry"), sortOrder: 7 },
      { name: "Haar", slug: "haar", description: "Long traditional necklaces", parentId: categoryMap.get("neck-jewelry"), sortOrder: 8 },
      { name: "Rani Haar", slug: "rani-haar", description: "Royal style long necklaces", parentId: categoryMap.get("neck-jewelry"), sortOrder: 9 },
      
      // Earrings subcategories (parent exists)
      { name: "Stud Earrings", slug: "stud-earrings", description: "Simple post earrings", parentId: categoryMap.get("earrings"), sortOrder: 1 },
      { name: "Hoop Earrings", slug: "hoop-earrings", description: "Circular hoop style earrings", parentId: categoryMap.get("earrings"), sortOrder: 2 },
      { name: "Jhumka", slug: "jhumka", description: "Traditional Indian bell-shaped earrings", parentId: categoryMap.get("earrings"), sortOrder: 3 },
      { name: "Dangler Earrings", slug: "dangler-earrings", description: "Long hanging earrings", parentId: categoryMap.get("earrings"), sortOrder: 4 },
      { name: "Ear Cuffs", slug: "ear-cuffs", description: "Wrap-around ear jewelry", parentId: categoryMap.get("earrings"), sortOrder: 5 },
      { name: "Drop Earrings", slug: "drop-earrings", description: "Elegant drop style earrings", parentId: categoryMap.get("earrings"), sortOrder: 6 },
      { name: "Chandbali", slug: "chandbali", description: "Crescent moon shaped earrings", parentId: categoryMap.get("earrings"), sortOrder: 7 },
      { name: "Bali", slug: "bali", description: "Traditional hoop earrings", parentId: categoryMap.get("earrings"), sortOrder: 8 },
      
      // Hand Jewelry subcategories
      { name: "Bracelet", slug: "bracelet", description: "Wrist bracelets", parentId: categoryMap.get("hand-jewelry"), sortOrder: 1 },
      { name: "Cuff Bracelet", slug: "cuff-bracelet", description: "Wide band bracelets", parentId: categoryMap.get("hand-jewelry"), sortOrder: 2 },
      { name: "Chain Bracelet", slug: "chain-bracelet", description: "Chain style bracelets", parentId: categoryMap.get("hand-jewelry"), sortOrder: 3 },
      { name: "Kada", slug: "kada", description: "Traditional thick bracelets", parentId: categoryMap.get("hand-jewelry"), sortOrder: 4 },
      { name: "Bangles Set", slug: "bangles-set", description: "Traditional circular bracelets in sets", parentId: categoryMap.get("hand-jewelry"), sortOrder: 5 },
      { name: "Watch Bracelet", slug: "watch-bracelet", description: "Fusion watch and bracelet", parentId: categoryMap.get("hand-jewelry"), sortOrder: 6 },
      { name: "Haath Phool", slug: "haath-phool", description: "Hand harness jewelry", parentId: categoryMap.get("hand-jewelry"), sortOrder: 7 },
      { name: "Armlet", slug: "armlet", description: "Upper arm jewelry (Bajuband)", parentId: categoryMap.get("hand-jewelry"), sortOrder: 8 },
      
      // Finger Jewelry subcategories
      { name: "Ring", slug: "ring", description: "General rings", parentId: categoryMap.get("finger-jewelry"), sortOrder: 1 },
      { name: "Solitaire Ring", slug: "solitaire-ring", description: "Single diamond rings", parentId: categoryMap.get("finger-jewelry"), sortOrder: 2 },
      { name: "Engagement Ring", slug: "engagement-ring", description: "Engagement rings", parentId: categoryMap.get("finger-jewelry"), sortOrder: 3 },
      { name: "Stackable Rings", slug: "stackable-rings", description: "Rings designed to be worn together", parentId: categoryMap.get("finger-jewelry"), sortOrder: 4 },
      { name: "Cocktail Ring", slug: "cocktail-ring", description: "Large statement rings", parentId: categoryMap.get("finger-jewelry"), sortOrder: 5 },
      { name: "Adjustable Ring", slug: "adjustable-ring", description: "Size-adjustable rings", parentId: categoryMap.get("finger-jewelry"), sortOrder: 6 },
      
      // Foot Jewelry subcategories
      { name: "Anklet", slug: "anklet", description: "Ankle jewelry (Payal)", parentId: categoryMap.get("foot-jewelry"), sortOrder: 1 },
      { name: "Toe Ring", slug: "toe-ring", description: "Toe rings (Bichhiya)", parentId: categoryMap.get("foot-jewelry"), sortOrder: 2 },
      
      // Nose Jewelry subcategories
      { name: "Nose Pin", slug: "nose-pin", description: "Small nose studs", parentId: categoryMap.get("nose-jewelry"), sortOrder: 1 },
      { name: "Nath", slug: "nath", description: "Traditional nose rings", parentId: categoryMap.get("nose-jewelry"), sortOrder: 2 },
      { name: "Septum Ring", slug: "septum-ring", description: "Modern septum jewelry", parentId: categoryMap.get("nose-jewelry"), sortOrder: 3 },
      
      // Waist Jewelry subcategories
      { name: "Waist Belt", slug: "waist-belt", description: "Decorative waist belts (Kamarbandh)", parentId: categoryMap.get("waist-jewelry"), sortOrder: 1 },
      
      // Hair Jewelry subcategories
      { name: "Maang Tikka", slug: "maang-tikka", description: "Forehead jewelry", parentId: categoryMap.get("hair-jewelry"), sortOrder: 1 },
      { name: "Hair Pin", slug: "hair-pin", description: "Decorative hair pins and clips", parentId: categoryMap.get("hair-jewelry"), sortOrder: 2 },
      { name: "Juda Pin", slug: "juda-pin", description: "Hair bun accessories", parentId: categoryMap.get("hair-jewelry"), sortOrder: 3 },
      { name: "Passa", slug: "passa", description: "Side head ornaments", parentId: categoryMap.get("hair-jewelry"), sortOrder: 4 },
      
      // Bridal & Special Sets subcategories
      { name: "Bridal Set", slug: "bridal-set", description: "Complete bridal jewelry sets", parentId: categoryMap.get("bridal-special-sets"), sortOrder: 1 },
      { name: "Engagement Set", slug: "engagement-set", description: "Engagement jewelry sets", parentId: categoryMap.get("bridal-special-sets"), sortOrder: 2 },
      { name: "Temple Jewelry Set", slug: "temple-jewelry-set", description: "Traditional temple style sets", parentId: categoryMap.get("bridal-special-sets"), sortOrder: 3 },
      { name: "Kundan Set", slug: "kundan-set", description: "Kundan jewelry sets", parentId: categoryMap.get("bridal-special-sets"), sortOrder: 4 },
      { name: "Polki Set", slug: "polki-set", description: "Polki diamond sets", parentId: categoryMap.get("bridal-special-sets"), sortOrder: 5 },
      { name: "Meenakari Set", slug: "meenakari-set", description: "Enamel work jewelry sets", parentId: categoryMap.get("bridal-special-sets"), sortOrder: 6 },
      
      // Men's Jewelry subcategories
      { name: "Men's Chain", slug: "mens-chain", description: "Chains for men", parentId: categoryMap.get("mens-jewelry"), sortOrder: 1 },
      { name: "Men's Bracelet", slug: "mens-bracelet", description: "Bracelets and Kadas for men", parentId: categoryMap.get("mens-jewelry"), sortOrder: 2 },
      { name: "Men's Studs", slug: "mens-studs", description: "Ear studs for men", parentId: categoryMap.get("mens-jewelry"), sortOrder: 3 },
      { name: "Signet Ring", slug: "signet-ring", description: "Men's signet rings", parentId: categoryMap.get("mens-jewelry"), sortOrder: 4 },
      { name: "Brooch", slug: "brooch", description: "Decorative pins", parentId: categoryMap.get("mens-jewelry"), sortOrder: 5 },
      { name: "Cufflinks", slug: "cufflinks", description: "Shirt cufflinks", parentId: categoryMap.get("mens-jewelry"), sortOrder: 6 },
      { name: "Tie Pin", slug: "tie-pin", description: "Tie accessories", parentId: categoryMap.get("mens-jewelry"), sortOrder: 7 },
      
      // Kids Jewelry subcategories
      { name: "Baby Bangles", slug: "baby-bangles", description: "Safe bangles for babies", parentId: categoryMap.get("kids-jewelry"), sortOrder: 1 },
      { name: "Nazariya", slug: "nazariya", description: "Protective amulets for children", parentId: categoryMap.get("kids-jewelry"), sortOrder: 2 },
      { name: "Kids Pendant", slug: "kids-pendant", description: "Child-safe pendants", parentId: categoryMap.get("kids-jewelry"), sortOrder: 3 },
      { name: "Kids Adjustable Rings", slug: "kids-adjustable-rings", description: "Growing rings for children", parentId: categoryMap.get("kids-jewelry"), sortOrder: 4 },
      
      // Body Jewelry subcategories
      { name: "Belly Rings", slug: "belly-rings", description: "Navel piercing jewelry", parentId: categoryMap.get("body-jewelry"), sortOrder: 1 },
      { name: "Eyebrow Rings", slug: "eyebrow-rings", description: "Eyebrow piercing jewelry", parentId: categoryMap.get("body-jewelry"), sortOrder: 2 },
      { name: "Lip Rings", slug: "lip-rings", description: "Lip piercing jewelry", parentId: categoryMap.get("body-jewelry"), sortOrder: 3 },
      { name: "Body Chains", slug: "body-chains", description: "Decorative body chains", parentId: categoryMap.get("body-jewelry"), sortOrder: 4 },
    ].filter(cat => cat.parentId && !existingSlugs.has(cat.slug)); // Only add if parent exists and slug is unique

    // Insert subcategories in batches to avoid conflicts
    let insertedSubCategories = [];
    if (allSubCategories.length > 0) {
      insertedSubCategories = await db.insert(categories)
        .values(allSubCategories)
        .returning({ id: categories.id, name: categories.name });
      console.log(`Added ${insertedSubCategories.length} subcategories`);
    }

    const totalAdded = insertedMainCategories.length + insertedSubCategories.length;
    console.log(`✓ Successfully added ${totalAdded} comprehensive jewelry categories!`);
    
    return {
      mainCategories: insertedMainCategories.length,
      subCategories: insertedSubCategories.length,
      total: totalAdded
    };
    
  } catch (error) {
    console.error("Error adding jewelry categories:", error);
    throw error;
  }
}

// Run the function
addComprehensiveJewelryCategories()
  .then((result) => {
    console.log(`✓ Process completed: ${result.total} categories added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Process failed:", error);
    process.exit(1);
  });