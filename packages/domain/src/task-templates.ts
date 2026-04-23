import type { Vertical } from "./verticals";

export type TaskTemplate = {
  code: string;
  vertical: Vertical;
  label: string;
  expectedMinutes: number;
  requiresScan: boolean;
  requiresPhoto: boolean;
  billable: boolean;
  billingUnit: string | null;
};

export const TASK_TEMPLATES: TaskTemplate[] = [
  // Hospitality
  { code: "room_clean_checkout", vertical: "hospitality", label: "Room Clean (Checkout)", expectedMinutes: 30, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "room" },
  { code: "room_clean_stayover", vertical: "hospitality", label: "Room Clean (Stayover)", expectedMinutes: 18, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "room" },
  { code: "room_refresh", vertical: "hospitality", label: "Room Refresh", expectedMinutes: 10, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "room" },
  { code: "banquet_setup", vertical: "hospitality", label: "Banquet Setup", expectedMinutes: 60, requiresScan: false, requiresPhoto: true, billable: true, billingUnit: "event" },
  { code: "linen_run", vertical: "hospitality", label: "Linen Run", expectedMinutes: 15, requiresScan: true, requiresPhoto: false, billable: false, billingUnit: null },

  // Healthcare
  { code: "room_turnover", vertical: "healthcare", label: "Room Turnover (EVS)", expectedMinutes: 25, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "bed" },
  { code: "patient_transport", vertical: "healthcare", label: "Patient Transport", expectedMinutes: 12, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "transport" },
  { code: "wheelchair_dispatch", vertical: "healthcare", label: "Wheelchair Dispatch", expectedMinutes: 8, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "dispatch" },
  { code: "discharge_cleaning", vertical: "healthcare", label: "Discharge Cleaning", expectedMinutes: 35, requiresScan: true, requiresPhoto: true, billable: true, billingUnit: "bed" },

  // Mobility
  { code: "car_wash_detail", vertical: "mobility", label: "Car Wash / Detail", expectedMinutes: 20, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "vehicle" },
  { code: "lot_stage", vertical: "mobility", label: "Lot Stage", expectedMinutes: 5, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "vehicle" },
  { code: "fuel_topup", vertical: "mobility", label: "Fuel Top-up", expectedMinutes: 8, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "vehicle" },
  { code: "pm_service", vertical: "mobility", label: "PM Service", expectedMinutes: 25, requiresScan: true, requiresPhoto: true, billable: true, billingUnit: "vehicle" },
  { code: "ready_line_audit", vertical: "mobility", label: "Ready-Line Audit", expectedMinutes: 3, requiresScan: true, requiresPhoto: false, billable: false, billingUnit: null },

  // Light Industrial
  { code: "pick", vertical: "light_industrial", label: "Pick", expectedMinutes: 2, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "unit" },
  { code: "pack", vertical: "light_industrial", label: "Pack", expectedMinutes: 3, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "unit" },
  { code: "load", vertical: "light_industrial", label: "Load", expectedMinutes: 10, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "pallet" },
  { code: "case_count", vertical: "light_industrial", label: "Case Count", expectedMinutes: 15, requiresScan: true, requiresPhoto: false, billable: false, billingUnit: null },
  { code: "putaway", vertical: "light_industrial", label: "Putaway", expectedMinutes: 4, requiresScan: true, requiresPhoto: false, billable: true, billingUnit: "unit" },
];

export function templatesForVertical(v: Vertical): TaskTemplate[] {
  return TASK_TEMPLATES.filter((t) => t.vertical === v);
}

export function templateByCode(code: string): TaskTemplate | undefined {
  return TASK_TEMPLATES.find((t) => t.code === code);
}
