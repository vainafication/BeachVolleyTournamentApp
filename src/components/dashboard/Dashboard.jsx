import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

const Dashboard = ({ onNewTournament }) => {
  const { tournaments, loadTournament, deleteTournament, exportTournament } = useTournament();

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="dashboard-container">
      <div className="dashboard-header card">
        <div>
          <h2>Global Dashboard</h2>
          <p className="subtitle">Manage and track all your beach volleyball tournaments</p>
        </div>
        <button className="btn btn-primary" onClick={onNewTournament}>
          + Generate New Tournament
        </button>
      </div>

      <div className="tournament-list">
        {tournaments.length === 0 ? (
          <div className="empty-state card">
            <p>No tournaments found. Create your first one to get started!</p>
          </div>
        ) : (
          tournaments.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).map(t => (
            <div key={t.id} className="tournament-card card">
              <div className="tournament-info">
                <h3>{t.name}</h3>
                <div className="tournament-meta">
                  <span className="badge">{t.numTeams} Teams</span>
                  <span className="status-badge">{t.status}</span>
                  <span className="date">{formatDate(t.createdAt)}</span>
                </div>
              </div>
              <div className="tournament-actions">
                <button className="btn btn-primary btn-sm" onClick={() => loadTournament(t.id)}>
                  Load
                </button>
                <button className="btn btn-secondary btn-sm" onClick={() => exportTournament(t.id)}>
                  Export
                </button>
                <button className="btn btn-danger btn-sm" onClick={() => {
                  if (window.confirm(`Delete tournament "${t.name}"?`)) deleteTournament(t.id);
                }}>
                  Delete
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      <style jsx>{`
        .dashboard-container {
          width: 100%;
          max-width: 1000px;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          padding: 0 var(--space-sm);
        }
        .dashboard-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }
        .subtitle {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .tournament-list {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-md);
        }
        .tournament-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md) var(--space-lg);
          transition: transform 0.2s;
        }
        .tournament-card:hover {
          transform: translateY(-2px);
        }
        .tournament-info h3 {
          margin-bottom: var(--space-xs);
        }
        .tournament-meta {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          font-size: 0.8rem;
        }
        .date {
          color: var(--text-muted);
        }
        .tournament-actions {
          display: flex;
          gap: var(--space-sm);
        }
        .btn-sm {
          padding: 4px 12px;
          font-size: 0.85rem;
        }
        .btn-danger {
          background-color: var(--danger);
          color: white;
        }
        .btn-danger:hover {
          background-color: #a0111a;
        }
        .empty-state {
          text-align: center;
          padding: var(--space-xl);
          color: var(--text-muted);
        }
        @media (max-width: 700px) {
          .dashboard-header {
            flex-direction: column;
            text-align: center;
            gap: var(--space-md);
            padding: var(--space-lg);
          }
          .dashboard-header .btn {
            width: 100%;
          }
          .tournament-card {
            flex-direction: column;
            gap: var(--space-md);
            text-align: center;
            padding: var(--space-lg);
          }
          .tournament-meta {
            justify-content: center;
            flex-wrap: wrap;
            gap: var(--space-sm);
          }
          .tournament-actions {
            width: 100%;
            flex-direction: column;
            gap: var(--space-sm);
          }
          .tournament-actions .btn {
            width: 100%;
          }
        }
      `}</style>
    </div>
  );
};

export default Dashboard;
