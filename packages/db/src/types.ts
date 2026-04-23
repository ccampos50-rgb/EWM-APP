// Regenerate with: supabase gen types typescript --local > packages/db/src/types.ts
// This placeholder keeps the workspace buildable before Supabase is provisioned.
export type Database = {
  public: {
    Tables: Record<string, { Row: Record<string, unknown>; Insert: Record<string, unknown>; Update: Record<string, unknown> }>;
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
