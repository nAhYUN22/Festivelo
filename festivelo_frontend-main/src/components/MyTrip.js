import React, { useState, useMemo } from 'react';
import '../styles/MyTrip.css';
import MyTripWeather from './MyTripWeather';
import { FaArrowDown, FaEllipsisV, FaTrash } from 'react-icons/fa';
import MyTripCollaborators from './MyTripCollaborators';
import { toast } from 'react-toastify';

const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).replace(/\. /g, '.').slice(0, -1);
};

const MyTrip = ({ trips, onPlaceSelect, onAddPlace, onDirectionSelect, onTripSelect, onRouteChange, onTripDelete }) => {
    const [expandedTripId, setExpandedTripId] = useState(null);
    const [draggedItemId, setDraggedItemId] = useState(null);
    const [openMenuId, setOpenMenuId] = useState(null);
    const [editingTripId, setEditingTripId] = useState(null);
    const [newTripName, setNewTripName] = useState('');

    const sortedAndFilteredTrips = useMemo(() => {
        const currentDate = new Date();
        
        currentDate.setHours(0, 0, 0, 0);

        const sortedTrips = [...trips].sort((a, b) => 
            new Date(a.start_date) - new Date(b.start_date)
        );

        return {
            currentTrips: sortedTrips.filter(trip => 
                new Date(trip.end_date) >= currentDate
            ),
            pastTrips: sortedTrips.filter(trip => 
                new Date(trip.end_date) < currentDate
            )
        };
    }, [trips]);

    const handleDragStart = (e, placeId) => {
        setDraggedItemId(placeId);
        e.currentTarget.classList.add('dragging');
      };
    
      const handleDragEnd = (e) => {
        e.currentTarget.classList.remove('dragging');
        setDraggedItemId(null);
      };
    
      const handleDragOver = (e) => {
        e.preventDefault();
      };

      const handleDrop = (e, targetPlaceId, tripId, day, plan) => {
        e.preventDefault();
        
        if (!draggedItemId || draggedItemId === targetPlaceId) return;

        if (!plan || !Array.isArray(plan.route)) {
            console.error('Invalid plan or route');
            return;
        }

        const currentRoute = [...plan.route];
        const draggedIndex = currentRoute.indexOf(draggedItemId);
        const targetIndex = currentRoute.indexOf(targetPlaceId);

        if (draggedIndex === -1 || targetIndex === -1) {
            console.error('Invalid place IDs in route');
            return;
        }
        currentRoute.splice(draggedIndex, 1);
        currentRoute.splice(targetIndex, 0, draggedItemId);

        onRouteChange(tripId, day, currentRoute);
    };

    const handleMenuClick = (e, tripId) => {
        e.stopPropagation();
        setOpenMenuId(openMenuId === tripId ? null : tripId);
    };

    const handleDeleteClick = (e, tripId) => {
        e.stopPropagation();
        if (window.confirm('이 여행을 삭제하시겠습니까?')) {
            onTripDelete(tripId);
        }
        setOpenMenuId(null);
    };

    const handlePlaceDelete = (e, tripId, day, plan, placeId) => {
        e.stopPropagation();

        if (window.confirm('이 장소를 삭제하시겠습니까?')) {
            const updatedRoute = plan.route.filter(id => id !== placeId);
            const updatedPlaces = plan.places.filter(place => place.id !== placeId);
            
            onRouteChange(tripId, day, updatedRoute, updatedPlaces);
        }
    };

    const handleEditClick = (e, tripId, currentName) => {
        e.stopPropagation();
        setEditingTripId(tripId);
        setNewTripName(currentName);
        setOpenMenuId(null);
    };

    const handleEditSubmit = (e, tripId) => {
        e.preventDefault();
        e.stopPropagation();

        if (!newTripName.trim()) {
            toast.error('여행 이름을 입력해주세요');
            return;
        }

        onRouteChange(tripId, null, null, null, newTripName.trim());
        setEditingTripId(null);
        setNewTripName('');
    };

    return (
        <div className="trip-list">
            <div className="current-trips">
                {sortedAndFilteredTrips.currentTrips.map((trip) => (
                    <div key={trip._id} className="trip-container">
                        <div
                            className={`trip-header ${expandedTripId === trip._id ? 'expanded' : ''}`}
                            onClick={() => {
                                setExpandedTripId(expandedTripId === trip._id ? null : trip._id)
                                onTripSelect(trip);
                            }}
                        >
                            <div className="trip-title">
                                {editingTripId === trip._id ? (
                                    <form onSubmit={(e) => handleEditSubmit(e, trip._id)} onClick={e => e.stopPropagation()}>
                                        <input
                                            type="text"
                                            value={newTripName}
                                            onChange={(e) => setNewTripName(e.target.value)}
                                            autoFocus
                                            onBlur={(e) => handleEditSubmit(e, trip._id)}
                                        />
                                    </form>
                                ) : (
                                    <>
                                        <h3>{trip.name}</h3>
                                        <span className="trip-date">
                                            {formatDate(trip.start_date)} ~ {formatDate(trip.end_date)}
                                        </span>
                                    </>
                                )}
                            </div>
                            <div className="trip-menu">
                                <button 
                                    className="menu-button"
                                    onClick={(e) => handleMenuClick(e, trip._id)}
                                >
                                    <FaEllipsisV />
                                </button>
                                {openMenuId === trip._id && (
                                    <div className="menu-dropdown">
                                        <button onClick={(e) => handleDeleteClick(e, trip._id)}>
                                            여행 삭제
                                        </button>
                                        <button onClick={(e) => handleEditClick(e, trip._id, trip.name)}>
                                            여행 이름 수정
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {expandedTripId === trip._id && (
                            <div className="trip-details">
                                <MyTripCollaborators
                                    tripId={trip._id}
                                    collaborators={trip.collaborators || []}
                                    ownerId={trip.create_by._id || trip.create_by}
                                />
                                <MyTripWeather
                                    location={trip.location}
                                    startDate={trip.start_date}
                                    endDate={trip.end_date}
                                />
                                {Object.entries(trip.plans).map(([day, plan]) => {
                                    const sortedPlaces = plan.route.map(routeId =>
                                        plan.places.find(place => place.id === routeId)
                                    );

                                    return (
                                        <div key={day} className="day-container">
                                            <div className="day-header">
                                                <h4>{day.replace('day', '')}일차</h4>
                                                <button
                                                    className="add-place-button"
                                                    onClick={() => onAddPlace(trip._id, day)}
                                                >
                                                    장소 추가
                                                </button>
                                            </div>
                                            <div className="places-list">
                                                {sortedPlaces.map((place, index) => (
                                                    <React.Fragment key={place.id}>
                                                        <div
                                                            className="place-item"
                                                            draggable="true"
                                                            onDragStart={(e) => handleDragStart(e, place.id)}
                                                            onDragEnd={handleDragEnd}
                                                            onDragOver={handleDragOver}
                                                            onDrop={(e) => handleDrop(e, place.id, trip._id, day, plan)}
                                                            onClick={() => onPlaceSelect(place)}
                                                        >
                                                            <div className="place-number">{index + 1}</div>
                                                            <div className="place-info">
                                                                <h5 className="place-name">{place.name}</h5>
                                                                <p className="place-location">{place.address || place.location}</p>
                                                            </div>
                                                            <button
                                                                className="delete-place-button"
                                                                onClick={(e) => handlePlaceDelete(e, trip._id, day, plan, place.id)}
                                                            >
                                                                <FaTrash />
                                                            </button>
                                                        </div>
                                                        {index < sortedPlaces.length - 1 && (
                                                            <div className="direction-container">
                                                                <div className="dotted-arrow">
                                                                    <span className="dot"></span>
                                                                    <span className="dot"></span>
                                                                    <span className="arrow"><FaArrowDown /></span>
                                                                </div>
                                                                <button
                                                                    className="direction-button"
                                                                    onClick={() => onDirectionSelect(
                                                                        sortedPlaces[index],
                                                                        sortedPlaces[index + 1]
                                                                    )}
                                                                >
                                                                    길찾기
                                                                </button>
                                                            </div>
                                                        )}
                                                    </React.Fragment>
                                                ))}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {sortedAndFilteredTrips.pastTrips.length > 0 && (
                <div className="past-trips">
                    <h2 className="trip-section-title">지난 여행</h2>
                    {sortedAndFilteredTrips.pastTrips.map((trip) => (
                        <div key={trip._id} className="trip-container past">
                            <div
                                className={`trip-header ${expandedTripId === trip._id ? 'expanded' : ''}`}
                                onClick={() => {
                                    setExpandedTripId(expandedTripId === trip._id ? null : trip._id)
                                    onTripSelect(trip);
                                }}
                            >
                                <div className="trip-title">
                                    {editingTripId === trip._id ? (
                                        <form onSubmit={(e) => handleEditSubmit(e, trip._id)} onClick={e => e.stopPropagation()}>
                                            <input
                                                type="text"
                                                value={newTripName}
                                                onChange={(e) => setNewTripName(e.target.value)}
                                                autoFocus
                                                onBlur={(e) => handleEditSubmit(e, trip._id)}
                                            />
                                        </form>
                                    ) : (
                                        <>
                                            <h3>{trip.name}</h3>
                                            <span className="trip-date">
                                                {formatDate(trip.start_date)} ~ {formatDate(trip.end_date)}
                                            </span>
                                        </>
                                    )}
                                </div>
                                <div className="trip-menu">
                                    <button 
                                        className="menu-button"
                                        onClick={(e) => handleMenuClick(e, trip._id)}
                                    >
                                        <FaEllipsisV />
                                    </button>
                                    {openMenuId === trip._id && (
                                        <div className="menu-dropdown">
                                            <button onClick={(e) => handleDeleteClick(e, trip._id)}>
                                                여행 삭제
                                            </button>
                                            <button onClick={(e) => handleEditClick(e, trip._id, trip.name)}>
                                                여행 이름 수정
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {expandedTripId === trip._id && (
                                <div className="trip-details">
                                    <MyTripCollaborators
                                        tripId={trip._id}
                                        collaborators={trip.collaborators || []}
                                        ownerId={trip.create_by._id || trip.create_by}
                                    />
                                    <MyTripWeather
                                        location={trip.location}
                                        startDate={trip.start_date}
                                        endDate={trip.end_date}
                                    />
                                    {Object.entries(trip.plans).map(([day, plan]) => {
                                        const sortedPlaces = plan.route.map(routeId =>
                                            plan.places.find(place => place.id === routeId)
                                        );

                                        return (
                                            <div key={day} className="day-container">
                                                <div className="day-header">
                                                    <h4>{day.replace('day', '')}일차</h4>
                                                    <button
                                                        className="add-place-button"
                                                        onClick={() => onAddPlace(trip._id, day)}
                                                    >
                                                        장소 추가
                                                    </button>
                                                </div>
                                                <div className="places-list">
                                                    {sortedPlaces.map((place, index) => (
                                                        <React.Fragment key={place.id}>
                                                            <div
                                                                className="place-item"
                                                                draggable="true"
                                                                onDragStart={(e) => handleDragStart(e, place.id)}
                                                                onDragEnd={handleDragEnd}
                                                                onDragOver={handleDragOver}
                                                                onDrop={(e) => handleDrop(e, place.id, trip._id, day, plan)}
                                                                onClick={() => onPlaceSelect(place)}
                                                            >
                                                                <div className="place-number">{index + 1}</div>
                                                                <div className="place-info">
                                                                    <h5 className="place-name">{place.name}</h5>
                                                                    <p className="place-location">{place.location}</p>
                                                                </div>
                                                                <button
                                                                    className="delete-place-button"
                                                                    onClick={(e) => handlePlaceDelete(e, trip._id, day, plan, place.id)}
                                                                >
                                                                    <FaTrash />
                                                                </button>
                                                            </div>
                                                            {index < sortedPlaces.length - 1 && (
                                                                <div className="direction-container">
                                                                    <div className="dotted-arrow">
                                                                        <span className="dot"></span>
                                                                        <span className="dot"></span>
                                                                        <span className="arrow"><FaArrowDown /></span>
                                                                    </div>
                                                                    <button
                                                                        className="direction-button"
                                                                        onClick={() => onDirectionSelect(
                                                                            sortedPlaces[index],
                                                                            sortedPlaces[index + 1]
                                                                        )}
                                                                    >
                                                                        길찾기
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </React.Fragment>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default MyTrip;
