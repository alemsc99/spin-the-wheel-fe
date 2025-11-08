import Board from '../board/Board.jsx';
import './GameInfo.css';
import { useTranslation } from '../../i18n/TranslationProvider';

export default function GameInfo({ topic, masked }) {
  const { t } = useTranslation();
  return (
    <>
      <div className="category-label-fancy">
        <span role="img" aria-label="category" className="category-icon">🎯</span>
        <span className="category-title">{t('category.label')}</span>
        <span className="category-value">{topic || t('board.placeholder')}</span>
      </div>
      <Board phrase={masked || t('board.placeholder')} />
    </>
  );
}
