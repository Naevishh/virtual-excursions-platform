/**
 * Анонимный ID посетителя. Регистрации нет, поэтому история пройденных
 * экскурсий привязывается к браузеру: ID создаётся один раз и хранится
 * в localStorage. Передаётся на backend заголовком X-Visitor-Id.
 */
const STORAGE_KEY = "ve_visitor_id";
let memoryId: string | null = null;

function generateId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `v-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export function getVisitorId(): string {
  try {
    let id = localStorage.getItem(STORAGE_KEY);
    if (!id) {
      id = generateId();
      localStorage.setItem(STORAGE_KEY, id);
    }
    return id;
  } catch {
    // localStorage недоступен (приватный режим и т.п.) — живём в памяти
    memoryId = memoryId || generateId();
    return memoryId;
  }
}
