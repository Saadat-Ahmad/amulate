import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  TrendingDown,
  Truck,
  CheckCircle
} from 'lucide-react';
import './Dashboard.css';

function Dashboard() {
  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDashboard();
  }, []);

  const loadDashboard = async () => {
    try {
      const [inventoryRes, alertsRes] = await Promise.all([
        axios.get('/api/inventory-summary'),
        axios.get('/api/alerts')
      ]);

      setStats(inventoryRes.data);
      setAlerts(alertsRes.data.alerts || []);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <button className="btn btn-primary" onClick={loadDashboard}>
          Refresh Data
        </button>
      </div>

      {/* Summary Cards */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Package size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Parts</p>
            <h3 className="stat-value">{stats?.total_materials || 0}</h3>
            <span className="stat-trend positive">+12% from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <DollarSign size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Inventory Value</p>
            <h3 className="stat-value">${stats?.total_stock_value?.toLocaleString() || 0}</h3>
            <span className="stat-trend positive">+18% from last month</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fee2e2' }}>
            <AlertTriangle size={24} style={{ color: '#ef4444' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Critical Alerts</p>
            <h3 className="stat-value">{alerts.filter(a => a.severity === 'critical').length}</h3>
            <span className="stat-trend negative">+3 from last week</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <TrendingDown size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Low Stock Items</p>
            <h3 className="stat-value">{stats?.low_stock_count || 0}</h3>
            <span className="stat-trend">0% from last month</span>
          </div>
        </div>
      </div>

      {/* Inventory Alerts & Status */}
      <div className="grid-2" style={{ marginTop: '2rem' }}>
        <div className="card">
          <div className="card-header">
            <h3>
              <AlertTriangle size={20} />
              Inventory Alerts
            </h3>
            <button className="btn-sm btn-primary">Get AI Analysis</button>
          </div>

          <div className="alerts-list">
            {alerts.slice(0, 5).map((alert, index) => (
              <div key={index} className="alert-item" data-severity={alert.severity}>
                <div className="alert-icon">
                  <AlertTriangle size={16} />
                </div>
                <div className="alert-content">
                  <strong>{alert.message}</strong>
                  <p>{alert.action_required}</p>
                </div>
                <button className="btn-sm">Order now →</button>
              </div>
            ))}
          </div>
        </div>

        <div className="card">
          <h3>
            <CheckCircle size={20} />
            Inventory Status
          </h3>

          <div className="status-bars">
            <div className="status-item">
              <div className="status-header">
                <span>Assembly</span>
                <span className="status-value">74% Healthy</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '74%', background: '#10b981' }} />
              </div>
            </div>

            <div className="status-item">
              <div className="status-header">
                <span>Service</span>
                <span className="status-value">100% Healthy</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '100%', background: '#10b981' }} />
              </div>
            </div>

            <div className="status-item">
              <div className="status-header">
                <span>Component</span>
                <span className="status-value">100% Healthy</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '100%', background: '#10b981' }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Dashboard;