import type { Express, RequestHandler } from "express";
import { storage } from "./storage";

// Temporary authentication for development
export async function setupTempAuth(app: Express) {
  // Temporary admin login endpoint
  app.post("/api/temp-login", async (req, res) => {
    try {
      const { email } = req.body;
      
      // Only allow specific admin email
      if (email === "akashmirande2@gmail.com") {
        // Create/update admin user
        const adminUser = await storage.upsertUser({
          id: "43578263",
          email: "akashmirande2@gmail.com",
          firstName: "Admin",
          lastName: "User",
          profileImageUrl: null,
          role: "admin"
        });
        
        // Set session
        (req as any).session.user = {
          id: adminUser.id,
          email: adminUser.email,
          role: "admin"
        };
        
        res.json({ success: true, user: adminUser });
      } else {
        res.status(401).json({ message: "Unauthorized" });
      }
    } catch (error) {
      console.error("Temp login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Check auth endpoint
  app.get("/api/auth/user", (req, res) => {
    const sessionUser = (req as any).session?.user;
    if (sessionUser) {
      res.json(sessionUser);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Logout endpoint
  app.post("/api/logout", (req, res) => {
    (req as any).session.destroy();
    res.json({ success: true });
  });
}

export const isAuthenticated: RequestHandler = (req, res, next) => {
  const sessionUser = (req as any).session?.user;
  if (sessionUser) {
    (req as any).user = sessionUser;
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

export const isAdmin: RequestHandler = (req, res, next) => {
  const sessionUser = (req as any).session?.user;
  if (sessionUser && sessionUser.role === 'admin') {
    (req as any).user = sessionUser;
    next();
  } else {
    res.status(403).json({ message: "Admin access required" });
  }
};