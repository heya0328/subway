import lineData from './line2.json';
import type { Station, Direction } from '../types';

const stations: Station[] = lineData.stations;
const totalStations = stations.length;

export function getAllStations(): Station[] {
  return stations;
}

export function getStationNames(): string[] {
  return stations.map((s) => s.name);
}

function getStationIndex(name: string): number {
  const idx = stations.findIndex((s) => s.name === name);
  if (idx === -1) throw new Error(`Unknown station: ${name}`);
  return idx;
}

export function getStationsInDirection(
  direction: Direction,
  fromStation: string
): string[] {
  const fromIdx = getStationIndex(fromStation);
  const result: string[] = [];

  if (direction === '외선순환') {
    for (let i = 1; i < totalStations; i++) {
      result.push(stations[(fromIdx + i) % totalStations].name);
    }
  } else {
    for (let i = 1; i < totalStations; i++) {
      result.push(
        stations[(fromIdx - i + totalStations) % totalStations].name
      );
    }
  }
  return result;
}

export function getTravelTimeSeconds(
  direction: Direction,
  fromStation: string,
  toStation: string
): number {
  const fromIdx = getStationIndex(fromStation);
  const toIdx = getStationIndex(toStation);
  let totalSeconds = 0;

  if (direction === '외선순환') {
    let i = fromIdx;
    while (i !== toIdx) {
      totalSeconds += stations[i].seconds_to_next;
      i = (i + 1) % totalStations;
    }
  } else {
    let i = fromIdx;
    while (i !== toIdx) {
      const prev = (i - 1 + totalStations) % totalStations;
      totalSeconds += stations[prev].seconds_to_next;
      i = prev;
    }
  }
  return totalSeconds;
}

export function getRemainingStationCount(
  direction: Direction,
  currentStation: string,
  arrivalStation: string
): number {
  const names = getStationsInDirection(direction, currentStation);
  const idx = names.indexOf(arrivalStation);
  return idx === -1 ? 0 : idx + 1;
}
