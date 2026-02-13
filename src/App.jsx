import { useState } from 'react'
import { useTournament } from './context/TournamentContext'
import TournamentSetup from './components/setup/TournamentSetup'
import TeamInput from './components/setup/TeamInput'
import GroupAssignment from './components/groups/GroupAssignment'
import GroupPhaseActive from './components/groups/GroupPhaseActive'
import KnockoutBracket from './components/knockout/KnockoutBracket'
import Dashboard from './components/dashboard/Dashboard'
import Login from './components/auth/Login'
import UserManagement from './components/auth/UserManagement'
import './App.css'

function App() {
  const {
    user,
    logout,
    tournament,
    closeActiveTournament,
    activeTournamentId,
    pendingUsers
  } = useTournament();

  const [isCreating, setIsCreating] = useState(false);
  const [isAdminView, setIsAdminView] = useState(false);

  // Guard: If no user is logged in, show the Login screen
  if (!user) {
    return <Login />;
  }

  const renderContent = () => {
    // Admin User Management view
    if (isAdminView && user.username === 'admin') {
      return <UserManagement />;
    }

    // If no active tournament is selected
    if (!activeTournamentId) {
      if (isCreating) {
        return <TournamentSetup />;
      }
      return <Dashboard onNewTournament={() => setIsCreating(true)} />;
    }

    // Determine view based on active tournament status
    switch (tournament?.status) {
      case 'SETUP':
        return <TeamInput />;
      case 'GROUP_PHASE':
        return <GroupAssignment />;
      case 'GROUP_PHASE_ACTIVE':
        return <GroupPhaseActive />;
      case 'KNOCKOUT':
        return <KnockoutBracket />;
      default:
        return <Dashboard onNewTournament={() => setIsCreating(true)} />;
    }
  };

  const handleBackToHome = () => {
    setIsCreating(false);
    setIsAdminView(false);
    closeActiveTournament();
  };

  return (
    <div className="app-container">
      <header className="glass">
        <div className="header-content">
          <div onClick={handleBackToHome} style={{ cursor: 'pointer' }}>
            <h1>Beach Volleyball</h1>
            <p>Tournament Management</p>
          </div>

          <div className="header-actions">
            {(activeTournamentId || isCreating || isAdminView) && (
              <button className="btn btn-secondary btn-sm" onClick={handleBackToHome}>
                ← Back to Home
              </button>
            )}

            {user.username === 'admin' && !tournament && !isCreating && (
              <button
                className={`btn btn-sm ${isAdminView ? 'btn-primary' : 'btn-secondary'}`}
                onClick={() => setIsAdminView(!isAdminView)}
              >
                Manage Users {pendingUsers.length > 0 && <span className="notification-dot">{pendingUsers.length}</span>}
              </button>
            )}

            {tournament && (
              <div className="tournament-info">
                <span className="badge">{tournament.name}</span>
                <span className="status-badge">{tournament.status}</span>
              </div>
            )}

            <div className="user-info">
              <span className="user-name">👤 {user.username}</span>
              <button className="btn btn-danger btn-sm logout-btn" onClick={logout}>
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {renderContent()}
      </main>

      <style jsx>{`
        .header-content {
          display: flex;
          justify-content: space-between;
          align-items: center;
          text-align: left;
        }
        .header-actions {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .tournament-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: var(--space-xs);
        }
        .badge {
          background: var(--primary);
          color: white;
          padding: 2px 8px;
          border-radius: 4px;
          font-weight: bold;
          max-width: 150px;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .status-badge {
          font-size: 0.8rem;
          color: var(--text-muted);
          text-transform: uppercase;
        }
        .user-info {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          border-left: 1px solid rgba(255,255,255,0.2);
          padding-left: var(--space-md);
        }
        .user-name {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--primary-dark);
        }
        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8rem;
          position: relative;
        }
        .notification-dot {
          background: var(--danger);
          color: white;
          font-size: 0.6rem;
          padding: 1px 5px;
          border-radius: 10px;
          margin-left: 5px;
          vertical-align: middle;
        }
        .logout-btn {
          margin-left: var(--space-md);
        }
        @media (max-width: 900px) {
          .header-content {
            flex-direction: column;
            text-align: center;
            gap: var(--space-md);
          }
          .header-actions {
            flex-direction: row;
            width: 100%;
            justify-content: center;
            flex-wrap: wrap;
          }
          .tournament-info {
            align-items: center;
          }
        }
      `}</style>
    </div>
  )
}

export default App
