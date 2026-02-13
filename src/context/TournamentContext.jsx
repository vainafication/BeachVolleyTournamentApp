import React, { createContext, useContext, useState, useEffect } from 'react';

const TournamentContext = createContext();

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};

export const TournamentProvider = ({ children }) => {
    const [tournaments, setTournaments] = useState(() => {
        const saved = localStorage.getItem('tournaments_list');
        return saved ? JSON.parse(saved) : [];
    });

    const [activeTournamentId, setActiveTournamentId] = useState(() => {
        return localStorage.getItem('active_tournament_id') || null;
    });

    const tournament = tournaments.find(t => t.id === activeTournamentId) || null;

    useEffect(() => {
        localStorage.setItem('tournaments_list', JSON.stringify(tournaments));
    }, [tournaments]);

    useEffect(() => {
        if (activeTournamentId) {
            localStorage.setItem('active_tournament_id', activeTournamentId);
        } else {
            localStorage.removeItem('active_tournament_id');
        }
    }, [activeTournamentId]);

    const createTournament = (config) => {
        const newTournament = {
            id: Date.now().toString(),
            name: config.name,
            numTeams: config.numTeams,
            rules: config.rules || {
                setsPerMatch: 3,
                pointsPerSet: 21,
                decidingSetPoints: 15,
                pointsPerWin: 2,
                pointsPerLoss: 1
            },
            teams: [],
            groups: [],
            knockout: null,
            status: 'SETUP', // SETUP, GROUP, KNOCKOUT, FINISHED
            createdAt: new Date().toISOString()
        };
        setTournaments(prev => [...prev, newTournament]);
        setActiveTournamentId(newTournament.id);
    };

    const updateTournament = (updates) => {
        setTournaments(prev => prev.map(t =>
            t.id === activeTournamentId ? { ...t, ...updates } : t
        ));
    };

    const deleteTournament = (id) => {
        setTournaments(prev => prev.filter(t => t.id !== id));
        if (activeTournamentId === id) {
            setActiveTournamentId(null);
        }
    };

    const loadTournament = (id) => {
        setActiveTournamentId(id);
    };

    const closeActiveTournament = () => {
        setActiveTournamentId(null);
    };

    const exportTournament = (id) => {
        const t = tournaments.find(tour => tour.id === id);
        if (!t) return;
        const blob = new Blob([JSON.stringify(t, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${t.name.replace(/\s+/g, '_')}_data.json`;
        link.click();
        URL.revokeObjectURL(url);
    };

    return (
        <TournamentContext.Provider value={{
            tournaments,
            tournament,
            activeTournamentId,
            createTournament,
            updateTournament,
            deleteTournament,
            loadTournament,
            closeActiveTournament,
            exportTournament
        }}>
            {children}
        </TournamentContext.Provider>
    );
};
