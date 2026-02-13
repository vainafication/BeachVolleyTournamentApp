import { useState } from 'react'
import { useTournament } from './context/TournamentContext'
import TournamentSetup from './components/setup/TournamentSetup'
import TeamInput from './components/setup/TeamInput'
import GroupAssignment from './components/groups/GroupAssignment'
import GroupPhaseActive from './components/groups/GroupPhaseActive'
import KnockoutBracket from './components/knockout/KnockoutBracket'
import Dashboard from './components/dashboard/Dashboard'
import './App.css'

function App() {
  const { tournament, closeActiveTournament, activeTournamentId } = useTournament();
  const [isCreating, setIsCreating] = useState(false);

  const renderContent = () => {
    // If no active tournament is selected
    if (!activeTournamentId) {
      if (isCreating) {
        return <TournamentSetup />; // Note: creating a tournament will set activeTournamentId automatically
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
            {(activeTournamentId || isCreating) && (
              <button className="btn btn-secondary btn-sm" onClick={handleBackToHome}>
                ← Back to Home
              </button>
            )}
            {tournament && (
              <div className="tournament-info">
                <span className="badge">{tournament.name}</span>
                <span className="status-badge">{tournament.status}</span>
              </div>
            )}
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
        .btn-sm {
          padding: 6px 12px;
          font-size: 0.8rem;
        }
        @media (max-width: 700px) {
          .header-content {
            flex-direction: column;
            text-align: center;
            gap: var(--space-md);
          }
          .header-actions {
            flex-direction: column;
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
