import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap/dist/js/bootstrap.esm.js";
import "bootstrap-icons/font/bootstrap-icons.css";
import { AuthProvider } from "./Auth";
import { BrowserRouter } from "react-router-dom";
import { DivisionProvider } from "./components/context/DivisionContext";
import { Provider } from "./components/ui/provider";
import { LightMode } from "@/components/ui/color-mode";
import { LoadScript } from "@react-google-maps/api";

const theme = {
  colorMode: "light",
  useSystemColorMode: false,
};

const AppTree = (
  <StrictMode>
    <AuthProvider>
      <BrowserRouter>
        <DivisionProvider>
          <Provider theme={theme}>
            <LightMode>
              <App />
            </LightMode>
          </Provider>
        </DivisionProvider>
      </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);

const root = createRoot(document.getElementById("root"));

if (import.meta.env.VITE_GOOGLE_MAPS_API_KEY) {
  root.render(
    <LoadScript
      googleMapsApiKey={import.meta.env.VITE_GOOGLE_MAPS_API_KEY}
      libraries={["places"]}
      onLoad={() => console.log("Google Maps loaded")}
      onError={(e) => console.error("Maps load error", e)}
    >
      {AppTree}
    </LoadScript>,
  );
} else {
  root.render(AppTree);
}
