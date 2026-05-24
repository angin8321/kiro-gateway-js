import axios from "axios";
import crypto from "crypto";
import { REFRESH_TOKEN, REGION, PROFILE_ARN, KIRO_API_URL } from "./config.js";

// Optional HTTP(S) proxy for VPN / corporate networks.
function buildAxiosConfigWithProxy() {
  const proxyUrl = process.env.VPN_PROXY_URL;
  if (!proxyUrl) return {};

  try {
    const normalized = proxyUrl.includes("://") ? proxyUrl : `http://${proxyUrl}`;
    const url = new URL(normalized);

    if (!url.protocol.startsWith("http")) {
      console.warn(
        `VPN_PROXY_URL protocol not supported in this gateway: ${url.protocol}`
      );
      return {};
    }

    const config = {
      proxy: {
        host: url.hostname,
        port: Number(url.port) || (url.protocol === "https:" ? 443 : 80),
      },
    };

    if (url.username || url.password) {
      config.proxy.auth = {
        username: decodeURIComponent(url.username || ""),
        password: decodeURIComponent(url.password || ""),
      };
    }

    return config;
  } catch (e) {
    console.warn("Failed to parse VPN_PROXY_URL:", e.message);
    return {};
  }
}

// Shared HTTP client used for all calls to Kiro API
export const httpClient = axios.create(buildAxiosConfigWithProxy());

// Refresh token -> access token
export async function getAccessToken() {
  if (!REFRESH_TOKEN) {
    throw new Error("REFRESH_TOKEN is not configured in environment");
  }

  try {
    const response = await httpClient.post(
      `https://prod.${REGION}.auth.desktop.kiro.dev/refreshToken`,
      { refreshToken: REFRESH_TOKEN }
    );
    if (!response.data?.accessToken) {
      throw new Error("No accessToken in refreshToken response");
    }
    return response.data.accessToken;
  } catch (error) {
    console.error("Token refresh failed:", error.message);
    throw error;
  }
}

// Build headers for Kiro generateAssistantResponse calls
export function buildKiroHeaders(accessToken) {
  const fingerprint = crypto.randomBytes(16).toString("hex");

  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/x-amz-json-1.0",
    "x-amz-target":
      "AmazonCodeWhispererStreamingService.GenerateAssistantResponse",
    "User-Agent":
      `aws-sdk-js/1.0.27 ua/2.1 os/win32#10.0.19044 lang/js md/nodejs#22.21.1 api/codewhispererstreaming#1.0.27 m/E KiroIDE-0.7.45-${fingerprint}`,
    "x-amz-user-agent": `aws-sdk-js/1.0.27 KiroIDE-0.7.45-${fingerprint}`,
    "x-amzn-codewhisperer-optout": "true",
    "x-amzn-kiro-agent-mode": "vibe",
    "amz-sdk-invocation-id": crypto.randomUUID(),
    "amz-sdk-request": "attempt=1; max=3",
  };
}

// High-level helper to call generateAssistantResponse (non-streaming)
export async function callGenerateAssistantResponse({ model, userContent, stream }) {
  const accessToken = await getAccessToken();
  const headers = buildKiroHeaders(accessToken);

  const conversationId = crypto.randomUUID();
  const agentContinuationId = crypto.randomUUID();

  const payload = {
    conversationState: {
      agentContinuationId,
      agentTaskType: "vibe",
      chatTriggerType: "MANUAL",
      conversationId,
      currentMessage: {
        userInputMessage: {
          content: userContent,
          modelId: model,
          origin: "AI_EDITOR",
          userInputMessageContext: {
            tools: [],
          },
        },
      },
      history: [],
    },
    ...(PROFILE_ARN ? { profileArn: PROFILE_ARN } : {}),
  };

  if (stream) {
    return httpClient.post(`${KIRO_API_URL}/generateAssistantResponse`, payload, {
      headers,
      responseType: "stream",
    });
  }

  return httpClient.post(`${KIRO_API_URL}/generateAssistantResponse`, payload, {
    headers,
    responseType: "stream",
    validateStatus: () => true,
  });
}
