import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, TrendingUp, DollarSign, Package, AlertTriangle } from 'lucide-react';
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import './Analytics.css';

function Analytics() {
  const [inventoryData, setInventoryData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadAnalytics();
  }, []);

  const loadAnalytics = async () => {
    try {
      const response = await axios.get('/api/inventory-summary');
      setInventoryData(response.data);
    } catch (error) {
      console.error('Error loading analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  // Prepare data for charts
  const getCategoryData = () => {
    if (!inventoryData?.materials) return [];
    
    const categories = {};
    inventoryData.materials.forEach(material => {
      if (!categories[material.category]) {
        categories[material.category] = {
          name: material.category,
          count: 0,
          value: 0
        };
      }
      categories[material.category].count++;
      categories[material.category].value += material.current_stock * material.unit_price;
    });
    
    return Object.values(categories);
  };

  const getStockStatusData = () => {
    if (!inventoryData?.materials) return [];
    
    let critical = 0;
    let low = 0;
    let good = 0;
    
    inventoryData.materials.forEach(material => {
      const stockPercent = (material.current_stock / material.reorder_point) * 100;
      if (stockPercent < 50) critical++;
      else if (stockPercent < 100) low++;
      else good++;
    });
    
    return [
      { name: 'Critical', value: critical, color: '#ef4444' },
      { name: 'Low Stock', value: low, color: '#f59e0b' },
      { name: 'Good Stock', value: good, color: '#10b981' }
    ];
  };

  const getTopValueParts = () => {
    if (!inventoryData?.materials) return [];
    
    return inventoryData.materials
      .map(m => ({
        name: m.part_id,
        value: m.current_stock * m.unit_price
      }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 10);
  };

  const getMonthlyTrend = () => {
    // Mock data - replace with real historical data
    return [
      { month: 'Jul', inventory: 85000, orders: 12 },
      { month: 'Aug', inventory: 92000, orders: 15 },
      { month: 'Sep', inventory: 88000, orders: 14 },
      { month: 'Oct', inventory: 95000, orders: 18 },
      { month: 'Nov', inventory: 103000, orders: 20 },
      { month: 'Dec', inventory: 110000, orders: 22 }
    ];
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const categoryData = getCategoryData();
  const stockStatusData = getStockStatusData();
  const topValueParts = getTopValueParts();
  const monthlyTrend = getMonthlyTrend();

  return (
    <div className="analytics-page">
      <div className="page-header">
        <h1>
          <BarChart3 size={28} />
          Analytics & Insights
        </h1>
        <button className="btn btn-primary" onClick={loadAnalytics}>
          Refresh Data
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Package size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total SKUs</p>
            <h3 className="stat-value">{inventoryData?.total_materials || 0}</h3>
            <span className="stat-trend positive">
              <TrendingUp size={14} />
              +12% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <DollarSign size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Inventory Value</p>
            <h3 className="stat-value">${inventoryData?.total_stock_value?.toLocaleString() || 0}</h3>
            <span className="stat-trend positive">
              <TrendingUp size={14} />
              +8% from last month
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Low Stock Items</p>
            <h3 className="stat-value">{inventoryData?.low_stock_count || 0}</h3>
            <span className="stat-trend negative">
              Needs attention
            </span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <BarChart3 size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Stock Level</p>
            <h3 className="stat-value">76%</h3>
            <span className="stat-trend">
              Healthy level
            </span>
          </div>
        </div>
      </div>

      {/* Charts Row 1 */}
      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="card chart-card">
          <h3>
            <BarChart3 size={20} />
            Inventory by Category
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={categoryData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="name" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Bar dataKey="count" fill="#667eea" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>
            <Package size={20} />
            Stock Status Distribution
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stockStatusData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
              >
                {stockStatusData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Charts Row 2 */}
      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="card chart-card">
          <h3>
            <TrendingUp size={20} />
            Inventory Trend (6 Months)
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={monthlyTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="month" stroke="#718096" />
              <YAxis stroke="#718096" />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
              />
              <Legend />
              <Line
                type="monotone"
                dataKey="inventory"
                stroke="#667eea"
                strokeWidth={3}
                dot={{ fill: '#667eea', r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="orders"
                stroke="#10b981"
                strokeWidth={3}
                dot={{ fill: '#10b981', r: 5 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="card chart-card">
          <h3>
            <DollarSign size={20} />
            Top 10 Parts by Value
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topValueParts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" stroke="#718096" />
              <YAxis type="category" dataKey="name" stroke="#718096" width={80} />
              <Tooltip
                contentStyle={{
                  background: 'white',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px'
                }}
                formatter={(value) => `$${value.toLocaleString()}`}
              />
              <Bar dataKey="value" fill="#10b981" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Insights Section */}
      <div className="card" style={{ marginTop: '2rem' }}>
        <h3>
          <AlertTriangle size={20} />
          Key Insights & Recommendations
        </h3>
        <div className="insights-list">
          <div className="insight-item warning">
            <AlertTriangle size={20} />
            <div>
              <strong>Low Stock Alert</strong>
              <p>{inventoryData?.low_stock_count || 0} parts are below reorder point. Consider placing orders soon.</p>
            </div>
          </div>
          <div className="insight-item success">
            <TrendingUp size={20} />
            <div>
              <strong>Inventory Growth</strong>
              <p>Total inventory value increased by 8% this month, showing healthy stock levels.</p>
            </div>
          </div>
          <div className="insight-item info">
            <Package size={20} />
            <div>
              <strong>Category Analysis</strong>
              <p>Assembly parts represent the largest category. Monitor closely for production demands.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Analytics;