import crypto from "crypto";
import {
  PROXY_API_KEY,
  FALLBACK_MODELS,
  PLAN_CREDITS_LIMIT,
  MODEL_METADATA,
  MODEL_ALIASES,
} from "../config.js";
import { callGenerateAssistantResponse, httpClient } from "../kiroClient.js";
import { recordUsage, getUsageSummary } from "../usageStore.js";
import { getActiveAccount } from "../accountsStore.js";

function normalizeModelName(input) {
  if (!input) return input;

  // alias eksplisit dulu
  if (MODEL_ALIASES[input]) return MODEL_ALIASES[input];

  const trimmed = input.trim();
  const lower = trimmed.toLowerCase();

  if (MODEL_ALIASES[trimmed]) return MODEL_ALIASES[trimmed];
  if (MODEL_ALIASES[lower]) return MODEL_ALIASES[lower];

  if (lower === "auto") return "auto";

  // pola "claude opus 4.7" -> "claude-opus-4.7"
  const m = lower.match(/^claude\s+(opus|sonnet|haiku)\s+([0-9.]+)/);
  if (m) {
    return `claude-${m[1]}-${m[2]}`;
  }

  // generic: spasi jadi dash
  return lower.replace(/\s+/g, "-");
}

export function registerOpenAIRoutes(app) {
  // OpenAI-compatible: /v1/chat/completions
  app.post("/v1/chat/completions", async (req, res) => {
    try {
      const { model, messages, stream } = req.body || {};

      if (!model || !Array.isArray(messages) || messages.length === 0) {
        return res
          .status(400)
          .json({ error: "model and messages are required" });
      }

      const lastUserMessage = [...messages]
        .reverse()
        .find((m) => m.role === "user");

      if (!lastUserMessage || !lastUserMessage.content) {
        return res.status(400).json({
          error: "At least one user message with content is required",
        });
      }

      const rawModel = model;
      const normalizedModel = normalizeModelName(rawModel);
      const account = getActiveAccount();
      const isStream = Boolean(stream);

      if (isStream) {
        const response = await callGenerateAssistantResponse({
          model: normalizedModel,
          userContent: lastUserMessage.content,
          stream: true,
        });

        res.setHeader("Content-Type", "text/event-stream");

        // Intersep stream: hitung meteringEvent usage sambil meneruskan SSE ke klien
        let meterBuffer = "";
        response.data.on("data", (chunk) => {
          const str = chunk.toString("utf8");
          meterBuffer += str;

          const meterRegex = /\{"unit":"credit","unitPlural":"credits","usage":([0-9eE+\.-]+)\}/g;
          let m;
          let lastEnd = 0;
          while ((m = meterRegex.exec(meterBuffer)) !== null) {
            lastEnd = meterRegex.lastIndex;
            try {
              const obj = JSON.parse(m[0]);
              if (typeof obj.usage === "number") {
                recordUsage(obj.usage, {
                  accountId: account?.id || "default",
                  modelId: normalizedModel,
                });
              }
            } catch (_) {}
          }
          if (lastEnd > 0) {
            meterBuffer = meterBuffer.slice(lastEnd);
          }

          // teruskan chunk ke klien
          res.write(chunk);
        });

        response.data.on("end", () => {
          res.end();
        });

        return;
      }

      const response = await callGenerateAssistantResponse({
        model: normalizedModel,
        userContent: lastUserMessage.content,
        stream: false,
      });

      if (response.status !== 200) {
        let errBuf = "";
        response.data.on("data", (chunk) => {
          errBuf += chunk.toString("utf8");
        });
        response.data.on("end", () => {
          res.status(response.status).json({
            error: "Kiro generateAssistantResponse error",
            status: response.status,
            details: errBuf,
          });
        });
        return;
      }

      let buffer = "";
      response.data.on("data", (chunk) => {
        buffer += chunk.toString("utf8");
      });

      response.data.on("end", () => {
        // Extract meteringEvent usage and accumulate credits
        const meterRegex = /\{"unit":"credit","unitPlural":"credits","usage":([0-9eE+\.-]+)\}/g;
        let m;
        while ((m = meterRegex.exec(buffer)) !== null) {
          try {
            const obj = JSON.parse(m[0]);
            if (typeof obj.usage === "number") {
              recordUsage(obj.usage, {
                accountId: account?.id || "default",
                modelId: normalizedModel,
              });
            }
          } catch (_) {}
        }

        let text = "";
        const regex = /\{"content":"([\s\S]*?)","modelId":"[^"]*"\}/g;
        let match;
        while ((match = regex.exec(buffer)) !== null) {
          try {
            const obj = JSON.parse(match[0]);
            if (typeof obj.content === "string") {
              text += obj.content;
            }
          } catch (_) {}
        }

        if (!text) {
          text = buffer;
        }

        res.json({
          id: `chatcmpl-${crypto.randomUUID()}`,
          object: "chat.completion",
          model: normalizedModel,
          choices: [
            {
              index: 0,
              finish_reason: "stop",
              message: {
                role: "assistant",
                content: text,
              },
            },
          ],
        });
      });
    } catch (error) {
      const status = error?.response?.status || 500;
      res.status(status).json({ error: error?.message || "Request failed" });
    }
  });

  // Anthropic-compatible: /v1/messages (masih simple proxy ke Kiro /v1/messages)
  app.post("/v1/messages", async (req, res) => {
    try {
      const { getAccessToken } = await import("../kiroClient.js");
      const { KIRO_API_URL } = await import("../config.js");

      const accessToken = await getAccessToken();
      const body = req.body;
      const isStream = Boolean(body?.stream);

      if (isStream) {
        const response = await httpClient.post(`${KIRO_API_URL}/v1/messages`, body, {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
          responseType: "stream",
        });

        if (response.headers["content-type"]) {
          res.setHeader("Content-Type", response.headers["content-type"]);
        }
        if (response.headers["transfer-encoding"]) {
          res.setHeader(
            "Transfer-Encoding",
            response.headers["transfer-encoding"]
          );
        }

        response.data.pipe(res);
        return;
      }

      const response = await httpClient.post(`${KIRO_API_URL}/v1/messages`, body, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      res.json(response.data);
    } catch (error) {
      const status = error?.response?.status || 500;
      res.status(status).json({ error: error?.message || "Request failed" });
    }
  });

  // Models list (local fallback list, not proxied).
  app.get("/v1/models", async (req, res) => {
    try {
      if (!PROXY_API_KEY) {
        return res
          .status(500)
          .json({ error: "PROXY_API_KEY is not configured on the server" });
      }

      const models = FALLBACK_MODELS.map((id) => {
        const meta = MODEL_METADATA[id] || {};
        return {
          id,
          object: "model",
          owned_by: "kiro",
          display_name: meta.displayName || id,
          credit_multiplier: meta.creditMultiplier ?? null,
          description: meta.description || null,
        };
      });

      res.json({ object: "list", data: models });
    } catch (error) {
      const status = error?.response?.status || 500;
      res.status(status).json({ error: error?.message || "Request failed" });
    }
  });

  // Usage summary based on meteringEvent credits (since process start)
  app.get("/v1/usage", (req, res) => {
    const summary = getUsageSummary();
    const limit = PLAN_CREDITS_LIMIT && !Number.isNaN(PLAN_CREDITS_LIMIT)
      ? PLAN_CREDITS_LIMIT
      : null;

    const percent = limit && limit > 0
      ? (summary.totalCreditsUsed / limit) * 100
      : null;

    res.json({
      total_credits_used: summary.totalCreditsUsed,
      plan_credits_limit: limit,
      plan_usage_percent: percent,
      since: summary.startedAt,
    });
  });

  app.get("/v1/usage/accounts", (req, res) => {
    const summary = getUsageSummary();
    res.json({ per_account: summary.perAccount });
  });

  app.get("/v1/usage/models", (req, res) => {
    const summary = getUsageSummary();
    res.json({ per_model: summary.perModel });
  });
}
