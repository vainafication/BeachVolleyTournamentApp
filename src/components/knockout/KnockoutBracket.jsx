import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { generateKnockoutMatches } from '../../logic/tournamentLogic';
import MatchEntry from '../matches/MatchEntry';

const KnockoutBracket = () => {
  const { tournament, updateTournament, exportTournament } = useTournament();
  const [activeMatch, setActiveMatch] = useState(null);

  if (!tournament.knockout) {
    if (tournament.advancedTeams && tournament.advancedTeams.length > 0) {
      setTimeout(() => {
        const rounds = generateKnockoutMatches(tournament.advancedTeams);
        updateTournament({ knockout: { rounds } });
      }, 0);
      return <div className="p-4 text-center">Generating Knockout Bracket...</div>;
    }
    return <div className="p-4 text-center">Knockout phase not initialized. Please complete the group phase.</div>;
  }

  const handleMatchUpdate = (updatedMatch) => {
    const newKnockout = { ...tournament.knockout };
    // Find round and match
    let currentRoundIndex = -1;
    let currentMatchIndex = -1;

    newKnockout.rounds.forEach((round, rIdx) => {
      const mIdx = round.matches.findIndex(m => m.id === updatedMatch.id);
      if (mIdx !== -1) {
        currentRoundIndex = rIdx;
        currentMatchIndex = mIdx;
      }
    });

    if (currentRoundIndex !== -1) {
      newKnockout.rounds[currentRoundIndex].matches[currentMatchIndex] = updatedMatch;

      // Auto-advance winner to next round
      const nextRound = newKnockout.rounds[currentRoundIndex + 1];
      if (nextRound) {
        const winner = updatedMatch.setsA > updatedMatch.setsB ? updatedMatch.teamA : updatedMatch.teamB;
        const nextMatchIndex = Math.floor(currentMatchIndex / 2);
        const isTeamA = currentMatchIndex % 2 === 0;

        if (isTeamA) {
          nextRound.matches[nextMatchIndex].teamA = winner;
        } else {
          nextRound.matches[nextMatchIndex].teamB = winner;
        }
      }

      updateTournament({ knockout: newKnockout });
    }
    setActiveMatch(null);
  };

  const handleExport = () => {
    exportTournament(tournament.id);
  };

  return (
    <div className="knockout-container card">
      <div className="knockout-header">
        <h2>Knockout Phase</h2>
      </div>

      <div className="bracket-wrapper">
        {tournament.knockout.rounds.map((round, rIdx) => (
          <div key={rIdx} className="round-column">
            <h4>{round.name}</h4>
            <div className="round-matches">
              {round.matches.map(match => (
                <div
                  key={match.id}
                  className={`bracket-match card ${match.completed ? 'completed' : ''} ${(!match.teamA || !match.teamB) ? 'pending' : ''}`}
                  onClick={() => match.teamA && match.teamB && setActiveMatch(match)}
                >
                  <div className={`bracket-team ${match.completed && match.setsA > match.setsB ? 'winner' : ''}`}>
                    <span className="seed">{match.teamA?.seed || '?'}</span>
                    <span className="name">{match.teamA?.name || 'TBD'}</span>
                    <span className="score">{match.completed ? match.setsA : ''}</span>
                  </div>
                  <div className="divider"></div>
                  <div className={`bracket-team ${match.completed && match.setsB > match.setsA ? 'winner' : ''}`}>
                    <span className="seed">{match.teamB?.seed || '?'}</span>
                    <span className="name">{match.teamB?.name || 'TBD'}</span>
                    <span className="score">{match.completed ? match.setsB : ''}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <div className="round-indicators">
        {tournament.knockout.rounds.map((round, idx) => (
          <div key={idx} className="round-dot" title={round.name}></div>
        ))}
      </div>

      <div className="utility-actions">
        <button className="btn btn-secondary btn-sm" onClick={handleExport}>
          Export JSON
        </button>
        <button className="btn btn-sm" onClick={() => alert('Tournament state is automatically saved.')}>
          Manual Save
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
        .knockout-container {
          width: 100%;
          max-width: 100%;
        }
        .knockout-header {
          margin-bottom: var(--space-md);
        }
        .bracket-wrapper {
          display: flex;
          gap: var(--space-xl);
          overflow-x: auto;
          overflow-y: visible;
          padding: var(--space-md) 0;
          scroll-snap-type: x mandatory;
          -webkit-overflow-scrolling: touch;
          margin: 0 calc(-1 * var(--space-lg));
          padding-left: var(--space-lg);
          padding-right: var(--space-lg);
        }
        .round-column {
          flex: 0 0 auto;
          min-width: 280px;
          display: flex;
          flex-direction: column;
          align-items: center;
          scroll-snap-align: center;
        }
        .round-matches {
          display: flex;
          flex-direction: column;
          justify-content: space-around;
          flex: 1;
          width: 100%;
          gap: var(--space-lg);
          margin-top: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .bracket-match {
          padding: var(--space-sm);
          width: 100%;
          border-left: 4px solid var(--accent);
          transition: transform 0.2s;
        }
        .bracket-match:not(.pending) {
          cursor: pointer;
        }
        .bracket-match:not(.pending):hover {
          transform: scale(1.02);
        }
        .bracket-match.pending {
          opacity: 0.7;
          border-left-color: var(--text-muted);
        }
        .bracket-team {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: var(--space-xs) var(--space-sm);
        }
        .bracket-team.winner {
          background: rgba(0, 119, 182, 0.1);
          font-weight: bold;
          border-radius: var(--radius-sm);
        }
        .seed {
          font-size: 0.7rem;
          color: var(--text-muted);
          margin-right: var(--space-sm);
        }
        .name {
          flex: 1;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .score {
          font-weight: bold;
          margin-left: var(--space-md);
        }
        .divider {
          height: 1px;
          background: #eee;
          margin: 2px 0;
        }
        h4 {
          text-transform: uppercase;
          font-size: 0.9rem;
          color: var(--text-muted);
          font-weight: 700;
        }
        .utility-actions {
          margin-top: var(--space-lg);
          display: flex;
          justify-content: center;
          gap: var(--space-md);
          flex-wrap: wrap;
        }
        .round-indicators {
          display: flex;
          justify-content: center;
          gap: var(--space-sm);
          margin-top: var(--space-md);
          padding: var(--space-sm) 0;
        }
        .round-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: #ddd;
        }
        @media (max-width: 768px) {
          .knockout-container {
            padding: var(--space-md);
          }
          .bracket-wrapper {
            gap: var(--space-md);
            margin: 0 calc(-1 * var(--space-md));
            padding-left: var(--space-md);
            padding-right: var(--space-md);
          }
          .round-column {
            min-width: 90vw;
          }
          .bracket-match {
            padding: var(--space-md);
          }
          .bracket-team {
            padding: var(--space-sm);
          }
          .name {
            font-size: 1rem;
          }
          .score {
            margin-left: var(--space-sm);
            font-size: 1.1rem;
            font-weight: 700;
          }
          h4 {
            font-size: 1.2rem;
            margin-bottom: var(--space-sm);
          }
          .round-indicators {
            display: flex;
          }
          .round-dot {
            width: 10px;
            height: 10px;
          }
          .utility-actions {
            flex-direction: column;
            width: 100%;
          }
          .utility-actions .btn {
            width: 100%;
            min-height: 44px;
          }
        }
      `}</style>
    </div>
  );
};

export default KnockoutBracket;
