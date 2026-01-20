import React, { useRef, useEffect } from "react";
import styles from "./HomePage.module.css";
import { 
  FaChartBar, 
  FaChartLine, 
  FaChartPie, 
  FaPlus,
  FaMinus
} from "react-icons/fa";

function ProductBarchart({ topPerformingBOs }) {
  const canvasRef = useRef(null);
  const [chartType, setChartType] = React.useState('bar');

  // Mock data for demonstration - replace with actual data
  const mockData = {
    salesTrend: [12, 19, 3, 5, 2, 3, 15, 8, 12, 15, 18, 22],
    productPerformance: [
      { name: 'Curd', value: 120, color: '#3B82F6' },
      { name: 'Butter', value: 280, color: '#F59E0B' },
      { name: 'Milk Powder', value: 150, color: '#10B981' },
      { name: 'Ghee', value: 80, color: '#8B5CF6' },
      { name: 'Butter Milk', value: 200, color: '#06B6D4' }
    ],
    monthlyRevenue: [45000, 52000, 48000, 61000, 58000, 72000, 68000, 75000, 82000, 78000, 85000, 92000]
  };

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  useEffect(() => {
    if (!canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    if (chartType === 'bar') {
      drawBarChart(ctx, mockData.monthlyRevenue, months);
    } else if (chartType === 'line') {
      drawLineChart(ctx, mockData.monthlyRevenue, months);
    } else if (chartType === 'pie') {
      drawPieChart(ctx, mockData.productPerformance);
    }
  }, [chartType, topPerformingBOs]);

  const drawBarChart = (ctx, data, labels) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data);
    const barWidth = chartWidth / data.length;
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw bars
    data.forEach((value, index) => {
      const barHeight = (value / maxValue) * chartHeight;
      const x = padding + index * barWidth + barWidth * 0.1;
      const y = height - padding - barHeight;
      
      // Create gradient
      const gradient = ctx.createLinearGradient(0, y, 0, height - padding);
      gradient.addColorStop(0, '#3B82F6');
      gradient.addColorStop(1, '#1D4ED8');
      
      ctx.fillStyle = gradient;
      ctx.fillRect(x, y, barWidth * 0.8, barHeight);
      
      // Draw value on top of bar
      ctx.fillStyle = '#374151';
      ctx.font = '12px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${(value/1000).toFixed(0)}K`, x + barWidth * 0.4, y - 5);
      
      // Draw month label
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px Poppins';
      ctx.fillText(labels[index], x + barWidth * 0.4, height - padding + 20);
    });
  };

  const drawLineChart = (ctx, data, labels) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const padding = 40;
    const chartWidth = width - 2 * padding;
    const chartHeight = height - 2 * padding;
    
    const maxValue = Math.max(...data);
    
    // Draw grid lines
    ctx.strokeStyle = '#E5E7EB';
    ctx.lineWidth = 1;
    for (let i = 0; i <= 5; i++) {
      const y = padding + (i * chartHeight / 5);
      ctx.beginPath();
      ctx.moveTo(padding, y);
      ctx.lineTo(width - padding, y);
      ctx.stroke();
    }
    
    // Draw line
    ctx.strokeStyle = '#3B82F6';
    ctx.lineWidth = 3;
    ctx.beginPath();
    
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      if (index === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    });
    
    ctx.stroke();
    
    // Draw data points
    data.forEach((value, index) => {
      const x = padding + (index / (data.length - 1)) * chartWidth;
      const y = height - padding - (value / maxValue) * chartHeight;
      
      ctx.fillStyle = '#3B82F6';
      ctx.beginPath();
      ctx.arc(x, y, 4, 0, 2 * Math.PI);
      ctx.fill();
      
      // Draw value
      ctx.fillStyle = '#374151';
      ctx.font = '12px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(`₹${(value/1000).toFixed(0)}K`, x, y - 10);
      
      // Draw month label
      ctx.fillStyle = '#6B7280';
      ctx.font = '11px Poppins';
      ctx.fillText(labels[index], x, height - padding + 20);
    });
  };

  const drawPieChart = (ctx, data) => {
    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const radius = Math.min(width, height) / 3;
    
    const total = data.reduce((sum, item) => sum + item.value, 0);
    let currentAngle = -Math.PI / 2;
    
    data.forEach((item, index) => {
      const sliceAngle = (item.value / total) * 2 * Math.PI;
      
      // Draw slice
      ctx.fillStyle = item.color;
      ctx.beginPath();
      ctx.moveTo(centerX, centerY);
      ctx.arc(centerX, centerY, radius, currentAngle, currentAngle + sliceAngle);
      ctx.closePath();
      ctx.fill();
      
      // Draw label
      const labelAngle = currentAngle + sliceAngle / 2;
      const labelRadius = radius * 1.2;
      const labelX = centerX + Math.cos(labelAngle) * labelRadius;
      const labelY = centerY + Math.sin(labelAngle) * labelRadius;
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Poppins';
      ctx.textAlign = 'center';
      ctx.fillText(item.name, labelX, labelY);
      
      currentAngle += sliceAngle;
    });
  };

  const getGrowthRate = () => {
    const data = mockData.monthlyRevenue;
    const currentMonth = data[data.length - 1];
    const previousMonth = data[data.length - 2];
    const growth = ((currentMonth - previousMonth) / previousMonth) * 100;
    return growth;
  };

  const growthRate = getGrowthRate();

  return (
    <div className={styles.enhancedChartCard}>
      <div className={styles.chartHeader}>
        <div className={styles.chartTitle}>
          <h4>Business Analytics</h4>
          <div className={styles.growthInfo}>
            <span className={styles.growthLabel}>Monthly Growth</span>
            <span className={`${styles.growthValue} ${growthRate >= 0 ? styles.positive : styles.negative}`}>
              {growthRate >= 0 ? <FaPlus /> : <FaMinus />}
              {Math.abs(growthRate).toFixed(1)}%
            </span>
          </div>
        </div>
        <div className={styles.chartControls}>
          <button 
            className={`${styles.chartButton} ${chartType === 'bar' ? styles.active : ''}`}
            onClick={() => setChartType('bar')}
          >
            <FaChartBar />
            Bar
          </button>
          <button 
            className={`${styles.chartButton} ${chartType === 'line' ? styles.active : ''}`}
            onClick={() => setChartType('line')}
          >
            <FaChartLine />
            Line
          </button>
          <button 
            className={`${styles.chartButton} ${chartType === 'pie' ? styles.active : ''}`}
            onClick={() => setChartType('pie')}
          >
            <FaChartPie />
            Pie
          </button>
        </div>
      </div>
      
      <div className={styles.chartContainer}>
        <canvas 
          ref={canvasRef} 
          width={600} 
          height={400}
          className={styles.chartCanvas}
        />
      </div>
      
      <div className={styles.chartLegend}>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#3B82F6' }}></div>
          <span>Revenue</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#10B981' }}></div>
          <span>Growth</span>
        </div>
        <div className={styles.legendItem}>
          <div className={styles.legendColor} style={{ backgroundColor: '#F59E0B' }}></div>
          <span>Target</span>
        </div>
      </div>
    </div>
  );
}

export default ProductBarchart;
