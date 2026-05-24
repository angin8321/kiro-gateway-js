import fs from "fs";
import path from "path";
import { REFRESH_TOKEN, PROFILE_ARN } from "./config.js";

const ACCOUNTS_FILE = path.join(process.cwd(), "accounts.json");

let loaded = false;
let accounts = [];

function loadFromFile() {
  if (loaded) return;
  loaded = true;

  if (fs.existsSync(ACCOUNTS_FILE)) {
    try {
      const raw = fs.readFileSync(ACCOUNTS_FILE, "utf8");
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed.accounts)) {
        accounts = parsed.accounts;
        return;
      }
    } catch (e) {
      console.warn("Failed to load accounts.json:", e.message);
    }
  }

  // Fallback: single account from ENV if configured
  if (REFRESH_TOKEN) {
    accounts = [
      {
        id: "default",
        refreshToken: REFRESH_TOKEN,
        profileArn: PROFILE_ARN || "",
        enabled: true,
      },
    ];
  } else {
    accounts = [];
  }
}

function persist() {
  try {
    fs.writeFileSync(
      ACCOUNTS_FILE,
      JSON.stringify({ accounts }, null, 2),
      "utf8"
    );
  } catch (e) {
    console.warn("Failed to write accounts.json:", e.message);
  }
}

export function getAccounts() {
  loadFromFile();
  return accounts;
}

export function getActiveAccount() {
  loadFromFile();
  if (!accounts.length) return null;
  const enabled = accounts.find((a) => a.enabled);
  return enabled || accounts[0];
}

export function addOrUpdateAccount({ id, refreshToken, profileArn, enabled }) {
  if (!id || !refreshToken) {
    throw new Error("id and refreshToken are required");
  }
  loadFromFile();

  const existingIndex = accounts.findIndex((a) => a.id === id);
  const account = {
    id,
    refreshToken,
    profileArn: profileArn || "",
    enabled: typeof enabled === "boolean" ? enabled : true,
  };

  if (existingIndex >= 0) {
    accounts[existingIndex] = account;
  } else {
    accounts.push(account);
  }

  // Ensure at least one account is enabled
  if (!accounts.some((a) => a.enabled)) {
    accounts[0].enabled = true;
  }

  persist();
  return account;
}

export function deleteAccount(id) {
  loadFromFile();
  accounts = accounts.filter((a) => a.id !== id);
  // Ensure at least one enabled if any account exists
  if (accounts.length && !accounts.some((a) => a.enabled)) {
    accounts[0].enabled = true;
  }
  persist();
}

export function setActiveAccount(id) {
  loadFromFile();
  let found = false;
  accounts = accounts.map((a) => {
    if (a.id === id) {
      found = true;
      return { ...a, enabled: true };
    }
    return { ...a, enabled: false };
  });
  if (!found) {
    throw new Error(`Account not found: ${id}`);
  }
  persist();
}
