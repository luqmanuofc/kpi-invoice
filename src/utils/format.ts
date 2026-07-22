export function formatIndian(value: number): string {
  if (value >= 1_00_00_000) return `${(value / 1_00_00_000).toFixed(1).replace(/\.0$/, "")} Cr`;
  if (value >= 1_00_000) return `${(value / 1_00_000).toFixed(1).replace(/\.0$/, "")} L`;
  if (value >= 1_000) return `${(value / 1_000).toFixed(1).replace(/\.0$/, "")} K`;
  return value.toLocaleString("en-IN");
}
