import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';

const TournamentContext = createContext();

export const useTournament = () => {
    const context = useContext(TournamentContext);
    if (!context) {
        throw new Error('useTournament must be used within a TournamentProvider');
    }
    return context;
};

export const TournamentProvider = ({ children }) => {
    // --- Auth State ---
    const [users, setUsers] = useState(() => {
        const saved = localStorage.getItem('registered_users');
        const initialByPass = saved ? JSON.parse(saved) : [
            { username: 'admin', password: 'admin123', role: 'organizer' }
        ];
        return initialByPass;
    });

    const [user, setUser] = useState(() => {
        const saved = localStorage.getItem('auth_user');
        return saved ? JSON.parse(saved) : null;
    });

    // --- Global Tournament List (All Users) ---
    const [allTournaments, setAllTournaments] = useState(() => {
        const saved = localStorage.getItem('tournaments_list_v2'); // New version for ownership
        if (saved) return JSON.parse(saved);

        // Migration: if old data exists, assign to 'admin'
        const oldSaved = localStorage.getItem('tournaments_list');
        if (oldSaved) {
            const oldData = JSON.parse(oldSaved);
            return oldData.map(t => ({ ...t, owner: 'admin' }));
        }
        return [];
    });

    const [activeTournamentId, setActiveTournamentId] = useState(() => {
        return localStorage.getItem('active_tournament_id') || null;
    });

    // --- Computed State ---
    const userTournaments = useMemo(() => {
        if (!user) return [];
        return allTournaments.filter(t => t.owner === user.username);
    }, [allTournaments, user]);

    const tournament = useMemo(() => {
        return userTournaments.find(t => t.id === activeTournamentId) || null;
    }, [userTournaments, activeTournamentId]);

    // --- Persistence Effects ---
    useEffect(() => {
        localStorage.setItem('registered_users', JSON.stringify(users));
    }, [users]);

    useEffect(() => {
        if (user) {
            localStorage.setItem('auth_user', JSON.stringify(user));
        } else {
            localStorage.removeItem('auth_user');
        }
    }, [user]);

    useEffect(() => {
        localStorage.setItem('tournaments_list_v2', JSON.stringify(allTournaments));
    }, [allTournaments]);

    useEffect(() => {
        if (activeTournamentId) {
            localStorage.setItem('active_tournament_id', activeTournamentId);
        } else {
            localStorage.removeItem('active_tournament_id');
        }
    }, [activeTournamentId]);

    // --- Auth Actions ---
    const login = (username, password) => {
        const foundUser = users.find(u => u.username === username && u.password === password);
        if (foundUser) {
            setUser({ username: foundUser.username, role: foundUser.role });
            return { success: true };
        }
        return { success: false, message: 'Invalid username or password' };
    };

    const register = (username, password) => {
        if (users.find(u => u.username === username)) {
            return { success: false, message: 'Username already exists' };
        }
        const newUser = { username, password, role: 'organizer' };
        setUsers(prev => [...prev, newUser]);
        setUser({ username: newUser.username, role: newUser.role });
        return { success: true };
    };

    const logout = () => {
        setUser(null);
        setActiveTournamentId(null);
    };

    // --- Tournament Actions ---
    const createTournament = (config) => {
        if (!user) return;
        const newTournament = {
            id: Date.now().toString(),
            owner: user.username, // Associate with current user
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
            status: 'SETUP',
            createdAt: new Date().toISOString()
        };
        setAllTournaments(prev => [...prev, newTournament]);
        setActiveTournamentId(newTournament.id);
    };

    const updateTournament = (updates) => {
        setAllTournaments(prev => prev.map(t =>
            (t.id === activeTournamentId && t.owner === user?.username)
                ? { ...t, ...updates }
                : t
        ));
    };

    const deleteTournament = (id) => {
        setAllTournaments(prev => prev.filter(t => t.id !== id || t.owner !== user?.username));
        if (activeTournamentId === id) {
            setActiveTournamentId(null);
        }
    };

    const loadTournament = (id) => {
        // Safety check: ensure it belongs to the user
        if (userTournaments.some(t => t.id === id)) {
            setActiveTournamentId(id);
        }
    };

    const closeActiveTournament = () => {
        setActiveTournamentId(null);
    };

    const exportTournament = (id) => {
        const t = userTournaments.find(tour => tour.id === id);
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
            user,
            login,
            register,
            logout,
            tournaments: userTournaments, // Only expose user-specific tournaments
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
