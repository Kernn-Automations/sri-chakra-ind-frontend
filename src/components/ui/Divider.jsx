import React from "react";
import { Box } from "@chakra-ui/react";

export default function CustomDivider({ my = 4 }) {
  return (
    <Box
      borderBottom="1px solid"
      borderColor="gray.200"
      width="100%"
      my={my}
    />
  );
}
