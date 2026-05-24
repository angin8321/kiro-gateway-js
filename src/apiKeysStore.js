import fs from "fs";
import path from "path";

const FILE_PATH = path.join(process.cwd(), "api_keys.json");

let loaded = false;
let apiKeys = [];

function loadFromFile() {
  if (loaded) return;
  loaded = true;

  if (!fs.existsSync(FILE_PATH)) {
    apiKeys = [];
    return;
  }

  try {
    const raw = fs.readFileSync(FILE_PATH, "utf8");
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed.keys)) {
      apiKeys = parsed.keys;
    } else {
      apiKeys = [];
    }
  } catch (e) {
    console.warn("Failed to load api_keys.json:", e.message);
    apiKeys = [];
  }
}

function persist() {
  try {
    fs.writeFileSync(
      FILE_PATH,
      JSON.stringify({ keys: apiKeys }, null, 2),
      "utf8"
    );
  } catch (e) {
    console.warn("Failed to write api_keys.json:", e.message);
  }
}

export function getApiKeys() {
  loadFromFile();
  return apiKeys;
}

export function findApiKey(keyValue) {
  loadFromFile();
  if (!keyValue) return null;
  return apiKeys.find((k) => k.enabled && k.key === keyValue) || null;
}

export function addApiKey({ label }) {
  loadFromFile();
  const id = `key_${Date.now().toString(36)}_${Math.random()
    .toString(36)
    .slice(2, 8)}`;
  const raw = Buffer.from(
    `${Date.now()}_${Math.random().toString(36).slice(2)}`,
    "utf8"
  ).toString("base64url");
  const key = `tenet-${raw}`;

  const rec = {
    id,
    key,
    label: label || "",
    enabled: true,
    createdAt: new Date().toISOString(),
  };

  apiKeys.push(rec);
  persist();
  return rec;
}

export function deleteApiKey(id) {
  loadFromFile();
  apiKeys = apiKeys.filter((k) => k.id !== id);
  persist();
}

export function setApiKeyEnabled(id, enabled) {
  loadFromFile();
  apiKeys = apiKeys.map((k) =>
    k.id === id ? { ...k, enabled: Boolean(enabled) } : k
  );
  persist();
}
