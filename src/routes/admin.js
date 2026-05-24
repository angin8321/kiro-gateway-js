import path from "path";
import { fileURLToPath } from "url";
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export function registerAdminRoutes(app) {
  // Serve static admin HTML (no auth; admin still needs key for API calls)
  app.get("/admin", (req, res) => {
    res.sendFile(path.join(__dirname, "../views/admin.html"));
  });
}
