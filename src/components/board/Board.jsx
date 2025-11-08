import React from "react";
import "./Board.css";
import AnimatedLetter from "../animated_letter/animated_letter";

const Board = ({ phrase }) => {
  // If phrase is empty or null, return null
  if (!phrase || phrase.length === 0) return null;
  const words = phrase.split(" ");
  let letterIdx = 0;
  return (
    <div className="board ml6">
      <span className="text-wrapper">
        <span className="letters">
          {words.map((word, wIdx) => {
            const letters = word.split("").map((char, i) => {
              let idx = null;
              if (char !== ' ') {
                idx = letterIdx;
                letterIdx++;
              }
              return (
                <AnimatedLetter
                  key={idx !== null ? idx : `sep-${wIdx}-${i}`}
                  char={char}
                  idx={idx !== null ? idx : i}
                  phrase={phrase}
                />
              );
            });
            return (
              <React.Fragment key={wIdx}>
                <span className="word-group">
                  {letters}
                </span>
                {wIdx < words.length - 1 && (
                  <span className="board-separator visible-separator" />
                )}
              </React.Fragment>
            );
          })}
        </span>
      </span>
    </div>
  );
}

export default Board;