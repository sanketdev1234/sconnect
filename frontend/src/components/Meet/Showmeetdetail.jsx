import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from "axios";

export default function ShowMeetDetail() {
  const { id } = useParams();
  const [meet, setmeet] = useState({});
  const [participants, setParticipants] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    async function getmeet() {
      try {
        const response = await axios.get(`/meeting/${id}/detail`, { withCredentials: true });
        console.log("the response ie meet is ", response.data);
        setmeet(response.data);
        setParticipants(response.data.Participants ?? []);
        setChats(response.data.Chats ?? []);
      } catch (err) {
        console.log("the error is ", err);
      }
    }
    getmeet();
  }, [id]);

  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <>
      <style>{`
        body {
          margin: 0;
          padding: 0;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', sans-serif;
          background: #f3f2f0;
        }

        .meeting-detail-container {
          min-height: 100vh;
          background: #f3f2f0;
          padding: 24px;
        }

        .meeting-detail-content {
          max-width: 1128px;
          margin: 0 auto;
        }

        .detail-header {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #e0e0e0;
        }

        .meeting-title {
          font-size: 24px;
          font-weight: 600;
          color: #000000;
          margin: 0 0 16px 0;
        }

        .meeting-info {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
          gap: 16px;
        }

        .info-item {
          padding: 12px 0;
        }

        .info-label {
          font-size: 12px;
          color: rgba(0, 0, 0, 0.6);
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }

        .info-value {
          font-size: 14px;
          color: #000000;
          font-weight: 500;
        }

        .section {
          background: white;
          padding: 24px;
          border-radius: 8px;
          margin-bottom: 24px;
          border: 1px solid #e0e0e0;
        }

        .section-title {
          font-size: 18px;
          font-weight: 600;
          color: #000000;
          margin: 0 0 16px 0;
          padding-bottom: 12px;
          border-bottom: 1px solid #e0e0e0;
        }

        .participants-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
        }

        .participant-card {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 4px;
          border: 1px solid #e0e0e0;
        }

        .participant-name {
          font-size: 16px;
          font-weight: 600;
          color: #000000;
          margin-bottom: 8px;
        }

        .participant-detail {
          font-size: 14px;
          color: rgba(0, 0, 0, 0.6);
          margin-bottom: 4px;
        }

        .chats-list {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .chat-item {
          background: #f9f9f9;
          padding: 16px;
          border-radius: 4px;
          border-left: 3px solid #0a66c2;
        }

        .chat-author {
          font-size: 14px;
          font-weight: 600;
          color: #0a66c2;
          margin-bottom: 8px;
        }

        .chat-content {
          font-size: 14px;
          color: #000000;
          line-height: 1.5;
        }

        .empty-state {
          text-align: center;
          padding: 40px 20px;
          color: rgba(0, 0, 0, 0.6);
        }

        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 16px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }


        @media (max-width: 768px) {
          .meeting-detail-container {
            padding: 16px;
          }

          .meeting-info {
            grid-template-columns: 1fr;
          }

          .participants-grid {
            grid-template-columns: 1fr;
          }
        }
      `}</style>

      <div className="meeting-detail-container">
        <div className="meeting-detail-content">
          {/* Header */}
          <div className="detail-header">
            <div className="meeting-title">
              Meeting Details
            </div>
            <div className="meeting-info">
              <div className="info-item">
                <div className="info-label">Meeting ID</div>
                <div className="info-value">{meet.Joining_id || 'N/A'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Host</div>
                <div className="info-value">{meet.Hosted_by?.display_name || 'Unknown'}</div>
              </div>
              <div className="info-item">
                <div className="info-label">Start Time</div>
                <div className="info-value">{formatDateTime(meet.StartAt)}</div>
              </div>
              <div className="info-item">
                <div className="info-label">End Time</div>
                <div className="info-value">{meet.EndAt ? formatDateTime(meet.EndAt) : 'N/A'}</div>
              </div>
            </div>
          </div>

          {/* Participants Section */}
          <div className="section">
            <h2 className="section-title">
              Participants ({participants.length})
            </h2>
            {participants.length === 0 ? (
              <div className="empty-state">
                No participants found
              </div>
            ) : (
              <div className="participants-grid">
                {participants.map((participant, index) => (
                  <div key={index} className="participant-card">
                    <div className="participant-name">
                      {participant.display_name}
                    </div>
                    <div className="participant-detail">
                      <strong>Name:</strong> {participant.full_name || 'N/A'}
                    </div>
                    <div className="participant-detail">
                      <strong>Email:</strong> {participant.email || 'N/A'}
                    </div>
                    <div className="participant-detail">
                      <strong>Gender:</strong> {participant.gender || 'N/A'}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Chats Section */}
          <div className="section">
            <h2 className="section-title">
              Chat Messages ({chats.length})
            </h2>
            {chats.length === 0 ? (
              <div className="empty-state">
                No chat messages found
              </div>
            ) : (
              <div className="chats-list">
                {chats.map((chat, index) => (
                  <div key={index} className="chat-item">
                    <div className="chat-author">
                      {chat.Author?.display_name || 'Unknown'}
                    </div>
                    <div className="chat-content">
                      {chat.Content}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}