function sanitizeCell(value) {
  const text = value == null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, "\"\"")}"`;
  }
  return text;
}

function stripBom(value) {
  return String(value || "").replace(/^\uFEFF/, "");
}

export function parseCSV(text) {
  const rows = [];
  let cell = "";
  let row = [];
  let inQuotes = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === "\"") {
      if (inQuotes && next === "\"") {
        cell += "\"";
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === "," && !inQuotes) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !inQuotes) {
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      row.push(cell.trim());
      if (row.some((item) => item !== "")) {
        rows.push(row);
      }
      row = [];
      cell = "";
      continue;
    }

    cell += char;
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    if (row.some((item) => item !== "")) {
      rows.push(row);
    }
  }

  return rows;
}

export function rowsToObjects(rows) {
  if (!rows.length) {
    return [];
  }

  const [rawHeaderRow, ...bodyRows] = rows;
  const headerRow = rawHeaderRow.map((header, index) =>
    index === 0 ? stripBom(header) : String(header || ""),
  );

  return bodyRows.map((cells) => {
    const record = {};
    headerRow.forEach((header, index) => {
      record[header] = cells[index] ?? "";
    });
    return record;
  });
}

export function toCSV(headers, rows) {
  const lines = [
    headers.map((header) => sanitizeCell(header.label)).join(","),
    ...rows.map((row) =>
      headers
        .map((header) => sanitizeCell(row[header.key]))
        .join(","),
    ),
  ];

  return lines.join("\n");
}

export function downloadTextFile(filename, content, mimeType) {
  const prefix = mimeType.includes("text/csv") ? "\uFEFF" : "";
  const blob = new Blob([prefix, content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function readFileAsText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsText(file, "utf-8");
  });
}
