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

export const PRODUCT_FAMILIES = [
  { value: "general", label: "General Item" },
  { value: "roofing_sheet", label: "Roofing Sheet" },
  { value: "coil", label: "Coil / Roll" },
  { value: "crash_barrier", label: "Crash Barrier" },
  { value: "raw_material", label: "Raw Material" },
  { value: "accessory", label: "Accessory / Fastener" },
];

export const DEFAULT_STEEL_DENSITY = 7850;

export const FIRST_TIME_PRODUCT_HELP = [
  "Choose the product family first. That decides which dimensions matter for stock and selling.",
  "Keep one stock-keeping unit only. For steel, kg is usually the cleanest inventory unit even if you sell by sheet, coil, or rmt.",
  "Add selling units separately in Unit Prices, then define how each unit converts back to stock through Conversion Rules.",
  "Use preferred stock views to tell the inventory screen what staff should see first, like sheet, coil, or rmt.",
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
