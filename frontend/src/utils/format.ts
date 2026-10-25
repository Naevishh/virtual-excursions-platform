export function formatDistance(meters?: number | null): string {
  if (meters === null || meters === undefined) return "";
  if (meters < 1000) {
    return `${Math.round(meters)} м`;
  }
  const km = meters / 1000;
  return `${km.toFixed(km < 10 ? 1 : 0)} км`;
}

export function formatDuration(seconds?: number | null): string {
  if (seconds === null || seconds === undefined) return "";
  const totalMinutes = Math.round(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;

  if (hours === 0) {
    return `${minutes} мин`;
  }
  if (minutes === 0) {
    return `${hours} ч`;
  }
  return `${hours} ч ${minutes} мин`;
}

export function categoryEmoji(slug?: string): string {
  switch (slug) {
    case "castles":
      return "🏰";
    case "religious":
      return "⛪";
    case "memorials":
      return "🕯️";
    case "museums":
      return "🏛️";
    default:
      return "📍";
  }
}

export function categoryColor(slug?: string, fallback = "#2563eb"): string {
  switch (slug) {
    case "castles":
      return "#8b5cf6";
    case "religious":
      return "#f59e0b";
    case "memorials":
      return "#ef4444";
    case "museums":
      return "#10b981";
    default:
      return fallback;
  }
}
