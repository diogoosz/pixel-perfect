export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Table<Row, Insert, Update> = { Row: Row; Insert: Insert; Update: Update; Relationships: [] }
type PersonRow = { id: string; user_id: string; name: string; notes: string | null; created_at: string }
type LoanRow = { id: string; user_id: string; person_id: string; loan_date: string; principal_amount: number; interest_rate: number; rate_period: string; status: string; notes: string | null; created_at: string }
type PaymentRow = { id: string; user_id: string; loan_id: string; amount: number; payment_date: string; notes: string | null; created_at: string }

export type Database = {
  __InternalSupabase: { PostgrestVersion: "14.18" }
  public: {
    Tables: {
      people: Table<PersonRow, { id?: string; user_id?: string; name: string; notes?: string | null; created_at?: string }, Partial<Omit<PersonRow, "id">>>
      loans: Table<LoanRow, { id?: string; user_id?: string; person_id: string; loan_date: string; principal_amount: number; interest_rate: number; rate_period?: string; status?: string; notes?: string | null; created_at?: string }, Partial<Omit<LoanRow, "id">>>
      payments: Table<PaymentRow, { id?: string; user_id?: string; loan_id: string; amount: number; payment_date: string; notes?: string | null; created_at?: string }, Partial<Omit<PaymentRow, "id">>>
    }
    Views: { [_ in never]: never }
    Functions: { [_ in never]: never }
    Enums: { [_ in never]: never }
    CompositeTypes: { [_ in never]: never }
  }
}

export const Constants = { public: { Enums: {} } } as const
