import express from "express";
import cors from "cors";
import { loadAllData, searchEntities } from "./data/dataLoader";
import classicRoutes from "./routes/classicRoutes";
import craftingRoutes from "./routes/craftingRoutes";
import textureRoutes from "./routes/textureRoutes";
import soundRoutes from "./routes/soundRoutes";

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Load data
loadAllData();

// Routes
app.use("/api/classic", classicRoutes);
app.use("/api/crafting", craftingRoutes);
app.use("/api/texture", textureRoutes);
app.use("/api/sound", soundRoutes);

// Search endpoint
app.get("/api/items/search", (req, res) => {
  const query = (req.query.q as string) || "";
  if (query.length < 1) {
    return res.json([]);
  }
  const results = searchEntities(query, 10);
  res.json(results);
});

// Health check
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok" });
});

// Only listen if this file is run directly (not imported for tests)
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`Craftdle server running on http://localhost:${PORT}`);
  });
}

export default app;
