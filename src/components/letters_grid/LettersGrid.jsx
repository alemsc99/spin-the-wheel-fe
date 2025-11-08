import './LettersGrid.css';

const IT_LETTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
const VOWELS = ['A', 'E', 'I', 'O', 'U'];

export default function LettersGrid({
  usedLetters,
  wrongLetters,
  canBuyVowel,
  canGuess,
  isSpinning,
  victory,
  onGuessLetter,
  onGuessVowel,
  onGridClick
}) {
  return (
    <div className="letters-grid-container">
      <div className="letters-grid">
        {IT_LETTERS.map(letter => {
          const isVowel = VOWELS.includes(letter);
          const isUsed = !!usedLetters[letter];
          const isWrong = !!wrongLetters[letter];
          
          let disabled = true;
          let additionalClasses = '';
          
          if (canBuyVowel) {
            // Buy vowel mode: only vowels are clickable
            disabled = !isVowel || isUsed || victory;
            if (isVowel && !isUsed) {
              additionalClasses = 'vowel-mode-active';
            } else {
              additionalClasses = 'consonant-mode-disabled';
            }
          } else {
            // Normal mode: only consonants are clickable if canGuess is true
            disabled = isVowel || isSpinning || !canGuess || isUsed || victory;
            if (isVowel) {
              additionalClasses = 'vowel-mode-disabled';
            }
          }
          
          return (
            <button
              key={letter}
              className={`letter-btn ${isUsed ? 'used' : ''} ${isWrong ? 'wrong' : ''} ${additionalClasses}`}
              onClick={() => {
                if (canBuyVowel && isVowel) {
                  onGuessVowel(letter);
                } else if (!canBuyVowel && !isVowel) {
                  onGuessLetter(letter);
                }
              }}
              disabled={disabled}
            >
              {letter}
            </button>
          );
        })}
      </div>
      
      {(isSpinning || (!canGuess && !canBuyVowel)) && (
        <div className="letters-grid-overlay" onClick={onGridClick} />
      )}
    </div>
  );
}
