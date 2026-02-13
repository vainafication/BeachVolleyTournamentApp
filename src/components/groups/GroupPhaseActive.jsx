import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { calculateStandings, generateKnockoutMatches } from '../../logic/tournamentLogic';
import MatchEntry from '../matches/MatchEntry';

const GroupPhaseActive = () => {
  const { tournament, updateTournament, exportTournament } = useTournament();
  const [selectedGroupIndex, setSelectedGroupIndex] = useState(0);
  const [activeMatch, setActiveMatch] = useState(null);

  const currentGroup = tournament.groups[selectedGroupIndex];
  const standings = calculateStandings(currentGroup.teams, currentGroup.matches, tournament.rules);

  const handleMatchUpdate = (updatedMatch) => {
    const newGroups = [...tournament.groups];
    const groupMatches = newGroups[selectedGroupIndex].matches;
    const matchIndex = groupMatches.findIndex(m => m.id === updatedMatch.id);
    groupMatches[matchIndex] = updatedMatch;

    updateTournament({ groups: newGroups });
    setActiveMatch(null);
  };

  const handleAdvanceToKnockout = () => {
    // Collect top 2 teams from each group
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

    // Simple seed sorting (can be more complex)
    const sortedAdvanced = advancedTeams.sort((a, b) => b.matchPoints - a.matchPoints || (b.setsWon - b.setsLost) - (a.setsWon - a.setsLost));

    // For 8 teams, we generate QF
    const knockoutRounds = generateKnockoutMatches(sortedAdvanced.slice(0, 8));

    updateTournament({
      knockout: {
        rounds: knockoutRounds
      },
      status: 'KNOCKOUT'
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
                  <th>Sets</th>
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

      <div className="actions" style={{ marginTop: 'var(--space-xl)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <p className="hint">Ensure all matches are completed before advancing.</p>
        <button className="btn btn-primary" onClick={handleAdvanceToKnockout}>
          Advance to Knockout Phase
        </button>
      </div>

      <div className="utility-actions card" style={{ marginTop: 'var(--space-md)', padding: 'var(--space-sm)', display: 'flex', justifyContent: 'center', gap: 'var(--space-md)' }}>
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          Export Tournament Data (JSON)
        </button>
        <button className="btn btn-sm" onClick={() => alert('Tournament state is automatically saved.')}>
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
          max-width: 1000px;
        }
        .hint {
          font-size: 0.8rem;
          color: var(--text-muted);
        }
        .group-tabs {
          display: flex;
          gap: var(--space-sm);
          margin-bottom: var(--space-md);
          overflow-x: auto;
          padding-bottom: var(--space-xs);
        }
        .tab {
          padding: var(--space-sm) var(--space-md);
          background: #eee;
          border-radius: var(--radius-md);
          white-space: nowrap;
          font-weight: 600;
        }
        .tab.active {
          background: var(--primary);
          color: white;
        }
        .group-content {
          display: grid;
          grid-template-columns: 1fr;
          gap: var(--space-lg);
        }
        @media (min-width: 900px) {
          .group-content {
            grid-template-columns: 1.2fr 0.8fr;
          }
        }
        .standings-section table {
          width: 100%;
          border-collapse: collapse;
          margin-top: var(--space-md);
        }
        th {
          text-align: left;
          color: var(--text-muted);
          font-size: 0.8rem;
          padding: var(--space-sm);
          border-bottom: 2px solid #eee;
        }
        td {
          padding: var(--space-sm);
          border-bottom: 1px solid #f0f0f0;
        }
        .team-name-cell {
          font-weight: 600;
        }
        .highlight-cell {
          font-weight: bold;
          color: var(--primary);
        }
        .match-list {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
          margin-top: var(--space-md);
        }
        .match-card {
          padding: var(--space-md);
          background: #f8f9fa;
          border-radius: var(--radius-md);
          display: flex;
          justify-content: space-between;
          align-items: center;
          cursor: pointer;
          transition: background 0.2s;
        }
        .match-card:hover {
          background: #e9ecef;
        }
        .match-teams {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          flex: 1;
        }
        .team {
          flex: 1;
          font-size: 0.9rem;
        }
        .team.winner {
          color: var(--primary);
          font-weight: bold;
        }
        .score {
          font-weight: bold;
          background: #ddd;
          padding: 2px 10px;
          border-radius: 10px;
          min-width: 50px;
          text-align: center;
        }
        .pending-tag {
          font-size: 0.7rem;
          background: var(--secondary);
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: bold;
        }
        .table-wrapper {
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default GroupPhaseActive;
