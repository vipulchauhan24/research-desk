export interface ChartBar {
  label: string;
  // Original cell text, so units like "₹ 1,420 Cr" or "18.2%" are shown exactly as pasted.
  display: string;
  // 0–100, relative to the largest value.
  widthPercent: number;
}

export interface ChartData {
  title: string;
  bars: ChartBar[];
}

// "₹ 1,420 Cr" -> 1420, "18.2%" -> 18.2, "22.4×" -> 22.4. Anything else (including empty) -> null.
export function parseCellNumber(text: string): number | null {
  const cleaned = text
    .replace(/[−–]/g, "-")
    .replace(/[₹,%×\s]/g, "")
    .replace(/(cr|l|x)$/i, "");
  return /^-?\d+(\.\d+)?$/.test(cleaned) ? Number(cleaned) : null;
}

// Turns a pasted table (first row = header) into bars: the first column labels each bar and the first
// column whose body cells are all numbers gives the values. Returns null when the table can't be charted.
export function chartFromRows(rows: string[][]): ChartData | null {
  const [header, ...body] = rows;
  if (!header || body.length === 0) return null;

  for (let column = 1; column < header.length; column++) {
    const values = body.map((row) => parseCellNumber(row[column] ?? ""));
    if (values.some((value) => value === null)) continue;

    const numbers = values as number[];
    const max = Math.max(...numbers);
    // Bars are lengths from zero, so negative values or an all-zero column have no honest bar.
    if (numbers.some((value) => value < 0) || max <= 0) return null;

    return {
      title: header[column] || "Value",
      bars: body.map((row, index) => ({
        label: row[0] ?? "",
        display: (row[column] ?? "").trim(),
        widthPercent: (numbers[index] / max) * 100,
      })),
    };
  }
  return null;
}
