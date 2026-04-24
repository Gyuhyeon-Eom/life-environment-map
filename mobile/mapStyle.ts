// 부드러운 파스텔/일러스트 느낌 지도 스타일
// Google Maps Platform Styling 기반
export const softMapStyle = [
  {
    elementType: "geometry",
    stylers: [{ color: "#f5f5f0" }],
  },
  {
    elementType: "labels.text.fill",
    stylers: [{ color: "#8a8a8a" }],
  },
  {
    elementType: "labels.text.stroke",
    stylers: [{ color: "#ffffff" }, { weight: 3 }],
  },
  {
    featureType: "administrative",
    elementType: "geometry.stroke",
    stylers: [{ color: "#d4d4d4" }],
  },
  {
    featureType: "administrative.land_parcel",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0b0b0" }],
  },
  // 자연 (공원, 숲)
  {
    featureType: "landscape.natural",
    elementType: "geometry",
    stylers: [{ color: "#e8f0e4" }],
  },
  {
    featureType: "landscape.man_made",
    elementType: "geometry",
    stylers: [{ color: "#f0ede8" }],
  },
  // 공원 - 부드러운 연두
  {
    featureType: "poi.park",
    elementType: "geometry",
    stylers: [{ color: "#d4e8c8" }],
  },
  {
    featureType: "poi.park",
    elementType: "labels.text.fill",
    stylers: [{ color: "#8aaa7e" }],
  },
  // 기타 POI
  {
    featureType: "poi",
    elementType: "geometry",
    stylers: [{ color: "#eae6df" }],
  },
  {
    featureType: "poi",
    elementType: "labels.text.fill",
    stylers: [{ color: "#a0a0a0" }],
  },
  {
    featureType: "poi.business",
    stylers: [{ visibility: "off" }],
  },
  // 도로 - 밝고 부드러운
  {
    featureType: "road",
    elementType: "geometry",
    stylers: [{ color: "#ffffff" }],
  },
  {
    featureType: "road",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e8e4df" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry",
    stylers: [{ color: "#faf6f0" }],
  },
  {
    featureType: "road.highway",
    elementType: "geometry.stroke",
    stylers: [{ color: "#e0dcd6" }],
  },
  {
    featureType: "road",
    elementType: "labels.text.fill",
    stylers: [{ color: "#b0a898" }],
  },
  {
    featureType: "road.arterial",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
  {
    featureType: "road.local",
    elementType: "labels",
    stylers: [{ visibility: "simplified" }],
  },
  // 대중교통
  {
    featureType: "transit",
    elementType: "geometry",
    stylers: [{ color: "#e8e4df" }],
  },
  {
    featureType: "transit.station",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9e9e9e" }],
  },
  // 물 - 부드러운 하늘색
  {
    featureType: "water",
    elementType: "geometry",
    stylers: [{ color: "#c8dce8" }],
  },
  {
    featureType: "water",
    elementType: "labels.text.fill",
    stylers: [{ color: "#9eb8c8" }],
  },
];
