import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import styles from "./SearchBar.module.css";
import { IoSearch } from "react-icons/io5";

const SearchBar = ({ options = [] }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredOptions, setFilteredOptions] = useState([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const navigate = useNavigate();

  const handleChange = (event) => {
    const value = event.target.value;
    setSearchTerm(value);

    if (value.trim() === "") {
      setFilteredOptions([]);
      return;
    }

    const filtered = options.filter((option) =>
      option.name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredOptions(filtered);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      setActiveIndex((prev) =>
        prev < filteredOptions.length - 1 ? prev + 1 : prev
      );
    } else if (event.key === "ArrowUp") {
      setActiveIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      navigate(filteredOptions[activeIndex].path);
      setSearchTerm("");
      setFilteredOptions([]);
    }
  };

  return (
    <div className={styles.searchbar}>
      <input
        type="text"
        placeholder="Search..."
        value={searchTerm}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
      />
      <span className={styles.searchicon}>
        <IoSearch />
      </span>
      {filteredOptions.length > 0 && (
        <ul className={styles.dropdown}>
          {filteredOptions.map((option, index) => (
            <li
              key={option.name}
              className={
                activeIndex === index ? styles.active : styles.dropdownItem
              }
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => {
                navigate(option.path);
                setSearchTerm("");
                setFilteredOptions([]);
              }}
            >
              {option.name}
              <p>{option.path}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SearchBar;
