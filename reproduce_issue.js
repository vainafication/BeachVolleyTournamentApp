
import { generateKnockoutMatches } from './src/logic/tournamentLogic.js';

console.log('--- Reproduction Script Start ---');

// Mock 8 teams
const advancedTeams = Array.from({ length: 8 }, (_, i) => ({
    id: `team-${i + 1}`,
    name: `Team ${i + 1}`,
    seed: i + 1,
    group: 'A' // Doesn't matter much for this test
}));

console.log('Generating knockout matches for 8 teams...');
try {
    const rounds = generateKnockoutMatches(advancedTeams);
    console.log('Rounds generated:', rounds.length);
    rounds.forEach((round, i) => {
        console.log(`Round ${i}: ${round.name} - ${round.matches.length} matches`);
        round.matches.forEach(m => {
            console.log(`  Match ${m.id}: ${m.teamA?.name} vs ${m.teamB?.name}`);
        });
    });

    // Simulate advancing a match
    const firstMatch = rounds[0].matches[0];
    console.log('\nSimulating match update for', firstMatch.id);

    // Simulate updating the match result
    const updatedMatch = { ...firstMatch, setsA: 2, setsB: 0, completed: true };

    // Simulate logic from KnockoutBracket.jsx
    const newKnockout = { rounds: JSON.parse(JSON.stringify(rounds)) };

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
            if (!winner) console.error("Winner is null!");

            console.log('Winner is:', winner.name);

            const nextMatchIndex = Math.floor(currentMatchIndex / 2);
            const isTeamA = currentMatchIndex % 2 === 0;

            console.log(`Advancing to Round ${currentRoundIndex + 1}, Match ${nextMatchIndex}, Position: ${isTeamA ? 'TeamA' : 'TeamB'}`);

            if (isTeamA) {
                nextRound.matches[nextMatchIndex].teamA = winner;
            } else {
                nextRound.matches[nextMatchIndex].teamB = winner;
            }

            console.log('Next match state:', nextRound.matches[nextMatchIndex]);
        } else {
            console.log('No next round (Finals completed?)');
        }
    } else {
        console.error('Match not found in structure');
    }

} catch (error) {
    console.error('Error during reproduction:', error);
}
