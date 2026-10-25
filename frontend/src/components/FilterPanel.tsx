import type { Category, District } from "../types";

interface FilterPanelProps {
  categories: Category[];
  districts: District[];
  selectedCategories: string[];
  onToggleCategory: (slug: string) => void;
  onClearCategories: () => void;
  selectedDistrict: string;
  onDistrictChange: (value: string) => void;
  query: string;
  onQueryChange: (value: string) => void;
  radiusKm: number;
  onRadiusChange: (value: number) => void;
  onUseMyLocation: () => void;
  userLocation: { lat: number; lng: number } | null;
  locationError: string | null;
  loading: boolean;
  onReset: () => void;
}

export default function FilterPanel({
  categories,
  districts,
  selectedCategories,
  onToggleCategory,
  onClearCategories,
  selectedDistrict,
  onDistrictChange,
  query,
  onQueryChange,
  radiusKm,
  onRadiusChange,
  onUseMyLocation,
  userLocation,
  locationError,
  loading,
  onReset,
}: FilterPanelProps) {
  return (
    <div className="filter-panel">
      <h2>Поиск и фильтры</h2>

      <div className="field">
        <label htmlFor="query">Поиск</label>
        <input
          id="query"
          type="text"
          value={query}
          onChange={(event) => onQueryChange(event.target.value)}
          placeholder="Например: Мир, замок, музей"
        />
      </div>

      <div className="field">
        <div className="field-header">
          <label>Категории</label>
          <button type="button" className="link-button" onClick={onClearCategories}>
            Сбросить
          </button>
        </div>
        <div className="checkbox-group">
          {categories.map((category) => (
            <label key={category.slug} className="checkbox-label">
              <input
                type="checkbox"
                checked={selectedCategories.includes(category.slug)}
                onChange={() => onToggleCategory(category.slug)}
              />
              <span>{category.name}</span>
            </label>
          ))}
        </div>
        <p className="hint">Если категория не выбрана — показываются все.</p>
      </div>

      <div className="field">
        <label htmlFor="district">Район / город</label>
        <select
          id="district"
          value={selectedDistrict}
          onChange={(event) => onDistrictChange(event.target.value)}
        >
          <option value="">Все территории</option>
          {districts.map((district) => (
            <option key={district.slug} value={district.slug}>
              {district.name}
            </option>
          ))}
        </select>
      </div>

      <div className="field">
        <label htmlFor="radius">Радиус поиска</label>
        <select
          id="radius"
          value={radiusKm}
          onChange={(event) => onRadiusChange(Number(event.target.value))}
        >
          <option value={0}>Вся территория</option>
          <option value={5}>5 км</option>
          <option value={10}>10 км</option>
          <option value={25}>25 км</option>
          <option value={50}>50 км</option>
          <option value={100}>100 км</option>
        </select>
        <button type="button" className="secondary-button" onClick={onUseMyLocation}>
          Определить моё местоположение
        </button>
        {userLocation && (
          <p className="success-text">
            Местоположение получено: {userLocation.lat.toFixed(4)},{" "}
            {userLocation.lng.toFixed(4)}
          </p>
        )}
        {locationError && <p className="error-text">{locationError}</p>}
        <p className="hint">
          Радиус применяется, если определено местоположение. Если нет — можно
          фильтровать по району.
        </p>
      </div>

      <div className="panel-actions">
        <button type="button" className="primary-button" onClick={onReset}>
          Сбросить все фильтры
        </button>
      </div>

      {loading && <p className="hint">Загрузка объектов...</p>}
    </div>
  );
}
