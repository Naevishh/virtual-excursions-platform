import { useCallback, useEffect, useRef, useState } from "react";
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

const pad = (n: number) => String(n).padStart(2, "0");

function pluralSlides(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return `${n} слайд`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${n} слайда`;
  return `${n} слайдов`;
}

/**
 * Полноэкранная экскурсия слайдами: одна точка — один слайд.
 * Листать: кнопки, клавиши ← →, свайп; Esc — закрыть.
 */
export default function ExcursionOverlay({
  excursion,
  loading,
  error,
  onClose,
  onComplete,
  recommendations,
  onSelectRecommendation,
}: ExcursionOverlayProps) {
  const [index, setIndex] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [finished, setFinished] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);
  const touchStartX = useRef<number | null>(null);
  const textRef = useRef<HTMLDivElement>(null);

  const stops = excursion?.stops ?? [];
  const total = stops.length;
  const isLast = index === total - 1;

  useEffect(() => {
    setIndex(0);
    setFinished(false);
    setCompleteError(null);
  }, [excursion?.attraction_id]);

  // новый слайд — текст снова сверху
  useEffect(() => {
    textRef.current?.scrollTo({ top: 0 });
  }, [index]);

  const goTo = useCallback(
    (next: number) => {
      if (next < 0 || next >= total) return;
      setDirection(next > index ? 1 : -1);
      setIndex(next);
    },
    [index, total]
  );

  const handleFinish = useCallback(async () => {
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
  }, [onComplete]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
      if (finished || total === 0) return;
      if (event.key === "ArrowRight") goTo(index + 1);
      if (event.key === "ArrowLeft") goTo(index - 1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose, goTo, index, finished, total]);

  function onTouchStart(event: React.TouchEvent) {
    touchStartX.current = event.touches[0].clientX;
  }

  function onTouchEnd(event: React.TouchEvent) {
    if (touchStartX.current === null || finished) return;
    const dx = event.changedTouches[0].clientX - touchStartX.current;
    touchStartX.current = null;
    if (Math.abs(dx) < 50) return;
    goTo(dx < 0 ? index + 1 : index - 1);
  }

  const emoji = categoryEmoji(excursion?.category.slug);
  const stop = stops[index];
  const nextStop = stops[index + 1];

  return (
    <div
      className="xo"
      role="dialog"
      aria-modal="true"
      onTouchStart={onTouchStart}
      onTouchEnd={onTouchEnd}
    >
      <header className="xo-top">
        <div className="xo-top-title">
          <span className="xo-eyebrow">Виртуальная экскурсия</span>
          <span className="xo-name">{excursion?.attraction_name ?? ""}</span>
        </div>
        <button
          type="button"
          className="xo-close"
          onClick={onClose}
          aria-label="Закрыть экскурсию"
        >
          ×
        </button>
      </header>

      {(loading || error || (excursion && total === 0)) && (
        <div className="xo-message">
          {loading && "Загрузка экскурсии..."}
          {error}
          {!loading && !error && "Для этого объекта экскурсия пока не подготовлена."}
        </div>
      )}

      {!loading && !error && stop && !finished && (
        <>
          <main
            key={stop.id}
            className={`xo-slide ${direction === 1 ? "from-right" : "from-left"}`}
          >
            <div className="xo-media">
              <StopImage src={stop.image_url} alt={stop.title} fallback={emoji} />
              <div className="xo-counter">
                <strong>{pad(index + 1)}</strong> / {pad(total)}
              </div>
            </div>

            <div className="xo-text" ref={textRef}>
              <div className="xo-text-inner">
                {stop.subtitle && <div className="xo-subtitle">{stop.subtitle}</div>}
                <h2 className="xo-title">{stop.title}</h2>
                {stop.description.split(/\n\s*\n/).map((paragraph, i) => (
                  <p key={i} className="xo-paragraph">
                    {paragraph}
                  </p>
                ))}
                {stop.fact && (
                  <aside className="xo-fact">
                    <span className="xo-fact-label">Интересно</span>
                    {stop.fact}
                  </aside>
                )}
              </div>
            </div>
          </main>

          {/* предзагрузка следующей картинки */}
          {nextStop?.image_url && (
            <link rel="prefetch" href={nextStop.image_url} />
          )}

          <footer className="xo-bottom">
            <button
              type="button"
              className="xo-nav"
              onClick={() => goTo(index - 1)}
              disabled={index === 0}
              aria-label="Предыдущий слайд"
            >
              ←
            </button>

            <div className="xo-progress">
              {stops.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  className={`xo-seg ${i <= index ? "done" : ""}`}
                  onClick={() => goTo(i)}
                  aria-label={`Слайд ${i + 1}: ${s.title}`}
                  title={s.title}
                />
              ))}
            </div>

            {isLast ? (
              <button
                type="button"
                className="xo-finish"
                onClick={handleFinish}
                disabled={completing}
              >
                {completing ? "Сохраняем..." : "Завершить"}
              </button>
            ) : (
              <button
                type="button"
                className="xo-nav primary"
                onClick={() => goTo(index + 1)}
                aria-label="Следующий слайд"
              >
                →
              </button>
            )}
          </footer>
          {completeError && <div className="xo-error">{completeError}</div>}
        </>
      )}

      {finished && (
        <main className="xo-done">
          <div className="xo-done-icon">🎉</div>
          <h2>Экскурсия пройдена!</h2>
          <p>
            «{excursion?.attraction_name}» — {pluralSlides(total)} позади.
          </p>

          {recommendations && recommendations.items.length > 0 && (
            <>
              <h3>Что пройти дальше</h3>
              <div className="xo-next-grid">
                {recommendations.items.map((item) => (
                  <button
                    key={item.attraction.id}
                    type="button"
                    className="xo-next-card"
                    onClick={() => onSelectRecommendation(item.attraction)}
                  >
                    <span className="xo-next-emoji">
                      {categoryEmoji(item.attraction.category.slug)}
                    </span>
                    <span className="xo-next-name">{item.attraction.name}</span>
                    <span className="xo-next-meta">
                      {item.attraction.category.name} • {item.attraction.district.name}
                    </span>
                  </button>
                ))}
              </div>
            </>
          )}

          <div className="xo-done-actions">
            <button
              type="button"
              className="xo-ghost"
              onClick={() => {
                setFinished(false);
                setIndex(0);
              }}
            >
              Смотреть заново
            </button>
            <button type="button" className="xo-finish" onClick={onClose}>
              Вернуться к карте
            </button>
          </div>
        </main>
      )}
    </div>
  );
}
