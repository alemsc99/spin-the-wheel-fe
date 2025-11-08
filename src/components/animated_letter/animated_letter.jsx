import { motion, AnimatePresence } from "framer-motion";
import "./animated_letter.css";

const AnimatedLetter = ({ char, idx, phrase }) => {
  if (char === ' ') {
    return (
      <span
        key={`sep-${idx}`}
        className="board-separator visible-separator"
      >
      </span>
    );
  }
  
  const isFirst = idx === 0 || phrase[idx - 1] === ' ';
  const isLast = idx === phrase.length - 1 || phrase[idx + 1] === ' ';
  const isUnderscore = char === '_';
  
  return (
    <span
      className={`board-cell masked-letter${isFirst ? ' first-in-word' : ''}${isLast ? ' last-in-word' : ''}`}
      key={idx}
      style={{ overflow: "visible" }}
    >
      <AnimatePresence>
        {!isUnderscore ? (
          <motion.span
            key={`letter-${idx}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            style={{ display: "inline-block" }}
            className={"letter revealed"}
            data-idx={idx}
          >
            {char.toUpperCase()}
          </motion.span>
        ) : (
          // Render a hidden span for underscores to maintain layout
          <span className="letter" style={{ display: "none" }} />
        )}
      </AnimatePresence>
    </span>
  );
};

export default AnimatedLetter;