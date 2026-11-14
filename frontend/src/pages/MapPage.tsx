import { useCallback, useEffect, useState } from "react";
import {
  buildRoute as buildRouteApi,
  completeExcursion,
  fetchAttraction,
  fetchAttractions,
  fetchCategories,
  fetchDistricts,
  fetchExcursion,
  fetchExcursionHistory,
  fetchNearbyAttractions,
  fetchRecommendations,
  fetchSimilarAttractions,
  startExcursion,
} from "../api/client";
import AttractionCard from "../components/AttractionCard";
import AttractionList from "../components/AttractionList";
import ExcursionOverlay from "../components/ExcursionOverlay";
import FilterPanel from "../components/FilterPanel";
import Legend from "../components/Legend";
import MapView from "../components/MapView";
import Recommendations from "../components/Recommendations";
import RelatedList from "../components/RelatedList";
import RoutePanel from "../components/RoutePanel";
import type {
  AttractionBrief,
  AttractionDetail,
  AttractionFilters,
  Category,
  District,
  Excursion,
  ExcursionStatus,
  RecommendationsResponse,
  RouteResponse,
} from "../types";

const MINSK_CENTER = {
  lat: 53.9045,
  lng: 27.5665,
};

export default function MapPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [districts, setDistricts] = useState<District[]>([]);
  const [attractions, setAttractions] = useState<AttractionBrief[]>([]);
  const [total, setTotal] = useState(0);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const [queryInput, setQueryInput] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedDistrict, setSelectedDistrict] = useState("");
  const [radiusKm, setRadiusKm] = useState(0);
  const [userLocation, setUserLocation] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);

  const [selected, setSelected] = useState<AttractionBrief | null>(null);
  const [detail, setDetail] = useState<AttractionDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const [routeResult, setRouteResult] = useState<RouteResponse | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);
  const [routeError, setRouteError] = useState<string | null>(null);
  const [originLabel, setOriginLabel] = useState("Моё местоположение");

  const [related, setRelated] = useState<AttractionBrief[]>([]);
  const [relatedTitle, setRelatedTitle] = useState<string | null>(null);
  const [relatedLoading, setRelatedLoading] = useState(false);
  const [relatedError, setRelatedError] = useState<string | null>(null);

  // --- виртуальная экскурсия ---
  const [excursionOpen, setExcursionOpen] = useState(false);
  const [excursion, setExcursion] = useState<Excursion | null>(null);
  const [excursionLoading, setExcursionLoading] = useState(false);
  const [excursionError, setExcursionError] = useState<string | null>(null);

  // --- история посетителя и рекомендации ---
  const [progress, setProgress] = useState<Record<number, ExcursionStatus>>({});
  const [recommendations, setRecommendations] =
    useState<RecommendationsResponse | null>(null);
  const [recommendationsLoading, setRecommendationsLoading] = useState(false);

  async function loadPersonalData() {
    setRecommendationsLoading(true);
    try {
      const [history, recs] = await Promise.all([
        fetchExcursionHistory(),
        fetchRecommendations(5),
      ]);
      const map: Record<number, ExcursionStatus> = {};
      history.forEach((item) => {
        map[item.attraction_id] = item.status;
      });
      setProgress(map);
      setRecommendations(recs);
    } catch {
      // рекомендации — необязательная часть интерфейса
    } finally {
      setRecommendationsLoading(false);
    }
  }

  useEffect(() => {
    loadPersonalData();
  }, []);

  useEffect(() => {
    async function loadStaticData() {
      try {
        const [categoriesData, districtsData] = await Promise.all([
          fetchCategories(),
          fetchDistricts(),
        ]);
        setCategories(categoriesData);
        setDistricts(districtsData);
      } catch (error: any) {
        setListError(
          error?.response?.data?.detail ||
            "Не удалось загрузить справочные данные"
        );
      }
    }
    loadStaticData();
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(queryInput.trim());
    }, 300);
    return () => clearTimeout(timeout);
  }, [queryInput]);

  const categoryParam = selectedCategories.join(",");

  useEffect(() => {
    let cancelled = false;

    async function loadAttractions() {
      setLoadingList(true);
      setListError(null);

      try {
        const params: AttractionFilters = {
          limit: 100,
        };

        if (categoryParam) {
          params.category = categoryParam;
        }
        if (selectedDistrict) {
          params.district = selectedDistrict;
        }
        if (debouncedQuery) {
          params.q = debouncedQuery;
        }
        if (userLocation) {
          params.lat = userLocation.lat;
          params.lng = userLocation.lng;
          if (radiusKm > 0) {
            params.radius_km = radiusKm;
          }
        }

        const response = await fetchAttractions(params);

        if (!cancelled) {
          setAttractions(response.items);
          setTotal(response.total);
        }
      } catch (error: any) {
        if (!cancelled) {
          setListError(
            error?.response?.data?.detail ||
              "Не удалось загрузить объекты. Проверьте backend."
          );
        }
      } finally {
        if (!cancelled) {
          setLoadingList(false);
        }
      }
    }

    loadAttractions();

    return () => {
      cancelled = true;
    };
  }, [categoryParam, selectedDistrict, debouncedQuery, userLocation, radiusKm]);

  useEffect(() => {
    setRouteResult(null);
    setRouteError(null);
    setExcursionOpen(false);
    setExcursion(null);
    setExcursionError(null);
    setRelated([]);
    setRelatedTitle(null);
    setRelatedError(null);

    if (!selected) {
      setDetail(null);
      return;
    }

    let cancelled = false;

    async function loadDetail() {
      setDetailLoading(true);
      try {
        const response = await fetchAttraction(selected.id);
        if (!cancelled) {
          setDetail(response);
        }
      } catch (error: any) {
        if (!cancelled) {
          setDetail({
            ...selected,
            full_description: null,
            source_url: null,
          });
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    }

    loadDetail();

    return () => {
      cancelled = true;
    };
  }, [selected?.id]);

  function toggleCategory(slug: string) {
    setSelectedCategories((prev) =>
      prev.includes(slug) ? prev.filter((item) => item !== slug) : [...prev, slug]
    );
  }

  function clearCategories() {
    setSelectedCategories([]);
  }

  function resetFilters() {
    setSelectedCategories([]);
    setSelectedDistrict("");
    setQueryInput("");
    setDebouncedQuery("");
    setRadiusKm(0);
    setUserLocation(null);
    setLocationError(null);
  }

  function useMyLocation() {
    if (!navigator.geolocation) {
      setLocationError("Геолокация не поддерживается этим браузером.");
      return;
    }

    setLocationError(null);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      },
      () => {
        setLocationError(
          "Не удалось определить местоположение. Используйте фильтр по району или маршрут от центра Минска."
        );
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  }

  async function handleBuildRoute() {
    if (!selected) return;

    setRouteLoading(true);
    setRouteError(null);
    setRouteResult(null);

    const origin = userLocation || MINSK_CENTER;
    setOriginLabel(
      userLocation ? "Моё местоположение" : "Минск, центр по умолчанию"
    );

    try {
      const response = await buildRouteApi({
        origin,
        destination: {
          lat: Number(selected.latitude),
          lng: Number(selected.longitude),
        },
      });
      setRouteResult(response);
    } catch (error: any) {
      setRouteError(
        error?.response?.data?.detail ||
          "Не удалось построить маршрут. Попробуйте открыть маршрут в Яндекс Картах."
      );
    } finally {
      setRouteLoading(false);
    }
  }

  /** Кнопка «Пройти экскурсию» — именно она пишет событие для рекомендаций. */
  async function handleStartExcursion() {
    if (!selected) return;
    const attractionId = selected.id;

    setExcursionOpen(true);
    setExcursionLoading(true);
    setExcursionError(null);

    try {
      const [data] = await Promise.all([
        fetchExcursion(attractionId),
        startExcursion(attractionId),
      ]);
      setExcursion(data);
      setProgress((prev) =>
        prev[attractionId] === "completed"
          ? prev
          : { ...prev, [attractionId]: "started" }
      );
      loadPersonalData();
    } catch (error: any) {
      setExcursionError(
        error?.response?.data?.detail || "Не удалось загрузить экскурсию"
      );
    } finally {
      setExcursionLoading(false);
    }
  }

  async function handleCompleteExcursion() {
    if (!excursion) return;
    await completeExcursion(excursion.attraction_id);
    setProgress((prev) => ({ ...prev, [excursion.attraction_id]: "completed" }));
    await loadPersonalData();
  }

  const closeExcursion = useCallback(() => setExcursionOpen(false), []);

  function clearRoute() {
    setRouteResult(null);
    setRouteError(null);
  }

  async function handleShowSimilar() {
    if (!selected) return;

    setRelatedLoading(true);
    setRelatedError(null);
    setRelatedTitle("Похожие объекты");
    setRelated([]);

    try {
      const response = await fetchSimilarAttractions(selected.id);
      setRelated(response.items);
    } catch (error: any) {
      setRelatedError(
        error?.response?.data?.detail || "Не удалось загрузить похожие объекты"
      );
    } finally {
      setRelatedLoading(false);
    }
  }

  async function handleShowNearby() {
    if (!selected) return;

    const nearbyRadius = radiusKm > 0 ? radiusKm : 10;

    setRelatedLoading(true);
    setRelatedError(null);
    setRelatedTitle(`Что рядом, ${nearbyRadius} км`);
    setRelated([]);

    try {
      const response = await fetchNearbyAttractions(selected.id, nearbyRadius);
      setRelated(response.items);
    } catch (error: any) {
      setRelatedError(
        error?.response?.data?.detail || "Не удалось загрузить объекты рядом"
      );
    } finally {
      setRelatedLoading(false);
    }
  }

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <h1>Виртуальные экскурсии</h1>
          <p>Минск и Минская область</p>
        </div>
        <Legend categories={categories} />
      </header>

      <div className="main-layout">
        <aside className="left-panel">
          <FilterPanel
            categories={categories}
            districts={districts}
            selectedCategories={selectedCategories}
            onToggleCategory={toggleCategory}
            onClearCategories={clearCategories}
            selectedDistrict={selectedDistrict}
            onDistrictChange={setSelectedDistrict}
            query={queryInput}
            onQueryChange={setQueryInput}
            radiusKm={radiusKm}
            onRadiusChange={setRadiusKm}
            onUseMyLocation={useMyLocation}
            userLocation={userLocation}
            locationError={locationError}
            loading={loadingList}
            onReset={resetFilters}
          />
          <AttractionList
            items={attractions}
            total={total}
            loading={loadingList}
            error={listError}
            selectedId={selected?.id ?? null}
            progress={progress}
            onSelect={setSelected}
          />
        </aside>

        <section className="map-section">
          <MapView
            attractions={attractions}
            selected={selected}
            routeGeometry={routeResult?.geometry ?? null}
            categories={categories}
            onSelect={setSelected}
          />
        </section>

        <aside className="right-panel">
          {!selected && (
            <>
              <div className="empty-state">
                Кликните по маркеру на карте или выберите объект в списке слева.
              </div>
              <Recommendations
                data={recommendations}
                loading={recommendationsLoading}
                onSelect={setSelected}
              />
            </>
          )}

          {selected && (
            <AttractionCard
              attraction={detail}
              loading={detailLoading}
              onClose={() => setSelected(null)}
              excursionStatus={progress[selected.id] ?? null}
              onStartExcursion={handleStartExcursion}
              onBuildRoute={handleBuildRoute}
              onShowSimilar={handleShowSimilar}
              onShowNearby={handleShowNearby}
              relatedLoading={relatedLoading}
            />
          )}

          <RoutePanel
            originLabel={originLabel}
            destinationName={selected?.name || ""}
            result={routeResult}
            loading={routeLoading}
            error={routeError}
            onClear={clearRoute}
          />

          {relatedTitle && (
            <RelatedList
              title={relatedTitle}
              items={related}
              loading={relatedLoading}
              error={relatedError}
              onSelect={setSelected}
            />
          )}
        </aside>
      </div>

      {selected && excursionOpen && (
        <ExcursionOverlay
          excursion={excursion}
          loading={excursionLoading}
          error={excursionError}
          onClose={closeExcursion}
          onComplete={handleCompleteExcursion}
          recommendations={recommendations}
          onSelectRecommendation={setSelected}
        />
      )}
    </div>
  );
}
