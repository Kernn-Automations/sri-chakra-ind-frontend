import {
  Line,
  Bar,
  Doughnut,
} from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Box, Heading } from "@chakra-ui/react";

// ✅ register once
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Enhanced color palette for better visual appeal
const ENHANCED_COLORS = [
  "#3B82F6", // Blue
  "#10B981", // Green
  "#F59E0B", // Yellow
  "#EF4444", // Red
  "#8B5CF6", // Purple
  "#06B6D4", // Cyan
  "#F97316", // Orange
  "#EC4899", // Pink
  "#84CC16", // Lime
  "#6366F1", // Indigo
  "#14B8A6", // Teal
  "#F43F5E", // Rose
];

const ChartComponent = ({
  type = "line",
  title,
  data,
  options,
  height = "250px",
  legendPosition = "right", // New prop for legend position
}) => {
  const Chart =
    type === "line" ? Line : type === "doughnut" ? Doughnut : Bar;

  // Validate data structure to prevent Chart.js errors
  const isValidData = data && 
    typeof data === 'object' && 
    Array.isArray(data.datasets) && 
    data.datasets.length > 0 &&
    Array.isArray(data.labels);

  // Default fallback data if the provided data is invalid
  const safeData = isValidData ? data : {
    labels: ["No Data"],
    datasets: [{
      label: "No Data",
      data: [0],
      backgroundColor: "#e2e8f0",
      borderColor: "#cbd5e0",
    }]
  };

  // Enhance data with better colors if not provided
  const enhancedData = {
    ...safeData,
    datasets: safeData.datasets.map((dataset, index) => ({
      ...dataset,
      backgroundColor: dataset.backgroundColor || ENHANCED_COLORS.slice(0, safeData.labels.length),
      borderColor: dataset.borderColor || ENHANCED_COLORS.slice(0, safeData.labels.length),
      borderWidth: dataset.borderWidth || 2,
    })),
  };

  // Custom options for pie/doughnut charts with proper centering
  const customOptions = {
    ...options,
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      ...options?.plugins,
      legend: {
        ...options?.plugins?.legend,
        position: legendPosition,
        align: legendPosition === "left" ? "start" : "center",
        labels: {
          ...options?.plugins?.legend?.labels,
          usePointStyle: true,
          padding: 15,
          font: {
            size: 12,
            weight: '500',
          },
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const dataset = data.datasets[0];
                const value = dataset.data[i];
                const backgroundColor = Array.isArray(dataset.backgroundColor) 
                  ? dataset.backgroundColor[i] 
                  : dataset.backgroundColor;
                return {
                  text: `${label}: ${value}`,
                  fillStyle: backgroundColor,
                  strokeStyle: backgroundColor,
                  lineWidth: 0,
                  pointStyle: 'circle',
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        ...options?.plugins?.tooltip,
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: '#ffffff',
        bodyColor: '#ffffff',
        borderColor: '#ffffff',
        borderWidth: 1,
        cornerRadius: 8,
        callbacks: {
          label: (context) => {
            const label = context.label || '';
            const value = context.parsed || context.raw || 0;
            if (type === "doughnut") {
              const total = context.dataset.data.reduce((a, b) => a + b, 0);
              const percentage = ((value / total) * 100).toFixed(1);
              return `${label}: ${value} (${percentage}%)`;
            }
            return `${label}: ${value}`;
          },
        },
      },
    },
    layout: {
      padding: legendPosition === "left" ? { left: 20, right: 20, top: 20, bottom: 20 } : { left: 20, right: 20, top: 20, bottom: 20 },
    },
    // Special options for pie/doughnut charts
    ...(type === "doughnut" && {
      cutout: '60%',
      radius: '90%',
      elements: {
        arc: {
          borderWidth: 3,
          borderColor: '#ffffff',
          hoverBorderWidth: 4,
          hoverBorderColor: '#ffffff',
        },
      },
    }),
    // Enhanced hover effects
    interaction: {
      mode: 'nearest',
      axis: 'xy',
      intersect: false,
    },
  };

  return (
    <Box
      bg="white"
      p={4}
      borderRadius="lg"
      boxShadow="lg"
      m={2}
      flex={type === "line" ? 2 : 1}
      textAlign="center"
      minHeight={type === "doughnut" ? "380px" : "auto"}
      display="flex"
      flexDirection="column"
      justifyContent="center"
      transition="all 0.3s ease"
      _hover={{
        transform: "translateY(-4px)",
        boxShadow: "xl",
      }}
    >
      <Heading as="h4" size="sm" color="gray.700" mb={4} fontWeight="600">
        {title}
      </Heading>
      <Box 
        height={height} 
        position="relative"
        display="flex"
        alignItems="center"
        justifyContent="center"
        borderRadius="md"
        overflow="hidden"
      >
        <Chart data={enhancedData} options={customOptions} />
      </Box>
    </Box>
  );
};

export default ChartComponent;
