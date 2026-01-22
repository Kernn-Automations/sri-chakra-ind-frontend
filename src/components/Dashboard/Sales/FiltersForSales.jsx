import { useAuth } from "@/Auth";
import CustomSearchDropdown from "@/utils/CustomSearchDropDown";
import React, { useEffect, useState } from "react";
import styles from "./Sales.module.css";

function FiltersForSales({
  divisionId,
  setDivisionId,
  zoneId,
  setZoneId,
  subZoneId,
  setSubZoneId,
  teamsId,
  setTeamsId,
  employeeId,
  setEmployeeId,
  isDivisionDisabled = false,
}) {
  const [divisions, setDivisions] = useState();
  const [zones, setZones] = useState();
  const [subZones, setSubZones] = useState();
  const [teams, setTeams] = useState();
  const [employees, setEmployees] = useState();

  const { axiosAPI } = useAuth();

  //   Divisions
  useEffect(() => {
    async function fetch() {
      try {
        const res = await axiosAPI.get("/divisions");
        console.log(res);
        setDivisions(res.data.data);
      } catch (e) {
        console.log(e);
      }
    }
    fetch();
  }, []);

  //   Zones
  useEffect(() => {
    async function fetch() {
      if (!divisionId) return;
      setZoneId(null);
      setSubZoneId(null);
      setTeamsId(null);
      setEmployeeId(null);
      try {
        const res = await axiosAPI.get(`/zones/division/${divisionId}`);
        console.log(res);
        setZones(res.data.data.zones);
      } catch (e) {
        console.log(e);
      }
    }
    fetch();
  }, [divisionId]);

  //   subzones
  useEffect(() => {
    async function fetch() {
      if (!zoneId) return;
      setSubZoneId(null);
      setTeamsId(null);
      setEmployeeId(null);
      try {
        const res = await axiosAPI.get(`/zones/${zoneId}/sub-zones`);
        console.log(res);
        setSubZones(res.data.data.subZones);
      } catch (e) {
        console.log(e);
      }
    }
    fetch();
  }, [zoneId]);

  //   Teams
  useEffect(() => {
    async function fetch() {
      if (!subZoneId) return;
      setTeamsId(null);
      setEmployeeId(null);
      try {
        const res = await axiosAPI.get(`/sub-zones/${subZoneId}/teams`);
        console.log(res);
        setTeams(res.data.data.teams);
      } catch (e) {
        console.log(e);
      }
    }
    fetch();
  }, [subZoneId]);

  //   Employees
  useEffect(() => {
    async function fetch() {
      if (!teamsId) return;
      setEmployeeId(null);
      try {
        const res = await axiosAPI.get(`/employees`);
        console.log(res);
        setEmployees(res.data.data);
      } catch (e) {
        console.log(e);
      }
    }
    fetch();
  }, [teamsId]);

  return (
    <>
      <div className={`col-3 formcontent`}>
        <label htmlFor="">Divisions</label>
        {isDivisionDisabled ? (
          <select
            name=""
            id=""
            value={divisionId}
            disabled={true}
            className={styles.readOnlySelect}
          >
            <option value={divisionId}>
              {divisions?.find((d) => d.id == divisionId)?.name ||
                localStorage.getItem("currentDivisionName") ||
                "Loading..."}
            </option>
          </select>
        ) : (
          <select
            name=""
            id=""
            value={divisionId}
            onChange={(e) =>
              setDivisionId(e.target.value === "null" ? null : e.target.value)
            }
          >
            <option value="null">--select--</option>
            {divisions?.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className={`col-3 formcontent`}>
        <label htmlFor="">Zones</label>
        <select
          name=""
          id=""
          value={zoneId}
          disabled={!divisionId}
          onChange={(e) =>
            setZoneId(e.target.value === "null" ? null : e.target.value)
          }
        >
          <option value="null">--select--</option>
          {zones?.map((z) => (
            <option value={z.id}>{z.name}</option>
          ))}
        </select>
      </div>

      <div className={`col-3 formcontent`}>
        <label htmlFor="">Sub Zones</label>
        <select
          name=""
          id=""
          value={subZoneId}
          disabled={!zoneId}
          onChange={(e) =>
            setSubZoneId(e.target.value === "null" ? null : e.target.value)
          }
        >
          <option value="null">--select--</option>
          {subZones?.map((sz) => (
            <option value={sz.id}>{sz.name}</option>
          ))}
        </select>
      </div>

      <div className={`col-3 formcontent`}>
        <label htmlFor="">Teams</label>
        <select
          name=""
          id=""
          value={teamsId}
          disabled={!subZoneId}
          onChange={(e) =>
            setTeamsId(e.target.value === "null" ? null : e.target.value)
          }
        >
          <option value="null">--select--</option>
          {teams?.map((t) => (
            <option value={t.id}>{t.name}</option>
          ))}
        </select>
      </div>

      <div className={`col-3 formcontent`}>
        <label htmlFor="">Employees</label>
        <select
          name=""
          id=""
          value={employeeId}
          disabled={!teamsId}
          onChange={(e) =>
            setEmployeeId(e.target.value === "null" ? null : e.target.value)
          }
        >
          <option value="null">--select--</option>
          {employees?.map((e) => (
            <option value={e.id}>{e.name}</option>
          ))}
        </select>
      </div>
    </>
  );
}

export default FiltersForSales;
