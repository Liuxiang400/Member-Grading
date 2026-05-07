const DEFAULT_FIELDS = [
  { key: "name", label: "姓名", type: "text", system: true, required: true },
  { key: "stage", label: "学段", type: "text", system: true, required: false },
  { key: "groupName", label: "小组名", type: "text", system: true, required: false },
  { key: "initialScore", label: "初始分数", type: "number", system: true, required: false },
  { key: "note", label: "备注", type: "text", system: true, required: false },
];

export const DEFAULT_PERSON_FIELDS = DEFAULT_FIELDS;
export const SYSTEM_PERSON_FIELD_KEYS = DEFAULT_FIELDS.map((field) => field.key);

export function isSystemPersonField(key) {
  return SYSTEM_PERSON_FIELD_KEYS.includes(key);
}

export function getDefaultPersonLabel(key) {
  return DEFAULT_FIELDS.find((field) => field.key === key)?.label || key;
}

export function createCustomFieldKey(label, existingKeys = []) {
  const normalized = String(label || "")
    .trim()
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fa5]+/g, "_")
    .replace(/^_+|_+$/g, "");

  const base = normalized ? `custom_${normalized}` : "custom_field";
  let candidate = base;
  let index = 1;

  while (existingKeys.includes(candidate) || isSystemPersonField(candidate)) {
    candidate = `${base}_${index}`;
    index += 1;
  }

  return candidate;
}

export function normalizePersonFields(fields) {
  const source = Array.isArray(fields) ? fields : [];

  const normalizedSystemFields = DEFAULT_FIELDS.map((field) => {
    const match = source.find((item) => item?.key === field.key);
    const label = String(match?.label || field.label).trim() || field.label;
    return {
      ...field,
      label,
    };
  });

  const usedKeys = normalizedSystemFields.map((field) => field.key);
  const customFields = source
    .filter((field) => field && !isSystemPersonField(field.key))
    .map((field, index) => {
      const key = String(field.key || "").trim() || createCustomFieldKey(field.label, usedKeys);
      const normalizedKey = usedKeys.includes(key) ? createCustomFieldKey(field.label || `字段${index + 1}`, usedKeys) : key;
      usedKeys.push(normalizedKey);

      return {
        key: normalizedKey,
        label: String(field.label || `字段${index + 1}`).trim() || `字段${index + 1}`,
        type: field.type === "number" ? "number" : "text",
        system: false,
        required: false,
      };
    });

  return [...normalizedSystemFields, ...customFields];
}

export function createEmptyCustomFields(fields) {
  return normalizePersonFields(fields)
    .filter((field) => !field.system)
    .reduce((result, field) => {
      result[field.key] = "";
      return result;
    }, {});
}

export function syncCustomFields(customFields, fields) {
  const next = createEmptyCustomFields(fields);
  const current = customFields || {};

  Object.keys(next).forEach((key) => {
    next[key] = current[key] ?? "";
  });

  return next;
}

export function createPersonDraft(person, fields) {
  return {
    id: person?.id || "",
    name: person?.name || "",
    stage: person?.stage || "",
    groupName: person?.groupName || "",
    initialScore: person?.initialScore ?? 0,
    note: person?.note || "",
    customFields: syncCustomFields(person?.customFields, fields),
  };
}

export function syncPersonDraftWithFields(draft, fields) {
  return {
    ...draft,
    customFields: syncCustomFields(draft?.customFields, fields),
  };
}

export function normalizePerson(person, fields) {
  return {
    ...person,
    name: String(person?.name || ""),
    stage: String(person?.stage || ""),
    groupName: String(person?.groupName || ""),
    initialScore: Number.isFinite(Number(person?.initialScore)) ? Number(person.initialScore) : 0,
    note: String(person?.note || ""),
    customFields: syncCustomFields(person?.customFields, fields),
  };
}

export function getPersonFieldValue(person, fieldKey) {
  if (isSystemPersonField(fieldKey)) {
    return person?.[fieldKey] ?? "";
  }

  return person?.customFields?.[fieldKey] ?? "";
}

export function getPersonFieldLabel(fields, fieldKey) {
  return normalizePersonFields(fields).find((field) => field.key === fieldKey)?.label || getDefaultPersonLabel(fieldKey);
}
