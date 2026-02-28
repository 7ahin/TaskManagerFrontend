export const toYmd = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const normalizeDueDate = (val) => {
  if (!val) return null;
  if (typeof val === "string") {
    const tIndex = val.indexOf("T");
    if (tIndex !== -1) return val.slice(0, tIndex);
    if (/^\d{4}-\d{2}-\d{2}$/.test(val)) return val;
  }
  const d = new Date(val);
  if (Number.isNaN(d.getTime())) return null;
  return toYmd(d);
};

export const formatDisplayDate = (d, options) => {
  return d.toLocaleDateString(undefined, options || {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};
