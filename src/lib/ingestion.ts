import axios from 'axios';
import db from './db.ts';
import { calculatePoissonPrediction, estimateLambdas } from './models.ts';

const FOOTBALL_DATA_API = 'https://api.football-data.org/v4';
const API_KEY = process.env.FOOTBALL_DATA_API_KEY;

export async function fetchCompetitions() {
  if (!API_KEY) return;
  try {
    const response = await axios.get(`${FOOTBALL_DATA_API}/competitions`, {
      headers: { 'X-Auth-Token': API_KEY }
    });
    
    const stmt = db.prepare(`
      INSERT INTO competitions (source_key, name, country, type)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(source_key) DO UPDATE SET
        name = excluded.name,
        country = excluded.country,
        type = excluded.type
    `);

    for (const comp of response.data.competitions) {
      if (['SA', 'CL'].includes(comp.code)) { // Serie A and Champions League
        stmt.run(comp.code, comp.name, comp.area.name, comp.type);
      }
    }
  } catch (error) {
    console.error('Error fetching competitions:', error);
  }
}

export async function fetchMatches(competitionCode: string) {
  if (!API_KEY) return;
  try {
    const response = await axios.get(`${FOOTBALL_DATA_API}/competitions/${competitionCode}/matches`, {
      headers: { 'X-Auth-Token': API_KEY }
    });

    const teamStmt = db.prepare(`
      INSERT INTO teams (source_key, name, short_name, tla, crest)
      VALUES (?, ?, ?, ?, ?)
      ON CONFLICT(source_key) DO UPDATE SET
        name = excluded.name,
        short_name = excluded.short_name,
        tla = excluded.tla,
        crest = excluded.crest
    `);

    const matchStmt = db.prepare(`
      INSERT INTO matches (source_key, competition_id, utc_kickoff, home_team_id, away_team_id, status, stage)
      VALUES (?, (SELECT id FROM competitions WHERE source_key = ?), ?, 
             (SELECT id FROM teams WHERE source_key = ?), 
             (SELECT id FROM teams WHERE source_key = ?), ?, ?)
      ON CONFLICT(source_key) DO UPDATE SET
        competition_id = excluded.competition_id,
        utc_kickoff = excluded.utc_kickoff,
        home_team_id = excluded.home_team_id,
        away_team_id = excluded.away_team_id,
        status = excluded.status,
        stage = excluded.stage
    `);

    for (const match of response.data.matches) {
      // Safety check: skip matches with missing team data (common in early CL stages)
      if (!match.homeTeam?.id || !match.awayTeam?.id || !match.id) {
        continue;
      }

      // Save teams first
      teamStmt.run(
        match.homeTeam.id.toString(), 
        match.homeTeam.name || 'Unknown Team', 
        match.homeTeam.shortName || '', 
        match.homeTeam.tla || '', 
        match.homeTeam.crest || ''
      );
      teamStmt.run(
        match.awayTeam.id.toString(), 
        match.awayTeam.name || 'Unknown Team', 
        match.awayTeam.shortName || '', 
        match.awayTeam.tla || '', 
        match.awayTeam.crest || ''
      );

      // Save match
      matchStmt.run(
        match.id.toString(),
        competitionCode,
        match.utcDate,
        match.homeTeam.id.toString(),
        match.awayTeam.id.toString(),
        match.status,
        match.stage
      );
    }
  } catch (error) {
    console.error(`Error fetching matches for ${competitionCode}:`, error);
  }
}

export async function fetchOdds(competitionCode: string) {
  const ODDS_API_KEY = process.env.THE_ODDS_API_KEY;
  if (!ODDS_API_KEY) return;
  
  try {
    // This is a placeholder for real The Odds API integration
    // In a real app, you would fetch from https://api.the-odds-api.com/v4/sports/soccer_italy_serie_a/odds
    console.log(`Fetching odds for ${competitionCode}... (Mocked for now)`);
  } catch (error) {
    console.error('Error fetching odds:', error);
  }
}

/**
 * Mock Data Generator for initial run or missing API keys
 */
