import type { AttractionDetail, ExcursionStatus } from "../types";
import { categoryEmoji } from "../utils/format";

interface AttractionCardProps {
  attraction: AttractionDetail | null;
  loading: boolean;
  onClose: () => void;
  excursionStatus: ExcursionStatus | null;
  onStartExcursion: () => void;
  onBuildRoute: () => void;
  onShowSimilar: () => void;
  onShowNearby: () => void;
  relatedLoading: boolean;
}

export default function AttractionCard({
  attraction,
  loading,
  onClose,
  excursionStatus,
  onStartExcursion,
  onBuildRoute,
  onShowSimilar,
  onShowNearby,
  relatedLoading,
}: AttractionCardProps) {
  if (loading) {
    return <div className="card">Загрузка карточки объекта...</div>;
  }

  if (!attraction) return null;

  return (
    <div className="card">
      <div className="card-header">
        <h2>{attraction.name}</h2>
        <button type="button" className="icon-button" onClick={onClose}>
          ×
        </button>
      </div>

      <div className="card-photo">
        {attraction.photo_url ? (
          <img src={attraction.photo_url} alt={attraction.name} />
        ) : (
          <div className="photo-placeholder">
            {categoryEmoji(attraction.category.slug)}
          </div>
        )}
      </div>

      <div className="card-meta">
        <div>
          <span className="meta-label">Категория:</span> {attraction.category.name}
        </div>
        <div>
          <span className="meta-label">Территория:</span> {attraction.district.name}
        </div>
        <div>
          <span className="meta-label">Координаты:</span>{" "}
          {Number(attraction.latitude).toFixed(5)},{" "}
          {Number(attraction.longitude).toFixed(5)}
        </div>
        {excursionStatus && (
          <div>
            <span className="meta-label">Экскурсия:</span>{" "}
            <span className={`excursion-badge ${excursionStatus}`}>
              {excursionStatus === "completed" ? "✓ пройдена" : "начата"}
            </span>
          </div>
        )}
      </div>

      {!attraction.is_accessible && (
        <p className="warning-text">
          Объект может быть недоступен для посещения. Проверьте информацию перед
          поездкой.
        </p>
      )}

      <p className="card-description">
        {attraction.full_description || attraction.short_description}
      </p>

      <div className="card-actions">
        <button
          type="button"
          className="primary-button excursion-button"
          onClick={onStartExcursion}
        >
          {excursionStatus === "completed"
            ? "Пройти экскурсию ещё раз"
            : excursionStatus === "started"
            ? "Продолжить экскурсию"
            : "Пройти экскурсию"}
        </button>
        <button type="button" className="primary-button" onClick={onBuildRoute}>
          Построить маршрут
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onShowSimilar}
          disabled={relatedLoading}
        >
          Похожие объекты
        </button>
        <button
          type="button"
          className="secondary-button"
          onClick={onShowNearby}
          disabled={relatedLoading}
        >
          Что рядом
        </button>
      </div>
    </div>
  );
}
