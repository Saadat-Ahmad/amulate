import React, { useState } from 'react';
import { ShoppingCart, Calendar, Truck, CheckCircle, Clock, XCircle, Plus } from 'lucide-react';
import toast from 'react-hot-toast';
import './Orders.css';

function Orders() {
  const [orders, setOrders] = useState([
    {
      id: 'PO-2025-001',
      supplier: 'TechParts Ltd.',
      items: 12,
      total: 45600,
      status: 'delivered',
      orderDate: '2025-01-15',
      deliveryDate: '2025-01-22'
    },
    {
      id: 'PO-2025-002',
      supplier: 'Global Components',
      items: 8,
      total: 32400,
      status: 'in_transit',
      orderDate: '2025-01-18',
      estimatedDelivery: '2025-02-05'
    },
    {
      id: 'PO-2025-003',
      supplier: 'ElectroSupply Co.',
      items: 15,
      total: 67890,
      status: 'pending',
      orderDate: '2025-01-20',
      estimatedDelivery: '2025-02-10'
    }
  ]);

  const [showNewOrderModal, setShowNewOrderModal] = useState(false);

  const getStatusInfo = (status) => {
    switch (status) {
      case 'delivered':
        return { label: 'Delivered', color: '#10b981', icon: CheckCircle };
      case 'in_transit':
        return { label: 'In Transit', color: '#3b82f6', icon: Truck };
      case 'pending':
        return { label: 'Pending', color: '#f59e0b', icon: Clock };
      case 'cancelled':
        return { label: 'Cancelled', color: '#ef4444', icon: XCircle };
      default:
        return { label: status, color: '#718096', icon: Clock };
    }
  };

  const handleViewDetails = (order) => {
    toast.success(`Viewing details for ${order.id}`);
    // Add modal or navigation logic here
  };

  const handleTrackOrder = (order) => {
    toast.success(`Tracking ${order.id}`);
    // Add tracking logic here
  };

  const handleNewOrder = () => {
    setShowNewOrderModal(true);
    toast.success('New order form opened');
  };

  return (
    <div className="orders-page">
      <div className="page-header">
        <h1>
          <ShoppingCart size={28} />
          Purchase Orders
        </h1>
        <button className="btn btn-primary" onClick={handleNewOrder}>
          <Plus size={20} />
          New Order
        </button>
      </div>

      <div className="orders-stats">
        <div className="stat-card-small">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <CheckCircle size={20} style={{ color: '#10b981' }} />
          </div>
          <div>
            <p>Delivered</p>
            <h3>{orders.filter(o => o.status === 'delivered').length}</h3>
          </div>
        </div>

        <div className="stat-card-small">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Truck size={20} style={{ color: '#3b82f6' }} />
          </div>
          <div>
            <p>In Transit</p>
            <h3>{orders.filter(o => o.status === 'in_transit').length}</h3>
          </div>
        </div>

        <div className="stat-card-small">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Clock size={20} style={{ color: '#f59e0b' }} />
          </div>
          <div>
            <p>Pending</p>
            <h3>{orders.filter(o => o.status === 'pending').length}</h3>
          </div>
        </div>
      </div>

      <div className="orders-list">
        {orders.map((order) => {
          const status = getStatusInfo(order.status);
          const StatusIcon = status.icon;

          return (
            <div key={order.id} className="order-card">
              <div className="order-header">
                <div>
                  <h3>{order.id}</h3>
                  <p className="supplier-name">{order.supplier}</p>
                </div>
                <span className="status-badge-lg" style={{ color: status.color }}>
                  <StatusIcon size={18} />
                  {status.label}
                </span>
              </div>

              <div className="order-details">
                <div className="detail-item">
                  <Calendar size={16} />
                  <span>Ordered: {order.orderDate}</span>
                </div>
                <div className="detail-item">
                  <Truck size={16} />
                  <span>
                    {order.deliveryDate ? `Delivered: ${order.deliveryDate}` : `ETA: ${order.estimatedDelivery}`}
                  </span>
                </div>
                <div className="detail-item">
                  <ShoppingCart size={16} />
                  <span>{order.items} items</span>
                </div>
              </div>

              <div className="order-footer">
                <div className="order-total">${order.total.toLocaleString()}</div>
                <div className="order-actions">
                  <button className="btn-secondary" onClick={() => handleViewDetails(order)}>
                    View Details
                  </button>
                  {order.status === 'in_transit' && (
                    <button className="btn btn-primary" onClick={() => handleTrackOrder(order)}>
                      Track Order
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Orders;