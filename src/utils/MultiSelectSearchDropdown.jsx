import React, { useState, useEffect, useRef } from "react";

const MultiSelectSearchDropdown = ({
  label,
  options = [],
  selectedValues = [],
  onSelect,
  labelKey = "label",
  valueKey = "value",
  placeholder = "Select or Type",
  className = "",
}) => {
  const [search, setSearch] = useState("");
  const [showOptions, setShowOptions] = useState(false);
  const [finalOptions, setFinalOptions] = useState([]);
  const dropdownRef = useRef(null);

  // Sort alphabetically
  useEffect(() => {
    if (options && Array.isArray(options)) {
      const sorted = [...options].sort((a, b) =>
        String(a[labelKey])
          .toLowerCase()
          .localeCompare(String(b[labelKey]).toLowerCase())
      );
      setFinalOptions(sorted);
    } else {
      setFinalOptions([]);
    }
  }, [options, labelKey, valueKey]);

  // Filter based on search
  const filtered = finalOptions.filter((opt) =>
    String(opt[labelKey]).toLowerCase().includes(search.toLowerCase())
  );

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowOptions(false);
      }
    };

    if (showOptions) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [showOptions]);

  const handleToggle = (value) => {
    const isSelected = selectedValues.includes(value);
    let newSelected;
    
    if (isSelected) {
      newSelected = selectedValues.filter((v) => v !== value);
    } else {
      newSelected = [...selectedValues, value];
    }
    
    onSelect(newSelected);
  };

  const handleSelectAll = () => {
    if (selectedValues.length === filtered.length) {
      onSelect([]);
    } else {
      const allValues = filtered.map((opt) => opt[valueKey]).filter(Boolean);
      onSelect(allValues);
    }
  };

  const getDisplayText = () => {
    if (selectedValues.length === 0) {
      return search || placeholder;
    }
    if (selectedValues.length === 1) {
      const selected = finalOptions.find((opt) => opt[valueKey] === selectedValues[0]);
      return selected ? selected[labelKey] : `${selectedValues.length} selected`;
    }
    return `${selectedValues.length} teams selected`;
  };

  const removeSelected = (value, e) => {
    e.stopPropagation();
    const newSelected = selectedValues.filter((v) => v !== value);
    onSelect(newSelected);
  };

  return (
    <div className={className} style={{ position: "relative" }} ref={dropdownRef}>
      <label>{label} :</label>
      <div
        style={{
          position: "relative",
          display: "flex",
          flexWrap: "wrap",
          alignItems: "center",
          minHeight: "27px",
          padding: "2px 4px",
          border: "1px solid #d9d9d9",
          borderRadius: "4px",
          boxShadow: "1px 1px 3px #333",
          cursor: "text",
          backgroundColor: "white",
        }}
        onClick={() => setShowOptions(true)}
      >
        {selectedValues.length > 0 && (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px", flex: 1 }}>
            {selectedValues.slice(0, 3).map((value) => {
              const option = finalOptions.find((opt) => opt[valueKey] === value);
              if (!option) return null;
              return (
                <span
                  key={value}
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    padding: "2px 6px",
                    backgroundColor: "#e3f2fd",
                    borderRadius: "4px",
                    fontSize: "12px",
                    gap: "4px",
                  }}
                >
                  {option[labelKey]}
                  <span
                    onClick={(e) => removeSelected(value, e)}
                    style={{
                      cursor: "pointer",
                      fontWeight: "bold",
                      color: "#1976d2",
                    }}
                  >
                    ×
                  </span>
                </span>
              );
            })}
            {selectedValues.length > 3 && (
              <span style={{ fontSize: "12px", color: "#666" }}>
                +{selectedValues.length - 3} more
              </span>
            )}
          </div>
        )}
        <input
          type="text"
          value={selectedValues.length === 0 ? search : ""}
          onChange={(e) => {
            setSearch(e.target.value);
            setShowOptions(true);
          }}
          onFocus={() => setShowOptions(true)}
          placeholder={selectedValues.length === 0 ? placeholder : ""}
          style={{
            border: "none",
            outline: "none",
            flex: selectedValues.length === 0 ? 1 : "0 0 auto",
            minWidth: selectedValues.length === 0 ? "100px" : "50px",
            fontSize: "14px",
            padding: "0 4px",
          }}
        />
      </div>
      {showOptions && (
        <ul
          style={{
            position: "absolute",
            top: "100%",
            left: "0",
            right: "0",
            zIndex: 999,
            background: "white",
            maxHeight: "200px",
            overflowY: "auto",
            borderRadius: "4px",
            boxShadow: "2px 2px 4px #333",
            padding: "4px 0",
            margin: "4px 0 0 0",
            listStyle: "none",
            border: "1px solid #d9d9d9",
          }}
        >
          {filtered.length > 0 && (
            <li
              onMouseDown={(e) => {
                e.preventDefault();
                handleSelectAll();
              }}
              style={{
                padding: "8px 12px",
                cursor: "pointer",
                fontSize: "14px",
                fontWeight: "bold",
                backgroundColor: selectedValues.length === filtered.length ? "#e3f2fd" : "transparent",
                borderBottom: "1px solid #eee",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#f5f5f5")}
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  selectedValues.length === filtered.length ? "#e3f2fd" : "transparent")
              }
            >
              {selectedValues.length === filtered.length ? "Deselect All" : "Select All"}
            </li>
          )}
          {filtered.length > 0 ? (
            filtered.map((opt) => {
              const isSelected = selectedValues.includes(opt[valueKey]);
              return (
                <li
                  key={opt[valueKey]}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    handleToggle(opt[valueKey]);
                  }}
                  style={{
                    padding: "8px 12px",
                    cursor: "pointer",
                    fontSize: "14px",
                    backgroundColor: isSelected ? "#e3f2fd" : "transparent",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px",
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = isSelected ? "#bbdefb" : "#f5f5f5")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = isSelected ? "#e3f2fd" : "transparent")
                  }
                >
                  <span
                    style={{
                      width: "16px",
                      height: "16px",
                      border: "2px solid #1976d2",
                      borderRadius: "3px",
                      display: "inline-flex",
                      alignItems: "center",
                      justifyContent: "center",
                      backgroundColor: isSelected ? "#1976d2" : "transparent",
                    }}
                  >
                    {isSelected && (
                      <span style={{ color: "white", fontSize: "12px" }}>✓</span>
                    )}
                  </span>
                  {opt[labelKey]}
                </li>
              );
            })
          ) : (
            <li style={{ padding: "8px 12px", fontSize: "14px", color: "#999" }}>
              No results found
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

export default MultiSelectSearchDropdown;

