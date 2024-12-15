import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaArrowLeft, FaUser } from 'react-icons/fa';
import { toast } from 'react-toastify';
import axios from 'axios';
import MyTrip from '../components/MyTrip';
import Map from '../components/Map';
import PlaceDetails from '../components/PlaceDetails';
import NewTrip from '../components/NewTrip';
import AddPlace from '../components/AddPlace';
import PlaceDirections from '../components/PlaceDirections';
import useKakaoMap from '../hooks/useKakaoMap';
import MapSearch from '../components/MapSearch';
import '../styles/HomePage.css';

const API_URL = process.env.REACT_APP_SERVER_URL;
const WS_URL = process.env.REACT_APP_WS_URL;

const Home = () => {
  const navigate = useNavigate();
  const [activeComponent, setActiveComponent] = useState('myTrip');
  const [activeTab, setActiveTab] = useState('attractions');
  const [selectedPlace, setSelectedPlace] = useState(null);
  const [selectedTrip, setselectedTrip] = useState(null);
  const [showNewTrip, setShowNewTrip] = useState(false);
  const [trips, setTrips] = useState([]);
  const [showDirection, setShowDirection] = useState(false);
  const [directionInfo, setDirectionInfo] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState({
    latitude: 37.2829,
    longitude: 127.0435 // 아주대학교
  });
  const [ws, setWs] = useState(null);

  const { map,setMarkers, clearMap } = useKakaoMap(selectedLocation);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get(
          `${API_URL}/api/trips/trips`,
          {
            headers: {
              'Authorization': `Bearer ${token}`
            }
          }
        );
        setTrips(response.data);
      } catch (error) {
        if (error.response?.status === 401) {
          toast.error('로그인이 필요합니다');
          navigate('/login');
        } else {
          toast.error('여행 데이터를 불러오는데 실패했습니다');
          console.error('여행 데이터를 불러오는데 실패했습니다:', error);
        }
      }
    };

    fetchTrips();
  }, []);

  useEffect(() => {
    if (ws && ws.readyState === WebSocket.OPEN && trips.length > 0) {
      ws.send(JSON.stringify({
        type: 'tripsUpdate',
        data: trips
      }));
    }
  }, [trips, ws]);

  useEffect(() => {
    const websocket = new WebSocket(WS_URL);

    websocket.onopen = () => {
      console.log('WebSocket 연결됨');
    };

    websocket.onmessage = (event) => {
      const change = JSON.parse(event.data);

      switch (change.type) {
        case 'tripsUpdate':
          // 다른 클라이언트에서 trips가 업데이트된 경우
          setTrips(change.data);
          break;
        case 'update':
          // 여행 정보가 업데이트된 경우
          refreshTrips();
          toast.success('여행 정보가 업데이트되었습니다.');
          break;
        case 'delete':
          // 여행이 삭제된 경우
          setTrips(prev => prev.filter(trip => trip._id !== change.documentId));
          toast.info('여행이 삭제되었습니다.');
          break;
        case 'addPlace':
          // 새로운 장소가 추가된 경우
          refreshTrips();
          toast.success('새로운 장소가 추가되었습니다.');
          break;
        case 'removePlace':
          // 장소가 제거된 경우
          refreshTrips();
          toast.info('장소가 제거되었습니다.');
          break;
        case 'create':
          // 새로운 여행이 생성된 경우
          refreshTrips();
          toast.success('새로운 여행이 생성되었습니다.');
          break;
      }
    };

    websocket.onerror = (error) => {
      console.error('WebSocket 에러:', error);
      toast.error('실시간 업데이트 연결에 실패했습니다.');
    };

    setWs(websocket);

    return () => {
      if (websocket && websocket.readyState === WebSocket.OPEN) {
        websocket.close();
      }
    };
  }, []);

  const toggleNewTrip = () => {
    setShowNewTrip(!showNewTrip);
    setSelectedPlace(null);
    setShowDirection(false);

    setTimeout(() => {
      map?.relayout();
    }, 500);
  };

  const handlePlaceSelect = useCallback((place) => {
    if (!map) return;

    console.log(place);

    clearMap();
    setSelectedPlace(place);

    const position = new window.kakao.maps.LatLng(
      place.coordinates.lat,
      place.coordinates.lng
    );

    const marker = new window.kakao.maps.Marker({
      position: position,
      map
    });

    setMarkers([{ marker }]);
    setSelectedLocation({
      latitude: place.coordinates.lat,
      longitude: place.coordinates.lng
    });

    map.setCenter(position);
    map.setLevel(4);

    setTimeout(() => {
      map?.relayout();
    }, 200);
  }, [map, clearMap]);

  const createCustomOverlay = useCallback((position, content) => {
    const element = document.createElement('div');
    element.className = 'marker-label';
    element.innerHTML = content;

    return new window.kakao.maps.CustomOverlay({
      position,
      content: element,
      yAnchor: 0,
      map
    });
  }, [map]);

  const handleTripSelect = useCallback((trip) => {
    if (!map) return;

    setselectedTrip(trip);
    clearMap();

    const newMarkers = [];
    const bounds = new window.kakao.maps.LatLngBounds();
    const linePath = [];

    const allPlaces = Object.values(trip.plans).flatMap(day => {
      return day.route.map(routeId =>
        day.places.find(place => place.id === routeId)
      );
    });

    if (allPlaces.length === 0) {
      const geocoder = new window.kakao.maps.services.Geocoder();
      geocoder.addressSearch(trip.location, (result, status) => {
        if (status === window.kakao.maps.services.Status.OK) {
          const position = new window.kakao.maps.LatLng(
            result[0].y,
            result[0].x
          );
          map.setCenter(position);
          map.setLevel(8);
          map.relayout();
        }
      });
      return;
    }

    const markerClusterer = new window.kakao.maps.MarkerClusterer({
      map: map,
      averageCenter: true,
      minLevel: 8,
      disableClickZoom: true,
      styles: [{
        width: '50px',
        height: '50px',
        background: 'rgba(255, 69, 0, 0.8)',
        borderRadius: '25px',
        color: '#fff',
        textAlign: 'center',
        lineHeight: '50px',
        fontSize: '14px',
        fontWeight: 'bold'
      }]
    });

    const overlayClusterer = new window.kakao.maps.MarkerClusterer({
      map: map,
      averageCenter: true,
      minLevel: 8,
      disableClickZoom: true,
      styles: [{
        width: '50px',
        height: '50px',
        background: 'rgba(0, 0, 0, 0.6)',
        borderRadius: '25px',
        color: '#fff',
        textAlign: 'center',
        lineHeight: '50px',
        fontSize: '14px',
        fontWeight: 'bold'
      }]
    });

    const realMarkers = [];
    const overlayMarkers = [];

    allPlaces.forEach((place, index) => {
      const position = new window.kakao.maps.LatLng(
        place.coordinates.lat,
        place.coordinates.lng
      );

      const placeMarker = new window.kakao.maps.Marker({ position, map: null });
      const overlayMarker = new window.kakao.maps.Marker({
        position,
        opacity: 0,
        map: null
      });

      const overlay = createCustomOverlay(position, `${index + 1}. ${place.name}`);
      
      const tilesLoadedListener = window.kakao.maps.event.addListener(map, 'tilesloaded', () => {
        const currentLevel = map.getLevel();
        overlay.setMap(currentLevel <= 7 ? map : null);
        window.kakao.maps.event.removeListener(map, 'tilesloaded', tilesLoadedListener);
      });

      window.kakao.maps.event.addListener(placeMarker, 'click', () => {
        handlePlaceSelect(place);
      });

      bounds.extend(position);
      linePath.push(position);

      realMarkers.push(placeMarker);
      overlayMarkers.push(overlayMarker);

      newMarkers.push({ marker: placeMarker, overlay });
    });

    markerClusterer.addMarkers(realMarkers);
    overlayClusterer.addMarkers(overlayMarkers);

    window.kakao.maps.event.addListener(markerClusterer, 'clusterclick', (cluster) => {
      const level = map.getLevel() - 1;
      map.setLevel(level, { anchor: cluster.getCenter() });
    });

    const polyline = new window.kakao.maps.Polyline({
      path: linePath,
      strokeWeight: 3,
      strokeColor: '#FF4500',
      strokeOpacity: 0.7,
      strokeStyle: 'solid'
    });

    polyline.setMap(map);
    map.polyline = polyline;

    setMarkers(newMarkers);
    map.setBounds(bounds);
    map.relayout();

    map.markerClusterers = [markerClusterer, overlayClusterer];

  }, [map, clearMap, handlePlaceSelect, createCustomOverlay]);

  const handleRouteChange = async (tripId, day, newRoute, places, newName) => {
    try {
      if (newName) {
        const response = await axios.put(
          `${API_URL}/api/trips/trips/${tripId}`,
          { name: newName }
        );
        if (response.status === 200) {
          refreshTrips();
        }
      } else if (day && newRoute) {
        const requestData = {
          dayKey: day,
          places: places,
          route: newRoute
        };
        const response = await axios.put(
          `${API_URL}/api/trips/trips/${tripId}/plans/day`,
          requestData
        );
        if (response.status === 200) {
          toast.success('경로가 성공적으로 업데이트되었습니다.');
          refreshTrips();
        }
      }
    } catch (error) {
      console.error('업데이트 실패:', error);
      toast.error('업데이트에 실패했습니다.');
    }
  };

  const handleDirectionSelect = (startPlace, endPlace) => {
    setShowDirection(true);
    setDirectionInfo({ startPlace, endPlace });
    setSelectedPlace(null);
  };

  const handleAddPlace = (tripId, day) => {
    const selectedTrip = trips.find(trip => trip._id === tripId);
    if (!selectedTrip) {
      console.error('선택된 여행을 찾을 수 없습니다.');
      return;
    }

    setselectedTrip({
      tripId,
      day,
      location: selectedTrip.location
    });
    setActiveComponent('addPlace');
  };

  const handleBack = () => {
    setActiveComponent('myTrip');
    setselectedTrip(null);
    setSelectedPlace(null);
  };

  const handleSearchResult = useCallback((searchResults) => {
    if (!map) return;

    clearMap();
    const newMarkers = [];
    const bounds = new window.kakao.maps.LatLngBounds();

    searchResults.forEach(place => {
      const position = new window.kakao.maps.LatLng(
        place.coordinates.lat,
        place.coordinates.lng
      );

      const marker = new window.kakao.maps.Marker({
        position: position,
        map: map
      });

      const overlay = createCustomOverlay(position, place.name);

      window.kakao.maps.event.addListener(marker, 'click', () => {
        const placeData = {
          id: place.id,
          name: place.name,
          location: place.address,
          coordinates: place.coordinates,
          tel: place.phone
        };
        handlePlaceSelect(placeData);
      });

      bounds.extend(position);
      newMarkers.push({ marker, overlay });
    });

    setMarkers(newMarkers);
    map.setBounds(bounds);
    map.relayout();
  }, [map, clearMap, createCustomOverlay, handlePlaceSelect]);

  const handleTripDelete = async (tripId) => {
    try {
      await axios.delete(`${API_URL}/api/trips/trips/${tripId}`);
      setTrips(prevTrips => prevTrips.filter(trip => trip._id !== tripId));

      // toast.success('여행이 성공적으로 삭제되었���니다.');
    } catch (error) {
      console.error('여행 삭제 중 오류 발생:', error);

      toast.error('여행 삭제 중 오류가 발생했습니다.');
    }
  };

  const handleTripCreate = (newTrip) => {
    setTrips(prevTrips => [...prevTrips, newTrip]);
  };

  const refreshTrips = async () => {
    try {
      clearMap();
      const token = localStorage.getItem('token');
      const response = await axios.get(
        `${API_URL}/api/trips/trips`,
        {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }
      );
      setTrips(response.data);

      if (selectedTrip) {
        const updatedTrip = response.data.find(trip => trip._id === selectedTrip._id);
        if (updatedTrip) {
          handleTripSelect(updatedTrip);
        }
      }
    } catch (error) {
      if (error.response?.status === 401) {
        toast.error('로그인이 필요합니다');
        navigate('/login');
      } else {
        toast.error('여행 데이터를 불러오는데 실패했습니다');
        console.error('여행 데이터를 불러오는데 실패했습니다:', error);
      }
    }
  };

  return (
    <div className="container">
      <div className={`wrapper ${showNewTrip ? 'full-content' : ''} ${(showDirection || selectedPlace) ? 'show-content' : ''}`}>
        <div className="sidebar">
          <div className="header-container">
            {activeComponent === 'addPlace' && (
              <button className="header-back-button" onClick={handleBack}>
                <FaArrowLeft />
              </button>
            )}
            <h1 className="festivelo-logo">FESTIVELO</h1>

            <button
              className="header-profile-button"
              onClick={() => navigate('/my')}
            >
              <FaUser />
            </button>
          </div>

          {activeComponent === 'addPlace' ? (
            <AddPlace
              tripId={selectedTrip?.tripId}
              day={selectedTrip?.day}
              onBack={handleBack}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              onPlaceSelect={handlePlaceSelect}
              tripStartDate={trips.find(trip => trip._id === selectedTrip?.tripId)?.start_date}
              tripEndDate={trips.find(trip => trip._id === selectedTrip?.tripId)?.end_date}
              location={trips.find(trip => trip._id === selectedTrip?.tripId)?.location}
              onSuccess={refreshTrips}
            />
          ) : (
            <>
              <div className="title-container">
                <h2 className="title">내 여행</h2>
                <button
                  className="add-trip-button"
                  onClick={toggleNewTrip}
                >
                  여행 추가
                </button>
              </div>
              <MyTrip
                trips={trips}
                onPlaceSelect={handlePlaceSelect}
                onAddPlace={handleAddPlace}
                onDirectionSelect={handleDirectionSelect}
                onTripSelect={handleTripSelect}
                onRouteChange={handleRouteChange}
                onTripDelete={handleTripDelete}
              />
            </>
          )}
        </div>
        <div className="content">
          {showNewTrip ? (
            <NewTrip
              onClose={toggleNewTrip}
              onTripCreate={handleTripCreate}
            />
          ) : showDirection ? (
            <PlaceDirections
              startPlace={directionInfo.startPlace}
              endPlace={directionInfo.endPlace}
              map={map}
              onClose={() => setShowDirection(false)}
            />
          ) : selectedPlace && (
            <PlaceDetails
              place={selectedPlace}
              onClose={() => setSelectedPlace(null)}
            />
          )}
        </div>
        <div className={`map-container ${showNewTrip ? 'hidden' : ''}`}>
          {!showNewTrip && !showDirection && !selectedPlace && (
            <MapSearch
              map={map}
              onSearchResult={handleSearchResult}
              clearMap={clearMap}
              setMarkers={setMarkers}
              trips={trips}
            />
          )}
          <Map />
        </div>
      </div>
    </div>
  );
};

export default Home;
