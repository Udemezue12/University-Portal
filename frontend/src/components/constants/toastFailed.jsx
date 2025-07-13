export function extractErrorMessage(err, fallback = "An error occurred") {
  const detail = err?.response?.data?.detail;
  if (Array.isArray(detail)) {
    return detail.map((d) => d.msg).join(" | ");
  } else if (typeof detail === "string") {
    return detail;
  }
  return fallback;
}
