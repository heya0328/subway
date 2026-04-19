import type { ArrivalInfo } from '../types/metro';

const API_KEY = '4e457a6a4b73756e3130396a42744c';
const BASE_URL = 'http://swopenapi.seoul.go.kr/api/subway';

export async function fetchArrivalInfo(stationName: string): Promise<ArrivalInfo[]> {
  try {
    const url = `${BASE_URL}/${API_KEY}/json/realtimeStationArrival/0/10/${encodeURIComponent(stationName)}`;
    const res = await fetch(url);
    const data = await res.json();
    if (!data.realtimeArrivalList) return [];
    return data.realtimeArrivalList.filter(
      (item: ArrivalInfo) => item.trainLineNm.includes('2호선')
    );
  } catch {
    return [];
  }
}
