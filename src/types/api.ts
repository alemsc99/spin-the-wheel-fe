type PlayerScores = Record<string, number>

type NewGameResp = {
	game_id: string;
	topic: string;
	masked: string;
	num_players?: number;
	player_names?: string[];
	player_scores?: PlayerScores;
	current_player_idx?: number;
	used_letters?: Record<string, boolean>;
	last_spin?: number | string;
	can_guess?: boolean;
	swapped_player?: string;
}

type SpinResp = {
	value: number | string;
	old_score: number;
	new_score: number;
	player_scores?: PlayerScores;
	current_player_idx?: number;
	last_spin?: number | string;
	can_guess?: boolean;
	used_letters?: Record<string, boolean>;
}

type GuessResp = {
	occurrences: number;
	added_score: number;
	total_score: number;
	masked: string;
	complete: boolean;
	player_scores?: PlayerScores;
	current_player_idx?: number;
	used_letters?: Record<string, boolean>;
	can_guess?: boolean;
}

type GuessPhraseResp = {
	success: boolean;
	masked: string;
	total_score: number;
	complete: boolean;
	player_scores?: PlayerScores;
	current_player_idx?: number;
	used_letters?: Record<string, boolean>;
	can_guess?: boolean;
}

export { NewGameResp, SpinResp, GuessResp, GuessPhraseResp };