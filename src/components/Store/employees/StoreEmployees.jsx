import React from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "../../ReusableCard";

export default function StoreEmployees() {
  return (
    <div>
      <h4>Employees</h4>

      {/* Buttons */}
      <div className="row m-0 p-2">
        <div className="col">
          <button className="homebtn">Employees List</button>
          <button className="homebtn">Create Employee</button>
        </div>
      </div>

      {/* Mini Dashboards */}
      <Flex wrap="wrap" justify="space-between" px={2}>
        <ReusableCard title="Managers" value={"1"} />
        <ReusableCard title="Staff" value={"6"} color="blue.500" />
        <ReusableCard title="Present Today" value={"6"} color="green.500" />
        <ReusableCard title="On Leave" value={"1"} color="yellow.500" />
      </Flex>
    </div>
  );
}
