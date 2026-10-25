import { useEffect, useMemo, useRef } from "react";
import L from "leaflet";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import type { AttractionBrief, Category, RouteGeometry } from "../types";
import { categoryColor, categoryEmoji } from "../utils/format";

interface MapViewProps {
  attractions: AttractionBrief[];
  selected: AttractionBrief | null;
  routeGeometry: RouteGeometry | null;
  categories: Category[];
  onSelect: (item: AttractionBrief) => void;
}

function FlyToSelected({ selected }: { selected: AttractionBrief | null }) {
  const map = useMap();
  const previousId = useRef<number | null>(null);

  useEffect(() => {
    if (!selected) return;
    if (previousId.current !== selected.id) {
      map.flyTo(
        [Number(selected.latitude), Number(selected.longitude)],
        Math.max(map.getZoom(), 10),
        { duration: 0.8 }
      );
      previousId.current = selected.id;
    }
  }, [selected, map]);

  return null;
}

function RouteLayer({ geometry }: { geometry: RouteGeometry | null }) {
  const map = useMap();

  useEffect(() => {
    if (!geometry || !geometry.coordinates || geometry.coordinates.length === 0) {
      return;
    }

    const coordinates = geometry.coordinates.map(
      ([lng, lat]) => [lat, lng] as [number, number]
    );

    const polyline = L.polyline(coordinates, {
      color: "#2563eb",
      weight: 5,
      opacity: 0.9,
    }).addTo(map);

    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    return () => {
      polyline.remove();
    };
  }, [geometry, map]);

  return null;
}

export default function MapView({
  attractions,
  selected,
  routeGeometry,
  categories,
  onSelect,
}: MapViewProps) {
  const markers = useMemo(() => {
    const mapById = new Map<number, AttractionBrief>();
    attractions.forEach((item) => {
      mapById.set(item.id, item);
    });

    if (selected && !mapById.has(selected.id)) {
      mapById.set(selected.id, selected);
    }

    return Array.from(mapById.values());
  }, [attractions, selected]);

  const createIcon = (item: AttractionBrief, isSelected: boolean) => {
    const category = categories.find((c) => c.slug === item.category.slug);
    const color = category?.color || categoryColor(item.category.slug);
    const emoji = categoryEmoji(item.category.slug);

    return L.divIcon({
      className: "",
      html: `
        <div
          class="custom-marker ${isSelected ? "selected" : ""}"
          style="--marker-color: ${color}"
        >
          ${emoji}
        </div>
      `,
      iconSize: [36, 36],
      iconAnchor: [18, 18],
    });
  };

  return (
    <MapContainer
      center={[53.9, 27.5]}
      zoom={8}
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FlyToSelected selected={selected} />
      <RouteLayer geometry={routeGeometry} />

      {markers.map((item) => (
        <Marker
          key={item.id}
          position={[Number(item.latitude), Number(item.longitude)]}
          icon={createIcon(item, selected?.id === item.id)}
          eventHandlers={{
            click: () => onSelect(item),
          }}
        >
          <Popup>
            <strong>{item.name}</strong>
            <br />
            {item.category.name}
            <br />
            {item.district.name}
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
