import type { RouteResponse } from "../types";
import { formatDistance, formatDuration } from "../utils/format";

interface RoutePanelProps {
  originLabel: string;
  destinationName: string;
  result: RouteResponse | null;
  loading: boolean;
  error: string | null;
  onClear: () => void;
}

export default function RoutePanel({
  originLabel,
  destinationName,
  result,
  loading,
  error,
  onClear,
}: RoutePanelProps) {
  if (!loading && !result && !error) return null;

  return (
    <div className="route-panel">
      <h3>Маршрут</h3>
      <p>
        <span className="meta-label">Откуда:</span> {originLabel}
      </p>
      <p>
        <span className="meta-label">Куда:</span> {destinationName}
      </p>

      {loading && <p className="hint">Строим маршрут...</p>}
      {error && <p className="error-text">{error}</p>}

      {result && (
        <>
          <p>
            <span className="meta-label">Расстояние:</span>{" "}
            {formatDistance(result.distance_m)}
          </p>
          <p>
            <span className="meta-label">Время в пути:</span>{" "}
            {formatDuration(result.duration_s)}
          </p>
          <div className="route-actions">
            <a
              className="primary-button"
              href={result.external_yandex_url}
              target="_blank"
              rel="noreferrer"
            >
              Открыть в Яндекс Картах
            </a>
            <button type="button" className="secondary-button" onClick={onClear}>
              Сбросить маршрут
            </button>
          </div>
        </>
      )}
    </div>
  );
}
