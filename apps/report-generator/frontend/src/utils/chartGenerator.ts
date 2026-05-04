/**
 * Chart generation utilities for IT/KPI reports
 * Supports: Pie charts, Line charts, Bar charts, Heatmaps, KPI cards
 */

export function generatePieChartData(labels, data, title) {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#4facfe', '#43e97b', 
    '#fa709a', '#feca57', '#ff9ff3', '#54a0ff', '#48dbfb'
  ];
  
  return {
    type: 'pie',
    title,
    labels,
    data,
    backgroundColor: colors.slice(0, labels.length),
    borderColor: '#fff',
    borderWidth: 2
  };
}

export function generateLineChartData(labels, datasets, title) {
  const colors = ['#667eea', '#764ba2', '#43e97b', '#fa709a', '#4facfe', '#feca57'];
  
  return {
    type: 'line',
    title,
    labels,
    datasets: datasets.map((dataset, idx) => ({
      label: dataset.label,
      data: dataset.data,
      borderColor: colors[idx % colors.length],
      backgroundColor: colors[idx % colors.length] + '20',
      borderWidth: 2,
      tension: 0.4,
      fill: false,
      pointRadius: 4,
      pointHoverRadius: 6
    }))
  };
}

export function generateBarChartData(labels, datasets, title) {
  const colors = ['#667eea', '#764ba2', '#43e97b', '#fa709a'];
  
  return {
    type: 'bar',
    title,
    labels,
    datasets: datasets.map((dataset, idx) => ({
      label: dataset.label,
      data: dataset.data,
      backgroundColor: colors[idx % colors.length],
      borderColor: colors[idx % colors.length],
      borderWidth: 1
    }))
  };
}

export function generateHeatmapData(measures, geos, data, title) {
  return {
    type: 'heatmap',
    title,
    measures,
    geos,
    data,
    colorScale: ['#86efac', '#fbbf24', '#fb7185'] // Green, Yellow, Red
  };
}

export function generateKPICard(title, value, unit = '', trend = null, trendDirection = 'up') {
  return {
    type: 'kpi',
    title,
    value,
    unit,
    trend,
    trendDirection
  };
}

export function createChartElement(chartData, containerId) {
  const container = document.getElementById(containerId);
  if (!container) return;

  if (chartData.type === 'heatmap') {
    createHeatmap(chartData, container);
  } else if (chartData.type === 'kpi') {
    createKPICard(chartData, container);
  } else {
    createCanvasChart(chartData, container);
  }
}

function createCanvasChart(chartData, container) {
  const canvas = document.createElement('canvas');
  container.appendChild(canvas);

  // Simple chart rendering (requires Chart.js library in HTML)
  if (typeof Chart === 'undefined') {
    container.innerHTML = '<p style="color: red;">Chart.js library not loaded</p>';
    return;
  }

  const ctx = canvas.getContext('2d');
  
  let chartConfig = {
    type: chartData.type,
    data: {
      labels: chartData.labels,
      datasets: chartData.datasets || [{
        data: chartData.data,
        backgroundColor: chartData.backgroundColor,
        borderColor: chartData.borderColor,
        borderWidth: chartData.borderWidth
      }]
    },
    options: {
      responsive: true,
      plugins: {
        title: { display: true, text: chartData.title },
        legend: { display: true, position: 'top' }
      },
      scales: chartData.type !== 'pie' ? {
        y: { beginAtZero: true }
      } : undefined
    }
  };

  new Chart(ctx, chartConfig);
}

function createHeatmap(heatmapData, container) {
  const table = document.createElement('table');
  table.style.cssText = 'width: 100%; border-collapse: collapse; margin-top: 20px;';

  // Header
  const headerRow = document.createElement('tr');
  const headerCell = document.createElement('th');
  headerCell.textContent = 'SLA';
  headerCell.style.cssText = 'background: #333; color: white; padding: 10px; text-align: left;';
  headerRow.appendChild(headerCell);

  heatmapData.geos.forEach(geo => {
    const cell = document.createElement('th');
    cell.textContent = geo;
    cell.style.cssText = 'background: #333; color: white; padding: 10px; text-align: center;';
    headerRow.appendChild(cell);
  });
  table.appendChild(headerRow);

  // Data rows
  heatmapData.measures.forEach((measure, idx) => {
    const row = document.createElement('tr');
    const labelCell = document.createElement('td');
    labelCell.textContent = measure;
    labelCell.style.cssText = 'background: #f5f5f5; padding: 10px; font-weight: bold;';
    row.appendChild(labelCell);

    heatmapData.geos.forEach((_, geoIdx) => {
      const cell = document.createElement('td');
      const value = heatmapData.data[idx]?.[geoIdx] || 0;
      
      // Color coding: green (100), yellow (50-99), red (<50)
      let bgColor = '#86efac'; // Green
      if (value < 100 && value >= 50) bgColor = '#fbbf24'; // Yellow
      if (value < 50) bgColor = '#fb7185'; // Red

      cell.textContent = value;
      cell.style.cssText = `background: ${bgColor}; padding: 10px; text-align: center; color: white; font-weight: bold;`;
      row.appendChild(cell);
    });
    table.appendChild(row);
  });

  container.appendChild(table);
}

function createKPICard(kpiData, container) {
  const card = document.createElement('div');
  card.style.cssText = `
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 20px;
    border-radius: 8px;
    margin: 10px;
    text-align: center;
    display: inline-block;
    min-width: 200px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.2);
  `;

  const titleEl = document.createElement('div');
  titleEl.style.cssText = 'font-size: 12px; opacity: 0.9; margin-bottom: 10px;';
  titleEl.textContent = kpiData.title;

  const valueEl = document.createElement('div');
  valueEl.style.cssText = 'font-size: 32px; font-weight: bold; margin-bottom: 10px;';
  valueEl.textContent = `${kpiData.value} ${kpiData.unit}`;

  const trendEl = document.createElement('div');
  if (kpiData.trend) {
    const arrow = kpiData.trendDirection === 'up' ? '↑' : '↓';
    const color = kpiData.trendDirection === 'up' ? '#86efac' : '#fb7185';
    trendEl.style.cssText = `font-size: 14px; color: ${color};`;
    trendEl.textContent = `${arrow} ${kpiData.trend}`;
  }

  card.appendChild(titleEl);
  card.appendChild(valueEl);
  if (kpiData.trend) card.appendChild(trendEl);

  container.appendChild(card);
}

export function exportChartAsImage(containerId, filename) {
  const canvas = document.querySelector(`#${containerId} canvas`);
  if (!canvas) {
    console.error('Canvas not found');
    return;
  }

  const link = document.createElement('a');
  link.href = canvas.toDataURL('image/png');
  link.download = filename;
  link.click();
}

export function createPowerPointFromCharts(chartElements, title = 'Report') {
  // This would integrate with pptxgenjs to create PowerPoint slides
  // Each chart element would become a slide
  console.log('PowerPoint generation requires pptxgenjs library');
}
