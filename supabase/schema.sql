-- routines table
CREATE TABLE IF NOT EXISTS routines (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  direction text NOT NULL,
  departure_station text NOT NULL,
  arrival_station text NOT NULL,
  departure_time time NOT NULL,
  days_of_week int[] NOT NULL DEFAULT '{0,1,2,3,4}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- active_rides table
CREATE TABLE IF NOT EXISTS active_rides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  direction text NOT NULL,
  departure_station text NOT NULL,
  arrival_station text NOT NULL,
  status text NOT NULL DEFAULT 'riding',
  activated_at timestamptz NOT NULL DEFAULT now(),
  estimated_arrival timestamptz NOT NULL,
  expires_at timestamptz NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_active_rides_query
  ON active_rides (line, direction, status, expires_at);

-- seat_reports table
CREATE TABLE IF NOT EXISTS seat_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id text NOT NULL,
  line text NOT NULL DEFAULT '2호선',
  station text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable Realtime on active_rides
ALTER PUBLICATION supabase_realtime ADD TABLE active_rides;

ALTER TABLE seat_shares ADD COLUMN IF NOT EXISTS car_number int NOT NULL DEFAULT 5;

-- Seat matching fields
ALTER TABLE seat_shares ADD COLUMN IF NOT EXISTS seat_position text DEFAULT '';
ALTER TABLE seat_shares ADD COLUMN IF NOT EXISTS matched_user_id text DEFAULT NULL;

-- Seat claims table
CREATE TABLE IF NOT EXISTS seat_claims (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  seat_share_id uuid NOT NULL REFERENCES seat_shares(id) ON DELETE CASCADE,
  user_id text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE seat_claims DISABLE ROW LEVEL SECURITY;
ALTER PUBLICATION supabase_realtime ADD TABLE seat_claims;
