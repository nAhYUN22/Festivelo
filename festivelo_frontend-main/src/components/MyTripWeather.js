import React, { useEffect, useState } from 'react';
import axios from 'axios';
import '../styles/MyTripWeather.css';

const MyTripWeather = ({ location }) => {
    const [weatherData, setWeatherData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const cityMapping = {
        '서울특별시': 'Seoul',
        '부산광역시': 'Busan',
        '대구광역시': 'Daegu',
        '인천광역시': 'Incheon',
        '광주광역시': 'Gwangju',
        '대전광역시': 'Daejeon',
        '울산광역시': 'Busan',
        '세종특별자치시': 'Daejeon',
        '경기도': 'Seoul',
        '강원특별자치도': 'Seoul',
        '충청북도': 'Daejeon',
        '충청남도': 'Daejeon',
        '전라북도': 'Gwangju',
        '전라남도': 'Gwangju',
        '경상북도': 'Daegu',
        '경상남도': 'Busan',
        '제주특별자치도': 'Gwangju'
    };

    useEffect(() => {
        const fetchWeather = async () => {
            try {
                if (!location) {
                    throw new Error('위치 정보가 필요합니다.');
                }

                setLoading(true);
                setError(null);
                const API_KEY = process.env.REACT_APP_OPENWEATHER_API_KEY;

                if (!API_KEY) {
                    throw new Error('API 키가 설정되지 않았습니다.');
                }

                const mainRegion = location.split(' ')[0];
                const cityName = cityMapping[mainRegion] || mainRegion;
                console.log('City name for API:', cityName);

                const response = await axios.get(
                    `https://api.openweathermap.org/data/2.5/forecast?q=${cityName}&appid=${API_KEY}&units=metric&lang=kr`
                );

                const dailyData = response.data.list.reduce((acc, item) => {
                    const date = new Date(item.dt * 1000).toLocaleDateString();
                    if (!acc[date]) {
                        acc[date] = item;
                    }
                    return acc;
                }, {});

                setWeatherData(Object.values(dailyData).slice(0, 3));
                setLoading(false);
            } catch (error) {
                console.error('날씨 데이터 가져오기 실패:', error);
                setError(error.message || '날씨 데이터를 가져오는데 실패했습니다.');
                setLoading(false);
            }
        };

        fetchWeather();
    }, [location]);

    if (error) return <div className="weather-error">{error}</div>;

    return (
        <div className="weather-container">
            <h4 className="weather-title">
                {loading ? (
                    <div className="weather-shimmer-text"></div>
                ) : (
                    `${location}의 날씨는?`
                )}
            </h4>
            <div className="weather-days">
                {loading ? (
                    Array(3).fill(null).map((_, index) => (
                        <div>
                        </div>
                    ))
                ) : (
                    weatherData.map((day, index) => (
                        <div key={index} className="weather-day">
                            <div className="weather-date">
                                {index === 0 ? '오늘' :
                                    index === 1 ? '내일' :
                                        '모레'}
                            </div>
                            <div className="weather-info">
                                <img
                                    src={`https://openweathermap.org/img/wn/${day.weather[0].icon}.png`}
                                    alt={day.weather[0].description}
                                />
                                <span className="temperature">{Math.round(day.main.temp)}°</span>
                            </div>
                            <div className="weather-desc">{day.weather[0].description}</div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default MyTripWeather;