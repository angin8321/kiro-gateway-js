import path from "path";
import { fileURLToPath } from "url";
import { PROXY_API_KEY } from "../config.js";
import {
  getAccounts,
  addOrUpdateAccount,
  deleteAccount,
  setActiveAccount,
} from "../accountsStore.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function requireAdminAuth(req, res, next) {
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

  const valid = bearer === PROXY_API_KEY || xApiKey === PROXY_API_KEY;

  if (!valid) {
    return res.status(401).json({ error: "Invalid admin API key" });
  }

  next();
}

export function registerAdminRoutes(app) {
  // Serve static admin HTML (no auth; admin still needs key for API calls)
  app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/admin.html"));
  });

  // Accounts management API (protected by admin key)
  app.get("/admin/api/accounts", requireAdminAuth, (req, res) => {
    res.json({ accounts: getAccounts() });
  });

  app.post("/admin/api/accounts", requireAdminAuth, (req, res) => {
    try {
      const { id, refreshToken, profileArn, enabled } = req.body || {};
      const acc = addOrUpdateAccount({ id, refreshToken, profileArn, enabled });
      res.json({ account: acc });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.delete("/admin/api/accounts/:id", requireAdminAuth, (req, res) => {
    try {
      deleteAccount(req.params.id);
      res.json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: e.message });
    }
  });

  app.post(
    "/admin/api/accounts/:id/activate",
    requireAdminAuth,
    (req, res) => {
      try {
        setActiveAccount(req.params.id);
        res.json({ ok: true });
      } catch (e) {
        res.status(400).json({ error: e.message });
      }
    }
  );
}
