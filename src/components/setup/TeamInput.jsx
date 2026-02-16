import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

const TeamInput = () => {
    const { tournament, updateTournament } = useTournament();
    const [teams, setTeams] = useState(
        Array.from({ length: tournament.numTeams }, (_, i) => ({
            id: `team-${i}`,
            name: `Team ${i + 1}`,
            players: ''
        }))
    );

    const handleTeamChange = (index, field, value) => {
        const newTeams = [...teams];
        newTeams[index][field] = value;
        setTeams(newTeams);
    };

    const handleConfirmTeams = () => {
        updateTournament({
            teams,
            status: 'GROUP_PHASE' // Next step: Group assignment
        });
    };

    return (
        <div className="team-input-container card">
            <h2>Enter Teams</h2>
            <p className="subtitle">Set names and player details for the {tournament.numTeams} teams.</p>

            <div className="team-grid">
                {teams.map((team, index) => (
                    <div key={team.id} className="team-form-group">
                        <span className="team-number">#{index + 1}</span>
                        <input
                            type="text"
                            placeholder="Team Name"
                            value={team.name}
                            onChange={(e) => handleTeamChange(index, 'name', e.target.value)}
                        />
                        <input
                            type="text"
                            placeholder="Players (comma separated)"
                            value={team.players}
                            onChange={(e) => handleTeamChange(index, 'players', e.target.value)}
                        />
                    </div>
                ))}
            </div>

            <div className="actions">
                <button className="btn btn-primary btn-large" onClick={handleConfirmTeams}>
                    Continue to Groups
                </button>
            </div>

            <style jsx>{`
        .subtitle {
          color: var(--text-muted);
          margin-bottom: var(--space-lg);
        }
        .team-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
          max-height: 60vh;
          overflow-y: auto;
          padding-right: var(--space-sm);
        }
        .team-form-group {
          display: flex;
          align-items: center;
          gap: var(--space-sm);
          padding: var(--space-sm);
          background: #f1f3f5;
          border-radius: var(--radius-md);
        }
        .team-number {
          font-weight: bold;
          color: var(--primary);
          min-width: 30px;
        }
        input {
          flex: 1;
          padding: var(--space-xs) var(--space-sm);
          border: 1px solid #ddd;
          border-radius: var(--radius-sm);
        }
        .actions {
          margin-top: var(--space-lg);
          display: flex;
          justify-content: flex-end;
        }
        @media (max-width: 600px) {
          .team-grid {
            grid-template-columns: 1fr;
          }
          .team-form-group {
            flex-direction: column;
            align-items: stretch;
          }
          .team-number {
            margin-bottom: var(--space-xs);
          }
        }
      `}</style>
        </div>
    );
};

export default TeamInput;
