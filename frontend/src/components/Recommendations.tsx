import type { AttractionBrief, RecommendationsResponse } from "../types";

interface RecommendationsProps {
  data: RecommendationsResponse | null;
  loading: boolean;
  title?: string;
  onSelect: (item: AttractionBrief) => void;
}

export default function Recommendations({
  data,
  loading,
  title,
  onSelect,
}: RecommendationsProps) {
  const personal = data?.strategy === "personal";
  const heading =
    title || (personal ? "Рекомендуем вам" : "Популярные экскурсии");

  return (
    <div className="related-list">
      <h3>{heading}</h3>
      <p className="hint rec-subtitle">
        {personal
          ? "Подобрано по экскурсиям, которые вы проходили."
          : "Пройдите первую экскурсию — и рекомендации станут персональными."}
      </p>

      {loading && !data && <p className="hint">Загрузка...</p>}
      {data && data.items.length === 0 && (
        <p className="hint">Вы прошли все экскурсии!</p>
      )}

      <div className="related-items">
        {data?.items.map((item) => (
          <button
            key={item.attraction.id}
            type="button"
            className="related-item"
            onClick={() => onSelect(item.attraction)}
          >
            <div className="related-item-title">{item.attraction.name}</div>
            <div className="related-item-meta">
              {item.attraction.category.name} • {item.attraction.district.name}
            </div>
            <ul className="rec-reasons">
              {item.reasons.map((reason) => (
                <li key={reason}>{reason}</li>
              ))}
            </ul>
          </button>
        ))}
      </div>
    </div>
  );
}
