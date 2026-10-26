ALTER TABLE public.pipedrive_deals
  ADD COLUMN IF NOT EXISTS activities_synced_at timestamptz,
  ADD COLUMN IF NOT EXISTS meeting_activity_id bigint,
  ADD COLUMN IF NOT EXISTS meeting_booking_id uuid,
  ADD COLUMN IF NOT EXISTS summary_note_id bigint;
