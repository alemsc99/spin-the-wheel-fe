import './LettersGrid.css';
import { useTranslation } from '../../i18n/TranslationProvider';

const IT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

export default function LettersGrid({
  usedLetters,
  wrongLetters,
  canGuess,
  isSpinning,
  victory,
  score,
  terminatedVowels,
  isBuyingVowel,
  onGuessLetter,
  onGuessVowel
}) {
  const { lang } = useTranslation();
  return (
    <div className="letters-grid-container">
      <div className="letters-grid">
        {IT_LETTERS.map(letter => {
          const isVowel = VOWELS.includes(letter);
          const isUsed = !!usedLetters[letter];
          const isWrong = !!wrongLetters[letter];
          
          const canPurchaseVowel = isVowel && score >= 500 && !canGuess && !isSpinning && !terminatedVowels;
          const disabled = isUsed || victory || isSpinning || isBuyingVowel || (isVowel
            ? !canPurchaseVowel
            : !canGuess);
          const additionalClasses = isVowel ? 'vowel-key' : '';
          
          return (
            <button
              key={letter}
              className={`letter-btn ${isUsed ? 'used' : ''} ${isWrong ? 'wrong' : ''} ${additionalClasses}`}
              title={isVowel ? `500 ${lang === 'it' ? 'monete' : 'coins'}` : letter}
              aria-label={isVowel ? `${letter}, 500 ${lang === 'it' ? 'monete' : 'coins'}` : letter}
              onClick={() => {
                if (isVowel) {
                  onGuessVowel(letter);
                } else {
                  onGuessLetter(letter);
                }
              }}
              disabled={disabled}
            >
              {isVowel && !isUsed && <span className="vowel-price-lock"><span aria-hidden="true">🔒</span><span>500🪙</span></span>}
              <span className="letter-label">{letter}</span>
            </button>
          );
        })}
      </div>
      
    </div>
  );
}
