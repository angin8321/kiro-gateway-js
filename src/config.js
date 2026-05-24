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

// Metadata per model (nama tampilan, kredit, deskripsi)
export const MODEL_METADATA = {
  "auto": {
    displayName: "Auto",
    creditMultiplier: 1.0,
    description:
      "Models chosen by task for optimal usage and consistent quality",
  },
  "claude-opus-4.7": {
    displayName: "Claude Opus 4.7",
    creditMultiplier: 2.2,
    description:
      "Experimental preview of Claude Opus 4.7 model with 1M context window",
  },
  "claude-opus-4.6": {
    displayName: "Claude Opus 4.6",
    creditMultiplier: 2.2,
    description: "The Claude Opus 4.6 model",
  },
  "claude-sonnet-4.6": {
    displayName: "Claude Sonnet 4.6",
    creditMultiplier: 1.3,
    description:
      "The latest Claude Sonnet model with 1M context window",
  },
  "claude-opus-4.5": {
    displayName: "Claude Opus 4.5",
    creditMultiplier: 2.2,
    description: "The Claude Opus 4.5 model",
  },
  "claude-sonnet-4.5": {
    displayName: "Claude Sonnet 4.5",
    creditMultiplier: 1.3,
    description: "The Claude Sonnet 4.5 model",
  },
  "claude-sonnet-4": {
    displayName: "Claude Sonnet 4",
    creditMultiplier: 1.3,
    description: "Hybrid reasoning and coding for regular use",
  },
  "claude-haiku-4.5": {
    displayName: "Claude Haiku 4.5",
    creditMultiplier: 0.4,
    description: "The latest Claude Haiku model",
  },
  "deepseek-3.2": {
    displayName: "Deepseek v3.2",
    creditMultiplier: 0.25,
    description: "Experimental preview of DeepSeek V3.2",
  },
  "minimax-m2.5": {
    displayName: "MiniMax M2.5",
    creditMultiplier: 0.25,
    description: "The MiniMax M2.5 model",
  },
  "minimax-m2.1": {
    displayName: "MiniMax M2.1",
    creditMultiplier: 0.15,
    description: "Experimental preview of MiniMax M2.1",
  },
  "glm-5": {
    displayName: "GLM 5",
    creditMultiplier: 0.5,
    description: "The GLM-5 model",
  },
  "qwen3-coder-next": {
    displayName: "Qwen3 Coder Next",
    creditMultiplier: 0.05,
    description: "Experimental preview of Qwen3 Coder Next",
  },
};

// Alias nama model "seperti di web" → id internal
export const MODEL_ALIASES = {
  "Auto": "auto",
  "Claude Opus 4.7": "claude-opus-4.7",
  "Claude Opus 4.6": "claude-opus-4.6",
  "Claude Sonnet 4.6": "claude-sonnet-4.6",
  "Claude Opus 4.5": "claude-opus-4.5",
  "Claude Sonnet 4.5": "claude-sonnet-4.5",
  "Claude Sonnet 4": "claude-sonnet-4",
  "Claude Haiku 4.5": "claude-haiku-4.5",
  "Deepseek v3.2": "deepseek-3.2",
  "DeepSeek v3.2": "deepseek-3.2",
  "MiniMax M2.5": "minimax-m2.5",
  "MiniMax M2.1": "minimax-m2.1",
  "GLM 5": "glm-5",
  "Qwen3 Coder Next": "qwen3-coder-next",
};
