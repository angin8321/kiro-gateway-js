// Simple in-memory usage tracker based on Kiro meteringEvent data.

let totalCreditsUsed = 0;
const startedAt = new Date().toISOString();

export function recordUsage(usage) {
  if (typeof usage === "number" && !Number.isNaN(usage) && usage >= 0) {
    totalCreditsUsed += usage;
  }
}

export function getUsageSummary() {
  return {
    totalCreditsUsed,
    startedAt,
  };
}
