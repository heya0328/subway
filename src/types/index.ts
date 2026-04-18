export interface Station {
  name: string;
  order: number;
  seconds_to_next: number;
}

export interface LineData {
  line: string;
  stations: Station[];
}

export type Direction = '외선순환' | '내선순환';

export interface Routine {
  id: string;
  user_id: string;
  line: string;
  direction: Direction;
  departure_station: string;
  arrival_station: string;
  departure_time: string;
  days_of_week: number[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export type RideStatus = 'riding' | 'arriving_soon' | 'arrived';

export interface ActiveRide {
  id: string;
  user_id: string;
  line: string;
  direction: Direction;
  departure_station: string;
  arrival_station: string;
  status: RideStatus;
  activated_at: string;
  estimated_arrival: string;
  expires_at: string;
}

export interface SeatReport {
  id: string;
  user_id: string;
  line: string;
  station: string;
  created_at: string;
}

export interface DepartureCount {
  arrival_station: string;
  departing_count: number;
}
