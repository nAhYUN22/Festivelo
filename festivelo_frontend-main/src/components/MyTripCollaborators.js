import React, { useState } from 'react';
import axios from 'axios';
import { FaUserPlus, FaUsers } from 'react-icons/fa';
import { useAuth } from '../App';
import { toast } from 'react-toastify';
import '../styles/MyTripCollaborators.css';

const API_URL = process.env.REACT_APP_SERVER_URL;

const MyTripCollaborators = ({ tripId, collaborators, ownerId }) => {
    const { user } = useAuth();
    const [showAddForm, setShowAddForm] = useState(false);
    const [email, setEmail] = useState('');

    const handleAddCollaborator = async (e) => {
        e.preventDefault();
        try {
            const response = await axios.post(`${API_URL}/api/trips/trips/${tripId}/collaborators`, {
                collaboratorEmail: email
            });
            
            if (response.status === 200) {
                toast.success('공동작업자가 추가되었습니다.');
                setEmail('');
                setShowAddForm(false);
                window.location.reload();
            }
        } catch (error) {
            if (error.response?.status === 404) {
                toast.error('해당 이메일의 사용자를 찾을 수 없습니다.');
            } else if (error.response?.status === 400) {
                toast.error('이미 공동작업자로 등록된 사용자입니다.');
            } else {
                toast.error('공동작업자 추가에 실패했습니다.');
            }
            console.error('공동작업자 추가 실패:', error.response?.data);
        }
    };

    return (
        <div className="collaborators-container">
            <div className="collaborators-header">
                <div className="collaborators-title">
                    <FaUsers className="icon" />
                    <span>공동작업자 ({collaborators.length}명)</span>
                </div>
                {user._id === ownerId && (
                    <button 
                        className="add-collaborator-btn"
                        onClick={() => setShowAddForm(!showAddForm)}
                    >
                        <FaUserPlus />
                    </button>
                )}
            </div>
            
            <div className="collaborators-list">
                {collaborators.map(collaborator => (
                    <div key={collaborator._id} className="collaborator-item">
                        <span>{collaborator.name}</span>
                        <span className="collaborator-email">{collaborator.email}</span>
                    </div>
                ))}
            </div>

            {showAddForm && (
                <form onSubmit={handleAddCollaborator} className="add-collaborator-form">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="이메일 주소를 입력하세요"
                        required
                    />
                    <button type="submit">추가</button>
                </form>
            )}
        </div>
    );
};

export default MyTripCollaborators; 