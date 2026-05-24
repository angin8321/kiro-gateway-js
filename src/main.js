import express from "express";
import { PROXY_API_KEY, REGION } from "./config.js";
import { registerOpenAIRoutes } from "./routes/openai.js";
import { registerAdminRoutes } from "./routes/admin.js";
import { findApiKey } from "./apiKeysStore.js";

const app = express();
app.use(express.json());

// Health endpoints (no auth)
app.get("/", (req, res) => {
  res.json({
    status: "ok",
    name: "simple-kiro-gateway",
    version: "0.3.0",
    region: REGION,
  });
});

app.get("/health", (req, res) => {
  res.json({ status: "ok", version: "0.3.0", region: REGION });
});

// Auth middleware for /v1/*
app.use((req, res, next) => {
  if (!req.path.startsWith("/v1/")) return next();

  if (!PROXY_API_KEY) {
    return res
      .status(500)
      .json({ error: "PROXY_API_KEY is not configured on the server" });
  }

  const authHeader = req.headers["authorization"];
  const xApiKey = req.headers["x-api-key"];

  const bearer =
    typeof authHeader === "string" && authHeader.startsWith("Bearer ")
      ? authHeader.slice("Bearer ".length)
      : null;

  const candidateKey = bearer || (typeof xApiKey === "string" ? xApiKey : null);

  const matchEnv = PROXY_API_KEY && candidateKey === PROXY_API_KEY;
  const matchManaged = candidateKey ? Boolean(findApiKey(candidateKey)) : false;

  if (!matchEnv && !matchManaged) {
    return res.status(401).json({ error: "Invalid API key" });
  }

  next();
});

// Register main API routes
registerOpenAIRoutes(app);

// Register admin panel
registerAdminRoutes(app);

const PORT = process.env.SERVER_PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
