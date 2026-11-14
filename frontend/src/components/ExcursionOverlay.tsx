import { useEffect, useRef, useState } from "react";
import type {
  AttractionBrief,
  Excursion,
  RecommendationsResponse,
} from "../types";
import { categoryEmoji } from "../utils/format";
import StopImage from "./StopImage";

interface ExcursionOverlayProps {
  excursion: Excursion | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onComplete: () => Promise<void>;
  recommendations: RecommendationsResponse | null;
  onSelectRecommendation: (item: AttractionBrief) => void;
}

function pluralStops(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} точка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} точки`;
  return `${n} точек`;
}

/** Полноэкранная экскурсия: все точки лентой, картинка + подпись. */
export default function ExcursionOverlay({
  excursion,
  loading,
  error,
  onClose,
  onComplete,
  recommendations,
  onSelectRecommendation,
}: ExcursionOverlayProps) {
  const [finished, setFinished] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const finishRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setFinished(false);
    setCompleteError(null);
  }, [excursion?.attraction_id]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  useEffect(() => {
    if (finished) {
      finishRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [finished]);

  async function handleFinish() {
    if (!excursion) return;
    setCompleting(true);
    setCompleteError(null);
    try {
      await onComplete();
      setFinished(true);
    } catch (err: any) {
      setCompleteError(
        err?.response?.data?.detail || "Не удалось сохранить прохождение"
      );
    } finally {
      setCompleting(false);
    }
  }

  const stops = excursion?.stops ?? [];
  const emoji = categoryEmoji(excursion?.category.slug);

  return (
    <div className="excursion-overlay" role="dialog" aria-modal="true">
      <header className="excursion-overlay-header">
        <div>
          <div className="excursion-label">Виртуальная экскурсия</div>
          <h2>{excursion?.attraction_name ?? "Загрузка..."}</h2>
        </div>
        <div className="excursion-overlay-header-right">
          {stops.length > 0 && (
            <span className="badge">{pluralStops(stops.length)}</span>
          )}
          <button
            type="button"
            className="icon-button"
            onClick={onClose}
            aria-label="Закрыть экскурсию"
          >
            ×
          </button>
        </div>
      </header>

      <div className="excursion-overlay-body">
        {loading && <p className="hint">Загрузка экскурсии...</p>}
        {error && <p className="error-text">{error}</p>}
        {!loading && !error && excursion && stops.length === 0 && (
          <p className="hint">Для этого объекта экскурсия пока не подготовлена.</p>
        )}

        {!loading && !error && stops.length > 0 && (
          <>
            <ol className="excursion-stops">
              {stops.map((stop, index) => (
                <li key={stop.id} className="excursion-stop">
                  <div className="excursion-stop-media">
                    <StopImage src={stop.image_url} alt={stop.title} fallback={emoji} />
                  </div>
                  <div className="excursion-stop-text">
                    <div className="excursion-stop-number">{index + 1}</div>
                    <h3>{stop.title}</h3>
                    <p>{stop.description}</p>
                  </div>
                </li>
              ))}
            </ol>

            <div className="excursion-finish" ref={finishRef}>
              {!finished ? (
                <>
                  <p className="hint">Вы дошли до конца маршрута.</p>
                  {completeError && <p className="error-text">{completeError}</p>}
                  <button
                    type="button"
                    className="primary-button excursion-button excursion-finish-button"
                    onClick={handleFinish}
                    disabled={completing}
                  >
                    {completing ? "Сохраняем..." : "Завершить экскурсию"}
                  </button>
                </>
              ) : (
                <>
                  <div className="excursion-done-icon">🎉</div>
                  <h3>Экскурсия пройдена!</h3>

                  {recommendations && recommendations.items.length > 0 && (
                    <>
                      <h4 className="excursion-next-title">Что пройти дальше</h4>
                      <div className="excursion-next-grid">
                        {recommendations.items.map((item) => (
                          <button
                            key={item.attraction.id}
                            type="button"
                            className="related-item"
                            onClick={() => onSelectRecommendation(item.attraction)}
                          >
                            <div className="related-item-title">
                              {categoryEmoji(item.attraction.category.slug)}{" "}
                              {item.attraction.name}
                            </div>
                            <div className="related-item-meta">
                              {item.attraction.category.name} •{" "}
                              {item.attraction.district.name}
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}

                  <button type="button" className="secondary-button" onClick={onClose}>
                    Вернуться к карте
                  </button>
                </>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