export function seedMockData() {
  const compStmt = db.prepare(`INSERT OR IGNORE INTO competitions (source_key, name, country, type) VALUES (?, ?, ?, ?)`);
  compStmt.run('SA', 'Serie A', 'Italy', 'LEAGUE');
  compStmt.run('CL', 'UEFA Champions League', 'Europe', 'CUP');

  const teamStmt = db.prepare(`INSERT OR IGNORE INTO teams (source_key, name, short_name, tla, crest) VALUES (?, ?, ?, ?, ?)`);
  teamStmt.run('1', 'Inter Milan', 'Inter', 'INT', 'https://crests.football-data.org/108.png');
  teamStmt.run('2', 'Juventus', 'Juve', 'JUV', 'https://crests.football-data.org/109.png');
  teamStmt.run('3', 'AC Milan', 'Milan', 'ACM', 'https://crests.football-data.org/98.png');
  teamStmt.run('4', 'Napoli', 'Napoli', 'NAP', 'https://crests.football-data.org/113.png');

  const matchStmt = db.prepare(`
    INSERT OR IGNORE INTO matches (source_key, competition_id, utc_kickoff, home_team_id, away_team_id, status, stage)
    VALUES (?, (SELECT id FROM competitions WHERE source_key = ?), ?, 
           (SELECT id FROM teams WHERE source_key = ?), 
           (SELECT id FROM teams WHERE source_key = ?), ?, ?)
  `);

  const now = new Date();
  const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000).toISOString();
  const dayAfter = new Date(now.getTime() + 48 * 60 * 60 * 1000).toISOString();

  matchStmt.run('m1', 'SA', tomorrow, '1', '2', 'SCHEDULED', 'REGULAR_SEASON');
  matchStmt.run('m2', 'SA', dayAfter, '3', '4', 'SCHEDULED', 'REGULAR_SEASON');

  // Generate some mock predictions
  const predStmt = db.prepare(`
    INSERT INTO predictions (
      match_id, prob_home, prob_draw, prob_away, 
      fair_home, fair_draw, fair_away,
      expected_goals_home, expected_goals_away, 
      reliability_score, data_coverage_score, 
      theoretical_signal, operational_signal,
      prob_over_25, prob_btts,
      explanations_json
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(match_id) DO UPDATE SET
      prob_home = excluded.prob_home,
      prob_draw = excluded.prob_draw,
      prob_away = excluded.prob_away,
      fair_home = excluded.fair_home,
      fair_draw = excluded.fair_draw,
      fair_away = excluded.fair_away,
      expected_goals_home = excluded.expected_goals_home,
      expected_goals_away = excluded.expected_goals_away,
      reliability_score = excluded.reliability_score,
      data_coverage_score = excluded.data_coverage_score,
      theoretical_signal = excluded.theoretical_signal,
      operational_signal = excluded.operational_signal,
      prob_over_25 = excluded.prob_over_25,
      prob_btts = excluded.prob_btts,
      explanations_json = excluded.explanations_json
  `);

  const matches = db.prepare('SELECT id FROM matches').all() as { id: number }[];
  for (const m of matches) {
    // Mock lambdas
    const { homeLambda, awayLambda } = estimateLambdas(1.2, 0.9, 1.0, 1.1);
    // Mock some bookmaker odds for signal calculation
    const mockOdds = { home: 2.1, draw: 3.4, away: 3.8 };
    const pred = calculatePoissonPrediction(homeLambda, awayLambda, mockOdds);
    
    predStmt.run(
      m.id,
      pred.homeWin,
      pred.draw,
      pred.awayWin,
      pred.fairOdds.home,
      pred.fairOdds.draw,
      pred.fairOdds.away,
      homeLambda,
      awayLambda,
      75,
      85,
      pred.signals.theoretical,
      pred.signals.operational,
      pred.over25,
      pred.btts,
      JSON.stringify([
        "Home team strong recent form (xG > 1.8)",
        "Away team missing key defender",
        "Historical H2H favors home team"
      ])
    );
  }
}
