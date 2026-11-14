import { useEffect, useState } from "react";
import type {
  AttractionBrief,
  Excursion,
  RecommendationsResponse,
} from "../types";
import { categoryEmoji } from "../utils/format";
import Recommendations from "./Recommendations";
import StopImage from "./StopImage";

interface ExcursionViewProps {
  excursion: Excursion | null;
  loading: boolean;
  error: string | null;
  onClose: () => void;
  onComplete: () => Promise<void>;
  recommendations: RecommendationsResponse | null;
  recommendationsLoading: boolean;
  onSelectRecommendation: (item: AttractionBrief) => void;
}

export default function ExcursionView({
  excursion,
  loading,
  error,
  onClose,
  onComplete,
  recommendations,
  recommendationsLoading,
  onSelectRecommendation,
}: ExcursionViewProps) {
  const [step, setStep] = useState(0);
  const [finished, setFinished] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [completeError, setCompleteError] = useState<string | null>(null);

  useEffect(() => {
    setStep(0);
    setFinished(false);
    setCompleteError(null);
  }, [excursion?.attraction_id]);

  if (loading) {
    return <div className="card">Загрузка экскурсии...</div>;
  }

  if (error || !excursion) {
    return (
      <div className="card">
        <p className="error-text">{error || "Экскурсия не найдена"}</p>
        <button type="button" className="secondary-button" onClick={onClose}>
          Назад к карточке
        </button>
      </div>
    );
  }

  const stops = excursion.stops;
  const header = (
    <div className="card-header">
      <div>
        <div className="excursion-label">Виртуальная экскурсия</div>
        <h2>{excursion.attraction_name}</h2>
      </div>
      <button type="button" className="icon-button" onClick={onClose}>
        ×
      </button>
    </div>
  );

  if (stops.length === 0) {
    return (
      <div className="card">
        {header}
        <p className="hint">Для этого объекта экскурсия пока не подготовлена.</p>
      </div>
    );
  }

  async function handleFinish() {
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

  if (finished) {
    return (
      <>
        <div className="card">
          {header}
          <div className="excursion-done">
            <div className="excursion-done-icon">🎉</div>
            <strong>Экскурсия пройдена!</strong>
            <p>Вы посмотрели все точки: {stops.length}.</p>
          </div>
          <div className="card-actions">
            <button
              type="button"
              className="secondary-button"
              onClick={() => {
                setStep(0);
                setFinished(false);
              }}
            >
              Пройти ещё раз
            </button>
            <button type="button" className="secondary-button" onClick={onClose}>
              Вернуться к карточке
            </button>
          </div>
        </div>
        <Recommendations
          title="Что пройти дальше"
          data={recommendations}
          loading={recommendationsLoading}
          onSelect={onSelectRecommendation}
        />
      </>
    );
  }

  const stop = stops[step];
  const isLast = step === stops.length - 1;

  return (
    <div className="card">
      {header}

      <div className="excursion-progress">
        <span>
          Точка {step + 1} из {stops.length}
        </span>
        <div className="excursion-dots">
          {stops.map((s, index) => (
            <button
              key={s.id}
              type="button"
              className={`excursion-dot ${index === step ? "active" : ""} ${
                index < step ? "done" : ""
              }`}
              onClick={() => setStep(index)}
              aria-label={`Точка ${index + 1}: ${s.title}`}
            />
          ))}
        </div>
      </div>

      <div className="card-photo">
        <StopImage
          src={stop.image_url}
          alt={stop.title}
          fallback={categoryEmoji(excursion.category.slug)}
        />
      </div>

      <h3 className="excursion-stop-title">{stop.title}</h3>
      <p className="card-description">{stop.description}</p>

      {completeError && <p className="error-text">{completeError}</p>}

      <div className="excursion-nav">
        <button
          type="button"
          className="secondary-button"
          onClick={() => setStep((s) => s - 1)}
          disabled={step === 0}
        >
          ← Назад
        </button>
        {isLast ? (
          <button
            type="button"
            className="primary-button"
            onClick={handleFinish}
            disabled={completing}
          >
            {completing ? "Сохраняем..." : "Завершить экскурсию"}
          </button>
        ) : (
          <button
            type="button"
            className="primary-button"
            onClick={() => setStep((s) => s + 1)}
          >
            Далее →
          </button>
        )}
      </div>
    </div>
  );
}
