import dotenv from "dotenv";

dotenv.config();

// Basic environment config
export const PROXY_API_KEY = process.env.PROXY_API_KEY;
export const REFRESH_TOKEN = process.env.REFRESH_TOKEN;
export const PROFILE_ARN = process.env.PROFILE_ARN;

// Region & API host (match Python gateway behavior)
export const REGION =
  process.env.KIRO_API_REGION || process.env.KIRO_REGION || "us-east-1";
export const KIRO_API_URL = `https://runtime.${REGION}.kiro.dev`;

// Static fallback model list (mirrors FALLBACK_MODELS in Python gateway)
export const FALLBACK_MODELS = [
  "auto",
  "claude-sonnet-4",
  "claude-sonnet-4.5",
  "claude-sonnet-4.6",
  "claude-haiku-4.5",
  "claude-opus-4.5",
  "claude-opus-4.6",
  "claude-opus-4.7",
  "deepseek-3.2",
  "glm-5",
  "minimax-m2.1",
  "minimax-m2.5",
  "qwen3-coder-next",
];

// Optional: plan credits limit (for usage reporting)
// Example: 2000 means "2000 credits covered in plan"
export const PLAN_CREDITS_LIMIT = Number(process.env.PLAN_CREDITS_LIMIT || 0);
