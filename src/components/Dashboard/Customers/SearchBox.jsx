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
    <Combobox value={value} onChange={handleSelect}>
      <ComboboxInput
        onChange={(e) => setValue(e.target.value)}
        disabled={!ready}
        placeholder="Search an address"
        style={{
          width: "300px",
          height: "40px",
          padding: "10px",
          border: "1px solid gray",
          borderRadius: "5px",
          fontSize: "16px",
        }}
      />
      <ComboboxOptions
        className="absolute bg-white shadow-md rounded mt-1 w-full"
        style={{
          width: "300px",
        }}
      >
        {status === "OK" &&
          data.map(({ place_id, description }) => (
            <ComboboxOption
              key={place_id}
              value={description}
              className="p-2 hover:bg-gray-200 cursor-pointer"
            >
              {description}
            </ComboboxOption>
          ))}
      </ComboboxOptions>
    </Combobox>
  );
};

export default SearchBox;
