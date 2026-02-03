from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import StreamingResponse
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime, timezone, timedelta
import jwt
import bcrypt
from itertools import combinations
import io

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT Configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'volleypro-secret-key-change-in-production')
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# Create the main app
app = FastAPI(title="VolleyPro API", version="1.0.0")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

security = HTTPBearer()

# ============ MODELS ============

class UserCreate(BaseModel):
    email: EmailStr
    password: str
    name: str

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    id: str
    email: str
    name: str

class TokenResponse(BaseModel):
    token: str
    user: UserResponse

class Player(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str

class TeamCreate(BaseModel):
    name: str
    players: List[str] = []  # List of player names

class Team(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    players: List[Player] = []
    group_id: Optional[str] = None

class MatchRules(BaseModel):
    sets_to_win: int = 2
    points_per_set: int = 21
    tiebreak_points: int = 15
    min_lead: int = 2
    cap_points: int = 30

class TiebreakerRules(BaseModel):
    order: List[str] = ["points", "set_diff", "head_to_head"]

class TournamentCreate(BaseModel):
    name: str
    num_teams: int
    num_groups: int = 2
    teams_advancing_per_group: int = 2
    match_rules: MatchRules = MatchRules()
    tiebreaker_rules: TiebreakerRules = TiebreakerRules()
    third_place_match: bool = True
    start_date: Optional[str] = None
    location: Optional[str] = None

class SetScore(BaseModel):
    team1: int = 0
    team2: int = 0

class MatchResult(BaseModel):
    sets: List[SetScore] = []
    winner_id: Optional[str] = None
    completed: bool = False

class Match(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    team1_id: Optional[str] = None
    team2_id: Optional[str] = None
    result: MatchResult = MatchResult()
    group_id: Optional[str] = None
    round_name: Optional[str] = None  # For knockout: "quarterfinal", "semifinal", "final", "third_place"
    bracket_position: Optional[int] = None
    court: Optional[str] = None
    scheduled_time: Optional[str] = None

class GroupStanding(BaseModel):
    team_id: str
    team_name: str
    matches_played: int = 0
    wins: int = 0
    losses: int = 0
    sets_won: int = 0
    sets_lost: int = 0
    points_scored: int = 0
    points_against: int = 0
    points: int = 0  # Tournament points

class Group(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    team_ids: List[str] = []
    matches: List[Match] = []
    standings: List[GroupStanding] = []

class Tournament(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    owner_id: str
    status: str = "draft"  # draft, group_phase, knockout_phase, completed
    num_teams: int
    num_groups: int
    teams_advancing_per_group: int
    match_rules: MatchRules
    tiebreaker_rules: TiebreakerRules
    third_place_match: bool
    teams: List[Team] = []
    groups: List[Group] = []
    knockout_matches: List[Match] = []
    start_date: Optional[str] = None
    location: Optional[str] = None
    created_at: str = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class MatchScoreUpdate(BaseModel):
    sets: List[SetScore]

# ============ AUTH HELPERS ============

def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode(), hashed.encode())

def create_token(user_id: str) -> str:
    payload = {
        "user_id": user_id,
        "exp": datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRATION_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    try:
        payload = jwt.decode(credentials.credentials, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        user_id = payload.get("user_id")
        if not user_id:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"id": user_id}, {"_id": 0})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ============ AUTH ROUTES ============

@api_router.post("/auth/register", response_model=TokenResponse)
async def register(user: UserCreate):
    existing = await db.users.find_one({"email": user.email})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user_id = str(uuid.uuid4())
    user_doc = {
        "id": user_id,
        "email": user.email,
        "name": user.name,
        "password": hash_password(user.password),
        "created_at": datetime.now(timezone.utc).isoformat()
    }
    await db.users.insert_one(user_doc)
    
    token = create_token(user_id)
    return TokenResponse(
        token=token,
        user=UserResponse(id=user_id, email=user.email, name=user.name)
    )

@api_router.post("/auth/login", response_model=TokenResponse)
async def login(credentials: UserLogin):
    user = await db.users.find_one({"email": credentials.email}, {"_id": 0})
    if not user or not verify_password(credentials.password, user["password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    token = create_token(user["id"])
    return TokenResponse(
        token=token,
        user=UserResponse(id=user["id"], email=user["email"], name=user["name"])
    )

@api_router.get("/auth/me", response_model=UserResponse)
async def get_me(user: dict = Depends(get_current_user)):
    return UserResponse(id=user["id"], email=user["email"], name=user["name"])

# ============ TOURNAMENT ROUTES ============

@api_router.post("/tournaments", response_model=Dict[str, Any])
async def create_tournament(data: TournamentCreate, user: dict = Depends(get_current_user)):
    tournament = Tournament(
        name=data.name,
        owner_id=user["id"],
        num_teams=data.num_teams,
        num_groups=data.num_groups,
        teams_advancing_per_group=data.teams_advancing_per_group,
        match_rules=data.match_rules,
        tiebreaker_rules=data.tiebreaker_rules,
        third_place_match=data.third_place_match,
        start_date=data.start_date,
        location=data.location
    )
    
    doc = tournament.model_dump()
    await db.tournaments.insert_one(doc)
    
    # Remove _id for response
    return {k: v for k, v in doc.items() if k != "_id"}

@api_router.get("/tournaments", response_model=List[Dict[str, Any]])
async def get_tournaments(user: dict = Depends(get_current_user)):
    tournaments = await db.tournaments.find(
        {"owner_id": user["id"]},
        {"_id": 0}
    ).to_list(100)
    return tournaments

@api_router.get("/tournaments/{tournament_id}", response_model=Dict[str, Any])
async def get_tournament(tournament_id: str, user: dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return tournament

@api_router.delete("/tournaments/{tournament_id}")
async def delete_tournament(tournament_id: str, user: dict = Depends(get_current_user)):
    result = await db.tournaments.delete_one({"id": tournament_id, "owner_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Tournament not found")
    return {"message": "Tournament deleted"}

# ============ TEAM ROUTES ============

@api_router.post("/tournaments/{tournament_id}/teams", response_model=Dict[str, Any])
async def add_team(tournament_id: str, team_data: TeamCreate, user: dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    if len(tournament.get("teams", [])) >= tournament["num_teams"]:
        raise HTTPException(status_code=400, detail="Maximum teams reached")
    
    team = Team(
        name=team_data.name,
        players=[Player(name=p) for p in team_data.players]
    )
    team_dict = team.model_dump()
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$push": {"teams": team_dict}}
    )
    
    return team_dict

@api_router.put("/tournaments/{tournament_id}/teams/{team_id}", response_model=Dict[str, Any])
async def update_team(tournament_id: str, team_id: str, team_data: TeamCreate, user: dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    teams = tournament.get("teams", [])
    team_index = next((i for i, t in enumerate(teams) if t["id"] == team_id), None)
    if team_index is None:
        raise HTTPException(status_code=404, detail="Team not found")
    
    teams[team_index]["name"] = team_data.name
    teams[team_index]["players"] = [{"id": str(uuid.uuid4()), "name": p} for p in team_data.players]
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": {"teams": teams}}
    )
    
    return teams[team_index]

@api_router.delete("/tournaments/{tournament_id}/teams/{team_id}")
async def delete_team(tournament_id: str, team_id: str, user: dict = Depends(get_current_user)):
    result = await db.tournaments.update_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"$pull": {"teams": {"id": team_id}}}
    )
    if result.modified_count == 0:
        raise HTTPException(status_code=404, detail="Team not found")
    return {"message": "Team deleted"}

# ============ GROUP ASSIGNMENT ============

@api_router.post("/tournaments/{tournament_id}/assign-groups")
async def assign_groups(tournament_id: str, auto: bool = True, user: dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    teams = tournament.get("teams", [])
    num_groups = tournament["num_groups"]
    
    if len(teams) < num_groups * 2:
        raise HTTPException(status_code=400, detail="Not enough teams for groups")
    
    # Create groups
    groups = []
    for i in range(num_groups):
        group = Group(name=f"Group {chr(65 + i)}")  # A, B, C...
        groups.append(group.model_dump())
    
    # Auto assign teams to groups (round-robin distribution)
    if auto:
        for i, team in enumerate(teams):
            group_index = i % num_groups
            groups[group_index]["team_ids"].append(team["id"])
            teams[i]["group_id"] = groups[group_index]["id"]
    
    # Generate round-robin matches for each group
    for group in groups:
        group_teams = group["team_ids"]
        matches = []
        for team1_id, team2_id in combinations(group_teams, 2):
            match = Match(
                team1_id=team1_id,
                team2_id=team2_id,
                group_id=group["id"]
            )
            matches.append(match.model_dump())
        group["matches"] = matches
        
        # Initialize standings
        group["standings"] = [
            GroupStanding(
                team_id=tid,
                team_name=next((t["name"] for t in teams if t["id"] == tid), "Unknown")
            ).model_dump()
            for tid in group_teams
        ]
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": {"groups": groups, "teams": teams, "status": "group_phase"}}
    )
    
    return {"message": "Groups assigned", "groups": groups}

@api_router.post("/tournaments/{tournament_id}/manual-assign-group")
async def manual_assign_group(
    tournament_id: str, 
    team_id: str, 
    group_index: int, 
    user: dict = Depends(get_current_user)
):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    teams = tournament.get("teams", [])
    groups = tournament.get("groups", [])
    
    if group_index >= len(groups):
        raise HTTPException(status_code=400, detail="Invalid group index")
    
    # Remove team from current group
    for group in groups:
        if team_id in group["team_ids"]:
            group["team_ids"].remove(team_id)
    
    # Add to new group
    groups[group_index]["team_ids"].append(team_id)
    
    # Update team's group_id
    for team in teams:
        if team["id"] == team_id:
            team["group_id"] = groups[group_index]["id"]
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": {"groups": groups, "teams": teams}}
    )
    
    return {"message": "Team reassigned"}

# ============ MATCH MANAGEMENT ============

def calculate_match_winner(sets: List[Dict], rules: Dict) -> Optional[str]:
    """Calculate winner based on sets and rules"""
    sets_to_win = rules.get("sets_to_win", 2)
    team1_sets = 0
    team2_sets = 0
    
    for s in sets:
        if s["team1"] > s["team2"]:
            team1_sets += 1
        elif s["team2"] > s["team1"]:
            team2_sets += 1
    
    if team1_sets >= sets_to_win:
        return "team1"
    elif team2_sets >= sets_to_win:
        return "team2"
    return None

def update_standings(groups: List[Dict], group_id: str, match: Dict, teams: List[Dict]):
    """Update standings after a match result"""
    for group in groups:
        if group["id"] != group_id:
            continue
        
        standings_map = {s["team_id"]: s for s in group["standings"]}
        
        team1_id = match["team1_id"]
        team2_id = match["team2_id"]
        result = match["result"]
        
        if team1_id not in standings_map or team2_id not in standings_map:
            continue
        
        s1 = standings_map[team1_id]
        s2 = standings_map[team2_id]
        
        # Reset if re-entering scores
        s1["matches_played"] += 1
        s2["matches_played"] += 1
        
        team1_sets = 0
        team2_sets = 0
        team1_points = 0
        team2_points = 0
        
        for set_score in result["sets"]:
            team1_points += set_score["team1"]
            team2_points += set_score["team2"]
            if set_score["team1"] > set_score["team2"]:
                team1_sets += 1
            elif set_score["team2"] > set_score["team1"]:
                team2_sets += 1
        
        s1["sets_won"] += team1_sets
        s1["sets_lost"] += team2_sets
        s2["sets_won"] += team2_sets
        s2["sets_lost"] += team1_sets
        
        s1["points_scored"] += team1_points
        s1["points_against"] += team2_points
        s2["points_scored"] += team2_points
        s2["points_against"] += team1_points
        
        if result.get("winner_id") == team1_id:
            s1["wins"] += 1
            s1["points"] += 2
            s2["losses"] += 1
            s2["points"] += 1
        elif result.get("winner_id") == team2_id:
            s2["wins"] += 1
            s2["points"] += 2
            s1["losses"] += 1
            s1["points"] += 1
        
        # Sort standings
        group["standings"] = sorted(
            group["standings"],
            key=lambda x: (
                -x["points"],
                -(x["sets_won"] - x["sets_lost"]),
                -(x["points_scored"] - x["points_against"])
            )
        )
        break

@api_router.put("/tournaments/{tournament_id}/matches/{match_id}/score")
async def update_match_score(
    tournament_id: str, 
    match_id: str, 
    score_data: MatchScoreUpdate,
    user: dict = Depends(get_current_user)
):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    groups = tournament.get("groups", [])
    knockout_matches = tournament.get("knockout_matches", [])
    teams = tournament.get("teams", [])
    rules = tournament.get("match_rules", {})
    
    match_found = False
    is_knockout = False
    
    # Check group matches
    for group in groups:
        for i, match in enumerate(group["matches"]):
            if match["id"] == match_id:
                match_found = True
                
                # Validate and update score
                sets = [s.model_dump() for s in score_data.sets]
                winner = calculate_match_winner(sets, rules)
                
                group["matches"][i]["result"]["sets"] = sets
                
                if winner:
                    winner_id = match["team1_id"] if winner == "team1" else match["team2_id"]
                    group["matches"][i]["result"]["winner_id"] = winner_id
                    group["matches"][i]["result"]["completed"] = True
                    
                    # Update standings
                    update_standings(groups, group["id"], group["matches"][i], teams)
                
                break
        if match_found:
            break
    
    # Check knockout matches
    if not match_found:
        for i, match in enumerate(knockout_matches):
            if match["id"] == match_id:
                match_found = True
                is_knockout = True
                
                sets = [s.model_dump() for s in score_data.sets]
                winner = calculate_match_winner(sets, rules)
                
                knockout_matches[i]["result"]["sets"] = sets
                
                if winner:
                    winner_id = match["team1_id"] if winner == "team1" else match["team2_id"]
                    knockout_matches[i]["result"]["winner_id"] = winner_id
                    knockout_matches[i]["result"]["completed"] = True
                    
                    # Progress winner to next round
                    progress_knockout_bracket(knockout_matches, match, winner_id)
                
                break
    
    if not match_found:
        raise HTTPException(status_code=404, detail="Match not found")
    
    # Check if all knockout matches complete
    status = tournament.get("status", "draft")
    if is_knockout:
        final_match = next((m for m in knockout_matches if m.get("round_name") == "final"), None)
        if final_match and final_match["result"].get("completed"):
            status = "completed"
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": {"groups": groups, "knockout_matches": knockout_matches, "status": status}}
    )
    
    return {"message": "Score updated"}

def progress_knockout_bracket(knockout_matches: List[Dict], completed_match: Dict, winner_id: str):
    """Progress winner to next round in knockout bracket"""
    round_progression = {
        "quarterfinal": "semifinal",
        "semifinal": "final",
        "semifinal_loser": "third_place"
    }
    
    current_round = completed_match.get("round_name", "")
    bracket_pos = completed_match.get("bracket_position", 0)
    
    next_round = round_progression.get(current_round)
    if not next_round:
        return
    
    # Find the next match
    next_pos = bracket_pos // 2
    for match in knockout_matches:
        if match.get("round_name") == next_round and match.get("bracket_position") == next_pos:
            if bracket_pos % 2 == 0:
                match["team1_id"] = winner_id
            else:
                match["team2_id"] = winner_id
            break
    
    # Handle third place match (losers from semifinals)
    if current_round == "semifinal":
        loser_id = completed_match["team1_id"] if winner_id == completed_match["team2_id"] else completed_match["team2_id"]
        for match in knockout_matches:
            if match.get("round_name") == "third_place":
                if bracket_pos % 2 == 0:
                    match["team1_id"] = loser_id
                else:
                    match["team2_id"] = loser_id
                break

# ============ KNOCKOUT PHASE ============

@api_router.post("/tournaments/{tournament_id}/start-knockout")
async def start_knockout_phase(tournament_id: str, user: dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    groups = tournament.get("groups", [])
    teams_advancing = tournament.get("teams_advancing_per_group", 2)
    third_place = tournament.get("third_place_match", True)
    
    # Check if all group matches completed
    for group in groups:
        for match in group["matches"]:
            if not match["result"].get("completed"):
                raise HTTPException(status_code=400, detail="Complete all group matches first")
    
    # Get qualified teams from each group
    qualified_teams = []
    for group in groups:
        standings = group.get("standings", [])
        for i in range(min(teams_advancing, len(standings))):
            qualified_teams.append({
                "team_id": standings[i]["team_id"],
                "seed": i + 1,
                "group_name": group["name"]
            })
    
    # Generate knockout bracket based on number of qualified teams
    num_teams = len(qualified_teams)
    knockout_matches = []
    
    if num_teams >= 8:
        # Quarterfinals
        for i in range(4):
            match = Match(
                round_name="quarterfinal",
                bracket_position=i
            ).model_dump()
            knockout_matches.append(match)
        
        # Semifinals
        for i in range(2):
            match = Match(
                round_name="semifinal",
                bracket_position=i
            ).model_dump()
            knockout_matches.append(match)
    elif num_teams >= 4:
        # Semifinals only
        for i in range(2):
            match = Match(
                round_name="semifinal",
                bracket_position=i
            ).model_dump()
            knockout_matches.append(match)
    
    # Final
    final = Match(round_name="final", bracket_position=0).model_dump()
    knockout_matches.append(final)
    
    # Third place match
    if third_place and num_teams >= 4:
        third = Match(round_name="third_place", bracket_position=0).model_dump()
        knockout_matches.append(third)
    
    # Seed teams into bracket (cross-group seeding)
    if num_teams >= 8:
        # QF seeding: 1A vs 2B, 1B vs 2A, etc.
        seeds = []
        num_groups = len(groups)
        for seed in range(teams_advancing):
            for g_idx in range(num_groups):
                team = next((t for t in qualified_teams if t["seed"] == seed + 1 and t["group_name"] == groups[g_idx]["name"]), None)
                if team:
                    seeds.append(team["team_id"])
        
        # Assign to quarterfinals
        qf_pairings = [(0, 7), (3, 4), (1, 6), (2, 5)]  # Standard bracket seeding
        for i, (s1, s2) in enumerate(qf_pairings):
            if s1 < len(seeds):
                knockout_matches[i]["team1_id"] = seeds[s1]
            if s2 < len(seeds):
                knockout_matches[i]["team2_id"] = seeds[s2]
    
    elif num_teams >= 4:
        # Semifinal seeding
        seeds = []
        num_groups = len(groups)
        for seed in range(teams_advancing):
            for g_idx in range(num_groups):
                team = next((t for t in qualified_teams if t["seed"] == seed + 1 and t["group_name"] == groups[g_idx]["name"]), None)
                if team:
                    seeds.append(team["team_id"])
        
        sf_idx = 0
        for match in knockout_matches:
            if match["round_name"] == "semifinal":
                if sf_idx == 0:
                    match["team1_id"] = seeds[0] if len(seeds) > 0 else None
                    match["team2_id"] = seeds[3] if len(seeds) > 3 else None
                else:
                    match["team1_id"] = seeds[1] if len(seeds) > 1 else None
                    match["team2_id"] = seeds[2] if len(seeds) > 2 else None
                sf_idx += 1
    
    await db.tournaments.update_one(
        {"id": tournament_id},
        {"$set": {"knockout_matches": knockout_matches, "status": "knockout_phase"}}
    )
    
    return {"message": "Knockout phase started", "knockout_matches": knockout_matches}

# ============ SCHEDULE ============

@api_router.put("/tournaments/{tournament_id}/matches/{match_id}/schedule")
async def schedule_match(
    tournament_id: str,
    match_id: str,
    court: Optional[str] = None,
    scheduled_time: Optional[str] = None,
    user: dict = Depends(get_current_user)
):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    groups = tournament.get("groups", [])
    knockout_matches = tournament.get("knockout_matches", [])
    
    # Update in groups
    for group in groups:
        for match in group["matches"]:
            if match["id"] == match_id:
                if court:
                    match["court"] = court
                if scheduled_time:
                    match["scheduled_time"] = scheduled_time
                await db.tournaments.update_one(
                    {"id": tournament_id},
                    {"$set": {"groups": groups}}
                )
                return {"message": "Schedule updated"}
    
    # Update in knockout
    for match in knockout_matches:
        if match["id"] == match_id:
            if court:
                match["court"] = court
            if scheduled_time:
                match["scheduled_time"] = scheduled_time
            await db.tournaments.update_one(
                {"id": tournament_id},
                {"$set": {"knockout_matches": knockout_matches}}
            )
            return {"message": "Schedule updated"}
    
    raise HTTPException(status_code=404, detail="Match not found")

# ============ PDF EXPORT ============

@api_router.get("/tournaments/{tournament_id}/export-pdf")
async def export_pdf(tournament_id: str, user: dict = Depends(get_current_user)):
    tournament = await db.tournaments.find_one(
        {"id": tournament_id, "owner_id": user["id"]},
        {"_id": 0}
    )
    if not tournament:
        raise HTTPException(status_code=404, detail="Tournament not found")
    
    # Generate simple text-based report (can be enhanced with reportlab later)
    teams_map = {t["id"]: t["name"] for t in tournament.get("teams", [])}
    
    lines = []
    lines.append(f"{'=' * 60}")
    lines.append(f"TOURNAMENT: {tournament['name']}")
    lines.append(f"{'=' * 60}")
    lines.append(f"Status: {tournament.get('status', 'draft').upper()}")
    if tournament.get("location"):
        lines.append(f"Location: {tournament['location']}")
    if tournament.get("start_date"):
        lines.append(f"Date: {tournament['start_date']}")
    lines.append("")
    
    # Group Standings
    for group in tournament.get("groups", []):
        lines.append(f"\n{'-' * 40}")
        lines.append(f"{group['name']} STANDINGS")
        lines.append(f"{'-' * 40}")
        lines.append(f"{'Rank':<5}{'Team':<20}{'W':<4}{'L':<4}{'Sets':<8}{'Pts':<5}")
        lines.append("-" * 46)
        
        for i, s in enumerate(group.get("standings", [])):
            team_name = teams_map.get(s["team_id"], "Unknown")[:18]
            set_diff = f"{s['sets_won']}-{s['sets_lost']}"
            lines.append(f"{i+1:<5}{team_name:<20}{s['wins']:<4}{s['losses']:<4}{set_diff:<8}{s['points']:<5}")
        
        lines.append(f"\n{group['name']} MATCHES:")
        for match in group.get("matches", []):
            t1 = teams_map.get(match["team1_id"], "TBD")[:12]
            t2 = teams_map.get(match["team2_id"], "TBD")[:12]
            result = match.get("result", {})
            if result.get("completed"):
                sets_str = " | ".join([f"{s['team1']}-{s['team2']}" for s in result.get("sets", [])])
                winner = teams_map.get(result.get("winner_id"), "")
                lines.append(f"  {t1} vs {t2}: {sets_str} (Winner: {winner})")
            else:
                lines.append(f"  {t1} vs {t2}: Not played")
    
    # Knockout Bracket
    if tournament.get("knockout_matches"):
        lines.append(f"\n{'=' * 40}")
        lines.append("KNOCKOUT BRACKET")
        lines.append(f"{'=' * 40}")
        
        round_order = ["quarterfinal", "semifinal", "final", "third_place"]
        round_names = {
            "quarterfinal": "QUARTERFINALS",
            "semifinal": "SEMIFINALS",
            "final": "FINAL",
            "third_place": "3RD PLACE MATCH"
        }
        
        for round_key in round_order:
            matches = [m for m in tournament["knockout_matches"] if m.get("round_name") == round_key]
            if matches:
                lines.append(f"\n{round_names.get(round_key, round_key.upper())}:")
                for match in matches:
                    t1 = teams_map.get(match.get("team1_id"), "TBD")[:15]
                    t2 = teams_map.get(match.get("team2_id"), "TBD")[:15]
                    result = match.get("result", {})
                    if result.get("completed"):
                        sets_str = " | ".join([f"{s['team1']}-{s['team2']}" for s in result.get("sets", [])])
                        winner = teams_map.get(result.get("winner_id"), "")
                        lines.append(f"  {t1} vs {t2}: {sets_str} (Winner: {winner})")
                    else:
                        lines.append(f"  {t1} vs {t2}: Pending")
    
    lines.append(f"\n{'=' * 60}")
    lines.append("Generated by VolleyPro")
    lines.append(f"{'=' * 60}")
    
    content = "\n".join(lines)
    
    return StreamingResponse(
        io.BytesIO(content.encode()),
        media_type="text/plain",
        headers={"Content-Disposition": f"attachment; filename={tournament['name']}_results.txt"}
    )

# ============ BASIC ROUTES ============

@api_router.get("/")
async def root():
    return {"message": "VolleyPro API v1.0"}

@api_router.get("/health")
async def health():
    return {"status": "healthy"}

# Include the router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
