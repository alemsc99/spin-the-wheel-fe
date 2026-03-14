export const API_URL = import.meta.env.VITE_BACKEND_URL;
export const VITE_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
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

// 1. DEFINIZIONE LAYOUT FISSI (Fuori dal componente così non cambiano mai)
const MULTIPLAYER_LAYOUT = [
  "Bancarotta", "100", "500", "Passa", "200", "400", "Swap", "300", "600", 
  "Bancarotta", "100", "700", "Passa", "200", "800", "Swap", "400", "500", 
  "100", "200", "300", "400", "500", "600"
];

const SINGLEPLAYER_LAYOUT = [
  "Bancarotta", "100", "300", "500", "200", "400", "600", 
  "Bancarotta", "100", "300", "500", "200", "400", "600",
  "700", "800", "100", "200", "300", "500"
];

const COLORS = [
  "#E5243B", "#DDA63A", "#C5192D", "#FF3A21", "#FCC30B", "#FD6925", "#DD1367", 
  "#FD9D24", "#BF8B2E", "#3F7E44", "#0ad9b7ff", "#56C02B", "#51c4fdff", "#19486A", 
  "#8E24AA", "#2E7D32", "#F57C00", "#5D4037", "#37474F", "#6A1B9A"
];

const categoryIcons = {
  random: '🎲',
  food: '🍔',
  travel: '✈️',
  sports: '⚽',
  music: '🎵',
  technology: '💻'
};


export { IMAGES, POWERUP_PRICES, MULTIPLAYER_LAYOUT, SINGLEPLAYER_LAYOUT, COLORS, categoryIcons };