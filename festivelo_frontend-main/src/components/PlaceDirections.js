import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import '../styles/PlaceDirections.css';

const PlaceDirections = ({ startPlace, endPlace, map, onClose }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [selectedStart, setSelectedStart] = useState(startPlace);
  const [selectedEnd, setSelectedEnd] = useState(endPlace);
  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const [markers, setMarkers] = useState([]);
  const [activeInfowindow, setActiveInfowindow] = useState(null);
  const [clusterer, setClusterer] = useState(null);
  const directionsRef = useRef(null);
  const [showGuides, setShowGuides] = useState(false);

  const clearMarkersAndInfowindows = () => {
    if (clusterer) {
      clusterer.clear();
    }
    if (activeInfowindow) {
      activeInfowindow.close();
    }
    markers.forEach(({ marker, overlay }) => {
      if (marker) {
        marker.setMap(null);
      }
      if (overlay) {
        overlay.setMap(null);
      }
    });
    setActiveInfowindow(null);
  };

  useEffect(() => {
    return () => {
      if (activeInfowindow) {
        activeInfowindow.close();
      }
    };
  }, [searchResults]);

  useEffect(() => {
    if (map) {
      const newClusterer = new window.kakao.maps.MarkerClusterer({
        map: map,
        averageCenter: true,
        minLevel: 6,
        calculator: [10, 30, 50],
        styles: [
          {
            width: '30px',
            height: '30px',
            background: 'rgba(51, 51, 51, 0.8)',
            borderRadius: '15px',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '30px',
            fontSize: '12px',
            fontWeight: 'bold'
          },
          {
            width: '40px',
            height: '40px',
            background: 'rgba(51, 51, 51, 0.8)',
            borderRadius: '20px',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '40px',
            fontSize: '13px',
            fontWeight: 'bold'
          },
          {
            width: '50px',
            height: '50px',
            background: 'rgba(51, 51, 51, 0.8)',
            borderRadius: '25px',
            color: '#fff',
            textAlign: 'center',
            lineHeight: '50px',
            fontSize: '14px',
            fontWeight: 'bold'
          }
        ]
      });
      setClusterer(newClusterer);

      return () => {
        if (clusterer) {
          clusterer.clear();
        }
      };
    }
  }, [map]);

  useEffect(() => {
    return () => {
      if (activeInfowindow) {
        activeInfowindow.close();
      }
    };
  }, [activeInfowindow]);



  const searchPlaces = () => {
    if (!searchKeyword.trim()) {
      alert('검색어를 입력하세요');
      return;
    }

    clearMarkersAndInfowindows();
    const ps = new window.kakao.maps.services.Places();

    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const bounds = new window.kakao.maps.LatLngBounds();
        const newMarkers = [];
        const newOverlays = [];
        const searchResultsList = [];

        if (clusterer) {
          clusterer.clear();
        }

        data.forEach((place, index) => {
          const placePosition = new window.kakao.maps.LatLng(place.y, place.x);
          const marker = new window.kakao.maps.Marker({
            position: placePosition,
          });
          newMarkers.push(marker);

          const content = document.createElement('div');
          content.className = 'marker-label';
          content.innerHTML = place.place_name;

          const customOverlay = new window.kakao.maps.CustomOverlay({
            position: placePosition,
            content: content,
            yAnchor: 0,
          });

          newOverlays.push(customOverlay);

          const placeInfo = {
            id: index,
            name: place.place_name,
            address: place.address_name,
            phone: place.phone,
            coordinates: {
              lat: place.y,
              lng: place.x
            },
            marker: marker,
            overlay: customOverlay
          };

          window.kakao.maps.event.addListener(marker, 'click', () => {
            showPlaceInfo(placeInfo);
          });

          bounds.extend(placePosition);
          searchResultsList.push(placeInfo);
        });

        clusterer.addMarkers(newMarkers);

        setMarkers(newMarkers.map((marker, i) => ({
          marker: marker,
          overlay: newOverlays[i]
        })));
        setSearchResults(searchResultsList);
        map.setBounds(bounds);

        const currentLevel = map.getLevel();
        newOverlays.forEach(overlay => {
          if (currentLevel <= 4) {
            overlay.setMap(map);
          } else {
            overlay.setMap(null);
          }
        });

        window.kakao.maps.event.addListener(clusterer, 'clusterclick', (cluster) => {
          const level = map.getLevel() - 1;
          map.setLevel(level, { anchor: cluster.getCenter() });
        });
      } else {
        alert('검색 결과가 없습니다.');
      }
    });
  };

  const showPlaceInfo = (place) => {
    if (activeInfowindow) {
      activeInfowindow.close();
    }
    const infowindow = new window.kakao.maps.InfoWindow({
      content: `
        <div class="infowindow-content">
          <div class="place-info">
            <h3>${place.name}</h3>
            <p>${place.address}</p>
            <div class="button-container">
              <button onclick="setAsStart('${place.id}')">출발지로 설정</button>
              <button onclick="setAsEnd('${place.id}')">도착지로 설정</button>
            </div>
          </div>
        </div>
      `
    });
    infowindow.open(map, place.marker);
    setActiveInfowindow(infowindow);
  };

  useEffect(() => {
    window.setAsStart = (placeId) => {
      const place = searchResults[parseInt(placeId)];
      setSelectedStart(place);
    };
    window.setAsEnd = (placeId) => {
      const place = searchResults[parseInt(placeId)];
      setSelectedEnd(place);
    };

    return () => {
      delete window.setAsStart;
      delete window.setAsEnd;
    };
  }, [searchResults]);

  const findRoute = async () => {
    if (!selectedStart || !selectedEnd) {
      alert('출발지와 도착지를 모두 선택해주세요.');
      return;
    }

    setLoading(true);
    try {
      const url = `https://apis-navi.kakaomobility.com/v1/directions?origin=${selectedStart.coordinates.lng},${selectedStart.coordinates.lat}&destination=${selectedEnd.coordinates.lng},${selectedEnd.coordinates.lat}&priority=RECOMMEND`;

      const response = await axios.get(url, {
        headers: {
          Authorization: `KakaoAK ${process.env.REACT_APP_KAKAO_MAP_API_KEY}`
        }
      });

      const path = response.data.routes[0].sections[0].roads.map(road => road.vertexes);
      const linePath = [];
      path.forEach(coordinates => {
        for (let i = 0; i < coordinates.length; i += 2) {
          linePath.push(new window.kakao.maps.LatLng(coordinates[i + 1], coordinates[i]));
        }
      });

      if (map.polyline) {
        map.polyline.setMap(null);
      }

      const polyline = new window.kakao.maps.Polyline({
        path: linePath,
        strokeWeight: 5,
        strokeColor: '#FF0000',
        strokeOpacity: 0.7
      });

      polyline.setMap(map);
      map.polyline = polyline;

      const distance = response.data.routes[0].summary.distance;
      const duration = response.data.routes[0].summary.duration;
      const fare = response.data.routes[0].summary.fare;
      const guides = response.data.routes[0].sections[0].guides.filter(guide => guide.type !== 100 && guide.type !== 101);


      setRouteInfo({
        distance: (distance / 1000).toFixed(1) + 'km',
        duration: Math.round(duration / 60) + '분',
        fare: fare ? {
          taxi: fare.taxi.toLocaleString() + '원',
          toll: fare.toll ? fare.toll.toLocaleString() + '원' : '0원'
        } : null,
        guides: guides.map(guide => ({
          name: guide.name,
          guidance: guide.guidance,
          distance: guide.distance
        }))
      });

      // 지도 범위 설정
      const bounds = new window.kakao.maps.LatLngBounds();
      bounds.extend(new window.kakao.maps.LatLng(selectedStart.coordinates.lat, selectedStart.coordinates.lng));
      bounds.extend(new window.kakao.maps.LatLng(selectedEnd.coordinates.lat, selectedEnd.coordinates.lng));
      map.setBounds(bounds);

    } catch (error) {
      console.error('길찾기 실패:', error);
      alert('경로를 찾을 수 없습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="place-directions" ref={directionsRef}>
      <div className="directions-header">
        <h2>길찾기</h2>
        <button className="close-button" onClick={onClose}>×</button>
      </div>

      <div className="search-container">
        <input
          type="text"
          placeholder="장소 검색"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
          className="search-input"
        />
        <button onClick={searchPlaces} className="search-button">검색</button>
      </div>

      {searchResults.length > 0 && (
        <div className="directions-search-results-list">
          {searchResults.map((place) => (
            <div
              key={place.id}
              className="directions-search-result-item"
              onClick={() => {
                showPlaceInfo(place);
                map.panTo(new window.kakao.maps.LatLng(place.coordinates.lat, place.coordinates.lng));
              }}
            >
              <h3>{place.name}</h3>
              <p>{place.address}</p>
              {place.phone && <p className="phone">{place.phone}</p>}
              <div className="directions-place-actions">
                <button onClick={() => setSelectedStart(place)}>출발지로 설정</button>
                <button onClick={() => setSelectedEnd(place)}>도착지로 설정</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="directions-route-info">
        <div className="directions-place-select">
          <div className="directions-start-place">
            <label>출발지</label>
            <div className="directions-selected-place">
              {selectedStart ? selectedStart.name : '출발지를 선택하세요'}
              {selectedStart && (
                <button onClick={() => setSelectedStart(null)}>×</button>
              )}
            </div>
          </div>
          <div className="directions-end-place">
            <label>도착지</label>
            <div className="directions-selected-place">
              {selectedEnd ? selectedEnd.name : '도착지를 선택하세요'}
              {selectedEnd && (
                <button onClick={() => setSelectedEnd(null)}>×</button>
              )}
            </div>
          </div>
        </div>

        <button
          className="directions-find-route-button"
          onClick={findRoute}
          disabled={loading || !selectedStart || !selectedEnd}
        >
          {loading ? '경로 찾는 중...' : '경로 찾기'}
        </button>

        {routeInfo && (
          <div className="directions-route-summary">
            <p>총 거리: {routeInfo.distance}</p>
            <p>예상 소요 시간: {routeInfo.duration}</p>
            {routeInfo.fare && (
              <>
                <p>예상 택시 요금: {routeInfo.fare.taxi}</p>
                <p>통행료: {routeInfo.fare.toll}</p>
              </>
            )}
            <div
              className="directions-route-guides-header"
              onClick={() => setShowGuides(!showGuides)}
            >
              <h4>상세 경로 안내</h4>
              <span className={`toggle-icon ${showGuides ? 'open' : ''}`}>
                ▼
              </span>
            </div>
            {showGuides && (
              <div className="directions-route-guides">
                {routeInfo.guides.map((guide, index) => (
                  <div key={index} className="directions-guide-item">
                    {guide.name && <strong>{guide.name}: </strong>}
                    <span>{guide.guidance}</span>
                    <small>({(guide.distance / 1000).toFixed(1)}km)</small>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default PlaceDirections;