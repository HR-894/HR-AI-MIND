import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import fs from "fs";
import path from "path";

export async function registerRoutes(app: Express): Promise<Server> {
  // put application routes here
  // prefix all routes with /api

  // use storage to perform CRUD operations on the storage interface
  // e.g. storage.insertUser(user) or storage.getUserByUsername(username)

  // Models API (Option B)
  app.get("/api/models", (_req, res) => {
    try {
      const jsonPath = path.resolve(process.cwd(), "public", "models.json");
      if (fs.existsSync(jsonPath)) {
        const raw = fs.readFileSync(jsonPath, "utf-8");
        const data = JSON.parse(raw);
        return res.json(data);
      }
      // Fallback inline, keep in sync with client default
      return res.json([
        {
          id: "Llama-3.2-1B-Instruct-q4f32_1-MLC",
          name: "Llama 3.2 1B",
          displayName: "Llama 3.2 1B Instruct",
          sizeMB: 630,
          quantization: "q4f32_1",
          vramMinGB: 1.5,
          speed: "Fast",
          description: "Fallback entry.",
          recommended: "General"
        }
      ]);
    } catch (e: any) {
      res.status(500).json({ message: e.message || "Failed to load models" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
