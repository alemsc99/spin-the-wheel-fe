export const API_URL = 'http://localhost:8000';
import doubleImg from '../components/powerups/images/double.png';
import shieldImg from '../components/powerups/images/shield.png';
import skipImg from '../components/powerups/images/skip.png';
import loseItAllImg from '../components/powerups/images/lose_it_all.png';

const IMAGES = {
  Double: doubleImg,
  Skip: skipImg,
  Lose: loseItAllImg,
  Shield: shieldImg,
};

// Default price (in-game coins) for each powerup. Assumption: simple integer costs.
const POWERUP_PRICES = {
  Double: 500,
  Skip: 250,
  Lose: 1000,
  Shield: 750,
};

export { IMAGES, POWERUP_PRICES };