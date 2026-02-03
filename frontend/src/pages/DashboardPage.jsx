import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../lib/auth';
import { tournamentApi } from '../lib/api';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { toast } from 'sonner';
import { 
  Plus, Trophy, Calendar, MapPin, Users, ChevronRight, 
  Volleyball, LogOut, Loader2, Trash2 
} from 'lucide-react';

export default function DashboardPage() {
  const [tournaments, setTournaments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Form state
  const [formData, setFormData] = useState({
    name: '',
    num_teams: 8,
    num_groups: 2,
    teams_advancing_per_group: 2,
    third_place_match: true,
    location: '',
    start_date: '',
    match_rules: {
      sets_to_win: 2,
      points_per_set: 21,
      tiebreak_points: 15,
      min_lead: 2,
      cap_points: 30
    }
  });

  useEffect(() => {
    loadTournaments();
  }, []);

  const loadTournaments = async () => {
    try {
      const response = await tournamentApi.getAll();
      setTournaments(response.data);
    } catch (error) {
      toast.error('Failed to load tournaments');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTournament = async (e) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Please enter a tournament name');
      return;
    }

    setCreating(true);
    try {
      const response = await tournamentApi.create(formData);
      toast.success('Tournament created!');
      setCreateDialogOpen(false);
      setFormData({
        name: '',
        num_teams: 8,
        num_groups: 2,
        teams_advancing_per_group: 2,
        third_place_match: true,
        location: '',
        start_date: '',
        match_rules: {
          sets_to_win: 2,
          points_per_set: 21,
          tiebreak_points: 15,
          min_lead: 2,
          cap_points: 30
        }
      });
      navigate(`/tournament/${response.data.id}`);
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Failed to create tournament');
    } finally {
      setCreating(false);
    }
  };

  const handleDeleteTournament = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this tournament?')) return;
    
    try {
      await tournamentApi.delete(id);
      toast.success('Tournament deleted');
      loadTournaments();
    } catch (error) {
      toast.error('Failed to delete tournament');
    }
  };

  const getStatusBadge = (status) => {
    const badges = {
      draft: { class: 'badge-draft', label: 'Draft' },
      group_phase: { class: 'badge-active', label: 'Groups' },
      knockout_phase: { class: 'badge-active', label: 'Knockout' },
      completed: { class: 'badge-completed', label: 'Completed' }
    };
    const badge = badges[status] || badges.draft;
    return (
      <span className={`badge-status ${badge.class}`} data-testid={`badge-${status}`}>
        {badge.label}
      </span>
    );
  };

  return (
    <div className="min-h-screen sand-texture">
      {/* Header */}
      <header className="sticky top-0 z-40 glass border-b border-stone-200">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-ocean rounded-lg flex items-center justify-center">
              <Volleyball className="w-6 h-6 text-white" />
            </div>
            <span className="font-heading text-xl font-bold text-navy hidden sm:block">VOLLEYPRO</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">
              {user?.name}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { logout(); navigate('/login'); }}
              className="text-muted-foreground hover:text-navy"
              data-testid="logout-btn"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-heading text-3xl sm:text-4xl font-bold text-navy tracking-tight">
              MY TOURNAMENTS
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage your beach volleyball competitions
            </p>
          </div>
          
          {/* Desktop Create Button */}
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button 
                className="hidden md:flex bg-sunset hover:bg-sunset/90 text-white rounded-full shadow-sunset"
                data-testid="create-tournament-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Tournament
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="font-heading text-2xl text-navy">CREATE TOURNAMENT</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleCreateTournament} className="space-y-5 mt-4">
                <div className="space-y-2">
                  <Label className="text-navy font-medium">Tournament Name</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Summer Beach Championship"
                    className="h-12"
                    data-testid="tournament-name-input"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-navy font-medium">Number of Teams</Label>
                    <Select 
                      value={formData.num_teams.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, num_teams: parseInt(v) })}
                    >
                      <SelectTrigger className="h-12" data-testid="num-teams-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[4, 6, 8, 10, 12, 16].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} teams</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-navy font-medium">Number of Groups</Label>
                    <Select 
                      value={formData.num_groups.toString()} 
                      onValueChange={(v) => setFormData({ ...formData, num_groups: parseInt(v) })}
                    >
                      <SelectTrigger className="h-12" data-testid="num-groups-select">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {[2, 3, 4].map(n => (
                          <SelectItem key={n} value={n.toString()}>{n} groups</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-navy font-medium">Teams Advancing per Group</Label>
                  <Select 
                    value={formData.teams_advancing_per_group.toString()} 
                    onValueChange={(v) => setFormData({ ...formData, teams_advancing_per_group: parseInt(v) })}
                  >
                    <SelectTrigger className="h-12" data-testid="teams-advancing-select">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4].map(n => (
                        <SelectItem key={n} value={n.toString()}>{n} team{n > 1 ? 's' : ''}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between py-2">
                  <Label className="text-navy font-medium">Third Place Match</Label>
                  <Switch
                    checked={formData.third_place_match}
                    onCheckedChange={(v) => setFormData({ ...formData, third_place_match: v })}
                    data-testid="third-place-switch"
                  />
                </div>

                <div className="border-t border-stone-200 pt-4">
                  <p className="label-caps mb-3">MATCH RULES</p>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Sets to Win</Label>
                      <Select 
                        value={formData.match_rules.sets_to_win.toString()} 
                        onValueChange={(v) => setFormData({ 
                          ...formData, 
                          match_rules: { ...formData.match_rules, sets_to_win: parseInt(v) }
                        })}
                      >
                        <SelectTrigger data-testid="sets-to-win-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[1, 2, 3].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm text-muted-foreground">Points per Set</Label>
                      <Select 
                        value={formData.match_rules.points_per_set.toString()} 
                        onValueChange={(v) => setFormData({ 
                          ...formData, 
                          match_rules: { ...formData.match_rules, points_per_set: parseInt(v) }
                        })}
                      >
                        <SelectTrigger data-testid="points-per-set-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {[15, 21, 25].map(n => (
                            <SelectItem key={n} value={n.toString()}>{n}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label className="text-navy font-medium">Location (optional)</Label>
                    <Input
                      value={formData.location}
                      onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                      placeholder="Miami Beach"
                      className="h-12"
                      data-testid="location-input"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-navy font-medium">Start Date (optional)</Label>
                    <Input
                      type="date"
                      value={formData.start_date}
                      onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                      className="h-12"
                      data-testid="start-date-input"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={creating}
                  className="w-full h-12 bg-sunset hover:bg-sunset/90 text-white rounded-full font-semibold shadow-sunset"
                  data-testid="create-submit-btn"
                >
                  {creating ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    'Create Tournament'
                  )}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Tournament List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-ocean" />
          </div>
        ) : tournaments.length === 0 ? (
          <Card className="border-dashed border-2 border-stone-300 bg-transparent">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mb-4">
                <Trophy className="w-8 h-8 text-stone-400" />
              </div>
              <h3 className="font-heading text-xl text-navy mb-2">No tournaments yet</h3>
              <p className="text-muted-foreground text-center mb-6">
                Create your first beach volleyball tournament
              </p>
              <Button
                onClick={() => setCreateDialogOpen(true)}
                className="bg-sunset hover:bg-sunset/90 text-white rounded-full"
                data-testid="create-first-tournament-btn"
              >
                <Plus className="w-4 h-4 mr-2" />
                Create Tournament
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {tournaments.map((tournament, idx) => (
              <Card
                key={tournament.id}
                className="card-elevated cursor-pointer animate-fade-in"
                style={{ animationDelay: `${idx * 0.1}s` }}
                onClick={() => navigate(`/tournament/${tournament.id}`)}
                data-testid={`tournament-card-${tournament.id}`}
              >
                <CardContent className="p-4 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-heading text-xl sm:text-2xl font-bold text-navy truncate">
                          {tournament.name}
                        </h3>
                        {getStatusBadge(tournament.status)}
                      </div>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {tournament.teams?.length || 0}/{tournament.num_teams} teams
                        </span>
                        {tournament.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {tournament.location}
                          </span>
                        )}
                        {tournament.start_date && (
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" />
                            {tournament.start_date}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={(e) => handleDeleteTournament(tournament.id, e)}
                        className="text-muted-foreground hover:text-destructive"
                        data-testid={`delete-tournament-${tournament.id}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <ChevronRight className="w-5 h-5 text-muted-foreground" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      {/* Mobile FAB */}
      <button
        onClick={() => setCreateDialogOpen(true)}
        className="fab md:hidden"
        data-testid="fab-create-tournament"
      >
        <Plus className="w-6 h-6" />
      </button>
    </div>
  );
}
