export interface CategoryBrief {
  slug: string;
  name: string;
}

export interface DistrictBrief {
  slug: string;
  name: string;
  type: string;
}

export interface Category {
  id: number;
  slug: string;
  name: string;
  icon?: string | null;
  color?: string | null;
}

export interface District {
  id: number;
  slug: string;
  name: string;
  type: string;
}

export interface AttractionBrief {
  id: number;
  name: string;
  slug?: string | null;
  category: CategoryBrief;
  district: DistrictBrief;
  latitude: number;
  longitude: number;
  short_description: string;
  photo_url?: string | null;
  is_accessible: boolean;
  distance_m?: number | null;
}

export interface AttractionDetail extends AttractionBrief {
  full_description?: string | null;
  source_url?: string | null;
}

export interface RoutePoint {
  lat: number;
  lng: number;
}

export interface RouteRequest {
  origin: RoutePoint;
  destination: RoutePoint;
}

export interface RouteGeometry {
  type: string;
  coordinates: [number, number][];
}

export interface RouteResponse {
  distance_m: number;
  duration_s: number;
  geometry: RouteGeometry;
  external_yandex_url: string;
}

export interface AttractionFilters {
  category?: string;
  district?: string;
  q?: string;
  lat?: number;
  lng?: number;
  radius_km?: number;
  limit?: number;
}

export type ExcursionStatus = "started" | "completed";

export interface ExcursionStop {
  id: number;
  position: number;
  title: string;
  subtitle?: string | null;
  description: string;
  fact?: string | null;
  image_url?: string | null;
}

export interface Excursion {
  attraction_id: number;
  attraction_name: string;
  category: CategoryBrief;
  stops: ExcursionStop[];
  status: ExcursionStatus | null;
}

export interface ExcursionProgress {
  attraction_id: number;
  status: ExcursionStatus;
  started_at: string;
  completed_at?: string | null;
}

export interface RecommendationItem {
  attraction: AttractionBrief;
  score: number;
  reasons: string[];
}

export interface RecommendationsResponse {
  strategy: "personal" | "popular";
  based_on: number;
  items: RecommendationItem[];
}
