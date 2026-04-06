import React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import StartScreen, { StartGameOptions } from './StartScreen';
import { useTranslation } from '../../i18n/TranslationProvider';

type Props = {
  newGame: (players: number, names: string[], category?: string, userId?: string) => Promise<void>;
  createRoom: (players: number, language: string, hostName: string, category?: string, userId?: string) => Promise<void>;
  joinRoom: (roomCode: string, playerName: string, userId?: string) => Promise<void>;
  setNumPlayers: React.Dispatch<React.SetStateAction<number>>;
  setPlayerNames: React.Dispatch<React.SetStateAction<string[]>>;
  setPlayerScores: React.Dispatch<React.SetStateAction<Record<string, number>>>;
  setFirstPlayerIdx: React.Dispatch<React.SetStateAction<number | null>>;
  setTurnOverlayMsg: React.Dispatch<React.SetStateAction<string>>;
  setTurnOverlayIsError: React.Dispatch<React.SetStateAction<boolean>>;
  setShowTurnOverlay: React.Dispatch<React.SetStateAction<boolean>>;
};

export default function StartScreenWrapper({
  newGame,
  createRoom,
  joinRoom,
  setNumPlayers,
  setPlayerNames,
  setPlayerScores,
  setFirstPlayerIdx,
  setTurnOverlayMsg,
  setTurnOverlayIsError,
  setShowTurnOverlay,
}: Props) {
  const navigate = useNavigate();
  const params = useParams<{ lang?: string }>();
  const { t, lang } = useTranslation();
  const activeLang = params.lang === 'en' || params.lang === 'it' ? params.lang : lang;

  return (
    <StartScreen
      onStart={async (options: StartGameOptions) => {
        const { players, names, mode, onlineSubMode, roomCode, category, userId } = options;

        if (mode === 'online') {
          const myName = names[0] || 'Player';
          if (onlineSubMode === 'join' && roomCode) {
            await joinRoom(roomCode, myName, userId);
          } else if (onlineSubMode === 'create') {
             // For create room, we probably use the set language
             await createRoom(players, activeLang, myName, category, userId);
          }
        } else {
          // Single or Local
          const finalNames = names && names.length === players ? names : Array(players).fill(t('players.defaultName'));
          setNumPlayers(players);
          setPlayerNames(finalNames);
          setPlayerScores(Object.fromEntries(finalNames.map((n: string) => [n, 0])));
          // choose a random first player
          const idx = Math.floor(Math.random() * players);
          setFirstPlayerIdx(idx);
          setTurnOverlayMsg('overlay.turnSpin');
          setTurnOverlayIsError(false);
          setShowTurnOverlay(true);
          // start the new game
          await newGame(players, finalNames, category, userId);
          navigate(`/${activeLang}/game`);
        }
      }}
    />
  );
}
