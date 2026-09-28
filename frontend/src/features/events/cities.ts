/** Cities offered in the event filters and create form, with a central map
 * pin used when the organizer does not share their current location. */
export const EVENT_CITIES = [
  { name: "Ho Chi Minh City", lat: 10.7769, lng: 106.7009 },
  { name: "Hanoi", lat: 21.0285, lng: 105.8542 },
  { name: "Da Nang", lat: 16.0544, lng: 108.2022 },
  { name: "Hai Phong", lat: 20.8449, lng: 106.6881 },
  { name: "Can Tho", lat: 10.0452, lng: 105.7469 },
  { name: "Hue", lat: 16.4637, lng: 107.5909 },
  { name: "Nha Trang", lat: 12.2388, lng: 109.1967 },
  { name: "Da Lat", lat: 11.9404, lng: 108.4583 },
  { name: "Vung Tau", lat: 10.346, lng: 107.0843 },
  { name: "Quy Nhon", lat: 13.782, lng: 109.2197 },
] as const;

export function cityCenter(name: string) {
  const key = name.trim().toLowerCase();
  return EVENT_CITIES.find((city) => city.name.toLowerCase() === key) || null;
}
