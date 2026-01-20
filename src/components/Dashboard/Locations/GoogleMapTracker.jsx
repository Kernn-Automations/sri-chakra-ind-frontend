import React, { useState, useCallback } from "react";
import { GoogleMap, MarkerF } from "@react-google-maps/api";

const containerStyle = {
  width: "100%",
  height: "500px",
};

const center = {
  lat: 17.49172973655364,
  lng: 78.38712249518254,
};

function GoogleMapTracker() {
  const isLoaded = typeof window !== "undefined" && !!window.google;
  if (!isLoaded) return <div>Loading Maps...</div>;

  return (
    <GoogleMap mapContainerStyle={containerStyle} center={center} zoom={15}>
      <MarkerF position={center} />
    </GoogleMap>
  );
}

export default GoogleMapTracker;
