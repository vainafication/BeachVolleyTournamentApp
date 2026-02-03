import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { tournamentApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { ScrollArea } from '../components/ui/scroll-area';
import { toast } from 'sonner';
import { 
  ArrowLeft, Users, Plus, Trophy, Download, Play, 
  ChevronLeft, ChevronRight, Loader2, Trash2, Volleyball
} from 'lucide-react';

export default function TournamentPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('teams');
  
  // Team dialog
  const [teamDialogOpen, setTeamDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState(null);
  const [teamName, setTeamName] = useState('');
  const [playerNames, setPlayerNames] = useState(['', '']);
  const [savingTeam, setSavingTeam] = useState(false);
  
  // Score dialog
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [selectedMatch, setSelectedMatch] = useState(null);
  const [scores, setScores] = useState([{ team1: 0, team2: 0 }]);
  const [savingScore, setSavingScore] = useState(false);
  
  // Bracket round
  const [selectedRound, setSelectedRound] = useState('semifinal');

  const loadTournament = useCallback(async () => {
    try {
      const response = await tournamentApi.getOne(id);
      setTournament(response.data);
      
      // Auto-select tab based on status
      if (response.data.status === 'group_phase') {
        setActiveTab('groups');
      } else if (response.data.status === 'knockout_phase') {
        setActiveTab('bracket');
      }
    } catch (error) {
      toast.error('Failed to load tournament');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadTournament();
  }, [loadTournament]);

  // Team functions
  const handleAddTeam = () => {
    setEditingTeam(null);
    setTeamName('');
    setPlayerNames(['', '']);
    setTeamDialogOpen(true);
  };

  const handleEditTeam = (team) => {
    setEditingTeam(team);
    setTeamName(team.name);
    setPlayerNames(team.players?.map(p => p.name) || ['', '']);
    setTeamDialogOpen(true);
  };

  const handleSaveTeam = async () => {
    if (!teamName.trim()) {
      toast.error('Please enter a team name');
      return;
    }

    setSavingTeam(true);
    try {
      const players = playerNames.filter(p => p.trim());
      if (editingTeam) {
        await tournamentApi.updateTeam(id, editingTeam.id, { name: teamName, players });
      } else {
        await tournamentApi.addTeam(id, { name: teamName, players });
      }
      toast.success(editingTeam ? 'Team updated' : 'Team added');
      setTeamDialogOpen(false);
      loadTournament();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save team');
    } finally {
      setSavingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId) => {
    if (!window.confirm('Delete this team?')) return;
    try {
      await tournamentApi.deleteTeam(id, teamId);
      toast.success('Team deleted');
      loadTournament();
    } catch (error) {
      toast.error('Failed to delete team');
    }
  };

  // Group functions
  const handleAssignGroups = async () => {
    if (tournament.teams?.length < tournament.num_groups * 2) {
      toast.error(`Need at least ${tournament.num_groups * 2} teams to create groups`);
      return;
    }
    
    try {
      await tournamentApi.assignGroups(id, true);
      toast.success('Groups assigned! Matches generated.');
      loadTournament();
      setActiveTab('groups');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to assign groups');
    }
  };

  // Knockout functions
  const handleStartKnockout = async () => {
    try {
      await tournamentApi.startKnockout(id);
      toast.success('Knockout phase started!');
      loadTournament();
      setActiveTab('bracket');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to start knockout');
    }
  };

  // Score functions
  const openScoreDialog = (match) => {
    setSelectedMatch(match);
    const existingSets = match.result?.sets || [];
    const setsToWin = tournament.match_rules?.sets_to_win || 2;
    const numSets = Math.max(existingSets.length, setsToWin);
    
    setScores(
      Array.from({ length: numSets }, (_, i) => 
        existingSets[i] || { team1: 0, team2: 0 }
      )
    );
    setScoreDialogOpen(true);
  };

  const updateScore = (setIndex, team, delta) => {
    setScores(prev => {
      const newScores = [...prev];
      const newValue = Math.max(0, newScores[setIndex][team] + delta);
      newScores[setIndex] = { ...newScores[setIndex], [team]: newValue };
      return newScores;
    });
  };

  const handleSaveScore = async () => {
    setSavingScore(true);
    try {
      await tournamentApi.updateMatchScore(id, selectedMatch.id, { sets: scores });
      toast.success('Score saved');
      setScoreDialogOpen(false);
      loadTournament();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to save score');
    } finally {
      setSavingScore(false);
    }
  };

  // Export
  const handleExport = async () => {
    try {
      const response = await tournamentApi.exportPdf(id);
      const blob = new Blob([response.data], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${tournament.name}_results.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success('Results exported');
    } catch (error) {
      toast.error('Failed to export results');
    }
  };

  // Helper to get team name by ID
  const getTeamName = (teamId) => {
    if (!teamId) return 'TBD';
    const team = tournament?.teams?.find(t => t.id === teamId);
    return team?.name || 'TBD';
  };

  // Check if all group matches are completed
  const allGroupMatchesCompleted = () => {
    if (!tournament?.groups) return false;
    return tournament.groups.every(group => 
      group.matches?.every(match => match.result?.completed)
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen sand-texture flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-ocean" />
      </div>
    );
  }

  if (!tournament) return null;

  return (
    <div className="min-h-screen sand-texture">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-stone-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate('/dashboard')}
              className="text-navy"
              data-testid="back-btn"
            >
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="font-heading text-xl font-bold text-navy truncate max-w-[200px] sm:max-w-none">
                {tournament.name}
              </h1>
              <p className="text-xs text-muted-foreground capitalize">
                {tournament.status.replace('_', ' ')}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
            className="border-ocean text-ocean hover:bg-ocean/5"
            data-testid="export-btn"
          >
            <Download className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Export</span>
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid grid-cols-3 w-full max-w-md mx-auto mb-6 bg-stone-100">
            <TabsTrigger 
              value="teams" 
              className="data-[state=active]:bg-white data-[state=active]:text-ocean"
              data-testid="tab-teams"
            >
              <Users className="w-4 h-4 mr-2" />
              Teams
            </TabsTrigger>
            <TabsTrigger 
              value="groups"
              className="data-[state=active]:bg-white data-[state=active]:text-ocean"
              data-testid="tab-groups"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Groups
            </TabsTrigger>
            <TabsTrigger 
              value="bracket"
              className="data-[state=active]:bg-white data-[state=active]:text-ocean"
              data-testid="tab-bracket"
            >
              <Play className="w-4 h-4 mr-2" />
              Bracket
            </TabsTrigger>
          </TabsList>

          {/* Teams Tab */}
          <TabsContent value="teams" className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <p className="text-muted-foreground">
                {tournament.teams?.length || 0} / {tournament.num_teams} teams
              </p>
              {tournament.status === 'draft' && tournament.teams?.length < tournament.num_teams && (
                <Button
                  onClick={handleAddTeam}
                  className="bg-sunset hover:bg-sunset/90 text-white rounded-full"
                  data-testid="add-team-btn"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Team
                </Button>
              )}
            </div>

            {tournament.teams?.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center py-12">
                  <Users className="w-12 h-12 text-stone-300 mb-4" />
                  <p className="text-muted-foreground mb-4">No teams added yet</p>
                  <Button 
                    onClick={handleAddTeam}
                    className="bg-sunset hover:bg-sunset/90 text-white rounded-full"
                    data-testid="add-first-team-btn"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Team
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {tournament.teams?.map((team, idx) => (
                  <Card 
                    key={team.id} 
                    className="card-elevated animate-fade-in"
                    style={{ animationDelay: `${idx * 0.05}s` }}
                    data-testid={`team-card-${team.id}`}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-heading text-lg font-bold text-navy">
                            {team.name}
                          </h3>
                          {team.players?.length > 0 && (
                            <p className="text-sm text-muted-foreground mt-1">
                              {team.players.map(p => p.name).join(', ')}
                            </p>
                          )}
                          {team.group_id && (
                            <span className="badge-status badge-active mt-2 inline-block">
                              {tournament.groups?.find(g => g.id === team.group_id)?.name || 'Group'}
                            </span>
                          )}
                        </div>
                        {tournament.status === 'draft' && (
                          <div className="flex gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEditTeam(team)}
                              className="text-ocean"
                              data-testid={`edit-team-${team.id}`}
                            >
                              Edit
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteTeam(team.id)}
                              className="text-muted-foreground hover:text-destructive"
                              data-testid={`delete-team-${team.id}`}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Start Groups Button */}
            {tournament.status === 'draft' && tournament.teams?.length >= tournament.num_groups * 2 && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleAssignGroups}
                  className="bg-ocean hover:bg-ocean/90 text-white rounded-full px-8"
                  data-testid="assign-groups-btn"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Start Group Phase
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Groups Tab */}
          <TabsContent value="groups" className="animate-fade-in">
            {tournament.groups?.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center py-12">
                  <Trophy className="w-12 h-12 text-stone-300 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Groups not yet created
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Add teams and start the group phase
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-8">
                {tournament.groups?.map(group => (
                  <Card key={group.id} className="overflow-hidden" data-testid={`group-${group.id}`}>
                    <CardHeader className="bg-ocean/10 py-3">
                      <CardTitle className="font-heading text-xl text-navy">
                        {group.name}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                      {/* Standings Table */}
                      <div className="overflow-x-auto">
                        <table className="standings-table">
                          <thead>
                            <tr>
                              <th className="w-8">#</th>
                              <th>Team</th>
                              <th className="text-center">P</th>
                              <th className="text-center">W</th>
                              <th className="text-center">L</th>
                              <th className="text-center">Sets</th>
                              <th className="text-center">Pts</th>
                            </tr>
                          </thead>
                          <tbody>
                            {group.standings?.map((standing, idx) => (
                              <tr key={standing.team_id} data-testid={`standing-${standing.team_id}`}>
                                <td className="font-bold text-navy">{idx + 1}</td>
                                <td className="font-medium">{standing.team_name}</td>
                                <td className="text-center">{standing.matches_played}</td>
                                <td className="text-center text-ocean font-semibold">{standing.wins}</td>
                                <td className="text-center">{standing.losses}</td>
                                <td className="text-center text-sm">
                                  {standing.sets_won}-{standing.sets_lost}
                                </td>
                                <td className="text-center font-bold text-sunset">{standing.points}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {/* Matches */}
                      <div className="p-4 border-t border-stone-100">
                        <p className="label-caps mb-3">MATCHES</p>
                        <div className="space-y-2">
                          {group.matches?.map(match => (
                            <div
                              key={match.id}
                              className={`match-card p-3 ${match.result?.completed ? 'border-ocean/30' : ''}`}
                              onClick={() => !match.result?.completed && openScoreDialog(match)}
                              data-testid={`match-${match.id}`}
                            >
                              <div className="flex items-center justify-between">
                                <div className="flex-1">
                                  <div className={`flex items-center justify-between py-1 ${
                                    match.result?.winner_id === match.team1_id ? 'text-ocean font-bold' : ''
                                  }`}>
                                    <span>{getTeamName(match.team1_id)}</span>
                                    {match.result?.completed && (
                                      <span className="score-display text-lg">
                                        {match.result.sets?.reduce((sum, s) => sum + (s.team1 > s.team2 ? 1 : 0), 0)}
                                      </span>
                                    )}
                                  </div>
                                  <div className={`flex items-center justify-between py-1 ${
                                    match.result?.winner_id === match.team2_id ? 'text-ocean font-bold' : ''
                                  }`}>
                                    <span>{getTeamName(match.team2_id)}</span>
                                    {match.result?.completed && (
                                      <span className="score-display text-lg">
                                        {match.result.sets?.reduce((sum, s) => sum + (s.team2 > s.team1 ? 1 : 0), 0)}
                                      </span>
                                    )}
                                  </div>
                                </div>
                                {match.result?.completed ? (
                                  <div className="ml-4 text-xs text-muted-foreground">
                                    {match.result.sets?.map((s, i) => (
                                      <div key={i}>{s.team1}-{s.team2}</div>
                                    ))}
                                  </div>
                                ) : (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-ocean ml-2"
                                    data-testid={`enter-score-${match.id}`}
                                  >
                                    Enter Score
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Start Knockout Button */}
                {tournament.status === 'group_phase' && allGroupMatchesCompleted() && (
                  <div className="flex justify-center">
                    <Button
                      onClick={handleStartKnockout}
                      className="bg-sunset hover:bg-sunset/90 text-white rounded-full px-8 animate-pulse-glow"
                      data-testid="start-knockout-btn"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      Start Knockout Phase
                    </Button>
                  </div>
                )}
              </div>
            )}
          </TabsContent>

          {/* Bracket Tab */}
          <TabsContent value="bracket" className="animate-fade-in">
            {tournament.knockout_matches?.length === 0 ? (
              <Card className="border-dashed border-2 bg-transparent">
                <CardContent className="flex flex-col items-center py-12">
                  <Volleyball className="w-12 h-12 text-stone-300 mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Knockout bracket not started
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Complete group phase first
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div>
                {/* Round Selector */}
                <div className="round-selector mb-6">
                  {['quarterfinal', 'semifinal', 'final', 'third_place'].map(round => {
                    const hasMatches = tournament.knockout_matches?.some(m => m.round_name === round);
                    if (!hasMatches) return null;
                    return (
                      <button
                        key={round}
                        onClick={() => setSelectedRound(round)}
                        className={`round-chip ${selectedRound === round ? 'round-chip-active' : ''}`}
                        data-testid={`round-${round}`}
                      >
                        {round === 'third_place' ? '3rd Place' : round.charAt(0).toUpperCase() + round.slice(1)}
                      </button>
                    );
                  })}
                </div>

                {/* Matches for selected round */}
                <div className="grid gap-4 max-w-md mx-auto">
                  {tournament.knockout_matches
                    ?.filter(m => m.round_name === selectedRound)
                    .map(match => (
                      <Card
                        key={match.id}
                        className={`card-elevated ${match.result?.completed ? 'border-accent' : ''} ${
                          match.round_name === 'final' && match.result?.completed ? 'winner-glow' : ''
                        }`}
                        onClick={() => match.team1_id && match.team2_id && !match.result?.completed && openScoreDialog(match)}
                        data-testid={`knockout-match-${match.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="space-y-3">
                            {/* Team 1 */}
                            <div className={`bracket-team ${
                              match.result?.winner_id === match.team1_id ? 'bracket-team-winner' : 'bg-stone-50'
                            }`}>
                              <span className={`font-medium ${
                                match.result?.winner_id === match.team1_id ? 'text-navy font-bold' : ''
                              }`}>
                                {getTeamName(match.team1_id)}
                              </span>
                              {match.result?.completed && (
                                <span className="score-display text-xl">
                                  {match.result.sets?.reduce((sum, s) => sum + (s.team1 > s.team2 ? 1 : 0), 0)}
                                </span>
                              )}
                            </div>

                            {/* VS */}
                            <div className="text-center text-xs text-muted-foreground">VS</div>

                            {/* Team 2 */}
                            <div className={`bracket-team ${
                              match.result?.winner_id === match.team2_id ? 'bracket-team-winner' : 'bg-stone-50'
                            }`}>
                              <span className={`font-medium ${
                                match.result?.winner_id === match.team2_id ? 'text-navy font-bold' : ''
                              }`}>
                                {getTeamName(match.team2_id)}
                              </span>
                              {match.result?.completed && (
                                <span className="score-display text-xl">
                                  {match.result.sets?.reduce((sum, s) => sum + (s.team2 > s.team1 ? 1 : 0), 0)}
                                </span>
                              )}
                            </div>

                            {/* Set Scores */}
                            {match.result?.completed && (
                              <div className="text-center text-sm text-muted-foreground pt-2 border-t">
                                {match.result.sets?.map((s, i) => `${s.team1}-${s.team2}`).join(' | ')}
                              </div>
                            )}

                            {/* Enter Score Button */}
                            {!match.result?.completed && match.team1_id && match.team2_id && (
                              <Button
                                className="w-full mt-2 bg-ocean hover:bg-ocean/90 text-white"
                                data-testid={`enter-knockout-score-${match.id}`}
                              >
                                Enter Score
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                </div>

                {/* Winner Display */}
                {tournament.status === 'completed' && (
                  <div className="mt-8 text-center animate-slide-up">
                    <div className="inline-block bg-accent/20 rounded-2xl px-8 py-6">
                      <p className="label-caps mb-2">CHAMPION</p>
                      <h2 className="font-heading text-3xl font-bold text-navy">
                        {getTeamName(
                          tournament.knockout_matches?.find(m => m.round_name === 'final')?.result?.winner_id
                        )}
                      </h2>
                    </div>
                  </div>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>

      {/* Team Dialog */}
      <Dialog open={teamDialogOpen} onOpenChange={setTeamDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-navy">
              {editingTeam ? 'EDIT TEAM' : 'ADD TEAM'}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="space-y-2">
              <Label className="text-navy font-medium">Team Name</Label>
              <Input
                value={teamName}
                onChange={(e) => setTeamName(e.target.value)}
                placeholder="Team Awesome"
                className="h-12"
                data-testid="team-name-input"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-navy font-medium">Players (optional)</Label>
              {playerNames.map((name, idx) => (
                <Input
                  key={idx}
                  value={name}
                  onChange={(e) => {
                    const newNames = [...playerNames];
                    newNames[idx] = e.target.value;
                    setPlayerNames(newNames);
                  }}
                  placeholder={`Player ${idx + 1}`}
                  className="h-10"
                  data-testid={`player-${idx}-input`}
                />
              ))}
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setPlayerNames([...playerNames, ''])}
                className="text-ocean"
              >
                <Plus className="w-4 h-4 mr-1" />
                Add Player
              </Button>
            </div>
            <Button
              onClick={handleSaveTeam}
              disabled={savingTeam}
              className="w-full h-12 bg-sunset hover:bg-sunset/90 text-white rounded-full"
              data-testid="save-team-btn"
            >
              {savingTeam ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Team'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Score Dialog - Big Tap */}
      <Dialog open={scoreDialogOpen} onOpenChange={setScoreDialogOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-navy text-center">
              ENTER SCORE
            </DialogTitle>
          </DialogHeader>
          {selectedMatch && (
            <div className="space-y-6 mt-4">
              {/* Team Names */}
              <div className="flex justify-between text-center">
                <div className="flex-1">
                  <p className="font-heading text-lg font-bold text-navy truncate px-2">
                    {getTeamName(selectedMatch.team1_id)}
                  </p>
                </div>
                <div className="text-muted-foreground px-4">VS</div>
                <div className="flex-1">
                  <p className="font-heading text-lg font-bold text-navy truncate px-2">
                    {getTeamName(selectedMatch.team2_id)}
                  </p>
                </div>
              </div>

              {/* Set Scores */}
              <ScrollArea className="max-h-[300px]">
                <div className="space-y-4">
                  {scores.map((set, idx) => (
                    <div key={idx} className="space-y-2">
                      <p className="label-caps text-center">SET {idx + 1}</p>
                      <div className="flex items-center justify-center gap-4">
                        {/* Team 1 Score */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateScore(idx, 'team1', -1)}
                            className="score-btn score-btn-minus touch-target"
                            data-testid={`score-minus-t1-s${idx}`}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <span className="score-display text-4xl w-16 text-center text-navy">
                            {set.team1}
                          </span>
                          <button
                            onClick={() => updateScore(idx, 'team1', 1)}
                            className="score-btn score-btn-plus touch-target"
                            data-testid={`score-plus-t1-s${idx}`}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>

                        <span className="text-2xl text-muted-foreground">:</span>

                        {/* Team 2 Score */}
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => updateScore(idx, 'team2', -1)}
                            className="score-btn score-btn-minus touch-target"
                            data-testid={`score-minus-t2-s${idx}`}
                          >
                            <ChevronLeft className="w-6 h-6" />
                          </button>
                          <span className="score-display text-4xl w-16 text-center text-navy">
                            {set.team2}
                          </span>
                          <button
                            onClick={() => updateScore(idx, 'team2', 1)}
                            className="score-btn score-btn-plus touch-target"
                            data-testid={`score-plus-t2-s${idx}`}
                          >
                            <ChevronRight className="w-6 h-6" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              {/* Add Set Button */}
              <Button
                variant="outline"
                onClick={() => setScores([...scores, { team1: 0, team2: 0 }])}
                className="w-full border-ocean text-ocean"
                data-testid="add-set-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Set
              </Button>

              {/* Save Button */}
              <Button
                onClick={handleSaveScore}
                disabled={savingScore}
                className="w-full h-14 bg-sunset hover:bg-sunset/90 text-white rounded-full text-lg font-bold shadow-sunset"
                data-testid="save-score-btn"
              >
                {savingScore ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Score'
                )}
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
