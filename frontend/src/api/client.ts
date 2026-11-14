import axios from "axios";
import type {
  AttractionBrief,
  AttractionDetail,
  AttractionFilters,
  Category,
  District,
  Excursion,
  ExcursionProgress,
  RecommendationsResponse,
  RouteRequest,
  RouteResponse,
} from "../types";
import { getVisitorId } from "../utils/visitor";

const api = axios.create({
  baseURL: "/api",
});

api.interceptors.request.use((config) => {
  config.headers.set("X-Visitor-Id", getVisitorId());
  return config;
});

export async function fetchCategories(): Promise<Category[]> {
  const response = await api.get<Category[]>("/categories");
  return response.data;
}

export async function fetchDistricts(): Promise<District[]> {
  const response = await api.get<District[]>("/districts");
  return response.data;
}

export async function fetchAttractions(
  params: AttractionFilters
): Promise<{ total: number; items: AttractionBrief[] }> {
  const response = await api.get<{ total: number; items: AttractionBrief[] }>(
    "/attractions",
    { params }
  );
  return response.data;
}

export async function fetchAttraction(id: number): Promise<AttractionDetail> {
  const response = await api.get<AttractionDetail>(`/attractions/${id}`);
  return response.data;
}

export async function fetchSimilarAttractions(
  id: number
): Promise<{ items: AttractionBrief[] }> {
  const response = await api.get<{ items: AttractionBrief[] }>(
    `/attractions/${id}/similar`
  );
  return response.data;
}

export async function fetchNearbyAttractions(
  id: number,
  radiusKm: number
): Promise<{ items: AttractionBrief[] }> {
  const response = await api.get<{ items: AttractionBrief[] }>(
    `/attractions/${id}/nearby`,
    {
      params: {
        radius_km: radiusKm,
      },
    }
  );
  return response.data;
}

export async function buildRoute(payload: RouteRequest): Promise<RouteResponse> {
  const response = await api.post<RouteResponse>("/route", payload);
  return response.data;
}

export async function fetchExcursion(attractionId: number): Promise<Excursion> {
  const response = await api.get<Excursion>(
    `/attractions/${attractionId}/excursion`
  );
  return response.data;
}

export async function startExcursion(
  attractionId: number
): Promise<ExcursionProgress> {
  const response = await api.post<ExcursionProgress>(
    `/attractions/${attractionId}/excursion/start`
  );
  return response.data;
}

export async function completeExcursion(
  attractionId: number
): Promise<ExcursionProgress> {
  const response = await api.post<ExcursionProgress>(
    `/attractions/${attractionId}/excursion/complete`
  );
  return response.data;
}

export async function fetchExcursionHistory(): Promise<ExcursionProgress[]> {
  const response = await api.get<ExcursionProgress[]>("/excursions/history");
  return response.data;
}

export async function fetchRecommendations(
  limit = 5
): Promise<RecommendationsResponse> {
  const response = await api.get<RecommendationsResponse>("/recommendations", {
    params: { limit },
  });
  return response.data;
}
