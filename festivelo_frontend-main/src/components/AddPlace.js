import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import '../styles/AddPlace.css';
import { FaPhoneAlt, FaStar, FaPlus, FaCalendarAlt, FaUser, FaTicketAlt } from 'react-icons/fa';
import axios from 'axios';
import { toast } from 'react-toastify';
import { AREA_CODE } from '../constants/areaCode';
import { useAuth } from '../App';

const API_URL = process.env.REACT_APP_SERVER_URL;

const AddPlace = ({ tripId, day, onBack, onPlaceSelect, tripStartDate, tripEndDate, location, onSuccess }) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('attractions');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [favorites, setFavorites] = useState(new Set());
  const [favoriteItems, setFavoriteItems] = useState([]);
  const [debouncedKeyword, setDebouncedKeyword] = useState(searchKeyword);
  const [lastApiCall, setLastApiCall] = useState(0);
  const API_CALL_INTERVAL = 1000;

  const [tabStates, setTabStates] = useState({
    attractions: {
      places: [],
      loading: false,
      pageNo: 1,
      hasMore: true,
      totalCount: 0
    },
    festivals: {
      places: [],
      loading: false,
      pageNo: 1,
      hasMore: true,
      totalCount: 0
    }
  });

  const updateTabState = (tab, newState) => {
    setTabStates(prev => ({
      ...prev,
      [tab]: {
        ...prev[tab],
        ...newState
      }
    }));
  };

  const getAreaCode = (location) => {
    const sido = location.split(/[\s,]/)[0];
    const areaCode = AREA_CODE[sido];

    console.log('추출된 지역명:', sido);
    console.log('지역 코드:', areaCode);

    if (!areaCode) {
      console.warn(`지역 코드를 찾을 수 없습니다: ${sido}`);
      return null;
    }

    return areaCode;
  };

  useEffect(() => {
    const currentState = tabStates[activeTab];
    if (currentState.pageNo > 1 && currentState.hasMore) {
      searchPlaces(currentState.pageNo, false);
    }
  }, [tabStates[activeTab].pageNo]);

  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    if (tabStates[newTab].places.length === 0) {
      searchPlaces(1, true);
    }
  };

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedKeyword(searchKeyword);
    }, 300);
    return () => clearTimeout(handler);
  }, [searchKeyword]);

  useEffect(() => {
    const currentState = tabStates[activeTab];
    console.log('페이지 번호:', currentState.pageNo);
    console.log('로딩 상태:', currentState.loading);
    console.log('더 불러올 데이터 여부:', currentState.hasMore);
    console.log('현재 탭:', activeTab);
    console.log('현재 탭의 데이터 개수:', currentState.places.length);
  }, [tabStates, activeTab]);

  useEffect(() => {
    updateTabState(activeTab, {
      pageNo: 1,
      hasMore: true
    });

    if (tabStates[activeTab].places.length === 0) {
      searchPlaces(1, true);
    }
  }, [activeTab]);

  useEffect(() => {
    const fetchFavorites = async () => {
      if (!user) return;

      try {
        const response = await axios.get(`${API_URL}/favorites?userId=${user._id}`);
        const favoriteItems = response.data.data;

        // 중복된 placeId 제거 (Set 사용)
        const uniqueFavorites = favoriteItems.reduce((acc, curr) => {
          if (!acc.some(item => item.placeId === curr.placeId)) {
            acc.push(curr);
          }
          return acc;
        }, []);

        // 즐겨찾기 Set 업데이트 (placeId 기준)
        const favoriteIds = new Set(uniqueFavorites.map(item => item.placeId));
        setFavorites(favoriteIds);

        // 즐겨찾기 장소 데이터 저장
        const favorites = uniqueFavorites.map(item => ({
          id: item.placeId,
          name: item.placeName,
          location: item.placeAddress,
          type: item.typeId,
          areaCode: item.areaCode,
          coordinates: item.coordinates,
          isFavorite: true
        }));

        setFavoriteItems(favorites);
      } catch (error) {
        console.error('즐겨찾기 불러오기 실패:', error);
        console.error('에러 상세:', error.response?.data);
      }
    };

    fetchFavorites();
  }, [user]);

  const observerRef = useRef();
  const loadingRef = useRef(null);

  const TOUR_API_KEY = process.env.REACT_APP_OPEN_API_KEY;
  const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService1';

  const CONTENT_TYPE = {
    attractions: '12',
    festivals: '15'
  };

  const filteredPlaces = useMemo(() => {
    const currentState = tabStates[activeTab];
    if (!currentState.places) return [];

    // 검색어가 있을 때는 검색 결과만 반환
    if (searchKeyword.trim()) {
      return currentState.places;
    }

    // 검색어가 없을 때만 즐겨찾기와 일반 항목 표시
    const currentTypeId = CONTENT_TYPE[activeTab];
    const currentAreaCode = getAreaCode(location);
    
    const matchingFavorites = favoriteItems.filter(place =>
      String(place.type) === currentTypeId &&
      place.areaCode === currentAreaCode
    );

    const nonFavoriteItems = currentState.places.filter(place =>
      !favorites.has(place.id)
    );

    return [...matchingFavorites, ...nonFavoriteItems];
  }, [tabStates[activeTab].places, favoriteItems, activeTab, location, favorites, searchKeyword]);

  const toggleFavorite = async (place) => {
    if (!user) {
      toast.error('로그인이 필요한 서비스입니다.');
      return;
    }

    try {
      if (favorites.has(place.id)) {
        // 즐겨찾기 삭제 로직
        const response = await axios.delete(`${API_URL}/favorites/${place.id}`, {
          data: {
            userId: user._id
          }
        });

        if (response.status === 200) {
          setFavorites(prev => {
            const newFavorites = new Set(prev);
            newFavorites.delete(place.id);
            return newFavorites;
          });

          setFavoriteItems(prev => prev.filter(item => item.id !== place.id));
          toast.success('즐겨찾기가 삭제되었습니다.');
        }
      } else {
        // 즐겨찾기 추가 로직
        const areaCode = getAreaCode(place.location);

        const favoriteData = {
          userId: user._id,
          placeId: String(place.id),
          placeName: place.name,
          placeAddress: place.location,
          areaCode: areaCode,
          typeId: Number(place.type || 12),
          coordinates: place.coordinates
        };

        const response = await axios.post(`${API_URL}/favorites`, favoriteData);

        if (response.status === 201) {
          setFavorites(prev => {
            const newFavorites = new Set(prev);
            newFavorites.add(place.id);
            return newFavorites;
          });

          setFavoriteItems(prev => [...prev, {
            id: place.id,
            name: place.name,
            location: place.location,
            type: place.type || 12,
            areaCode: areaCode,
            coordinates: place.coordinates,
            isFavorite: true
          }]);

          toast.success('즐겨찾기에 추가되었습니다.');
        }
      }
    } catch (error) {
      console.error('즐겨찾기 처리 실패:', error);
      console.error('에러 상세:', error.response?.data);
      toast.error('즐겨찾기 처리에 실패했습니다.');
    }
  };

  const observerCallback = useCallback(entries => {
    const target = entries[0];
    const currentState = tabStates[activeTab];

    if (target.isIntersecting && currentState.hasMore && !currentState.loading) {
      const now = Date.now();
      const timeToWait = API_CALL_INTERVAL - (now - lastApiCall);

      if (timeToWait <= 0) {
        updateTabState(activeTab, {
          pageNo: currentState.pageNo + 1
        });
        setLastApiCall(now);
        console.log('API 호출 준비 완료');
      } else {
        console.log(`API 호출 간격이 너무 짧습니다. ${timeToWait}ms 후 재시도...`);
        setTimeout(() => {
          updateTabState(activeTab, {
            pageNo: currentState.pageNo + 1
          });
          setLastApiCall(Date.now());
          console.log('대기 후 API 호출 준비 완료');
        }, timeToWait);
      }
    }
  }, [tabStates, activeTab, lastApiCall]);

  useEffect(() => {
    const observer = new IntersectionObserver(observerCallback, {
      threshold: 0.5,
      rootMargin: '100px'
    });
    observerRef.current = observer;

    const loadingElement = loadingRef.current;
    if (loadingElement) {
      observer.observe(loadingElement);
    }

    return () => observer.disconnect();
  }, [observerCallback, tabStates[activeTab].loading]);

  useEffect(() => {
    const loadingElement = loadingRef.current;
    const currentState = tabStates[activeTab];

    if (loadingElement && observerRef.current) {
      observerRef.current.observe(loadingElement);
    }

    return () => {
      if (loadingElement && observerRef.current) {
        observerRef.current.unobserve(loadingElement);
      }
    };
  }, [activeTab, tabStates[activeTab].loading]);

  useEffect(() => {
    const currentState = tabStates[activeTab];
    if (currentState.pageNo > 1 && currentState.hasMore) {
      searchPlaces(currentState.pageNo, false);
    }
  }, [tabStates[activeTab].pageNo]);

  const formatISODate = (isoDateString) => {
    const date = new Date(isoDateString);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const searchPlaces = async (page, isNewSearch, keyword = '') => {
    const currentState = tabStates[activeTab];
    if (currentState.loading || (!currentState.hasMore && !isNewSearch)) return;

    const formatDate = (dateString) => {
      if (!dateString) return null;
      const year = dateString.substring(0, 4);
      const month = dateString.substring(4, 6);
      const day = dateString.substring(6, 8);
      return `${year}-${month}-${day}`;
    };

    const areaCode = getAreaCode(location);
    if (!areaCode) {
      toast.error('올바른 지역 정보가 아닙니다.');
      return;
    }

    updateTabState(activeTab, { loading: true });
    try {
      let apiEndpoint;
      let apiParams;

      if (activeTab === 'festivals') {
        apiEndpoint = 'searchFestival1';
        const formattedTripStartDate = formatISODate(tripStartDate).replace(/-/g, '');
        const formattedTripEndDate = formatISODate(tripEndDate).replace(/-/g, '');
        
        console.log('축제 검색 파라미터:', {
          시작일: formattedTripStartDate,
          종료일: formattedTripEndDate,
          지역코드: areaCode,
          페이지: page,
          키워드: keyword
        });

        apiParams = keyword
          ? `&keyword=${encodeURIComponent(keyword)}`
          : `&eventStartDate=${formattedTripStartDate}&eventEndDate=${formattedTripEndDate}`;
      } else {
        apiEndpoint = keyword ? 'searchKeyword1' : 'areaBasedList1';
        apiParams = keyword ? `&keyword=${encodeURIComponent(keyword)}` : '';
      }

      const apiUrl = `${TOUR_API_BASE_URL}/${apiEndpoint}` +
        `?ServiceKey=${TOUR_API_KEY}` +
        `${activeTab !== 'festivals' ? `&contentTypeId=${CONTENT_TYPE[activeTab]}` : ''}` +
        `&areaCode=${areaCode}` +
        `&listYN=Y` +
        `&MobileOS=ETC` +
        `&MobileApp=AppTest` +
        `&arrange=E` +
        `&numOfRows=${CONTENT_TYPE[activeTab] === '15' ? 30 : 20}` +
        `&pageNo=${page}` +
        apiParams +
        `&_type=json`;

      console.log('API 요청 URL:', apiUrl);

      const response = await fetch(apiUrl);
      const text = await response.text();
      
      console.log('API 응답 원본:', text);

      if (text.includes('<OpenAPI_ServiceResponse>')) {
        console.error('API 에러 응답 발생');
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(text, 'text/xml');
        const errorMsg = xmlDoc.querySelector('returnAuthMsg')?.textContent;
        const reasonCode = xmlDoc.querySelector('returnReasonCode')?.textContent;

        let userErrorMsg = '서비스 오류가 발생했습니다. 잠시 후 다시 시도해주세요.';
        if (errorMsg === 'LIMITED_NUMBER_OF_SERVICE_REQUESTS_EXCEEDS_ERROR') {
          userErrorMsg = '일일 API 호출 한도를 초과과습니다. 잠시 후 다시 시도해주세요.';
        }

        console.log(userErrorMsg);

        updateTabState(activeTab, {
          loading: false,
          hasMore: false,
          error: userErrorMsg
        });
        return;
      }

      const data = JSON.parse(text);
      console.log('파싱된 API 응답:', data);

      const items = data.response.body.items.item || [];

      if (activeTab === 'festivals') {
        const newPlaces = items.map(item => {
          console.log('축제 아이템 데이터:', item);
          return {
            id: item.contentid,
            type: item.contenttypeid,
            name: item.title,
            location: `${item.addr1} ${item.addr2 || ''}`.trim(),
            coordinates: {
              lat: parseFloat(item.mapy),
              lng: parseFloat(item.mapx)
            },
            image: item.firstimage,
            tel: item.tel,
            dist: item.dist,
            eventStartDate: formatDate(item.eventstartdate),
            eventEndDate: formatDate(item.eventenddate),
            sponsor: item.sponsor1,
            usetimefestival: item.usetimefestival
          };
        });

        console.log('변환된 축제 데이터:', newPlaces);

        updateTabState('festivals', {
          places: isNewSearch ? newPlaces : [...currentState.places, ...newPlaces],
          loading: false,
          hasMore: newPlaces.length > 0,
          totalCount: parseInt(data.response.body.totalCount)
        });
      } else {
        const total = parseInt(data.response.body.totalCount);
        const newPlaces = items.map(item => ({
          id: item.contentid,
          type: item.contenttypeid,
          name: item.title,
          location: `${item.addr1} ${item.addr2 || ''}`.trim(),
          coordinates: {
            lat: parseFloat(item.mapy),
            lng: parseFloat(item.mapx)
          },
          image: item.firstimage,
          tel: item.tel,
          dist: item.dist
        }));

        updateTabState('attractions', {
          places: isNewSearch ? newPlaces : [...currentState.places, ...newPlaces],
          loading: false,
          hasMore: newPlaces.length > 0,
          totalCount: total
        });
      }
    } catch (error) {
      console.error('Failed to fetch places:', error);
    } finally {
      updateTabState(activeTab, { loading: false });
    }
  };

  const handleAddPlace = async (place, e) => {
    e.stopPropagation();

    try {
      const tripResponse = await axios.get(`${API_URL}/api/trips/trips/${tripId}`);
      const currentTrip = tripResponse.data;
      const currentDayPlans = currentTrip.plans[day] || { places: [], route: [] };

      const newPlace = {
        id: place.id,
        type: place.type || 12,
        name: place.name,
        address: place.location,
        coordinates: place.coordinates
      };

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

      if (response.status === 200 || response.status === 201) {
        // toast.success('장소가 성공으로 추가되었습니다.');
        onSuccess?.();
      }
    } catch (error) {
      console.error('장소 추가 실패:', error);
      toast.error(error.response?.data?.message || '장소 추가에 실패했습니다.');
    }
  };

  useEffect(() => {
    if (debouncedKeyword) {
      // 검색어가 있을 때는 첫 페이지부터 새로 검색
      updateTabState(activeTab, {
        places: [],
        pageNo: 1,
        hasMore: true
      });
      searchPlaces(1, true, debouncedKeyword);
    } else if (tabStates[activeTab].places.length === 0) {
      // 검색어가 없고 장소 목록이 비어있을 때는 기본 지역 검색
      searchPlaces(1, true);
    }
  }, [debouncedKeyword, activeTab]);

  return (
    <div className="add-place">
      <div className="search-container">
        <input
          type="text"
          placeholder="장소를 검색하세요"
          value={searchKeyword}
          onChange={(e) => setSearchKeyword(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'attractions' ? 'active' : ''}`}
          onClick={() => handleTabChange('attractions')}
        >
          관광지
        </button>
        <button
          className={`tab ${activeTab === 'festivals' ? 'active' : ''}`}
          onClick={() => handleTabChange('festivals')}
        >
          지역축제
        </button>
      </div>

      <div className="add-places-list">
        {filteredPlaces.map((place) => (
          <div
            key={place.id}
            className="place-item"
            onClick={() => {
              if (place.coordinates) {
                onPlaceSelect(place);
              } else {
                toast.warning('해당 장소의 좌표 정보가 없습니다.');
              }
            }}
          >
            <div className="place-info">
              <h3>{place.name}</h3>
              <p className="location">{place.location}</p>
              {place.tel && <p className="tel"><FaPhoneAlt className="tel-icon" />{place.tel}</p>}
              {activeTab === 'festivals' && (
                <>
                  {place.eventStartDate && place.eventEndDate && (
                    <p className="festival-period">
                      <FaCalendarAlt className="calendar-icon" />
                      {place.eventStartDate} ~ {place.eventEndDate}
                    </p>
                  )}
                  {place.sponsor && (
                    <p className="festival-sponsor">
                      <FaUser className="sponsor-icon" />
                      {place.sponsor}
                    </p>
                  )}
                  {place.usetimefestival && (
                    <p className="festival-fee">
                      <FaTicketAlt className="fee-icon" />
                      <span dangerouslySetInnerHTML={{ __html: place.usetimefestival }} />
                    </p>
                  )}
                </>
              )}
            </div>
            <div className="button-group">
              <button
                className={`favorite-button ${favorites.has(place.id) ? 'active' : ''}`}
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(place);
                }}
              >
                <FaStar />
              </button>
              <button
                className="add-button"
                onClick={(e) => handleAddPlace(place, e)}
              >
                <FaPlus />
              </button>
            </div>
          </div>
        ))}
        <div ref={loadingRef} className="loading-indicator">
          {tabStates[activeTab].loading && (
            <div>
              <div className="spinner" />
              <div className="loading-text">로딩 중...</div>
            </div>
          )}
          {!tabStates[activeTab].loading && tabStates[activeTab].hasMore && (
            <div className="loading-text">
              스크롤하여 더 보기
            </div>
          )}
          {!tabStates[activeTab].hasMore && (
            <div className="loading-text">
              더 이상 결과가 없습니다
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AddPlace;
