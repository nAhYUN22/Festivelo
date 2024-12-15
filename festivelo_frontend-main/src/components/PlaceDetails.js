import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { FaMapMarkerAlt, FaPhoneAlt, FaCalendarAlt, FaClock, FaParking, FaMoneyBillWave } from 'react-icons/fa'; // 필요한 아이콘 가져오기
import '../styles/PlaceDetails.css';
import PlaceReview from './PlaceReview';
import ShimmerImage from './ShimmerImage';

const PlaceDetails = ({ place, onClose }) => {
  const [placeDetails, setPlaceDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const detailsRef = useRef(null);

  const TOUR_API_KEY = process.env.REACT_APP_OPEN_API_KEY;
  const TOUR_API_BASE_URL = 'https://apis.data.go.kr/B551011/KorService1';

  useEffect(() => {
    const fetchPlaceDetails = async () => {
      try {
        const url = `${TOUR_API_BASE_URL}/detailIntro1?` +
          `ServiceKey=${TOUR_API_KEY}` +
          `&contentId=${place.id}` +
          `&contentTypeId=${place.type}` +
          `&MobileOS=ETC` +
          `&MobileApp=AppTest` +
          `&_type=json`;

        const response = await axios.get(url);

        if (response.data.response.header.resultCode !== "0000") {
          throw new Error(`Error Code: ${response.data.response.header.resultCode}, Message: ${response.data.response.header.resultMsg}`);
        }

        console.log(response.data.response.body.items.item[0]);

        const data = response.data.response.body.items.item[0];
        setPlaceDetails(data);
      } catch (error) {
        console.error('Error fetching place details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPlaceDetails();
  }, [place.id, place.type]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (detailsRef.current && !detailsRef.current.contains(event.target)) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [onClose]);

  const renderHTML = (htmlString) => {
    if (!htmlString) return null;

    return htmlString.split('<br>').map((text, index, array) => (
      <React.Fragment key={index}>
        {text}
        {index < array.length - 1 && <br />}
      </React.Fragment>
    ));
  };

  if (loading) {
    return <p>로딩 중...</p>;
  }

  if (!placeDetails) {
    return <p>상세 정보를 불러올 수 없습니다.</p>;
  }

  return (
    <div className="place-detail" ref={detailsRef}>
      <h2>{place.name}</h2>
      {place.image && (
        <ShimmerImage
          src={place.image}
          alt={place.name}
          className="detail-image"
        />
      )}
      <div className="detail-info">
        <p className="location">
          <FaMapMarkerAlt className="icon" />
          <strong>주소:</strong>
          <span>{renderHTML(place.location || place.address)}</span>
        </p>
        {place.tel && (
          <p className="tel">
            <FaPhoneAlt className="icon" />
            <strong>전화:</strong>
            <span>{renderHTML(place.tel)}</span>
          </p>
        )}

        {/* 관광지일 경우 */}
        {(place.type === 12 || place.type === '12') && (
          <>
            {placeDetails.restdate && (
              <p>
                <FaCalendarAlt className="icon" />
                <strong>쉬는날:</strong>
                <span>{renderHTML(placeDetails.restdate)}</span>
              </p>
            )}
            {placeDetails.usetime && (
              <p>
                <FaClock className="icon" />
                <strong>이용시간:</strong>
                <span>{renderHTML(placeDetails.usetime)}</span>
              </p>
            )}
            {placeDetails.parking && (
              <p>
                <FaParking className="icon" />
                <strong>주차장:</strong>
                <span>{renderHTML(placeDetails.parking)}</span>
              </p>
            )}
          </>
        )}

        {/* 지역 축제일 경우 */}
        {(place.type === 15 || place.type === '15') && (
          <>
            {placeDetails.eventstartdate && placeDetails.eventenddate && (
              <p>
                <FaCalendarAlt className="icon" />
                <strong>기간:</strong>
                <span>{`${placeDetails.eventstartdate} ~ ${placeDetails.eventenddate}`}</span>
              </p>
            )}
            {placeDetails.sponsor1 && (
              <p>
                <FaPhoneAlt className="icon" />
                <strong>주최자:</strong>
                <span>{renderHTML(placeDetails.sponsor1)}</span>
              </p>
            )}
            {placeDetails.usetimefestival && (
              <p>
                <FaMoneyBillWave className="icon" />
                <strong>이용 요금:</strong>
                <span>{renderHTML(placeDetails.usetimefestival)}</span>
              </p>
            )}
          </>
        )}
      </div>
      <PlaceReview placeId={place.id} placeName={place.name} />
    </div>
  );
};

export default PlaceDetails;