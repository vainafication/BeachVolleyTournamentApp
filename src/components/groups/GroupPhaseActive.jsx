import React, { useState, useMemo } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { calculateStandings } from '../../logic/tournamentLogic';
import MatchEntry from '../matches/MatchEntry';

const GroupPhaseActive = () => {
  const { tournament, updateTournament, exportTournament } = useTournament();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [activeMatch, setActiveMatch] = useState(null);

  const currentGroup = tournament.groups[selectedGroupIndex];

  const standings = useMemo(() => {
    return calculateStandings(currentGroup.teams, currentGroup.matches, tournament.rules);
  }, [currentGroup, tournament.rules]);

  const handleMatchUpdate = (updatedMatch) => {
    const newGroups = tournament.groups.map(group => {
      if (group.id === currentGroup.id) {
        return {
          ...group,
          matches: group.matches.map(m => m.id === updatedMatch.id ? updatedMatch : m)
        };
      }
      return group;
    });

    updateTournament({ groups: newGroups });
    setActiveMatch(null);
  };

  const handleAdvanceToKnockout = () => {
    const allMatchesCompleted = tournament.groups.every(group =>
      group.matches.every(m => m.completed)
    );

    if (!allMatchesCompleted) {
      alert('Please complete all matches in all groups before advancing.');
      return;
    }

    if (!window.confirm('Are you sure you want to advance to the knockout phase? This cannot be undone.')) {
      return;
    }

    const advancedTeams = [];
    tournament.groups.forEach(group => {
      const groupStandings = calculateStandings(group.teams, group.matches, tournament.rules);
      if (groupStandings[0]) {
        advancedTeams.push({ ...groupStandings[0], seed: 1, group: group.name });
      }
      if (groupStandings[1]) {
        advancedTeams.push({ ...groupStandings[1], seed: 2, group: group.name });
      }
    });

    updateTournament({
      status: 'KNOCKOUT',
      advancedTeams,
      knockout: null
    });
  };

  const handleExport = () => {
    exportTournament(tournament.id);
  };

  return (
    <div className="group-active-container">
      <div className="group-tabs">
        {tournament.groups.map((group, index) => (
          <button
            key={group.id}
            className={`tab ${selectedGroupIndex === index ? 'active' : ''}`}
            onClick={() => setSelectedGroupIndex(index)}
          >
            {group.name}
          </button>
        ))}
      </div>

      <div className="group-content">
        <section className="standings-section card">
          <h3>Standings: {currentGroup.name}</h3>
          <div className="table-wrapper">
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Team</th>
                  <th>P</th>
                  <th>W</th>
                  <th>L</th>
                  <th>S</th>
                  <th>Pts</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((s, i) => (
                  <tr key={s.teamId}>
                    <td>{i + 1}</td>
                    <td className="team-name-cell">{s.name}</td>
                    <td>{s.played}</td>
                    <td>{s.wins}</td>
                    <td>{s.losses}</td>
                    <td>{s.setsWon}:{s.setsLost}</td>
                    <td className="highlight-cell">{s.matchPoints}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="matches-section card">
          <h3>Fixtures & Results</h3>
          <div className="match-list">
            {currentGroup.matches.map(match => (
              <div
                key={match.id}
                className={`match-card ${match.completed ? 'completed' : ''}`}
                onClick={() => setActiveMatch(match)}
              >
                <div className="match-teams">
                  <div className={`team ${match.setsA > match.setsB ? 'winner' : ''}`}>
                    {match.teamA.name}
                  </div>
                  <div className="score">
                    {match.completed ? `${match.setsA} - ${match.setsB}` : 'vs'}
                  </div>
                  <div className={`team ${match.setsB > match.setsA ? 'winner' : ''}`}>
                    {match.teamB.name}
                  </div>
                </div>
                {!match.completed && <span className="pending-tag">Live / Entry</span>}
              </div>
            ))}
          </div>
        </section>
      </div>

      <div className="actions footer-actions">
        <p className="hint">Ensure all matches are completed before advancing.</p>
        <button className="btn btn-primary advance-btn" onClick={handleAdvanceToKnockout}>
          Advance to Knockout Phase
        </button>
      </div>

      <div className="utility-actions card">
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          Export Data
        </button>
        <button className="btn btn-sm" onClick={() => alert('Saved automatically.')}>
          Save Snapshot
        </button>
      </div>

      {activeMatch && (
        <MatchEntry
          match={activeMatch}
          rules={tournament.rules}
          onSave={handleMatchUpdate}
          onClose={() => setActiveMatch(null)}
        />
      )}

      <style jsx>{`
        .group-active-container {
          width: 100%;
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
        }
        .group-tabs {
          display: flex;
          gap: var(--space-sm);
          overflow-x: auto;
          padding-bottom: var(--space-sm);
          scrollbar-width: none;
        }
        .group-tabs::-webkit-scrollbar { display: none; }
        .tab {
          padding: var(--space-sm) var(--space-lg);
          background: white;
          border-radius: var(--radius-md);
          white-space: nowrap;
          font-weight: 600;
          color: var(--text-muted);
          border: 1px solid #ddd;
        }
        .tab.active {
          background: var(--primary);
          color: white;
          border-color: var(--primary);
        }
        .group-content {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: var(--space-lg);
          align-items: start;
        }
        @media (max-width: 1000px) {
          .group-content {
            grid-template-columns: 1fr;
          }
        }
        .team-name-cell {
          font-weight: 600;
          color: var(--primary-dark);
        }
        .highlight-cell {
          font-weight: bold;
          color: var(--accent);
        }
        .match-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }
        .match-card {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-md);
          background: #f8f9fa;
          border-radius: var(--radius-md);
          cursor: pointer;
          transition: all 0.2s;
          border-left: 4px solid var(--primary);
        }
        .match-card:hover {
          transform: translateX(4px);
          background: #f1f3f5;
        }
        .match-card.completed {
          border-left-color: var(--success);
          opacity: 0.8;
        }
        .match-teams {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
        }
        .team {
          flex: 1;
          font-weight: 500;
        }
        .team.winner {
          color: var(--primary-dark);
          font-weight: bold;
        }
        .score {
          font-weight: bold;
          background: white;
          padding: 2px 8px;
          border-radius: 4px;
          min-width: 60px;
          text-align: center;
        }
        .pending-tag {
          font-size: 0.7rem;
          color: var(--accent);
          font-weight: bold;
          text-transform: uppercase;
        }
        .footer-actions {
          margin-top: var(--space-xl);
          display: flex;
          justify-content: space-between;
          align-items: center;
          gap: var(--space-md);
        }
        .hint {
          color: var(--text-muted);
          font-size: 0.9rem;
        }
        .utility-actions {
          margin-top: var(--space-md);
          padding: var(--space-sm);
          display: flex;
          justify-content: center;
          gap: var(--space-md);
        }
        @media (max-width: 600px) {
          .footer-actions {
            flex-direction: column;
            text-align: center;
          }
          .advance-btn {
            width: 100%;
          }
          .utility-actions {
            flex-direction: column;
            gap: var(--space-sm);
          }
          .utility-actions .btn {
            width: 100%;
          }
          .match-teams {
            gap: var(--space-xs);
          }
          .score {
            min-width: 50px;
            font-size: 0.9rem;
          }
        }
      `}</style>
    </div>
  );
};

export default GroupPhaseActive;
