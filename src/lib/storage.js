import { DEFAULT_PERSON_FIELDS, normalizePerson, normalizePersonFields } from "./personFields";

const STORAGE_KEY = "scoreflow-store-v2";

export function createId(prefix = "id") {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return `${prefix}-${crypto.randomUUID()}`;
  }

  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function emptyStore() {
  return normalizeStore({
    people: [],
    tasks: [],
    scoreRecords: [],
    personFields: DEFAULT_PERSON_FIELDS,
    savedAt: new Date().toISOString(),
  });
}

export function normalizeStore(input = {}) {
  const personFields = normalizePersonFields(input.personFields);

  return {
    people: Array.isArray(input.people)
      ? input.people.map((person) => normalizePerson(person, personFields))
      : [],
    tasks: Array.isArray(input.tasks) ? input.tasks : [],
    scoreRecords: Array.isArray(input.scoreRecords) ? input.scoreRecords : [],
    personFields,
    savedAt: input.savedAt || new Date().toISOString(),
  };
}

export function loadStore() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return emptyStore();
    }

    return normalizeStore(JSON.parse(raw));
  } catch (error) {
    console.error("Failed to load ScoreFlow data", error);
    return emptyStore();
  }
}

export function saveStore(store) {
  const nextStore = normalizeStore({
    ...store,
    savedAt: new Date().toISOString(),
  });

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextStore));
  return nextStore;
}
