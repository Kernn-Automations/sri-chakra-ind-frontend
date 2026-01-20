import React, { useState, useCallback } from "react";
import { GoogleMap, MarkerF, StandaloneSearchBox } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "300px"
};

const defaultCenter = {
  lat: 17.385,  // Hyderabad default
  lng: 78.4867
};

function MapPicker({ lat, lng, onChange }) {
  const isLoaded = typeof window !== "undefined" && !!window.google;

  const [markerPos, setMarkerPos] = useState({
    lat: lat || defaultCenter.lat,
    lng: lng || defaultCenter.lng
  });

  const onMapClick = useCallback((event) => {
    const lat = event.latLng.lat();
    const lng = event.latLng.lng();
    setMarkerPos({ lat, lng });
    onChange({ lat, lng });
  }, [onChange]);

  const [searchBox, setSearchBox] = useState(null);

  const onPlacesChanged = useCallback(() => {
    if (!searchBox) return;
    const places = searchBox.getPlaces();
    if (!places || places.length === 0) return;
    const place = places[0];
    const lat = place.geometry?.location?.lat();
    const lng = place.geometry?.location?.lng();
    if (typeof lat === "number" && typeof lng === "number") {
      const next = { lat, lng };
      setMarkerPos(next);
      onChange(next);
    }
  }, [searchBox, onChange]);

  if (!isLoaded) return <div>Loading map...</div>;

  return (
    <div style={{ width: "100%" }}>
      <div style={{ marginBottom: 8 }}>
        <StandaloneSearchBox onLoad={setSearchBox} onPlacesChanged={onPlacesChanged}>
          <input
            type="text"
            placeholder="Search for a place"
            style={{
              boxSizing: "border-box",
              border: "1px solid #d1d5db",
              width: "100%",
              height: "36px",
              padding: "0 12px",
              borderRadius: 6,
              fontSize: 14,
            }}
          />
        </StandaloneSearchBox>
      </div>
      <GoogleMap
        mapContainerStyle={containerStyle}
        center={markerPos}
        zoom={12}
        onClick={onMapClick}
      >
        <MarkerF position={markerPos} />
      </GoogleMap>
    </div>
  );
}

export default React.memo(MapPicker);
