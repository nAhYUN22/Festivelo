import React, { useState, useRef, useEffect } from 'react';
import Calendar from 'react-calendar';
import axios from 'axios';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import 'react-calendar/dist/Calendar.css';
import '../styles/NewTrip.css';
import KoreaMap from './KoreaMap';
import { findRegion, DISTRICT_MAP } from '../constants/administrativeDistricts';

const API_URL = process.env.REACT_APP_SERVER_URL;

const NewTrip = ({ onClose, onTripCreate }) => {
    const { user } = useAuth();
    const [step, setStep] = useState(1);
    const [selectedDestination, setSelectedDestination] = useState('');
    const [dateRange, setDateRange] = useState([new Date(), new Date()]);
    const [tripName, setTripName] = useState('');
    const [searchKeyword, setSearchKeyword] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [isSearching, setIsSearching] = useState(false);

    const newTripRef = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (newTripRef.current && !newTripRef.current.contains(event.target)) {
                onClose();
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [onClose]);

    const handleNext = () => {
        if (!selectedDestination) {
            toast.error('여행지를 선택해주세요');
            return;
        }
        setStep(2);
    };

    const formatDate = (date) => {
        const d = new Date(date);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleSearch = (keyword) => {
        setSearchKeyword(keyword);

        if (!keyword.trim()) {
            setSearchResults([]);
            setIsSearching(false);
            return;
        }

        const normalizedKeyword = keyword.trim().replace(/\s+/g, ' ');

        const results = Object.keys(DISTRICT_MAP)
            .filter(key => key.toLowerCase().includes(normalizedKeyword.toLowerCase()))
            .slice(0, 10);

        setSearchResults(results);
        setIsSearching(true);
    };

    const handleLocationSelect = (location) => {
        const result = findRegion(location);
        console.log(result);
        if (result) {
            setSearchKeyword(result.city);
            setSelectedDestination(result.city);
            setSearchResults([]);
            setIsSearching(false);
        }
    };

    const searchRef = useRef(null);
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (searchRef.current && !searchRef.current.contains(event.target)) {
                setIsSearching(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleSubmit = async () => {
        if (!dateRange[0] || !dateRange[1]) {
            toast.error('여행 기간을 선택해주세요');
            return;
        }

        try {
            const tripData = {
                name: tripName || `${selectedDestination} 여행`,
                start_date: formatDate(dateRange[0]),
                end_date: formatDate(dateRange[1]),
                create_by: user,
                location: selectedDestination,
                collaborators: []
            };

            const response = await axios.post(`${API_URL}/api/trips/trips`, tripData);

            if (response.status === 201 || response.status === 200) {
                toast.success('새로운 여행이 생성되었습니다!');
                onTripCreate(response.data);
                onClose();
            }
        } catch (error) {
            console.error('여행 생성 중 오류 발생:', error);
            toast.error('여행 생성에 실패했습니다. 다시 시도해주세요.');
        }
    };

    return (
        <div className="new-trip-container" ref={newTripRef}>
            <div className="new-trip-header">
                <h2>새로운 여행 만들기</h2>
                <button className="close-button" onClick={onClose}>×</button>
            </div>

            {step === 1 ? (
                <div className="destination-selection">
                    <h3>어디로 떠나시나요?</h3>
                    <div className="location-search" ref={searchRef}>
                        <input
                            type="text"
                            placeholder="지도에서 선택하거나 지역을 검색하세요"
                            value={searchKeyword}
                            onChange={(e) => handleSearch(e.target.value)}
                            className="location-search-input"
                        />
                        {isSearching && searchResults.length > 0 && (
                            <ul className="search-results">
                                {searchResults.map((result, index) => (
                                    <li
                                        key={index}
                                        onClick={() => handleLocationSelect(result)}
                                        className="search-result-item"
                                    >
                                        {result}
                                    </li>
                                ))}
                            </ul>
                        )}
                        {isSearching && searchResults.length === 0 && (
                            <div className="no-results">
                                검색 결과가 없습니다
                            </div>
                        )}
                    </div>
                    <KoreaMap
                        onRegionSelect={(region) => {
                            setSelectedDestination(region);
                            setSearchKeyword(region);
                        }}
                        selectedRegion={selectedDestination}
                    />
                    <button
                        className="next-button"
                        onClick={handleNext}
                    >
                        다음
                    </button>
                </div>
            ) : (
                <div className="date-selection">
                    <input
                        type="text"
                        placeholder="여행 이름을 작성해주세요 (선택)"
                        value={tripName}
                        onChange={(e) => setTripName(e.target.value)}
                        className="trip-name-input"
                    />
                    <h3>언제 떠나시나요?</h3>
                    <Calendar
                        onChange={setDateRange}
                        value={dateRange}
                        selectRange={true}
                        minDate={new Date()}
                        className="trip-calendar"
                    />
                    <div className="selected-dates">
                        <p>
                            {dateRange[0] && dateRange[1] ? (
                                <>
                                    {dateRange[0].toLocaleDateString()} ~ {dateRange[1].toLocaleDateString()}
                                    <br />
                                    ({Math.ceil((dateRange[1] - dateRange[0]) / (1000 * 60 * 60 * 24))}일간)
                                </>
                            ) : (
                                '날짜를 선택해주세요'
                            )}
                        </p>
                    </div>
                    <div className="button-group">
                        <button
                            className="back-button"
                            onClick={() => setStep(1)}
                        >
                            이전
                        </button>
                        <button
                            className="submit-button"
                            onClick={handleSubmit}
                        >
                            여행 만들기
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default NewTrip;