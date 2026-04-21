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
    .trail-popup {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      min-width: 140px;
      max-width: 180px;
    }
    .trail-popup .tp-name {
      font-weight: 700;
      font-size: 13px;
      color: #262626;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .trail-popup .tp-cat {
      font-size: 10px;
      color: #8E8E8E;
      margin-bottom: 5px;
    }
    .trail-popup .tp-stars {
      display: flex;
      align-items: center;
      gap: 3px;
      margin-bottom: 3px;
    }
    .trail-popup .tp-star {
      color: #F4A261;
      font-size: 12px;
      letter-spacing: -1px;
    }
    .trail-popup .tp-star-empty {
      color: #E0E0E0;
      font-size: 12px;
      letter-spacing: -1px;
    }
    .trail-popup .tp-score {
      font-size: 11px;
      font-weight: 700;
      color: #2D6A4F;
      margin-left: 2px;
    }
    .trail-popup .tp-reviews {
      font-size: 10px;
      color: #C7C7C7;
    }
    .trail-popup .tp-comment {
      font-size: 11px;
      color: #555;
      margin-top: 6px;
      padding-top: 5px;
      border-top: 1px solid #f0f0f0;
      line-height: 1.4;
      font-style: italic;
    }
    .trail-popup .tp-commenter {
      font-weight: 600;
      font-style: normal;
      color: #2D6A4F;
      font-size: 10px;
    }
    .trail-popup .tp-surface {
      font-size: 10px;
      color: #aaa;
      margin-top: 3px;
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px !important;
      padding: 0 !important;
      box-shadow: 0 3px 12px rgba(0,0,0,0.12) !important;
    }
    .leaflet-popup-content {
      margin: 10px 12px !important;
    }
    .leaflet-popup-tip {
      box-shadow: 0 2px 6px rgba(0,0,0,0.08) !important;
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

    // 검색은 React Native 쪽에서 처리 (location prop 변경으로 지도 재렌더)

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

    // OSM 산책로 geometry 직접 표시
    var trailGroup = L.layerGroup().addTo(map);

    var categoryStyles = {
      hiking:     { color: '#E76F51', weight: 4, opacity: 0.75, dashArray: null },
      footway:    { color: '#E9967A', weight: 3, opacity: 0.65, dashArray: '6 4' },
      pedestrian: { color: '#F4A261', weight: 3.5, opacity: 0.7, dashArray: null },
      path:       { color: '#DDA0A0', weight: 2.5, opacity: 0.55, dashArray: '4 4' },
    };

    function loadTrails(tlat, tlng) {
      trailGroup.clearLayers();
    fetch('${API_BASE}/api/v1/trails/nearby-paths?lat=' + tlat + '&lng=' + tlng + '&radius=3000')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.data || data.data.length === 0) return;

        data.data.forEach(function(trail) {
          if (!trail.geometry || trail.geometry.length < 2) return;

          var style = categoryStyles[trail.category] || categoryStyles.path;

          var line = L.polyline(trail.geometry, {
            color: style.color,
            weight: style.weight,
            opacity: style.opacity,
            dashArray: style.dashArray,
            lineCap: 'round',
            lineJoin: 'round',
          }).addTo(trailGroup);

          // 모든 산책로에 리뷰 스타일 팝업
          var catLabel = { hiking: '등산로', footway: '산책로', pedestrian: '보행자거리', path: '오솔길' };
          var trailName = trail.name || (catLabel[trail.category] || '산책로') + ' ' + (trail.id ? trail.id.toString().slice(-4) : '');

          // 시드 기반 더미 평점/리뷰
          var seed = trailName + (trail.category || '');
          var hash = 0;
          for (var ci = 0; ci < seed.length; ci++) {
            hash = ((hash << 5) - hash) + seed.charCodeAt(ci);
            hash |= 0;
          }
          var rating = 3.0 + (Math.abs(hash) % 21) / 10.0;
          rating = Math.min(rating, 5.0);
          var ratingStr = rating.toFixed(1);
          var reviews = 3 + (Math.abs(hash) % 120);

          // 더미 한줄평 (시드 기반 선택)
          var comments = [
            '경치가 좋고 걷기 편해요',
            '조용해서 산책하기 딱이에요',
            '그늘이 많아 여름에도 좋아요',
            '오르막이 좀 있지만 뷰가 최고',
            '아이들과 함께 걷기 좋아요',
            '단풍철에 정말 예뻐요',
            '야간 조명이 있어서 밤산책 가능',
            '주말에 사람이 좀 많아요',
            '벤치가 군데군데 있어서 쉬기 좋아요',
            '자전거 주의! 가끔 빠르게 지나가요',
          ];
          var comment = comments[Math.abs(hash) % comments.length];
          var commenter = ['산책러', '동네주민', '걷기좋아', '주말탐험', '힐링중', '자연인'][Math.abs(hash >> 4) % 6];

          var fullStars = Math.floor(rating);
          var halfStar = (rating - fullStars) >= 0.5;
          var starsHtml = '';
          for (var si = 0; si < 5; si++) {
            if (si < fullStars) starsHtml += '<span class="tp-star">&#9733;</span>';
            else if (si === fullStars && halfStar) starsHtml += '<span class="tp-star">&#9733;</span>';
            else starsHtml += '<span class="tp-star-empty">&#9733;</span>';
          }

          var popup = '<div class="trail-popup">'
            + '<div class="tp-name">' + trailName + '</div>'
            + '<div class="tp-cat">' + (catLabel[trail.category] || trail.type || '산책로') + '</div>'
            + '<div class="tp-stars">' + starsHtml + '<span class="tp-score">' + ratingStr + '</span></div>'
            + '<div class="tp-reviews">리뷰 ' + reviews + '개</div>'
            + '<div class="tp-comment">'
            + '<span class="tp-commenter">' + commenter + '</span> "' + comment + '"'
            + '</div>'
            + (trail.surface ? '<div class="tp-surface">노면: ' + trail.surface + '</div>' : '')
            + '</div>';
          line.bindPopup(popup, { maxWidth: 220, closeButton: false });

          // 호버 시 강조
          line.on('mouseover', function(e) {
            e.target.setStyle({ weight: style.weight + 3, opacity: 1 });
          });
          line.on('mouseout', function(e) {
            e.target.setStyle({ weight: style.weight, opacity: style.opacity });
          });
        });

        // 카운트 표시용 콘솔
        console.log('OSM trails loaded:', data.count);
      })
      .catch(function(e) {
        console.log('OSM trail fetch error:', e);
      });
    }
    // 초기 로드
    loadTrails(lat, lng);

    // === 편의시설(SOC) 마커 ===
    var poiIcons = {
      cafe:           { emoji: '&#9749;',  color: '#8B4513' },
      toilet:         { emoji: '&#128701;', color: '#4A90D9' },
      convenience:    { emoji: '&#127915;', color: '#FF6B35' },
      bench:          { emoji: '&#129691;', color: '#8B7355' },
      drinking_water: { emoji: '&#128167;', color: '#00BFFF' },
      parking:        { emoji: '&#127359;', color: '#666666' },
      restaurant:     { emoji: '&#127860;', color: '#E74C3C' },
      pharmacy:       { emoji: '&#9769;',   color: '#27AE60' },
    };

    var poiLayers = {};
    var poiGroup = L.layerGroup().addTo(map);

    function loadPOIs(plat, plng) {
      poiGroup.clearLayers();
      poiLayers = {};
    fetch('${API_BASE}/api/v1/trails/nearby-pois?lat=' + plat + '&lng=' + plng + '&radius=1500')
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.data || data.data.length === 0) return;

        data.data.forEach(function(poi) {
          var iconInfo = poiIcons[poi.category] || { emoji: '&#128204;', color: '#999' };

          var icon = L.divIcon({
            className: '',
            html: '<div style="'
              + 'width:26px;height:26px;'
              + 'background:white;'
              + 'border:2px solid ' + iconInfo.color + ';'
              + 'border-radius:50%;'
              + 'display:flex;align-items:center;justify-content:center;'
              + 'font-size:13px;'
              + 'box-shadow:0 1px 4px rgba(0,0,0,0.15);'
              + '">' + iconInfo.emoji + '</div>',
            iconSize: [26, 26],
            iconAnchor: [13, 13],
          });

          var marker = L.marker([poi.lat, poi.lng], { icon: icon }).addTo(poiGroup);

          var popupHtml = '<div class="trail-popup" style="min-width:120px;">'
            + '<div class="tp-name">' + poi.name + '</div>'
            + '<div class="tp-cat">' + poi.label + '</div>'
            + (poi.opening_hours ? '<div class="tp-surface">' + poi.opening_hours + '</div>' : '')
            + (poi.wheelchair === 'yes' ? '<div class="tp-surface" style="color:#2D6A4F;">&#9855; 휠체어 접근 가능</div>' : '')
            + '</div>';
          marker.bindPopup(popupHtml, { maxWidth: 180, closeButton: false });

          // 레이어 그룹별 관리
          if (!poiLayers[poi.category]) poiLayers[poi.category] = [];
          poiLayers[poi.category].push(marker);
        });

        console.log('POIs loaded:', data.count, data.categories);
      })
      .catch(function(e) {
        console.log('POI fetch error:', e);
      });
    }
    // 초기 로드
    loadPOIs(lat, lng);

    // POI 필터 컨트롤
    var poiLabels = {
      cafe: '카페', toilet: '화장실', convenience: '편의점',
      bench: '벤치', drinking_water: '음수대', parking: '주차장',
      restaurant: '음식점', pharmacy: '약국'
    };
    var poiVisible = {};

    var PoiFilter = L.Control.extend({
      options: { position: 'topright' },
      onAdd: function() {
        var container = L.DomUtil.create('div', 'weather-control');
        container.style.marginTop = '50px';
        container.style.fontSize = '11px';
        container.style.maxWidth = '110px';
        container.style.cursor = 'pointer';

        var title = L.DomUtil.create('div', '', container);
        title.innerHTML = '<b style="font-size:12px;">편의시설</b>';
        title.style.marginBottom = '6px';
        title.style.borderBottom = '1px solid #eee';
        title.style.paddingBottom = '4px';

        Object.keys(poiIcons).forEach(function(cat) {
          poiVisible[cat] = true;
          var row = L.DomUtil.create('div', '', container);
          row.style.padding = '2px 0';
          row.style.display = 'flex';
          row.style.alignItems = 'center';
          row.style.gap = '4px';
          row.dataset.cat = cat;
          row.innerHTML = '<span style="font-size:13px;">' + poiIcons[cat].emoji + '</span>'
            + '<span>' + (poiLabels[cat] || cat) + '</span>';

          row.addEventListener('click', function(e) {
            e.stopPropagation();
            var c = this.dataset.cat;
            poiVisible[c] = !poiVisible[c];
            this.style.opacity = poiVisible[c] ? '1' : '0.35';
            (poiLayers[c] || []).forEach(function(m) {
              if (poiVisible[c]) poiGroup.addLayer(m);
              else poiGroup.removeLayer(m);
            });
          });
        });

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);
        return container;
      }
    });
    new PoiFilter().addTo(map);

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
          + '<div><span style="display:inline-block;width:16px;height:3px;background:#E76F51;margin-right:6px;vertical-align:middle;border-radius:2px;"></span>등산로</div>'
          + '<div><span style="display:inline-block;width:16px;height:2px;background:#E9967A;margin-right:6px;vertical-align:middle;border-radius:2px;border-top:2px dashed #E9967A;"></span>산책로</div>'
          + '<div><span style="display:inline-block;width:16px;height:3px;background:#F4A261;margin-right:6px;vertical-align:middle;border-radius:2px;"></span>보행자거리</div>'
          + '<div><span style="margin-right:6px;">📸</span>포토스팟</div>'
          + '<div style="margin-top:3px;border-top:1px solid #eee;padding-top:3px;"><span style="margin-right:4px;">&#9749;</span>카페 <span style="margin-right:4px;margin-left:6px;">&#128701;</span>화장실</div>';
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
