import {
  Combobox,
  ComboboxInput,
  ComboboxOption,
  ComboboxOptions,
} from "@headlessui/react";
import usePlacesAutocomplete from "use-places-autocomplete";

const SearchBox = ({ onSelectFromSearch }) => {
  const {
    ready,
    value,
    setValue,
    suggestions: { status, data },
    clearSuggestions,
  } = usePlacesAutocomplete();

  const handleSelect = (address) => {
    setValue(address, false);
    clearSuggestions();
    onSelectFromSearch(address);
  };

  return (
    <div
      className="search-container"
      style={{ position: "relative", zIndex: 1100 }}
    >
      <Combobox value={value} onChange={handleSelect}>
        <ComboboxInput
          onChange={(e) => setValue(e.target.value)}
          disabled={!ready}
          placeholder="Search an address"
          // Stop propagation ensures clicks inside the input don't trigger map events
          onPointerDown={(e) => e.stopPropagation()}
          style={{
            width: "300px",
            height: "40px",
            padding: "10px",
            border: "1px solid #ccc",
            borderRadius: "5px",
            fontSize: "16px",
            backgroundColor: "white", // Explicitly white
            color: "black", // Explicitly black text
          }}
        />
        <ComboboxOptions
          className="absolute bg-white shadow-md rounded mt-1"
          style={{
            width: "300px",
            zIndex: 1200,
            backgroundColor: "white",
            listStyle: "none",
            padding: 0,
            margin: "5px 0 0 0",
            border: "1px solid #ddd",
            maxHeight: "200px",
            overflowY: "auto",
          }}
        >
          {status === "OK" &&
            data.map(({ place_id, description }) => (
              <ComboboxOption
                key={place_id}
                value={description}
                style={{
                  padding: "10px",
                  cursor: "pointer",
                  borderBottom: "1px solid #eee",
                  backgroundColor: "white",
                  color: "black",
                }}
              >
                {({ active }) => (
                  <div
                    style={{
                      backgroundColor: active ? "#f0f0f0" : "transparent",
                    }}
                  >
                    {description}
                  </div>
                )}
              </ComboboxOption>
            ))}
        </ComboboxOptions>
      </Combobox>
    </div>
  );
};

export default SearchBox;
