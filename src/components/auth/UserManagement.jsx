import React from 'react';
import { useTournament } from '../../context/TournamentContext';

const UserManagement = () => {
    const { pendingUsers, approveUser, rejectUser } = useTournament();

    return (
        <div className="user-management-container">
            <div className="admin-header card">
                <h2>User Management</h2>
                <p className="subtitle">Approve or reject pending account registrations</p>
            </div>

            <div className="pending-list">
                {pendingUsers.length === 0 ? (
                    <div className="empty-state card">
                        <p>No pending users at the moment. All set! ✅</p>
                    </div>
                ) : (
                    pendingUsers.map(u => (
                        <div key={u.username} className="user-row card">
                            <div className="user-info">
                                <span className="user-avatar">👤</span>
                                <div className="user-details">
                                    <span className="username">{u.username}</span>
                                    <span className="role-tag">Organizer</span>
                                </div>
                            </div>
                            <div className="user-actions">
                                <button
                                    className="btn btn-primary btn-sm"
                                    onClick={() => approveUser(u.username)}
                                >
                                    Approve
                                </button>
                                <button
                                    className="btn btn-danger btn-sm"
                                    onClick={() => {
                                        if (window.confirm(`Reject and delete user "${u.username}"?`)) {
                                            rejectUser(u.username);
                                        }
                                    }}
                                >
                                    Reject
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>

            <style jsx>{`
        .user-management-container {
          width: 100%;
          max-width: 800px;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .admin-header {
          padding: var(--space-lg);
        }
        .subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .pending-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-md);
        }
        .user-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          transition: transform 0.2s;
        }
        .user-row:hover {
          transform: translateY(-2px);
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .user-avatar {
          font-size: 1.5rem;
          background: #f1f3f5;
          width: 40px;
          height: 40px;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 50%;
        }
        .user-details {
          display: flex;
          flex-direction: column;
        }
        .username {
          font-weight: bold;
          font-size: 1.1rem;
        }
        .role-tag {
          font-size: 0.75rem;
          color: var(--text-muted);
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .user-actions {
          display: flex;
          gap: var(--space-sm);
        }
        .empty-state {
          text-align: center;
          padding: var(--space-xl);
          color: var(--text-muted);
        }
        @media (max-width: 600px) {
          .user-row {
            flex-direction: column;
            gap: var(--space-md);
            text-align: center;
          }
        }
      `}</style>
        </div>
    );
};

export default UserManagement;
