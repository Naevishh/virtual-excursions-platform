import type { AttractionBrief } from "../types";
import { formatDistance } from "../utils/format";

interface RelatedListProps {
  title: string;
  items: AttractionBrief[];
  loading: boolean;
  error: string | null;
  onSelect: (item: AttractionBrief) => void;
}

export default function RelatedList({
  title,
  items,
  loading,
  error,
  onSelect,
}: RelatedListProps) {
  return (
    <div className="related-list">
      <h3>{title}</h3>

      {loading && <p className="hint">Загрузка...</p>}
      {error && <p className="error-text">{error}</p>}
      {!loading && !error && items.length === 0 && (
        <p className="hint">Ничего не найдено.</p>
      )}

      <div className="related-items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            className="related-item"
            onClick={() => onSelect(item)}
          >
            <div className="related-item-title">{item.name}</div>
            <div className="related-item-meta">
              {item.category.name} • {item.district.name}
            </div>
            {item.distance_m !== null && item.distance_m !== undefined && (
              <div className="related-item-distance">
                {formatDistance(item.distance_m)}
              </div>
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
