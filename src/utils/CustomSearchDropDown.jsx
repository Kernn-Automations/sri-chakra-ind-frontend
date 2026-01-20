import React, { useState, useEffect } from "react";

const CustomSearchDropdown = ({
  label,
  options = [],
  onSelect,
  labelKey = "label",
  valueKey = "value",
  showSelectAll = true,
}) => {
  const [search, setSearch] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [finalOptions, setFinalOptions] = useState([]);

  // Sort alphabetically and add "Select All" option on top
  useEffect(() => {
    if (options && Array.isArray(options)) {
      const sorted = [...options].sort((a, b) =>
        String(a[labelKey])
          .toLowerCase()
          .localeCompare(String(b[labelKey]).toLowerCase())
      );

      // Add "Select All" option at the top if showSelectAll is true
      const combined = showSelectAll
        ? [
            { [labelKey]: "Select All", [valueKey]: null },
            ...sorted,
          ]
        : sorted;
      setFinalOptions(combined);
    } else {
      setFinalOptions([]);
    }
  }, [options, labelKey, valueKey, showSelectAll]);

  // Filter based on search
  const filtered = finalOptions.filter((opt) =>
    String(opt[labelKey]).toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="col-4 formcontent" style={{ position: "relative" }}>
      <label>{label}:</label>
      <input
        type="text"
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setShowOptions(true);
        }}
        onFocus={() => setShowOptions(true)}
        onBlur={() => setTimeout(() => setShowOptions(false), 200)}
        placeholder="Select or Type"
      />
      {showOptions && (
        <ul
          style={{
            position: "absolute",
            top: "60px",
            left: "80px",
            zIndex: 999,
            background: "white",
            width: "260px",
            maxHeight: "200px",
            overflowY: "auto",
            borderRadius: "10px",
            boxShadow: "2px 2px 4px #333",
            padding: "0",
            margin: "0",
            listStyle: "none",
          }}
        >
          {filtered.length > 0 ? (
            filtered.map((opt) => (
              <li
                key={opt[valueKey]}
                onMouseDown={() => {
                  setSearch(opt[labelKey]);
                  onSelect(opt[valueKey]);
                  setShowOptions(false);
                }}
                style={{
                  padding: "5px 10px",
                  cursor: "pointer",
                  fontSize: "15px",
                  fontWeight:
                    opt[labelKey] === "Select All" ? "bold" : "normal",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.background = "#f1f1f1")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.background = "transparent")
                }
              >
                {opt[labelKey]}
              </li>
            ))
          ) : (
            <li style={{ padding: "5px 10px", fontSize: "14px" }}>
              No results
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default CustomSearchDropdown;
