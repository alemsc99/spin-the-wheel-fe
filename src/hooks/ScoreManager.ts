import type { Dispatch, SetStateAction } from 'react';
import { useCallback } from 'react';

export default function useScoreManager({
  API_URL,
  gameId,
  playerNames,
  firstPlayerIdx,
  setPlayerScores,
  setScore
}: {
  API_URL: string;
  gameId: string | null;
  playerNames: string[];
  firstPlayerIdx: number | null;
  setPlayerScores: Dispatch<SetStateAction<Record<string, number>>>;
  // allow functional updates so hook can animate visible score if needed
  setScore: Dispatch<SetStateAction<number>>;
}) {
  // Normalize base URL to avoid double slashes when concatenating paths
  const baseUrl = API_URL.replace(/\/$/, '');
  const incrementPlayerScore = useCallback(async (player: string, delta: number) => {
    if (!gameId) return { ok: false, error: 'no_game_id' };

    // Do NOT mutate authoritative playerScores locally here. The server is the source of truth.
    // The App component is responsible for triggering UI animations (score increment) before/while
    // this call completes.

    try {
      const res = await fetch(`${baseUrl}/games/${encodeURIComponent(gameId)}/score/increment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, delta })
      });
      // Safely read body: the server might return an empty body or non-JSON
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        json = {};
      }

      if (res.ok) {
        // Apply authoritative totals when server returns them
        if (json.player_scores) {
          setPlayerScores(json.player_scores);
          if (firstPlayerIdx !== null && playerNames[firstPlayerIdx] === player) {
            setScore(json.player_scores[player] ?? 0);
          }
        }
      } else {
        // On error, do not keep any optimistic local changes; apply server state if provided.
        console.error('incrementPlayerScore failed', res.status, json);
        if (json.player_scores) setPlayerScores(json.player_scores);
      }

      return json;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [baseUrl, gameId, playerNames, firstPlayerIdx, setPlayerScores, setScore]);

  const setPlayerScoreAbsolute = useCallback(async (player: string, value: number) => {
    if (!gameId) {
      // Without a game id we cannot set authoritative totals; return an error and do not mutate state.
      return { ok: false, error: 'no_game_id' };
    }

    try {
      const res = await fetch(`${baseUrl}/games/${encodeURIComponent(gameId)}/score/set`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ player, value })
      });
      // Safely parse body to avoid exceptions on empty/non-JSON responses
      const text = await res.text();
      let json: any = {};
      try {
        json = text ? JSON.parse(text) : {};
      } catch (e) {
        json = {};
      }

      if (res.ok) {
        if (json.player_scores) {
          setPlayerScores(json.player_scores);
          if (firstPlayerIdx !== null && playerNames[firstPlayerIdx] === player) {
            setScore(json.player_scores[player] ?? 0);
          }
        }
      } else {
        console.error('setPlayerScoreAbsolute failed', res.status, json);
        if (json.player_scores) setPlayerScores(json.player_scores);
      }

      return json;
    } catch (err) {
      console.error(err);
      throw err;
    }
  }, [baseUrl, gameId, playerNames, firstPlayerIdx, setPlayerScores, setScore]);

  return { incrementPlayerScore, setPlayerScoreAbsolute };
}