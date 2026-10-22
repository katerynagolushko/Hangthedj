"use client";

import { useMemo } from "react";
import { MapContainer, Marker, Popup, TileLayer } from "react-leaflet";
import L from "leaflet";
import Link from "next/link";
import "leaflet/dist/leaflet.css";

export type MapMarker = {
  id: string;
  name: string;
  photo: string;
  lat: number;
  lng: number;
  area: string;
  score?: string;
  detail?: string;
  distance?: string;
  variant?: "person" | "place";
};

function pin(marker: MapMarker) {
  if (marker.variant === "place") {
    return L.divIcon({
      className: "hang-pin",
      html: `<span class="hang-place-pin"></span>`,
      iconSize: [18, 18],
      iconAnchor: [9, 9],
      popupAnchor: [0, -12],
    });
  }
  return L.divIcon({
    className: "hang-pin",
    html: `<span class="hang-pin-face" style="background-image:url('${marker.photo}')"></span>`,
    iconSize: [46, 46],
    iconAnchor: [23, 23],
    popupAnchor: [0, -22],
  });
}

export function LondonMap({
  markers = [],
  interactive = true,
  center = [51.513, -0.095] as [number, number],
  zoom = 13,
}: {
  markers?: MapMarker[];
  interactive?: boolean;
  center?: [number, number];
  zoom?: number;
}) {
  const icons = useMemo(() => {
    const map = new Map<string, L.DivIcon>();
    for (const marker of markers) map.set(marker.id, pin(marker));
    return map;
  }, [markers]);

  return (
    <MapContainer
      center={center}
      zoom={zoom}
      zoomControl={interactive}
      dragging={interactive}
      scrollWheelZoom={interactive}
      doubleClickZoom={interactive}
      touchZoom={interactive}
      boxZoom={interactive}
      keyboard={interactive}
      style={{ height: "100%", width: "100%", background: "#E7E2DA" }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {markers.map((marker) => (
        <Marker key={marker.id} position={[marker.lat, marker.lng]} icon={icons.get(marker.id)}>
          <Popup className="hang-popup">
            <div className="w-44 font-sans text-[#1B1F3B]">
              <p className="font-semibold">{marker.name}</p>
              <p className="text-xs text-[#6B6B6B]">{marker.area}</p>
              {marker.score ? <p className="mt-1 text-sm text-[#FF5A24]">{marker.score}</p> : null}
              {marker.detail ? <p className="mt-1 text-xs leading-snug">{marker.detail}</p> : null}
              {marker.distance ? <p className="mt-1 text-xs text-[#FF5A24]">{marker.distance} from you</p> : null}
              <Link href={`/simulate?with=${marker.id}`} className="mt-2 inline-block text-xs font-medium text-[#1B1F3B] underline">
                View simulation
              </Link>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
