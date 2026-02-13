import React, { useState } from 'react';
import { useTournament } from '../../context/TournamentContext';

const TournamentSetup = () => {
    const { createTournament } = useTournament();
    const [formData, setFormData] = useState({
        name: '',
        numTeams: 16,
        setsPerMatch: 3,
        pointsPerSet: 21,
        decidingSetPoints: 15
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: name === 'name' ? value : parseInt(value)
        }));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        createTournament({
            name: formData.name,
            numTeams: formData.numTeams,
            rules: {
                setsPerMatch: formData.setsPerMatch,
                pointsPerSet: formData.pointsPerSet,
                decidingSetPoints: formData.decidingSetPoints,
                pointsPerWin: 2,
                pointsPerLoss: 1
            }
        });
    };

    return (
        <div className="setup-container card">
            <h2>Create New Tournament</h2>
            <form onSubmit={handleSubmit} className="setup-form">
                <div className="form-group">
                    <label>Tournament Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        placeholder="e.g. Summer Beach Bash"
                        required
                    />
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Number of Teams</label>
                        <select name="numTeams" value={formData.numTeams} onChange={handleChange}>
                            <option value={4}>4 Teams</option>
                            <option value={8}>8 Teams</option>
                            <option value={12}>12 Teams</option>
                            <option value={16}>16 Teams</option>
                            <option value={24}>24 Teams</option>
                            <option value={32}>32 Teams</option>
                        </select>
                    </div>

                    <div className="form-group">
                        <label>Sets per Match</label>
                        <select name="setsPerMatch" value={formData.setsPerMatch} onChange={handleChange}>
                            <option value={1}>Best of 1</option>
                            <option value={3}>Best of 3</option>
                            <option value={5}>Best of 5</option>
                        </select>
                    </div>
                </div>

                <div className="form-row">
                    <div className="form-group">
                        <label>Points per Set</label>
                        <input
                            type="number"
                            name="pointsPerSet"
                            value={formData.pointsPerSet}
                            onChange={handleChange}
                            min="10"
                            max="30"
                        />
                    </div>

                    <div className="form-group">
                        <label>Tie-break Points</label>
                        <input
                            type="number"
                            name="decidingSetPoints"
                            value={formData.decidingSetPoints}
                            onChange={handleChange}
                            min="5"
                            max="21"
                        />
                    </div>
                </div>

                <button type="submit" className="btn btn-primary btn-large">
                    Initialize Tournament
                </button>
            </form>

            <style jsx>{`
        .setup-form {
          display: flex;
          flex-direction: column;
          gap: var(--space-lg);
          margin-top: var(--space-lg);
        }
        .form-group {
          display: flex;
          flex-direction: column;
          gap: var(--space-xs);
        }
        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-md);
        }
        label {
          font-weight: 600;
          font-size: 0.9rem;
          color: var(--text-muted);
        }
        input, select {
          padding: var(--space-sm) var(--space-md);
          border: 1px solid #ddd;
          border-radius: var(--radius-md);
          font-size: 1rem;
        }
        .btn-large {
          width: 100%;
          padding: var(--space-md);
          font-size: 1.1rem;
        }
        @media (max-width: 600px) {
          .form-row {
            grid-template-columns: 1fr;
          }
        }
      `}</style>
        </div>
    );
};

export default TournamentSetup;
