import React, { useState } from 'react';
import { ShoppingCart, Plus, Calendar, Package, DollarSign, Truck } from 'lucide-react';
import './Orders.css';

// Mock data - replace with API calls
const mockOrders = [
  {
    id: 'PO-2024-001',
    supplier: 'TechParts Ltd.',
    date: '2024-12-28',
    status: 'delivered',
    items: 5,
    total: 12500,
    deliveryDate: '2024-12-30'
  },
  {
    id: 'PO-2024-002',
    supplier: 'Global Components',
    date: '2024-12-27',
    status: 'in_transit',
    items: 3,
    total: 8750,
    deliveryDate: '2025-01-02'
  },
  {
    id: 'PO-2024-003',
    supplier: 'ElectroSupply Co.',
    date: '2024-12-26',
    status: 'pending',
    items: 7,
    total: 15300,
    deliveryDate: '2025-01-05'
  }
];

function Orders() {
  const [orders] = useState(mockOrders);
  const [filterStatus, setFilterStatus] = useState('all');

  const getStatusInfo = (status) => {
    const statuses = {
      pending: { label: 'Pending', color: '#f59e0b', bg: '#fef3c7' },
      in_transit: { label: 'In Transit', color: '#3b82f6', bg: '#dbeafe' },
      delivered: { label: 'Delivered', color: '#10b981', bg: '#d1fae5' },
      cancelled: { label: 'Cancelled', color: '#ef4444', bg: '#fee2e2' }
    };
    return statuses[status] || statuses.pending;
  };

  const filteredOrders = filterStatus === 'all'
    ? orders
    : orders.filter(o => o.status === filterStatus);

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>
          <ShoppingCart size={28} />
          Purchase Orders
        </h1>
        <button className="btn btn-primary">
          <Plus size={20} />
          New Order
        </button>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <ShoppingCart size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Orders</p>
            <h3 className="stat-value">{orders.length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Package size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Pending</p>
            <h3 className="stat-value">{orders.filter(o => o.status === 'pending').length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Truck size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">In Transit</p>
            <h3 className="stat-value">{orders.filter(o => o.status === 'in_transit').length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <DollarSign size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Value</p>
            <h3 className="stat-value">${orders.reduce((sum, o) => sum + o.total, 0).toLocaleString()}</h3>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="orders-filters">
        <button
          className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
          onClick={() => setFilterStatus('all')}
        >
          All Orders
        </button>
        <button
          className={`filter-btn ${filterStatus === 'pending' ? 'active' : ''}`}
          onClick={() => setFilterStatus('pending')}
        >
          Pending
        </button>
        <button
          className={`filter-btn ${filterStatus === 'in_transit' ? 'active' : ''}`}
          onClick={() => setFilterStatus('in_transit')}
        >
          In Transit
        </button>
        <button
          className={`filter-btn ${filterStatus === 'delivered' ? 'active' : ''}`}
          onClick={() => setFilterStatus('delivered')}
        >
          Delivered
        </button>
      </div>

      {/* Orders List */}
      <div className="orders-list">
        {filteredOrders.map((order) => {
          const status = getStatusInfo(order.status);
          
          return (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>{order.id}</h3>
                  <p className="supplier-name">{order.supplier}</p>
                </div>
                <span
                  className="status-badge"
                  style={{ background: status.bg, color: status.color }}
                >
                  {status.label}
                </span>
              </div>

              <div className="order-details">
                <div className="detail-item">
                  <Calendar size={16} />
                  <div>
                    <span className="detail-label">Order Date</span>
                    <span className="detail-value">{new Date(order.date).toLocaleDateString()}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <Package size={16} />
                  <div>
                    <span className="detail-label">Items</span>
                    <span className="detail-value">{order.items} parts</span>
                  </div>
                </div>

                <div className="detail-item">
                  <DollarSign size={16} />
                  <div>
                    <span className="detail-label">Total</span>
                    <span className="detail-value">${order.total.toLocaleString()}</span>
                  </div>
                </div>

                <div className="detail-item">
                  <Truck size={16} />
                  <div>
                    <span className="detail-label">Delivery</span>
                    <span className="detail-value">{new Date(order.deliveryDate).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>

              <div className="order-actions">
                <button className="btn-sm">View Details</button>
                <button className="btn-sm btn-primary">Track Order</button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;