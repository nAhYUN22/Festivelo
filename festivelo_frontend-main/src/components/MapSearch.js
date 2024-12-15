import React, { useState, useRef, useEffect } from 'react';
import { FaSearch, FaPlus } from 'react-icons/fa';
import '../styles/Map.css';
import axios from 'axios';
import { toast } from 'react-toastify';

const API_URL = process.env.REACT_APP_SERVER_URL;

const MapSearch = ({ map, onSearchResult, clearMap, setMarkers, trips }) => {
  const [searchKeyword, setSearchKeyword] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedTrip, setSelectedTrip] = useState(null);
  const [selectedDay, setSelectedDay] = useState(null);
  const [showTripSelector, setShowTripSelector] = useState(false);
  const searchContainerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchContainerRef.current && !searchContainerRef.current.contains(event.target)) {
        setIsFocused(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const searchPlaces = () => {
    if (!searchKeyword.trim() || !map) return;
    
    clearMap();

    const ps = new window.kakao.maps.services.Places();
    ps.keywordSearch(searchKeyword, (data, status) => {
      if (status === window.kakao.maps.services.Status.OK) {
        const searchResultsList = data.map(place => ({
          id: place.id,
          name: place.place_name,
          address: place.address_name,
          coordinates: {
            lat: place.y,
            lng: place.x
          },
          phone: place.phone
        }));

        setSearchResults(searchResultsList);
        setIsSearching(true);
        onSearchResult(searchResultsList);
      }
    });
  };

  const handlePlaceSelect = (place) => {
    const moveLatLon = new window.kakao.maps.LatLng(
      place.coordinates.lat,
      place.coordinates.lng
    );
    map.setCenter(moveLatLon);
    map.setLevel(3);
    setIsFocused(false);
  };

  const handleAddPlace = async (place, tripId, day) => {
    try {
      // 현재 여행 정보 조회
      const tripResponse = await axios.get(`${API_URL}/api/trips/trips/${tripId}`);
      const currentTrip = tripResponse.data;
      const currentDayPlans = currentTrip.plans[day] || { places: [], route: [] };

      // 새로운 place 객체 생성
      const newPlace = {
        id: place.id,
        name: place.name,
        address: place.address,
        type: 77,
        coordinates: place.coordinates,
        tel: place.phone
      };

      // 기존 places와 route에 새로운 장소 추가
      const updatedPlaces = [...currentDayPlans.places, newPlace];
      const updatedRoute = [...currentDayPlans.route, place.id];

      const requestData = {
        dayKey: day,
        places: updatedPlaces,
        route: updatedRoute
      };

      const response = await axios.put(
        `${API_URL}/api/trips/trips/${tripId}/plans/day`,
        requestData
      );

      if (response.status === 200) {
        toast.success('장소가 성공적으로 추가되었습니다.');
        setShowTripSelector(false);
        setSelectedTrip(null);
        setSelectedDay(null);
        // 선택적: 지도 새로고침이나 다른 업데이트 작업
      }
    } catch (error) {
      console.error('장소 추가 실패:', error);
      toast.error(error.response?.data?.message || '장소 추가에 실패했습니다.');
    }
  };

  return (
    <div className="map-search-container" ref={searchContainerRef}>
      <div className="search-bar">
        <input
          type="text"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchPlaces()}
          onFocus={() => setIsFocused(true)}
          placeholder="지도 검색"
          className="search-input"
        />
        <button onClick={searchPlaces} className="search-button">
          <FaSearch />
        </button>
      </div>
      {isSearching && searchResults.length > 0 && isFocused && (
        <div className="search-results">
          {searchResults.map((place) => (
            <div key={place.id} className="search-result-item">
              <div 
                className="place-info"
                onClick={() => handlePlaceSelect(place)}
              >
                <h3>{place.name}</h3>
                <p>{place.address}</p>
                {place.phone && <p className="phone">{place.phone}</p>}
              </div>
              <button
                className="add-button"
                onClick={() => setShowTripSelector(place)}
              >
                <FaPlus />
              </button>
            </div>
          ))}
        </div>
      )}
      
      {showTripSelector && (
        <div className="trip-selector">
          <h3>여행 선택</h3>
          <select 
            value={selectedTrip?._id || ''} 
            onChange={(e) => {
              const trip = trips.find(t => t._id === e.target.value);
              setSelectedTrip(trip);
              setSelectedDay(null);
            }}
          >
            <option value="">여행을 선택하세요</option>
            {trips.map(trip => (
              <option key={trip._id} value={trip._id}>
                {trip.name} ({trip.start_date} ~ {trip.end_date})
              </option>
            ))}
          </select>
          
          {selectedTrip && (
            <>
              <h3>일차 선택</h3>
              <select 
                value={selectedDay || ''} 
                onChange={(e) => setSelectedDay(e.target.value)}
              >
                <option value="">일차를 선택하세요</option>
                {Array.from({ length: getDaysDifference(selectedTrip.start_date, selectedTrip.end_date) + 1 }).map((_, idx) => (
                  <option key={idx} value={`day${idx + 1}`}>
                    {idx + 1}일차
                  </option>
                ))}
              </select>
            </>
          )}
          
          {selectedTrip && selectedDay && (
            <div className="button-group">
              <button 
                className="confirm-button"
                onClick={() => handleAddPlace(showTripSelector, selectedTrip._id, selectedDay)}
              >
                추가하기
              </button>
              <button 
                className="cancel-button"
                onClick={() => {
                  setShowTripSelector(false);
                  setSelectedTrip(null);
                  setSelectedDay(null);
                }}
              >
                취소
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const getDaysDifference = (startDate, endDate) => {
  const start = new Date(startDate);
  const end = new Date(endDate);
  return Math.ceil((end - start) / (1000 * 60 * 60 * 24));
};

export default MapSearch;