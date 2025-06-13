import { db } from "./db";
import { categories, products } from "@shared/schema";
import { eq } from "drizzle-orm";

export async function reorganizeCategories() {
  try {
    console.log("Reorganizing categories...");
    
    // First, update all products to have null category_id to avoid foreign key constraints
    await db.update(products).set({ categoryId: null });
    console.log("Updated products to remove category references");
    
    // Delete all existing categories
    await db.delete(categories);
    console.log("Cleared existing categories");

    // Define the new main categories (body parts/locations)
    const mainCategories = [
      { name: "Neck", slug: "neck", description: "All neck jewelry including necklaces, chains, pendants", sortOrder: 1 },
      { name: "Ear", slug: "ear", description: "All ear jewelry including earrings, studs, hoops", sortOrder: 2 },
      { name: "Hand", slug: "hand", description: "All hand jewelry including bracelets, bangles, kadas", sortOrder: 3 },
      { name: "Finger", slug: "finger", description: "All finger jewelry including rings", sortOrder: 4 },
      { name: "Foot", slug: "foot", description: "All foot jewelry including anklets, toe rings", sortOrder: 5 },
      { name: "Nose", slug: "nose", description: "All nose jewelry including nose pins, nath", sortOrder: 6 },
      { name: "Waist", slug: "waist", description: "All waist jewelry including kamarbandh", sortOrder: 7 },
      { name: "Hair", slug: "hair", description: "All hair jewelry including maang tikka, hair pins", sortOrder: 8 },
      { name: "Bridal Sets", slug: "bridal-sets", description: "Complete bridal and special occasion jewelry sets", sortOrder: 9 },
      { name: "Men's Jewelry", slug: "mens-jewelry", description: "Jewelry specifically designed for men", sortOrder: 10 },
      { name: "Kids Jewelry", slug: "kids-jewelry", description: "Safe and beautiful jewelry for children", sortOrder: 11 },
      { name: "Body Jewelry", slug: "body-jewelry", description: "Contemporary body piercing jewelry", sortOrder: 12 },
    ];

    // Insert main categories
    const insertedMainCategories = await db.insert(categories)
      .values(mainCategories)
      .returning({ id: categories.id, name: categories.name, slug: categories.slug });
    
    console.log(`Added ${insertedMainCategories.length} main categories`);
    
    // Create category map
    const categoryMap = new Map(insertedMainCategories.map(cat => [cat.slug, cat.id]));

    // Define all subcategories under their respective main categories
    const subCategories = [
      // Neck subcategories
      { name: "Necklace", slug: "necklace", description: "Classic necklaces", parentId: categoryMap.get("neck"), sortOrder: 1 },
      { name: "Chain", slug: "chain", description: "Simple and elegant chains", parentId: categoryMap.get("neck"), sortOrder: 2 },
      { name: "Choker", slug: "choker", description: "Short necklaces that sit close to the neck", parentId: categoryMap.get("neck"), sortOrder: 3 },
      { name: "Pendant Necklace", slug: "pendant-necklace", description: "Necklaces with decorative pendants", parentId: categoryMap.get("neck"), sortOrder: 4 },
      { name: "Layered Necklace", slug: "layered-necklace", description: "Multiple strand necklaces", parentId: categoryMap.get("neck"), sortOrder: 5 },
      { name: "Locket", slug: "locket", description: "Necklaces with photo lockets", parentId: categoryMap.get("neck"), sortOrder: 6 },
      { name: "Mangalsutra", slug: "mangalsutra", description: "Traditional Indian married women's necklace", parentId: categoryMap.get("neck"), sortOrder: 7 },
      { name: "Haar", slug: "haar", description: "Long traditional necklaces", parentId: categoryMap.get("neck"), sortOrder: 8 },
      { name: "Rani Haar", slug: "rani-haar", description: "Royal style long necklaces", parentId: categoryMap.get("neck"), sortOrder: 9 },
      { name: "Pendants", slug: "pendants", description: "Standalone pendants", parentId: categoryMap.get("neck"), sortOrder: 10 },
      
      // Ear subcategories
      { name: "Stud Earrings", slug: "stud-earrings", description: "Simple post earrings", parentId: categoryMap.get("ear"), sortOrder: 1 },
      { name: "Hoop Earrings", slug: "hoop-earrings", description: "Circular hoop style earrings", parentId: categoryMap.get("ear"), sortOrder: 2 },
      { name: "Jhumka", slug: "jhumka", description: "Traditional Indian bell-shaped earrings", parentId: categoryMap.get("ear"), sortOrder: 3 },
      { name: "Dangler Earrings", slug: "dangler-earrings", description: "Long hanging earrings", parentId: categoryMap.get("ear"), sortOrder: 4 },
      { name: "Ear Cuffs", slug: "ear-cuffs", description: "Wrap-around ear jewelry", parentId: categoryMap.get("ear"), sortOrder: 5 },
      { name: "Drop Earrings", slug: "drop-earrings", description: "Elegant drop style earrings", parentId: categoryMap.get("ear"), sortOrder: 6 },
      { name: "Chandbali", slug: "chandbali", description: "Crescent moon shaped earrings", parentId: categoryMap.get("ear"), sortOrder: 7 },
      { name: "Bali", slug: "bali", description: "Traditional hoop earrings", parentId: categoryMap.get("ear"), sortOrder: 8 },
      
      // Hand subcategories
      { name: "Bracelet", slug: "bracelet", description: "Wrist bracelets", parentId: categoryMap.get("hand"), sortOrder: 1 },
      { name: "Cuff Bracelet", slug: "cuff-bracelet", description: "Wide band bracelets", parentId: categoryMap.get("hand"), sortOrder: 2 },
      { name: "Chain Bracelet", slug: "chain-bracelet", description: "Chain style bracelets", parentId: categoryMap.get("hand"), sortOrder: 3 },
      { name: "Kada", slug: "kada", description: "Traditional thick bracelets", parentId: categoryMap.get("hand"), sortOrder: 4 },
      { name: "Bangles", slug: "bangles", description: "Traditional circular bracelets", parentId: categoryMap.get("hand"), sortOrder: 5 },
      { name: "Watch Bracelet", slug: "watch-bracelet", description: "Fusion watch and bracelet", parentId: categoryMap.get("hand"), sortOrder: 6 },
      { name: "Haath Phool", slug: "haath-phool", description: "Hand harness jewelry", parentId: categoryMap.get("hand"), sortOrder: 7 },
      { name: "Armlet", slug: "armlet", description: "Upper arm jewelry (Bajuband)", parentId: categoryMap.get("hand"), sortOrder: 8 },
      
      // Finger subcategories
      { name: "Ring", slug: "ring", description: "General rings", parentId: categoryMap.get("finger"), sortOrder: 1 },
      { name: "Solitaire Ring", slug: "solitaire-ring", description: "Single diamond rings", parentId: categoryMap.get("finger"), sortOrder: 2 },
      { name: "Engagement Ring", slug: "engagement-ring", description: "Engagement rings", parentId: categoryMap.get("finger"), sortOrder: 3 },
      { name: "Stackable Rings", slug: "stackable-rings", description: "Rings designed to be worn together", parentId: categoryMap.get("finger"), sortOrder: 4 },
      { name: "Cocktail Ring", slug: "cocktail-ring", description: "Large statement rings", parentId: categoryMap.get("finger"), sortOrder: 5 },
      { name: "Adjustable Ring", slug: "adjustable-ring", description: "Size-adjustable rings", parentId: categoryMap.get("finger"), sortOrder: 6 },
      { name: "Customizable Rings", slug: "customizable-rings", description: "Rings that can be customized", parentId: categoryMap.get("finger"), sortOrder: 7 },
      
      // Foot subcategories
      { name: "Anklet", slug: "anklet", description: "Ankle jewelry (Payal)", parentId: categoryMap.get("foot"), sortOrder: 1 },
      { name: "Toe Ring", slug: "toe-ring", description: "Toe rings (Bichhiya)", parentId: categoryMap.get("foot"), sortOrder: 2 },
      
      // Nose subcategories
      { name: "Nose Pin", slug: "nose-pin", description: "Small nose studs", parentId: categoryMap.get("nose"), sortOrder: 1 },
      { name: "Nath", slug: "nath", description: "Traditional nose rings", parentId: categoryMap.get("nose"), sortOrder: 2 },
      { name: "Septum Ring", slug: "septum-ring", description: "Modern septum jewelry", parentId: categoryMap.get("nose"), sortOrder: 3 },
      
      // Waist subcategories
      { name: "Waist Belt", slug: "waist-belt", description: "Decorative waist belts (Kamarbandh)", parentId: categoryMap.get("waist"), sortOrder: 1 },
      
      // Hair subcategories
      { name: "Maang Tikka", slug: "maang-tikka", description: "Forehead jewelry", parentId: categoryMap.get("hair"), sortOrder: 1 },
      { name: "Hair Pin", slug: "hair-pin", description: "Decorative hair pins and clips", parentId: categoryMap.get("hair"), sortOrder: 2 },
      { name: "Juda Pin", slug: "juda-pin", description: "Hair bun accessories", parentId: categoryMap.get("hair"), sortOrder: 3 },
      { name: "Passa", slug: "passa", description: "Side head ornaments", parentId: categoryMap.get("hair"), sortOrder: 4 },
      
      // Bridal Sets subcategories
      { name: "Bridal Set", slug: "bridal-set", description: "Complete bridal jewelry sets", parentId: categoryMap.get("bridal-sets"), sortOrder: 1 },
      { name: "Engagement Set", slug: "engagement-set", description: "Engagement jewelry sets", parentId: categoryMap.get("bridal-sets"), sortOrder: 2 },
      { name: "Temple Jewelry Set", slug: "temple-jewelry-set", description: "Traditional temple style sets", parentId: categoryMap.get("bridal-sets"), sortOrder: 3 },
      { name: "Kundan Set", slug: "kundan-set", description: "Kundan jewelry sets", parentId: categoryMap.get("bridal-sets"), sortOrder: 4 },
      { name: "Polki Set", slug: "polki-set", description: "Polki diamond sets", parentId: categoryMap.get("bridal-sets"), sortOrder: 5 },
      { name: "Meenakari Set", slug: "meenakari-set", description: "Enamel work jewelry sets", parentId: categoryMap.get("bridal-sets"), sortOrder: 6 },
      
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
    ];

    // Insert subcategories
    const insertedSubCategories = await db.insert(categories)
      .values(subCategories)
      .returning({ id: categories.id, name: categories.name });
    
    console.log(`Added ${insertedSubCategories.length} subcategories`);
    
    const totalAdded = insertedMainCategories.length + insertedSubCategories.length;
    console.log(`✓ Successfully reorganized categories: ${totalAdded} total categories`);
    
    return {
      mainCategories: insertedMainCategories.length,
      subCategories: insertedSubCategories.length,
      total: totalAdded
    };
    
  } catch (error) {
    console.error("Error reorganizing categories:", error);
    throw error;
  }
}

// Run the function
reorganizeCategories()
  .then((result) => {
    console.log(`✓ Reorganization completed: ${result.total} categories added`);
    process.exit(0);
  })
  .catch((error) => {
    console.error("✗ Reorganization failed:", error);
    process.exit(1);
  });