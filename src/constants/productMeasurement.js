export const STEEL_MEASUREMENT_UNITS = {
  weight: ["mg", "g", "kg", "ton", "mt"],
  length: ["mm", "cm", "m", "ft", "inch", "yard", "rmt"],
  area: ["sq_mm", "sq_cm", "sq_m", "sq_ft", "sq_yard"],
  count: ["nos", "pcs", "bundle", "sheet", "coil", "panel", "set"],
};

export const STEEL_ALL_UNITS = [
  ...STEEL_MEASUREMENT_UNITS.weight,
  ...STEEL_MEASUREMENT_UNITS.length,
  ...STEEL_MEASUREMENT_UNITS.area,
  ...STEEL_MEASUREMENT_UNITS.count,
];

export const STEEL_PACKAGE_UNITS = [
  "g",
  "kg",
  "ton",
  "mt",
  "pcs",
  "bundle",
  "coil",
  "sheet",
];

export function getInventoryUnit(measurementType) {
  switch (measurementType) {
    case "weight":
      return "kg";
    case "length":
      return "m";
    case "area":
      return "sq_m";
    case "count":
      return "nos";
    default:
      return "";
  }
}
