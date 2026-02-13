/**
 * Beach Volleyball Tournament Logic 
 */

/**
 * Generate Round Robin fixtures for a group of teams
 */
export const generateRoundRobin = (teams) => {
    const matches = [];
    const n = teams.length;
    if (n < 2) return matches;

    for (let i = 0; i < n; i++) {
        for (let j = i + 1; j < n; j++) {
            matches.push({
                id: `match-${i}-${j}-${Math.random().toString(36).substr(2, 9)}`,
                teamA: teams[i],
                teamB: teams[j],
                scoreA: null,
                scoreB: null,
                setsA: 0,
                setsB: 0,
                completed: false,
                setHistory: []
            });
        }
    }
    return matches;
};

/**
 * Calculate standings for a group
 */
export const calculateStandings = (teams, matches, rules) => {
    const standings = teams.map(team => ({
        teamId: team.id,
        name: team.name,
        played: 0,
        wins: 0,
        losses: 0,
        setsWon: 0,
        setsLost: 0,
        pointsFor: 0,
        pointsAgainst: 0,
        matchPoints: 0
    }));

    matches.forEach(match => {
        if (!match.completed) return;

        const teamA = standings.find(s => s.teamId === match.teamA.id);
        const teamB = standings.find(s => s.teamId === match.teamB.id);

        if (teamA && teamB) {
            teamA.played++;
            teamB.played++;

            teamA.setsWon += match.setsA;
            teamA.setsLost += match.setsB;
            teamB.setsWon += match.setsB;
            teamB.setsLost += match.setsA;

            match.setHistory.forEach(set => {
                teamA.pointsFor += set.a;
                teamA.pointsAgainst += set.b;
                teamB.pointsFor += set.b;
                teamB.pointsAgainst += set.a;
            });

            if (match.setsA > match.setsB) {
                teamA.wins++;
                teamA.matchPoints += rules.pointsPerWin || 1;
                teamB.losses++;
                teamB.matchPoints += rules.pointsPerLoss || 0;
            } else {
                teamB.wins++;
                teamB.matchPoints += rules.pointsPerWin || 1;
                teamA.losses++;
                teamA.matchPoints += rules.pointsPerLoss || 0;
            }
        }
    });

    return standings.sort((a, b) => {
        if (b.matchPoints !== a.matchPoints) return b.matchPoints - a.matchPoints;
        const diffA = a.setsWon - a.setsLost;
        const diffB = b.setsWon - b.setsLost;
        if (diffB !== diffA) return diffB - diffA;
        const pDiffA = a.pointsFor - a.pointsAgainst;
        const pDiffB = b.pointsFor - b.pointsAgainst;
        return pDiffB - pDiffA;
    });
};

/**
 * Generate knockout bracket
 * @param {Array} advancedTeams - [{ team: Team, seed: 1, group: 'A' }, ...]
 */
export const generateKnockoutMatches = (advancedTeams) => {
    const rounds = [];
    let numTeams = advancedTeams.length;
    let roundLevel = 0;

    // Determine initial round name
    let roundName = '';
    if (numTeams === 8) roundName = 'Quarter-Finals';
    else if (numTeams === 4) roundName = 'Semi-Finals';
    else if (numTeams === 2) roundName = 'Final';

    while (numTeams >= 2) {
        const numMatches = numTeams / 2;
        const matches = [];

        for (let i = 0; i < numMatches; i++) {
            let teamA = null;
            let teamB = null;

            // Only populate the very first round matches
            if (roundLevel === 0) {
                if (advancedTeams.length === 8) {
                    // Seeding: 1v8, 4v5, 2v7, 3v6
                    const seedIndices = [0, 7, 3, 4, 1, 6, 2, 5];
                    teamA = advancedTeams[seedIndices[i * 2]];
                    teamB = advancedTeams[seedIndices[i * 2 + 1]];
                } else {
                    teamA = advancedTeams[i * 2];
                    teamB = advancedTeams[i * 2 + 1];
                }
            }

            matches.push({
                id: `ko-${roundLevel}-${i}`,
                teamA,
                teamB,
                scoreA: null,
                scoreB: null,
                completed: false,
                setHistory: [],
                setsA: 0,
                setsB: 0
            });
        }

        rounds.push({
            name: roundName,
            matches
        });

        // Prepare next round info
        numTeams = numTeams / 2;
        roundLevel++;
        if (numTeams === 4) roundName = 'Semi-Finals';
        else if (numTeams === 2) roundName = 'Final';
        else roundName = 'Finished';
    }

    return rounds;
};
