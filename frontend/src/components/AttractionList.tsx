import type { AttractionBrief } from "../types";
import { formatDistance } from "../utils/format";

interface AttractionListProps {
  items: AttractionBrief[];
  total: number;
  loading: boolean;
  error: string | null;
  selectedId: number | null;
  onSelect: (item: AttractionBrief) => void;
}

export default function AttractionList({
  items,
  total,
  loading,
  error,
  selectedId,
  onSelect,
}: AttractionListProps) {
  return (
    <div className="attraction-list">
      <div className="list-header">
        <h2>Объекты</h2>
        <span className="badge">{total}</span>
      </div>

      {error && <p className="error-text">{error}</p>}
      {!error && loading && <p className="hint">Загрузка...</p>}
      {!error && !loading && items.length === 0 && (
        <p className="hint">Ничего не найдено. Попробуйте изменить фильтры.</p>
      )}

      <div className="list-items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className={`list-item ${selectedId === item.id ? "selected" : ""}`}
            onClick={() => onSelect(item)}
          >
            <div className="list-item-title">{item.name}</div>
            <div className="list-item-meta">
              <span>{item.category.name}</span>
              <span>•</span>
              <span>{item.district.name}</span>
            </div>
            <p className="list-item-description">{item.short_description}</p>
            {item.distance_m !== null && item.distance_m !== undefined && (
              <div className="list-item-distance">
                Расстояние: {formatDistance(item.distance_m)}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
