import React, { useEffect, useState } from "react";
import axios from "axios";
import styles from "./DivisionSelector.module.css";
import { useDivision } from "../context/DivisionContext";

export default function DivisionSelector({ userData }) {
  const [divisions, setDivisions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { setSelectedDivision, refreshData } = useDivision();

  useEffect(() => {
    if (!userData?.user?.showDivisions) return;

    const fetchDivisions = async () => {
      setLoading(true);
      setError("");
      const token = localStorage.getItem("accessToken");
      if (!token) {
        setError("No auth token found");
        return setLoading(false);
      }
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/divisions/user-divisions`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setDivisions(res.data.divisions || res.data.data || []);
      } catch (e) {
        console.error("Error fetching divisions:", e);
        setError("Failed to fetch divisions");
      } finally {
        setLoading(false);
      }
    };

    fetchDivisions();
  }, [userData]);

  const handleSelect = async (division) => {
    const token = localStorage.getItem("accessToken");
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/divisions/select`,
        { divisionId: division.id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (e) {
      if (e.response?.status !== 404) {
        console.error("Error selecting division:", e);
        return alert("Unable to select division.");
      }
    }
    
    // Store selected division with proper fields
    const divisionData = {
      id: division.id,
      name: division.name,
      state: division.state,
      isActive: division.isActive,
      createdAt: division.createdAt,
      updatedAt: division.updatedAt
    };
    
    // Update the division context
    setSelectedDivision(divisionData);
    
    // Store in localStorage
    localStorage.setItem("selectedDivision", JSON.stringify(divisionData));
    localStorage.setItem(
      "user",
      JSON.stringify({ ...userData.user, showDivisions: false })
    );
    
    // Trigger data refresh for all components
    refreshData();
    
    // Navigate to dashboard instead of reloading
    window.location.href = '/';
  };

  console.log('DivisionSelector - Checking conditions:', {
    userData,
    showDivisions: userData?.user?.showDivisions,
    shouldShow: userData?.user?.showDivisions
  });
  
  if (!userData?.user?.showDivisions) {
    console.log('DivisionSelector - Not showing because showDivisions is false');
    return null;
  }
  if (loading) return <p>Loading divisions…</p>;
  if (error) return (
    <div>
      <p style={{ color: "red" }}>{error}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  );
  if (!divisions.length) return <p>No divisions available.</p>;

  return (
    <div className={styles.container}>
      <div className={styles.selectorBox}>
        <h3 className={styles.title}>Select a <span>Division</span></h3>
        <p className={styles.subtitle}>Choose your division to continue</p>
        <div className={styles.divisionsGrid}>
          {divisions.map(d => (
            <div
              key={d.id}
              className={styles.divisionCard}
              onClick={() => handleSelect(d)}
            >
              <div className={styles.divisionContent}>
                <div className={styles.divisionName}>{d.name}</div>
                <div className={styles.divisionState}>{d.state}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}