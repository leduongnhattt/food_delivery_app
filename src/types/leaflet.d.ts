declare module "leaflet" {
  export type LatLngExpression = [number, number] | { lat: number; lng: number };

  export type LeafletMouseEvent = {
    latlng: {
      lat: number;
      lng: number;
    };
  };

  export interface Map {
    setView: (...args: unknown[]) => unknown;
    getZoom: (...args: unknown[]) => unknown;
    on: (...args: unknown[]) => unknown;
    remove: (...args: unknown[]) => unknown;
    invalidateSize: (...args: unknown[]) => unknown;
  }

  export interface CircleMarker {
    setLatLng: (...args: unknown[]) => CircleMarker;
    addTo: (...args: unknown[]) => CircleMarker;
  }

  export function map(...args: unknown[]): Map;
  export function tileLayer(...args: unknown[]): { addTo: (...args: unknown[]) => unknown };
  export function circleMarker(...args: unknown[]): CircleMarker;
}

