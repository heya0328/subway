export interface ArrivalInfo {
  trainLineNm: string;
  arvlMsg2: string;
  arvlMsg3: string;
  updnLine: string;
  barvlDt: string;
  lstcarAt: string;
}

export interface MetroArrivalResponse {
  realtimeArrivalList?: ArrivalInfo[];
}
