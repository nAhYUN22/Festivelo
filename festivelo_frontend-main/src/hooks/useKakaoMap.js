import { useEffect, useState, useCallback, useRef } from 'react';

const UseKakaoMap = (initialLocation) => {
    const [map, setMap] = useState(null);
    const [markers, setMarkers] = useState([]);
    const mapContainerRef = useRef(null);
    const scriptLoadedRef = useRef(false);
    const markersRef = useRef(markers);
    const mapInstanceRef = useRef(null);

    useEffect(() => {
        markersRef.current = markers;
    }, [markers]);

    const handleZoomChange = useCallback(() => {
        const level = mapInstanceRef.current.getLevel();
        console.log('Current zoom level:', level);
        markersRef.current.forEach(({ marker, overlay }) => {
            if (overlay) {
                overlay.setMap(level <= 7 ? mapInstanceRef.current : null);
            }
        });
    }, []);

    const initializeMap = useCallback(() => {
        if (!window.kakao || !window.kakao.maps) return;

        const container = document.getElementById('map');
        if (!container) return;

        try {
            const options = {
                center: new window.kakao.maps.LatLng(
                    initialLocation.latitude,
                    initialLocation.longitude
                ),
                level: 5
            };
            const mapInstance = new window.kakao.maps.Map(container, options);
            mapInstanceRef.current = mapInstance;

            window.kakao.maps.event.addListener(mapInstance, 'zoom_changed', handleZoomChange);

            setMap(mapInstance);
        } catch (error) {
            console.error('Error creating map:', error);
        }
    }, [initialLocation, handleZoomChange]);

    const clearMap = useCallback(() => {
        if (!map) return;

        markers.forEach(marker => {
            if (marker.marker) {
                marker.marker.setMap(null);
            }
            if (marker.overlay) {
                marker.overlay.setMap(null);
                const element = marker.overlay.getContent();
                if (element && element.parentNode) {
                    element.parentNode.removeChild(element);
                }
            }
        });
        setMarkers([]);

        if (map.polyline) {
            map.polyline.setMap(null);
            map.polyline = null;
        }

        if (map.infowindow) {
            map.infowindow.close();
            map.infowindow = null;
        }

        const clusterers = map.markerClusterers || [];
        clusterers.forEach(clusterer => {
            if (clusterer) {
                clusterer.clear();
                clusterer.setMap(null);
            }
        });
        map.markerClusterers = [];
    }, [map, markers]);

    const loadKakaoMapScript = useCallback(() => {
        if (scriptLoadedRef.current) {
            console.log('Script already loaded');
            initializeMap();
            return;
        }

        console.log('Loading Kakao Maps script...');
        const script = document.createElement('script');
        script.src = `https://dapi.kakao.com/v2/maps/sdk.js?appkey=${process.env.REACT_APP_KAKAO_MAP_APP_KEY}&libraries=services,clusterer&autoload=false`;
        script.async = true;

        script.onload = () => {
            console.log('Script loaded, initializing Kakao Maps...');
            window.kakao.maps.load(() => {
                console.log('Kakao Maps loaded successfully');
                scriptLoadedRef.current = true;
                initializeMap();
            });
        };

        script.onerror = (error) => {
            console.error('Error loading Kakao Maps script:', error);
        };

        document.head.appendChild(script);
    }, [initializeMap]);

    useEffect(() => {
        loadKakaoMapScript();
        return () => {
            if (map) {
                window.kakao.maps.event.removeListener(map, 'zoom_changed');
                clearMap();
                setMap(null);
            }
        };
    }, []);

    return {
        map,
        setMap,
        markers,
        setMarkers,
        clearMap,
        mapContainerRef
    };
};

export default UseKakaoMap;
