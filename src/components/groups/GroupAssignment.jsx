import React, { useState, useEffect } from 'react';
import { useTournament } from '../../context/TournamentContext';
import { generateRoundRobin } from '../../logic/tournamentLogic';

const GroupAssignment = () => {
    const { tournament, updateTournament } = useTournament();
    const [numGroups, setNumGroups] = useState(4);
    const [groups, setGroups] = useState([]);

    useEffect(() => {
        // Initial auto-assignment
        autoAssign(4);
    }, []);

    const autoAssign = (count) => {
        const teams = [...tournament.teams];
        const newGroups = Array.from({ length: count }, (_, i) => ({
            id: `group-${String.fromCharCode(65 + i)}`,
            name: `Group ${String.fromCharCode(65 + i)}`,
            teams: [],
            matches: []
        }));

        // Shuffle and distribute
        const shuffled = teams.sort(() => 0.5 - Math.random());
        shuffled.forEach((team, index) => {
            newGroups[index % count].teams.push(team);
        });

        setGroups(newGroups);
        setNumGroups(count);
    };

    const startGroupPhase = () => {
        // Generate fixtures for each group
        const groupsWithMatches = groups.map(group => ({
            ...group,
            matches: generateRoundRobin(group.teams)
        }));

        updateTournament({
            groups: groupsWithMatches,
            status: 'GROUP_PHASE_ACTIVE'
        });
    };

    return (
        <div className="group-assignment card">
            <h2>Group Assignment</h2>
            <div className="controls">
                <label>Number of Groups:</label>
                <select value={numGroups} onChange={(e) => autoAssign(parseInt(e.target.value))}>
                    <option value={2}>2 Groups</option>
                    <option value={4}>4 Groups</option>
                    <option value={8}>8 Groups</option>
                </select>
                <button className="btn btn-secondary" onClick={() => autoAssign(numGroups)}>
                    Shuffle Teams
                </button>
            </div>

            <div className="groups-preview">
                {groups.map(group => (
                    <div key={group.id} className="group-box">
                        <h3>{group.name}</h3>
                        <ul>
                            {group.teams.map(team => (
                                <li key={team.id}>{team.name}</li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="actions">
                <button className="btn btn-primary btn-large" onClick={startGroupPhase}>
                    Generate Fixtures & Start
                </button>
            </div>

            <style jsx>{`
        .controls {
          display: flex;
          align-items: center;
          gap: var(--space-md);
          margin-bottom: var(--space-lg);
        }
        .groups-preview {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
          gap: var(--space-md);
          margin-bottom: var(--space-xl);
        }
        .group-box {
          background: #f8f9fa;
          padding: var(--space-md);
          border-radius: var(--radius-md);
          border-left: 4px solid var(--primary);
        }
        .group-box h3 {
          font-size: 1rem;
          margin-bottom: var(--space-sm);
        }
        ul {
          list-style: none;
          font-size: 0.9rem;
        }
        li {
          padding: var(--space-xs) 0;
          border-bottom: 1px solid #eee;
        }
      `}</style>
        </div>
    );
};

export default GroupAssignment;
