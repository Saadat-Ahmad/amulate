import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  AlertTriangle, 
  Package, 
  TrendingUp, 
  TrendingDown,
  Clock,
  DollarSign,
  Truck,
  AlertCircle
} from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [alerts, setAlerts] = useState(null);
  const [inventory, setInventory] = useState(null);
  const [stockHealth, setStockHealth] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      const [alertsRes, inventoryRes, healthRes] = await Promise.all([
        axios.get('/api/alerts'),
        axios.get('/api/inventory-summary'),
        axios.get('/api/stock-health')
      ]);

      setAlerts(alertsRes.data);
      setInventory(inventoryRes.data);
      setStockHealth(healthRes.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="dashboard-loading">Loading dashboard...</div>;
  }

  const getSeverityColor = (severity) => {
    const colors = {
      critical: '#ef4444',
      high: '#f97316',
      medium: '#eab308',
      low: '#3b82f6'
    };
    return colors[severity] || '#6b7280';
  };

  const getHealthColor = (status) => {
    const colors = {
      HEALTHY: '#10b981',
      ADEQUATE: '#3b82f6',
      LOW: '#eab308',
      CRITICAL: '#f97316',
      OUT_OF_STOCK: '#ef4444'
    };
    return colors[status] || '#6b7280';
  };

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2>Operations Dashboard</h2>
        <button onClick={loadDashboardData} className="refresh-button">
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="summary-cards">
        <div className="summary-card">
          <div className="card-icon" style={{ background: '#dbeafe' }}>
            <Package size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="card-content">
            <p className="card-label">Total Materials</p>
            <p className="card-value">{inventory?.total_materials || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon" style={{ background: '#dcfce7' }}>
            <DollarSign size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="card-content">
            <p className="card-label">Inventory Value</p>
            <p className="card-value">
              ${inventory?.total_stock_value?.toLocaleString() || 0}
            </p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon" style={{ background: '#fee2e2' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div className="card-content">
            <p className="card-label">Critical Alerts</p>
            <p className="card-value">{alerts?.by_severity?.critical || 0}</p>
          </div>
        </div>

        <div className="summary-card">
          <div className="card-icon" style={{ background: '#fef3c7' }}>
            <TrendingDown size={24} style={{ color: '#eab308' }} />
          </div>
          <div className="card-content">
            <p className="card-label">Low Stock Items</p>
            <p className="card-value">{inventory?.low_stock_count || 0}</p>
          </div>
        </div>
      </div>

      {/* Alerts Section */}
      <div className="dashboard-section">
        <h3>
          <AlertCircle size={20} />
          Active Alerts ({alerts?.total_alerts || 0})
        </h3>
        <div className="alerts-list">
          {alerts?.alerts?.slice(0, 10).map((alert, index) => (
            <div 
              key={index} 
              className="alert-item"
              style={{ borderLeftColor: getSeverityColor(alert.severity) }}
            >
              <div className="alert-header">
                <span 
                  className="alert-severity"
                  style={{ background: getSeverityColor(alert.severity) }}
                >
                  {alert.severity.toUpperCase()}
                </span>
                <span className="alert-type">{alert.alert_type}</span>
              </div>
              <p className="alert-message">{alert.message}</p>
              <p className="alert-action">
                <strong>Action:</strong> {alert.action_required}
              </p>
            </div>
          ))}
          {alerts?.alerts?.length === 0 && (
            <p className="no-data">No active alerts - all systems operational! 🎉</p>
          )}
        </div>
      </div>

      {/* Stock Health */}
      <div className="dashboard-section">
        <h3>
          <Package size={20} />
          Stock Health Overview
        </h3>
        <div className="health-summary">
          {Object.entries(stockHealth?.by_status || {}).map(([status, count]) => (
            <div key={status} className="health-badge">
              <span 
                className="health-indicator"
                style={{ background: getHealthColor(status) }}
              />
              <span className="health-label">{status}</span>
              <span className="health-count">{count}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default Dashboard;