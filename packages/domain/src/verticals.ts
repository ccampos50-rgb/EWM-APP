export const VERTICALS = ["hospitality", "healthcare", "mobility", "light_industrial"] as const;
export type Vertical = (typeof VERTICALS)[number];

export const VERTICAL_LABELS: Record<Vertical, string> = {
  hospitality: "Hospitality",
  healthcare: "Healthcare",
  mobility: "Mobility",
  light_industrial: "Light Industrial",
};
