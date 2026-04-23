-- Seed data for local dev. Re-runnable.

-- EWM tenant
insert into tenants (id, name, slug) values
  ('00000000-0000-0000-0000-000000000001', 'Elevated Workforce Management', 'ewm')
  on conflict (slug) do nothing;

-- Demo customer (fictional hotel)
insert into customers (id, tenant_id, name, vertical) values
  ('00000000-0000-0000-0000-000000000100',
   '00000000-0000-0000-0000-000000000001',
   'Grand Demo Hotel',
   'hospitality')
  on conflict (id) do nothing;

-- Demo site
insert into sites (id, customer_id, name, address, latitude, longitude, timezone) values
  ('00000000-0000-0000-0000-000000000200',
   '00000000-0000-0000-0000-000000000100',
   'Grand Demo Hotel — Downtown Dallas',
   '1 Demo Plaza, Dallas, TX 75201',
   32.7767,
   -96.7970,
   'America/Chicago')
  on conflict (id) do nothing;

-- Task templates (mirrors packages/domain/task-templates.ts)
insert into task_templates (code, vertical, label, expected_minutes, requires_scan, requires_photo, billable, billing_unit) values
  -- Hospitality
  ('room_clean_checkout', 'hospitality', 'Room Clean (Checkout)', 30, true, false, true, 'room'),
  ('room_clean_stayover', 'hospitality', 'Room Clean (Stayover)', 18, true, false, true, 'room'),
  ('room_refresh', 'hospitality', 'Room Refresh', 10, true, false, true, 'room'),
  ('banquet_setup', 'hospitality', 'Banquet Setup', 60, false, true, true, 'event'),
  ('linen_run', 'hospitality', 'Linen Run', 15, true, false, false, null),
  -- Healthcare
  ('room_turnover', 'healthcare', 'Room Turnover (EVS)', 25, true, false, true, 'bed'),
  ('patient_transport', 'healthcare', 'Patient Transport', 12, true, false, true, 'transport'),
  ('wheelchair_dispatch', 'healthcare', 'Wheelchair Dispatch', 8, true, false, true, 'dispatch'),
  ('discharge_cleaning', 'healthcare', 'Discharge Cleaning', 35, true, true, true, 'bed'),
  -- Mobility
  ('car_wash_detail', 'mobility', 'Car Wash / Detail', 20, true, false, true, 'vehicle'),
  ('lot_stage', 'mobility', 'Lot Stage', 5, true, false, true, 'vehicle'),
  ('fuel_topup', 'mobility', 'Fuel Top-up', 8, true, false, true, 'vehicle'),
  ('pm_service', 'mobility', 'PM Service', 25, true, true, true, 'vehicle'),
  ('ready_line_audit', 'mobility', 'Ready-Line Audit', 3, true, false, false, null),
  -- Light Industrial
  ('pick', 'light_industrial', 'Pick', 2, true, false, true, 'unit'),
  ('pack', 'light_industrial', 'Pack', 3, true, false, true, 'unit'),
  ('load', 'light_industrial', 'Load', 10, true, false, true, 'pallet'),
  ('case_count', 'light_industrial', 'Case Count', 15, true, false, false, null),
  ('putaway', 'light_industrial', 'Putaway', 4, true, false, true, 'unit')
  on conflict (code) do nothing;

-- Demo scan codes (room QR codes at the fictional hotel)
insert into scan_codes (site_id, code, entity_kind, entity_ref) values
  ('00000000-0000-0000-0000-000000000200', 'ROOM-101', 'room', '101'),
  ('00000000-0000-0000-0000-000000000200', 'ROOM-102', 'room', '102'),
  ('00000000-0000-0000-0000-000000000200', 'ROOM-103', 'room', '103'),
  ('00000000-0000-0000-0000-000000000200', 'ROOM-201', 'room', '201'),
  ('00000000-0000-0000-0000-000000000200', 'ROOM-202', 'room', '202')
  on conflict (site_id, code) do nothing;
