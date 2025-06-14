import { db } from "./db";
import { storeLocations } from "../shared/schema";

export async function seedStoreLocations() {
  try {
    console.log("Seeding store locations...");
    
    // Your Google Maps location data
    const locations = [
      {
        name: "DDM Jewellers - Main Store",
        address: "Shop No. 123, Main Market, Sector 15, Gurgaon, Haryana 122001",
        city: "Gurgaon",
        state: "Haryana", 
        pincode: "122001",
        phone: "+91-9876543210",
        email: "info@ddmjewellers.com",
        latitude: "28.4595",
        longitude: "77.0266",
        googleMapsUrl: "https://g.co/kgs/xKrZ2rZ",
        openingHours: {
          monday: "10:00 AM - 8:00 PM",
          tuesday: "10:00 AM - 8:00 PM", 
          wednesday: "10:00 AM - 8:00 PM",
          thursday: "10:00 AM - 8:00 PM",
          friday: "10:00 AM - 8:00 PM",
          saturday: "10:00 AM - 8:00 PM",
          sunday: "11:00 AM - 6:00 PM"
        },
        isActive: true
      }
    ];

    // Insert locations
    const insertedLocations = await db.insert(storeLocations)
      .values(locations)
      .returning();

    console.log(`Successfully seeded ${insertedLocations.length} store locations`);
    
    return {
      success: true,
      locationsCreated: insertedLocations.length,
      locations: insertedLocations
    };
    
  } catch (error) {
    console.error("Error seeding store locations:", error);
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedStoreLocations()
    .then(() => {
      console.log("Store locations seeding completed!");
      process.exit(0);
    })
    .catch((error) => {
      console.error("Store locations seeding failed:", error);
      process.exit(1);
    });
}