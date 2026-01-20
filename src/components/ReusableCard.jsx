import { Box, Heading, Text, useMediaQuery } from "@chakra-ui/react";

const ReusableCard = ({ title, value, subtitle, color = "blue.600", icon }) => {
  const [isMobile] = useMediaQuery("(max-width: 768px)");
  const [isSmallMobile] = useMediaQuery("(max-width: 480px)");

  return (
    <Box
      bg="white"
      p={isSmallMobile ? 2 : isMobile ? 3 : 4}
      borderRadius="md"
      boxShadow="md"
      textAlign="center"
      borderTop="4px solid"
      borderTopColor={color}
      flex="1"
      minW={isMobile ? "140px" : "200px"}
      m={isSmallMobile ? 1 : isMobile ? 1.5 : 2}
    >
      <Heading 
        as="h4" 
        size={isSmallMobile ? "xs" : isMobile ? "xs" : "sm"} 
        color="gray.600"
        fontSize={isSmallMobile ? "11px" : isMobile ? "12px" : "14px"}
      >
        {title}
      </Heading>
      <Heading 
        as="h2" 
        size={isSmallMobile ? "md" : isMobile ? "md" : "lg"} 
        color={color} 
        mt={isSmallMobile ? 1 : isMobile ? 1.5 : 2}
        fontSize={isSmallMobile ? "16px" : isMobile ? "18px" : "24px"}
      >
        {value}
      </Heading>
      {subtitle && (
        <Text 
          fontSize={isSmallMobile ? "10px" : isMobile ? "11px" : "sm"} 
          color="gray.500"
        >
          {subtitle}
        </Text>
      )}
      {icon && <Box mt={isMobile ? 1 : 2}>{icon}</Box>}
    </Box>
  );
};

export default ReusableCard;
