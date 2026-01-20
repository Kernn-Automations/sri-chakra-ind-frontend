import React, { useEffect, useState, useMemo } from "react";
import { Flex } from "@chakra-ui/react";
import ReusableCard from "@/components/ReusableCard";
import ChartComponent from "@/components/ChartComponent";
import { useAuth } from "@/Auth";
import Loading from "@/components/Loading";
import styles from "../Dashboard.module.css";

function SampleHome({ navigate, isAdmin }) {
  const { axiosAPI } = useAuth();
  const [loading, setLoading] = useState(false);
  const [sampleData, setSampleData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchSampleDashboard() {
      try {
        setLoading(true);
        
        // ✅ Get division ID from localStorage for division filtering
        const currentDivisionId = localStorage.getItem('currentDivisionId');
        const currentDivisionName = localStorage.getItem('currentDivisionName');
        
        // ✅ Add division parameters to endpoint
        let endpoint = "/dashboard/samples";
        if (currentDivisionId && currentDivisionId !== '1') {
          endpoint += `?divisionId=${currentDivisionId}`;
        } else if (currentDivisionId === '1') {
          endpoint += `?showAllDivisions=true`;
        }
        
        console.log('SampleHome - Fetching sample dashboard with endpoint:', endpoint);
        console.log('SampleHome - Division ID:', currentDivisionId);
        console.log('SampleHome - Division Name:', currentDivisionName);
        
        const res = await axiosAPI.get(endpoint);
        console.log("Sample Dashboard Response:", res.data);
        
        // Handle the new API response structure
        if (res.data.success && res.data.data) {
          setSampleData(res.data.data);
        } else {
          setSampleData(res.data);
        }
      } catch (err) {
        console.error("Sample dashboard fetch error:", err);
        setError(err?.response?.data?.message || "Failed to load sample dashboard");
      } finally {
        setLoading(false);
      }
    }
    fetchSampleDashboard();
  }, []);

  // Transform backend data for Chart.js format - Updated for new API structure
  const trendData = React.useMemo(() => {
    if (!sampleData?.samplesAddedTrend || !sampleData.samplesAddedTrend.months) {
      return {
        labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
        datasets: [
          {
            label: "Samples Added",
            data: [0, 0, 0, 0, 0, 0],
            borderColor: "#2a4d9b",
            backgroundColor: "rgba(42,77,155,0.1)",
            fill: true,
            tension: 0.3,
          },
        ],
      };
    }

    const labels = sampleData.samplesAddedTrend.months;
    const data = sampleData.samplesAddedTrend.data;

    return {
      labels,
      datasets: [
        {
          label: "Samples Added",
          data,
          borderColor: "#2a4d9b",
          backgroundColor: "rgba(42,77,155,0.1)",
          fill: true,
          tension: 0.3,
        },
      ],
    };
  }, [sampleData?.samplesAddedTrend]);

  const topSampleData = React.useMemo(() => {
    if (!sampleData?.topSamplesByQuantity || !Array.isArray(sampleData.topSamplesByQuantity)) {
      return {
        labels: ["No Samples"],
        datasets: [
          {
            label: "Quantity",
            data: [0],
            backgroundColor: ["#4e73df"],
          },
        ],
      };
    }

    const labels = sampleData.topSamplesByQuantity.map(item => item.name);
    const data = sampleData.topSamplesByQuantity.map(item => item.quantity);

    return {
      labels,
      datasets: [
        {
          label: "Quantity",
          data,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
            "#858796",
            "#ff6384",
            "#36a2eb",
            "#cc65fe",
            "#ffce56"
          ],
        },
      ],
    };
  }, [sampleData?.topSamplesByQuantity]);

  // Sample types distribution chart
  const sampleTypesData = React.useMemo(() => {
    if (!sampleData?.sampleTypesDistribution || !Array.isArray(sampleData.sampleTypesDistribution)) {
      return {
        labels: ["No Data"],
        datasets: [
          {
            label: "Count",
            data: [0],
            backgroundColor: ["#4e73df"],
          },
        ],
      };
    }

    const labels = sampleData.sampleTypesDistribution.map(item => item.type);
    const data = sampleData.sampleTypesDistribution.map(item => item.count);

    return {
      labels,
      datasets: [
        {
          label: "Count",
          data,
          backgroundColor: [
            "#4e73df",
            "#1cc88a",
            "#36b9cc",
            "#f6c23e",
            "#e74a3b",
          ],
        },
      ],
    };
  }, [sampleData?.sampleTypesDistribution]);

  // Usage stats data
  const usageStatsData = React.useMemo(() => {
    if (!sampleData?.usageStats) {
      return {
        labels: ["Used", "Unused", "Feedback Pending"],
        datasets: [
          {
            label: "Count",
            data: [0, 0, 0],
            backgroundColor: ["#1cc88a", "#f6c23e", "#e74a3b"],
          },
        ],
      };
    }

    const { used, unused, feedbackPending } = sampleData.usageStats;

    return {
      labels: ["Used", "Unused", "Feedback Pending"],
      datasets: [
        {
          label: "Count",
          data: [used, unused, feedbackPending],
          backgroundColor: ["#1cc88a", "#f6c23e", "#e74a3b"],
        },
      ],
    };
  }, [sampleData?.usageStats]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <>
      {/* Buttons - Always visible */}
      <div className="row m-0 p-3">
        <div className="col">
          {isAdmin && (
            <button
              className="homebtn"
              onClick={() => navigate("/samples/create")}
            >
              + Create Sample
            </button>
          )}
          <button
            className="homebtn"
            onClick={() => navigate("/samples/view")}
          >
            View Samples
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <Flex wrap="wrap" justify="space-between" px={4}>
        <ReusableCard 
          title="Total Samples" 
          value={sampleData?.summary?.totalSamples ?? "0"} 
        />
        <ReusableCard 
          title="Active Samples" 
          value={sampleData?.summary?.activeSamples ?? "0"} 
          color="green.500" 
        />
        <ReusableCard 
          title="Samples in Testing" 
          value={sampleData?.summary?.samplesInTesting ?? "0"} 
          color="blue.500" 
        />
        <ReusableCard 
          title="Expired Samples" 
          value={sampleData?.summary?.expiredSamples ?? "0"} 
          color="red.500" 
        />
      </Flex>

      {/* Usage Stats Cards */}
      {sampleData?.usageStats && (
        <Flex wrap="wrap" justify="space-between" px={4} mt={4}>
          <ReusableCard 
            title="Total Given" 
            value={sampleData.usageStats.totalGiven ?? "0"} 
            color="purple.500"
          />
          <ReusableCard 
            title="Used" 
            value={sampleData.usageStats.used ?? "0"} 
            color="green.500" 
          />
          <ReusableCard 
            title="Unused" 
            value={sampleData.usageStats.unused ?? "0"} 
            color="orange.500" 
          />
          <ReusableCard 
            title="Feedback Pending" 
            value={sampleData.usageStats.feedbackPending ?? "0"} 
            color="red.500" 
          />
        </Flex>
      )}

      {/* Charts */}
      <div className={styles["charts-grid"]}>
        {trendData && trendData.datasets && trendData.datasets[0] && trendData.datasets[0].data && trendData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="line"
            title="Samples Added Trend"
            data={trendData}
            options={{ responsive: true }}
          />
        )}
        {topSampleData && topSampleData.datasets && topSampleData.datasets[0] && topSampleData.datasets[0].data && topSampleData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="doughnut"
            title="Top Samples by Quantity"
            data={topSampleData}
            options={{ responsive: true }}
            legendPosition="left"
          />
        )}
        {sampleTypesData && sampleTypesData.datasets && sampleTypesData.datasets[0] && sampleTypesData.datasets[0].data && sampleTypesData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="pie"
            title="Sample Types Distribution"
            data={sampleTypesData}
            options={{ responsive: true }}
            legendPosition="left"
          />
        )}
        {usageStatsData && usageStatsData.datasets && usageStatsData.datasets[0] && usageStatsData.datasets[0].data && usageStatsData.datasets[0].data.length > 0 && (
          <ChartComponent
            type="bar"
            title="Usage Statistics"
            data={usageStatsData}
            options={{ responsive: true }}
          />
        )}
      </div>

      {/* Recent Activity Section */}
      {sampleData?.recentActivity && sampleData.recentActivity.length > 0 && (
        <div className="row m-0 p-3">
          <div className="col-12">
            <h5 className="mb-3">Recent Activity</h5>
            <div className="table-responsive">
              <table className="table table-striped table-bordered">
                <thead>
                  <tr>
                    <th>Sample Name</th>
                    <th>Type</th>
                    <th>Farmer</th>
                    <th>Given By</th>
                    <th>Quantity</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {sampleData.recentActivity.slice(0, 10).map((activity, index) => (
                    <tr key={activity.id || index}>
                      <td>{activity.sampleName}</td>
                      <td>
                        <span className={`badge ${activity.sampleType === 'product' ? 'bg-primary' : 'bg-success'}`}>
                          {activity.sampleType}
                        </span>
                      </td>
                      <td>{activity.farmerName}</td>
                      <td>{activity.givenBy}</td>
                      <td>{activity.quantity}</td>
                      <td>
                        <span className={`badge ${activity.usedStatus === 'used' ? 'bg-success' : 'bg-warning'}`}>
                          {activity.usedStatus}
                        </span>
                      </td>
                      <td>{new Date(activity.givenDate).toLocaleDateString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default SampleHome;

