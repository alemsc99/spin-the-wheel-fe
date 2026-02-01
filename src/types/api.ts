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
	powerups?: Record<string, string[]>;
}

type ReelSpinResponse = {
    value: string;
    player_scores: Record<string, number>;
    masked: string;
    phrase: string;
    used_letters: Record<string, boolean>;
    last_spin: number | string;
    current_spin: number;
    topic: string;
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
	powerups?: Record<string, string[]>;
	showReel?: boolean;
	used_shields?: string[];
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
	powerups?: Record<string, string[]>;
	showReel?: boolean;
	used_shields?: string[];
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

type CreateRoomResponse = {
    room_code: string;
    players: string[];
    capacity: number;
    language: string;
    is_host: boolean;
}

export { NewGameResp, SpinResp, GuessResp, GuessPhraseResp, ReelSpinResponse, CreateRoomResponse};