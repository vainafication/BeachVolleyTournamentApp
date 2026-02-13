import React, { useState } from 'react';

const MatchEntry = ({ match, rules, onSave, onClose }) => {
    const [sets, setSets] = useState(match.setHistory.length > 0 ? match.setHistory : [{ a: 0, b: 0 }]);

    const updateSet = (index, field, value) => {
        const newSets = [...sets];
        newSets[index][field] = parseInt(value) || 0;
        setSets(newSets);
    };

    const addSet = () => setSets([...sets, { a: 0, b: 0 }]);

    const handleSave = () => {
        let setsA = 0;
        let setsB = 0;
        sets.forEach(set => {
            if (set.a > set.b) setsA++;
            else if (set.b > set.a) setsB++;
        });

        onSave({
            ...match,
            setHistory: sets,
            setsA,
            setsB,
            completed: true
        });
    };

    return (
        <div className="modal-overlay">
            <div className="modal-content card">
                <h3>Match Result</h3>
                <p className="match-info">{match.teamA.name} vs {match.teamB.name}</p>

                <div className="sets-entry">
                    {sets.map((set, i) => (
                        <div key={i} className="set-row">
                            <span className="set-label">Set {i + 1}</span>
                            <input
                                type="number"
                                value={set.a}
                                onChange={(e) => updateSet(i, 'a', e.target.value)}
                            />
                            <span className="divider">:</span>
                            <input
                                type="number"
                                value={set.b}
                                onChange={(e) => updateSet(i, 'b', e.target.value)}
                            />
                        </div>
                    ))}
                </div>

                <button className="btn btn-secondary btn-small" onClick={addSet} style={{ marginTop: 'var(--space-md)' }}>
                    + Add Set
                </button>

                <div className="modal-actions">
                    <button className="btn btn-primary" onClick={handleSave}>Save Result</button>
                    <button className="btn" onClick={onClose}>Cancel</button>
                </div>
            </div>

            <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0,0,0,0.5);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          padding: var(--space-md);
        }
        .modal-content {
          width: 100%;
          max-width: 400px;
        }
        .match-info {
          font-weight: bold;
          margin-bottom: var(--space-lg);
          color: var(--primary);
        }
        .sets-entry {
          display: flex;
          flex-direction: column;
          gap: var(--space-sm);
        }
        .set-row {
          display: flex;
          align-items: center;
          gap: var(--space-md);
        }
        .set-label {
          min-width: 50px;
          font-weight: 600;
        }
        input {
          width: 60px;
          padding: var(--space-sm);
          text-align: center;
          font-size: 1.2rem;
          border: 1px solid #ddd;
          border-radius: var(--radius-sm);
        }
        .divider {
          font-weight: bold;
          font-size: 1.2rem;
        }
        .modal-actions {
          margin-top: var(--space-xl);
          display: flex;
          gap: var(--space-md);
          justify-content: flex-end;
        }
        .btn-small {
          font-size: 0.8rem;
          padding: 4px 12px;
        }
      `}</style>
        </div>
    );
};

export default MatchEntry;
