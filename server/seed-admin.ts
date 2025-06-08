import { storage } from "./storage";
import { hashPassword, generateUserId } from "./auth";

async function seedAdmin() {
  try {
    console.log("Checking for existing admin user...");
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail("admin@ddmjewellers.com");
    if (existingAdmin) {
      console.log("Admin user already exists!");
      console.log("Email: admin@ddmjewellers.com");
      console.log("Use the forgot password feature to reset if needed.");
      return;
    }

    console.log("Creating admin user...");
    
    // Create admin user
    const adminData = {
      id: generateUserId(),
      email: "admin@ddmjewellers.com",
      passwordHash: await hashPassword("admin123"),
      firstName: "Admin",
      lastName: "User",
      role: "admin" as const,
      isEmailVerified: true,
      isApproved: true,
      phone: "+91 98765 43210",
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await storage.createUser(adminData);
    
    console.log("✅ Admin user created successfully!");
    console.log("Email: admin@ddmjewellers.com");
    console.log("Password: admin123");
    console.log("Please change this password after first login.");
    
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
  
  process.exit(0);
}

seedAdmin();