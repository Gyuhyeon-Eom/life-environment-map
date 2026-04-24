import { View, StyleSheet, Dimensions } from "react-native";
import { useRef, forwardRef, useImperativeHandle } from "react";

type Props = {
  location: { latitude: number; longitude: number };
  weather: any;
};

const API_BASE = "http://127.0.0.1:9090";

const MapViewComponent = forwardRef(function MapViewComponent({ location, weather }: Props, ref) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 부모에서 iframe contentWindow에 접근할 수 있도록 노출
  useImperativeHandle(ref, () => ({
    get contentWindow() {
      return iframeRef.current?.contentWindow;
    },
    postMessage(data: any, origin: string) {
      iframeRef.current?.contentWindow?.postMessage(data, origin);
    },
  }));

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
      color: #3D3D3D;
      margin-bottom: 3px;
      line-height: 1.3;
    }
    .trail-popup .tp-cat {
      font-size: 10px;
      color: #9E9E9E;
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
      color: #6BAB90;
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
      color: #6BAB90;
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
      color: #6BAB90;
    }
    .weather-detail {
      font-size: 11px;
      color: #9E9E9E;
      margin-top: 2px;
    }
    .my-location-marker {
      width: 16px;
      height: 16px;
      background: #6BAB90;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 4px rgba(107,171,144,0.2), 0 2px 6px rgba(0,0,0,0.3);
    }
    .pulse-ring {
      position: absolute;
      width: 40px;
      height: 40px;
      border-radius: 50%;
      background: rgba(107,171,144,0.12);
      animation: pulse 2s ease-out infinite;
      margin-left: -12px;
      margin-top: -12px;
    }
    @keyframes pulse {
      0% { transform: scale(0.5); opacity: 1; }
      100% { transform: scale(2.5); opacity: 0; }
    }
    .mood-chip {
      border: none;
      outline: none;
      cursor: pointer;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
      font-size: 11px;
      font-weight: 600;
      padding: 6px 10px;
      border-radius: 16px;
      background: rgba(255,255,255,0.92);
      color: #555;
      border: 1.5px solid #e0e0e0;
      backdrop-filter: blur(6px);
      box-shadow: 0 1px 4px rgba(0,0,0,0.08);
      transition: all 0.2s;
      white-space: nowrap;
    }
    .mood-chip:hover {
      background: rgba(255,255,255,1);
      box-shadow: 0 2px 8px rgba(0,0,0,0.12);
      transform: scale(1.05);
    }
    .mood-chip-active {
      background: #6BAB90;
      color: white;
      border-color: #6BAB90;
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
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
      subdomains: 'abcd'
    }).addTo(map);

    // 줌 컨트롤 우하단
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // 검색은 React Native 쪽에서 처리 (location prop 변경으로 지도 재렌더)

    // 내 위치 마커 (배낭곰돌이 SVG)
    var bearSvg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 56" width="44" height="52">'
      + '<polygon points="20,48 28,48 24,56" fill="white" stroke="#6BAB90" stroke-width="1.5" stroke-linejoin="round"/>'
      + '<circle cx="24" cy="24" r="22" fill="white" stroke="#6BAB90" stroke-width="2.5"/>'
      + '<circle cx="10" cy="8" r="6" fill="#C4956A" stroke="#6BAB90" stroke-width="1.5"/>'
      + '<circle cx="10" cy="8" r="3" fill="#E8C9A0"/>'
      + '<circle cx="38" cy="8" r="6" fill="#C4956A" stroke="#6BAB90" stroke-width="1.5"/>'
      + '<circle cx="38" cy="8" r="3" fill="#E8C9A0"/>'
      + '<circle cx="24" cy="26" r="16" fill="#D4A574"/>'
      + '<ellipse cx="24" cy="32" rx="10" ry="8" fill="#E8C9A0"/>'
      + '<circle cx="18" cy="22" r="2.5" fill="#333"/><circle cx="19" cy="21" r="1" fill="white"/>'
      + '<circle cx="30" cy="22" r="2.5" fill="#333"/><circle cx="31" cy="21" r="1" fill="white"/>'
      + '<ellipse cx="24" cy="27" rx="3" ry="2" fill="#333"/>'
      + '<path d="M21,30 Q24,33 27,30" fill="none" stroke="#333" stroke-width="1.2" stroke-linecap="round"/>'
      + '<ellipse cx="14" cy="28" rx="3" ry="2" fill="#FFB5B5" opacity="0.5"/>'
      + '<ellipse cx="34" cy="28" rx="3" ry="2" fill="#FFB5B5" opacity="0.5"/>'
      + '<path d="M16,20 L16,35" stroke="#6BAB90" stroke-width="2" stroke-linecap="round"/>'
      + '<path d="M32,20 L32,35" stroke="#6BAB90" stroke-width="2" stroke-linecap="round"/>'
      + '</svg>';

    var bearIcon = L.divIcon({
      className: '',
      html: '<div class="pulse-ring" style="margin-left:-8px;margin-top:-4px;"></div>'
        + '<div style="position:relative;z-index:2;filter:drop-shadow(0 2px 4px rgba(0,0,0,0.25));">' + bearSvg + '</div>',
      iconSize: [44, 52],
      iconAnchor: [22, 52]
    });

    L.marker([lat, lng], { icon: bearIcon }).addTo(map)
      .bindPopup('<b>나의 위치</b><br><span style="font-size:11px;color:#9E9E9E;">배낭곰돌이가 산책 중!</span>', { offset: [0, -52] });

    // 날씨는 앱 헤더에 표시 (지도 내 중복 제거)

    // OSM 산책로 geometry 직접 표시
    var trailGroup = L.layerGroup().addTo(map);

    // 유형(mood)별 스타일 - 백엔드 분류 결과 사용
    var moodStyles = {
      healing:  { color: '#6BAB90', weight: 4,   opacity: 0.7,  dashArray: null,    glow: 'rgba(107,171,144,0.25)' },
      date:     { color: '#F4A4B8', weight: 4,   opacity: 0.7,  dashArray: null,    glow: 'rgba(244,164,184,0.25)' },
      family:   { color: '#E8B888', weight: 4.5, opacity: 0.7,  dashArray: null,    glow: 'rgba(232,184,136,0.25)' },
      workout:  { color: '#E8A889', weight: 3.5, opacity: 0.65, dashArray: '8 5',   glow: 'rgba(232,168,137,0.25)' },
      pet:      { color: '#B8A0E0', weight: 4,   opacity: 0.7,  dashArray: null,    glow: 'rgba(184,160,224,0.25)' },
      night:    { color: '#7BB8D9', weight: 3.5, opacity: 0.65, dashArray: '4 8 4', glow: 'rgba(123,184,217,0.25)' },
    };
    var fallbackStyle = { color: '#CCC', weight: 2.5, opacity: 0.5, dashArray: '4 4', glow: 'rgba(0,0,0,0.1)' };

    // 활성 mood 필터 (null = 전체)
    var activeMoodFilter = null;

    // mood 이모지/라벨
    var moodMeta = {
      healing:  { emoji: '\\uD83C\\uDF3F', label: '힐링' },
      date:     { emoji: '\\uD83D\\uDC95', label: '데이트' },
      family:   { emoji: '\\uD83D\\uDC68\\u200D\\uD83D\\uDC69\\u200D\\uD83D\\uDC67', label: '가족' },
      workout:  { emoji: '\\uD83C\\uDFC3', label: '운동' },
      pet:      { emoji: '\\uD83D\\uDC15', label: '반려동물' },
      night:    { emoji: '\\uD83C\\uDF19', label: '야경' },
    };

    // 전역 산책로 데이터 저장 (카드 리스트에서 사용)
    var allTrailData = [];
    // 선택된 산책로의 레이어 (하이라이트용)
    var selectedTrailLayer = L.layerGroup().addTo(map);
    // 마커 전용 레이어
    var markerGroup = L.layerGroup().addTo(map);

    function loadTrails(tlat, tlng) {
      trailGroup.clearLayers();
      markerGroup.clearLayers();
      selectedTrailLayer.clearLayers();
      allTrailData = [];

    var url = '${API_BASE}/api/v1/trails/nearby-paths?lat=' + tlat + '&lng=' + tlng + '&radius=3000';

    fetch(url)
      .then(function(r) { return r.json(); })
      .then(function(data) {
        if (!data.data || data.data.length === 0) return;
        allTrailData = data.data;
        renderMarkers(allTrailData);
        console.log('Trails loaded:', data.count);
        // RN에 산책로 데이터 전달
        window.parent.postMessage(JSON.stringify({ type: 'trailsLoaded', trails: allTrailData }), '*');
      })
      .catch(function(e) {
        console.log('Trail fetch error:', e);
      });
    }

    // 각 산책로 출발점에 원형 마커만 표시 (Polyline은 그리지 않음)
    function renderMarkers(trails) {
      markerGroup.clearLayers();

      trails.forEach(function(trail) {
        if (!trail.geometry || trail.geometry.length < 2) return;

        var primaryMood = trail.primary_mood || 'healing';
        var moods = trail.moods || [primaryMood];

        // mood 필터 적용
        if (activeMoodFilter && moods.indexOf(activeMoodFilter) === -1) return;

        var style = moodStyles[primaryMood] || fallbackStyle;
        var startPoint = trail.geometry[0];

        // 작은 원형 마커
        var marker = L.circleMarker(startPoint, {
          radius: 7,
          fillColor: style.color,
          fillOpacity: 0.85,
          color: '#FFFFFF',
          weight: 2.5,
          opacity: 1,
        }).addTo(markerGroup);

        // 팝업 (간단)
        var catLabel = { hiking: '등산로', footway: '산책로', pedestrian: '보행자거리', path: '오솔길' };
        var trailName = trail.name || (catLabel[trail.category] || '산책로') + ' ' + (trail.id ? trail.id.toString().slice(-4) : '');
        var lengthStr = trail.length_m ? (trail.length_m >= 1000 ? (trail.length_m / 1000).toFixed(1) + 'km' : trail.length_m + 'm') : '';
        var popup = '<div class="trail-popup">'
          + '<div class="tp-name">' + trailName + '</div>'
          + '<div class="tp-cat">' + (catLabel[trail.category] || '산책로') + (lengthStr ? ' · ' + lengthStr : '') + '</div>'
          + '</div>';
        marker.bindPopup(popup, { maxWidth: 180, closeButton: false });

        // 호버 시 살짝 키우기
        marker.on('mouseover', function() { marker.setRadius(10); });
        marker.on('mouseout', function() { marker.setRadius(7); });

        // 클릭 시 해당 산책로 Polyline 하이라이트
        (function(t) {
          marker.on('click', function() {
            highlightTrail(t.id);
            // RN에도 알려주기
            window.parent.postMessage(JSON.stringify({ type: 'trailSelected', trailId: String(t.id) }), '*');
          });
        })(trail);
      });
    }

    // 특정 산책로 하나만 Polyline으로 하이라이트
    function highlightTrail(trailId) {
      selectedTrailLayer.clearLayers();

      var trail = null;
      for (var i = 0; i < allTrailData.length; i++) {
        if (String(allTrailData[i].id) === String(trailId)) {
          trail = allTrailData[i];
          break;
        }
      }
      if (!trail || !trail.geometry || trail.geometry.length < 2) return;

      var primaryMood = trail.primary_mood || 'healing';
      var style = moodStyles[primaryMood] || fallbackStyle;

      // 글로우 효과
      L.polyline(trail.geometry, {
        color: style.glow,
        weight: style.weight + 8,
        opacity: 0.5,
        lineCap: 'round',
        lineJoin: 'round',
        interactive: false,
      }).addTo(selectedTrailLayer);

      // 메인 라인 (weight + 2로 더 두껍게)
      var line = L.polyline(trail.geometry, {
        color: style.color,
        weight: style.weight + 2,
        opacity: 0.9,
        dashArray: style.dashArray,
        lineCap: 'round',
        lineJoin: 'round',
      }).addTo(selectedTrailLayer);

      // 지도 fitBounds
      map.fitBounds(line.getBounds(), { padding: [40, 40], maxZoom: 16 });
    }

    // 초기 로드 (마커만)
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
            + (poi.wheelchair === 'yes' ? '<div class="tp-surface" style="color:#6BAB90;">&#9855; 휠체어 접근 가능</div>' : '')
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

    // === Mood 필터 칩 (하단 좌측) ===
    var MoodFilter = L.Control.extend({
      options: { position: 'topleft' },
      onAdd: function() {
        var container = L.DomUtil.create('div');
        container.style.display = 'flex';
        container.style.flexDirection = 'row';
        container.style.flexWrap = 'wrap';
        container.style.gap = '4px';
        container.style.marginTop = '155px';
        container.style.maxWidth = '280px';

        var allBtn = document.createElement('button');
        allBtn.className = 'mood-chip mood-chip-active';
        allBtn.id = 'mood-all';
        allBtn.textContent = '전체';
        allBtn.onclick = function() {
          activeMoodFilter = null;
          updateMoodChips();
          renderMarkers(allTrailData);
        };
        container.appendChild(allBtn);

        var moods = ['healing','date','family','workout','pet','night'];
        moods.forEach(function(m) {
          var meta = moodMeta[m];
          var ms = moodStyles[m];
          var btn = document.createElement('button');
          btn.className = 'mood-chip';
          btn.id = 'mood-' + m;
          btn.dataset.mood = m;
          btn.dataset.color = ms.color;
          btn.innerHTML = meta.emoji + ' ' + meta.label;
          btn.onclick = function() {
            if (activeMoodFilter === m) {
              activeMoodFilter = null;
            } else {
              activeMoodFilter = m;
            }
            updateMoodChips();
            renderMarkers(allTrailData);
          };
          container.appendChild(btn);
        });

        L.DomEvent.disableClickPropagation(container);
        return container;
      }
    });
    new MoodFilter().addTo(map);

    function updateMoodChips() {
      var all = document.getElementById('mood-all');
      if (all) {
        all.className = activeMoodFilter ? 'mood-chip' : 'mood-chip mood-chip-active';
      }
      var moods = ['healing','date','family','workout','pet','night'];
      moods.forEach(function(m) {
        var btn = document.getElementById('mood-' + m);
        if (btn) {
          var ms = moodStyles[m];
          if (activeMoodFilter === m) {
            btn.className = 'mood-chip mood-chip-active';
            btn.style.background = ms.color;
            btn.style.color = 'white';
            btn.style.borderColor = ms.color;
          } else {
            btn.className = 'mood-chip';
            btn.style.background = '';
            btn.style.color = '';
            btn.style.borderColor = '';
          }
        }
      });
    }

    // 편의시설 필터는 React Native 레이어로 이동 (App.tsx)
    // iframe 내에서는 postMessage로 토글
    var poiLabels = {
      cafe: '카페', toilet: '화장실', convenience: '편의점',
      bench: '벤치', drinking_water: '음수대', parking: '주차장',
      restaurant: '음식점', pharmacy: '약국'
    };
    var poiVisible = {};
    Object.keys(poiIcons).forEach(function(cat) { poiVisible[cat] = true; });

    // RN에서 메시지 받아서 POI 토글 / mood 필터 / 산책로 선택
    window.addEventListener('message', function(e) {
      try {
        var msg = typeof e.data === 'string' ? JSON.parse(e.data) : e.data;
        if (msg.type === 'togglePoi') {
          var c = msg.category;
          poiVisible[c] = !poiVisible[c];
          (poiLayers[c] || []).forEach(function(m) {
            if (poiVisible[c]) poiGroup.addLayer(m);
            else poiGroup.removeLayer(m);
          });
        }
        if (msg.type === 'filterMood') {
          activeMoodFilter = msg.mood || null;
          updateMoodChips();
          renderMarkers(allTrailData);
        }
        // 산책로 선택 → 해당 산책로만 Polyline 하이라이트
        if (msg.type === 'selectTrail') {
          highlightTrail(msg.trailId);
        }
        // 하이라이트 제거
        if (msg.type === 'clearTrail') {
          selectedTrailLayer.clearLayers();
        }
        // 산책로 데이터 요청 → 부모에게 응답
        if (msg.type === 'getTrails') {
          window.parent.postMessage(JSON.stringify({ type: 'trailsLoaded', trails: allTrailData }), '*');
        }
      } catch(ex) {}
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
});

export default MapViewComponent;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f0f0f0",
  },
});
