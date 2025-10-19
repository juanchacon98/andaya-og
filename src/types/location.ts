export interface Location {
  id: string;
  label: string;
  type: "city" | "district" | "airport";
  lat: number;
  lng: number;
  state?: string;
  city?: string;
}
