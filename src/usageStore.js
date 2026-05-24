// Simple in-memory usage tracker based on Kiro meteringEvent data.

let totalCreditsUsed = 0;
const startedAt = new Date().toISOString();

// breakdown per account & per model
const perAccount = {}; // { [accountId]: number }
const perModel = {};   // { [modelId]: number }

export function recordUsage(usage, { accountId, modelId } = {}) {
  if (typeof usage === "number" && !Number.isNaN(usage) && usage >= 0) {
    totalCreditsUsed += usage;
    if (accountId) {
      perAccount[accountId] = (perAccount[accountId] || 0) + usage;
    }
    if (modelId) {
      perModel[modelId] = (perModel[modelId] || 0) + usage;
    }
  }
}

export function getUsageSummary() {
  return {
    totalCreditsUsed,
    startedAt,
    perAccount,
    perModel,
  };
}
