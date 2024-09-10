export const smoothstep = (edge0, edge1, x) => {
  // Clamp the value of x between 0 and 1
  const t = Math.max(0, Math.min(1, (x - edge0) / (edge1 - edge0)));
  // Apply smoothstep function
  return t * t * (3 - 2 * t);
};
