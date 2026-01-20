import React from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import { isAdmin as isAdminRole, getUserFromStorage } from "../../../utils/roleUtils";
import TargetsHome from "./TargetsHome";
import SalesTargets from "./SalesTargets";
import CustomerTargets from "./CustomerTargets";
import TargetList from "./TargetList";
import CreateTargetPage from "./CreateTargetPage";
import TargetDetails from "./TargetDetails";

function TargetRoutes() {
  const navigate = useNavigate();
  const user = getUserFromStorage();
  const isAdmin = isAdminRole(user);

  return (
    <Routes>
      <Route path="/" element={<TargetsHome />} />
      <Route path="/create-target" element={<CreateTargetPage />} />
      <Route path="/:id" element={<TargetDetails />} />
      <Route path="/all-targets" element={<TargetList />} />
      <Route path="/sales-target" element={<SalesTargets navigate={navigate} isAdmin={isAdmin} />} />
      <Route path="/customer-target" element={<CustomerTargets navigate={navigate} isAdmin={isAdmin} />} />
    </Routes>
  );
}

export default TargetRoutes;
