import { View, StyleSheet, Dimensions } from "react-native";
import { useRef } from "react";

type Props = {
  location: { latitude: number; longitude: number };
  weather: any;
};

const API_BASE = "http://127.0.0.1:9090";

export default function MapViewComponent({ location, weather }: Props) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const mapHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    * { margin: 0; padding: 0; }
    html, body, #map { width: 100%; height: 100%; }
    .weather-control {
      background: rgba(255,255,255,0.92);
      backdrop-filter: blur(8px);
      border-radius: 12px;
      padding: 10px 14px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      line-height: 1.4;
    }
    .weather-temp {
      font-size: 20px;
      font-weight: 800;
      color: #2D6A4F;
    }
    .weather-detail {
      font-size: 11px;
      color: #8E8E8E;
      margin-top: 2px;
    }
    .my-location-marker {
      width: 16px;
      height: 16px;
      background: #2D6A4F;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(45,106,79,0.2), 0 2px 6px rgba(0,0,0,0.3);
    }
    .pulse-ring {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(45,106,79,0.15);
      animation: pulse 2s ease-out infinite;
      margin-left: -12px;
      margin-top: -12px;
    }
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var lat = ${location.latitude};
    var lng = ${location.longitude};

    var map = L.map('map', {
      zoomControl: false,
      attributionControl: false
    }).setView([lat, lng], 15);

    // 깔끔한 타일 (CartoDB Voyager)
    L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // 줌 컨트롤 우하단
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 내 위치 마커 (펄스 효과)
    var pulseIcon = L.divIcon({
      className: '',
      html: '<div class="pulse-ring"></div><div class="my-location-marker"></div>',
      iconSize: [16, 16],
      iconAnchor: [8, 8]
    });

    L.marker([lat, lng], { icon: pulseIcon }).addTo(map)
      .bindPopup('<b>현재 위치</b>', { offset: [0, -8] });

    // 날씨 오버레이
    ${weather ? `
    var WeatherControl = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function() {
        var div = L.DomUtil.create('div', 'weather-control');
        div.innerHTML = '<div class="weather-temp">${weather.temperature?.toFixed(0) || '--'}°C</div>'
          + '<div class="weather-detail">습도 ${weather.humidity || '--'}%  ·  풍속 ${weather.wind_speed || '--'}m/s</div>';
        return div;
      }
    });
    new WeatherControl().addTo(map);
    ` : ''}

    // 산책로 API 호출 + 지도 표시
    var trailColor = '#E76F51';      // 코랄/주황
    var trailColorLight = 'rgba(231,111,81,0.15)';

    var trailIcon = L.divIcon({
      className: '',
      html: '<div style="width:12px;height:12px;background:' + trailColor + ';border:2.5px solid white;border-radius:50%;box-shadow:0 0 0 3px rgba(231,111,81,0.25),0 1px 4px rgba(0,0,0,0.3);"></div>',
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });

    var trailGroup = L.layerGroup().addTo(map);

    fetch('${API_BASE}/api/v1/trails?lat=' + lat + '&lng=' + lng + '&radius=5000')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.data || data.data.length === 0) return;

        var trails = data.data;
        var coords = [];

        trails.forEach(function(t) {
          if (!t.latitude || !t.longitude) return;
          coords.push([t.latitude, t.longitude]);

          var popup = '<div style="font-family:-apple-system,sans-serif;min-width:140px;">'
            + '<div style="font-weight:700;font-size:13px;color:#262626;margin-bottom:4px;">' + (t.title || '산책로') + '</div>'
            + (t.address ? '<div style="font-size:11px;color:#8E8E8E;margin-bottom:4px;">' + t.address + '</div>' : '')
            + (t.distance ? '<div style="font-size:11px;color:' + trailColor + ';font-weight:600;">' + (t.distance/1000).toFixed(1) + 'km</div>' : '')
            + '</div>';

          L.marker([t.latitude, t.longitude], { icon: trailIcon })
            .addTo(trailGroup)
            .bindPopup(popup);
        });

        // 실제 도로 경로 그리기 (OSRM 도보 라우팅)
        function fetchRoute(fromLat, fromLng, toLat, toLng, style) {
          var url = 'https://router.project-osrm.org/route/v1/foot/'
            + fromLng + ',' + fromLat + ';' + toLng + ',' + toLat
            + '?overview=full&geometries=geojson';

          return fetch(url)
            .then(function(r) { return r.json(); })
            .then(function(data) {
              if (data.routes && data.routes[0]) {
                var geojson = data.routes[0].geometry;
                var latlngs = geojson.coordinates.map(function(c) { return [c[1], c[0]]; });
                L.polyline(latlngs, style).addTo(trailGroup);
              }
            })
            .catch(function() {});
        }

        // 산책로끼리 순서대로 도로 경로 연결
        if (coords.length >= 2) {
          coords.sort(function(a, b) {
            var angleA = Math.atan2(a[0] - lat, a[1] - lng);
            var angleB = Math.atan2(b[0] - lat, b[1] - lng);
            return angleA - angleB;
          });

          for (var i = 0; i < coords.length - 1; i++) {
            (function(a, b) {
              fetchRoute(a[0], a[1], b[0], b[1], {
                color: trailColor,
                weight: 4,
                opacity: 0.5,
                dashArray: '10 6',
                lineCap: 'round',
              });
            })(coords[i], coords[i + 1]);
          }
        }

        // 내 위치 → 가장 가까운 산책로 3개까지 도로 경로
        var sorted = coords.slice().sort(function(a, b) {
          var dA = Math.pow(a[0]-lat,2) + Math.pow(a[1]-lng,2);
          var dB = Math.pow(b[0]-lat,2) + Math.pow(b[1]-lng,2);
          return dA - dB;
        });
        var nearest = sorted.slice(0, 3);

        nearest.forEach(function(c, idx) {
          setTimeout(function() {
            fetchRoute(lat, lng, c[0], c[1], {
              color: trailColor,
              weight: 3,
              opacity: 0.35,
              dashArray: '6 4',
              lineCap: 'round',
            });
          }, idx * 300); // 요청 간 딜레이
        });
      })
      .catch(function(e) {
        console.log('Trail fetch error:', e);
      });

    // 더미 커뮤니티 핀
    var photoIcon = L.divIcon({
      className: '',
      html: '<div style="font-size:18px;filter:drop-shadow(0 1px 2px rgba(0,0,0,0.3))">📸</div>',
      iconSize: [20, 20],
      iconAnchor: [10, 10]
    });

    var pins = [
      { lat: lat + 0.006, lng: lng - 0.009, label: '산책 포토스팟' },
      { lat: lat - 0.004, lng: lng + 0.011, label: '공원 풍경' },
      { lat: lat + 0.002, lng: lng + 0.006, label: '거리 산책' },
    ];

    pins.forEach(function(p) {
      L.marker([p.lat, p.lng], { icon: photoIcon }).addTo(map)
        .bindPopup('<b>' + p.label + '</b>');
    });

    // 범례
    var Legend = L.Control.extend({
      options: { position: 'bottomleft' },
      onAdd: function() {
        var div = L.DomUtil.create('div', 'weather-control');
        div.style.fontSize = '11px';
        div.style.lineHeight = '1.8';
        div.innerHTML = ''
          + '<div><span style="display:inline-block;width:10px;height:10px;background:#2D6A4F;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>내 위치</div>'
          + '<div><span style="display:inline-block;width:10px;height:10px;background:#E76F51;border-radius:50%;margin-right:6px;vertical-align:middle;"></span>산책로</div>'
          + '<div><span style="margin-right:6px;">📸</span>포토스팟</div>';
        return div;
      }
    });
    new Legend().addTo(map);
  </script>
</body>
</html>`;

  return (
    <View style={styles.container}>
      <iframe
        ref={iframeRef}
        srcDoc={mapHtml}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        title="map"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
});
