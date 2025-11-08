import React from 'react';
import { useNavigate } from 'react-router-dom';
import StartScreen from './StartScreen';
import { useTranslation } from '../../i18n/TranslationProvider';

type Props = {
  newGame: (players: number, names: string[]) => Promise<void>;
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
  setNumPlayers,
  setPlayerNames,
  setPlayerScores,
  setFirstPlayerIdx,
  setTurnOverlayMsg,
  setTurnOverlayIsError,
  setShowTurnOverlay,
}: Props) {
  const navigate = useNavigate();
  const { t } = useTranslation();

  return (
    <StartScreen
      onStart={async (players, names) => {
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
        await newGame(players, finalNames);
        navigate('/game');
      }}
    />
  );
}
// end of StartScreenWrapper component
  // language is handled by TranslationProvider (localStorage + context)


