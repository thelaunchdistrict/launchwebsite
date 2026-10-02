/** Sort key for sector labels such as "63A": 63.1 sorts after 63 and before 64. */
export const sectorKey = (s: string | null) => {
  if (!s) return 9999;
  const m = s.match(/^(\d+)([A-D]?)$/);
  return m ? Number(m[1]) + (m[2] ? (m[2].charCodeAt(0) - 64) / 10 : 0) : 9999;
};
