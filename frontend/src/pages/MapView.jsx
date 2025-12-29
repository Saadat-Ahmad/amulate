import React, { useState, useEffect } from 'react';
import { Map, MapPin, Truck, Package, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';
import './MapView.css';

function MapView() {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: 'TechParts Ltd.',
      location: 'Shenzhen, China',
      orders: 145,
      status: 'active',
      position: { left: '75%', top: '45%' }
    },
    {
      id: 2,
      name: 'Global Components',
      location: 'Mumbai, India',
      orders: 98,
      status: 'active',
      position: { left: '68%', top: '52%' }
    },
    {
      id: 3,
      name: 'ElectroSupply Co.',
      location: 'Tokyo, Japan',
      orders: 203,
      status: 'active',
      position: { left: '85%', top: '42%' }
    }
  ]);

  const [selectedSupplier, setSelectedSupplier] = useState(null);

  const [shipments, setShipments] = useState([
    { 
      id: 1,
      from: 'Shenzhen',
      to: 'Mumbai',
      status: 'in_transit',
      eta: '2025-01-05',
      items: 45
    },
    {
      id: 2,
      from: 'Tokyo',
      to: 'Mumbai',
      status: 'in_transit',
      eta: '2025-01-03',
      items: 32
    },
    {
      id: 3,
      from: 'Shenzhen',
      to: 'Delhi',
      status: 'pending',
      eta: '2025-01-10',
      items: 28
    }
  ]);

  const handleSupplierClick = (supplier) => {
    setSelectedSupplier(supplier);
    toast.success(`Selected ${supplier.name}`);
  };

  const handleTrackShipment = (shipment) => {
    toast.success(`Tracking shipment from ${shipment.from} to ${shipment.to}`);
  };

  const handleViewFullProfile = () => {
    if (selectedSupplier) {
      toast.success(`Opening full profile for ${selectedSupplier.name}`);
      // Navigate to supplier detail page
    }
  };

  return (
    <div className="map-page">
      <div className="page-header">
        <h1>
          <Map size={28} />
          Global Supply Chain Map
        </h1>
        <div className="map-legend">
          <span className="legend-item">
            <span className="legend-dot active"></span>
            Active Suppliers ({suppliers.length})
          </span>
          <span className="legend-item">
            <span className="legend-dot transit"></span>
            In Transit ({shipments.filter(s => s.status === 'in_transit').length})
          </span>
          <span className="legend-item">
            <span className="legend-dot pending"></span>
            Pending ({shipments.filter(s => s.status === 'pending').length})
          </span>
        </div>
      </div>

      <div className="map-container-wrapper">
        <div className="map-view">
          <div className="map-canvas">
            {/* World Map Background */}
            <div className="world-map">
              {/* Supplier Markers */}
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className={`supplier-marker ${supplier.status} ${selectedSupplier?.id === supplier.id ? 'selected' : ''}`}
                  style={supplier.position}
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <div className="marker-pulse"></div>
                  <MapPin size={28} />
                  <div className="marker-tooltip">
                    <strong>{supplier.name}</strong>
                    <span>{supplier.location}</span>
                    <span className="orders-badge">{supplier.orders} orders</span>
                  </div>
                </div>
              ))}

              {/* Shipment Routes */}
              <svg className="routes-svg">
                <defs>
                  <marker
                    id="arrowhead"
                    markerWidth="10"
                    markerHeight="10"
                    refX="9"
                    refY="3"
                    orient="auto"
                  >
                    <polygon points="0 0, 10 3, 0 6" fill="#667eea" />
                  </marker>
                </defs>
                
                {/* Route 1: Shenzhen to Mumbai */}
                <path
                  d="M 75% 45% Q 70% 48% 68% 52%"
                  stroke="#667eea"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10,5"
                  markerEnd="url(#arrowhead)"
                  className="route-line animated"
                />
                
                {/* Route 2: Tokyo to Mumbai */}
                <path
                  d="M 85% 42% Q 75% 47% 68% 52%"
                  stroke="#10b981"
                  strokeWidth="3"
                  fill="none"
                  strokeDasharray="10,5"
                  markerEnd="url(#arrowhead)"
                  className="route-line animated"
                />
              </svg>

              {/* Hub Location (Your warehouse) */}
              <div className="hub-marker" style={{ left: '68%', top: '52%' }}>
                <div className="hub-pulse"></div>
                <Package size={32} />
                <div className="hub-label">Your Warehouse<br/>Mumbai, India</div>
              </div>
            </div>
          </div>
        </div>

        <div className="map-sidebar">
          {/* Supplier Details or List */}
          {selectedSupplier ? (
            <div className="supplier-details">
              <div className="details-header">
                <h3>Supplier Details</h3>
                <button className="close-btn" onClick={() => setSelectedSupplier(null)}>×</button>
              </div>
              
              <div className="detail-card">
                <div className="detail-avatar">
                  {selectedSupplier.name.charAt(0)}
                </div>
                <h4>{selectedSupplier.name}</h4>
                
                <div className="detail-row">
                  <MapPin size={16} />
                  <span>{selectedSupplier.location}</span>
                </div>
                <div className="detail-row">
                  <Package size={16} />
                  <span>{selectedSupplier.orders} total orders</span>
                </div>
                <div className="detail-row">
                  <Truck size={16} />
                  <span className={`status-badge ${selectedSupplier.status}`}>
                    {selectedSupplier.status}
                  </span>
                </div>
                
                <div className="detail-actions">
                  <button className="btn btn-primary full-width" onClick={handleViewFullProfile}>
                    View Full Profile
                  </button>
                  <button className="btn-secondary full-width">
                    Create New Order
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="supplier-list">
              <h3>All Suppliers ({suppliers.length})</h3>
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="supplier-item"
                  onClick={() => handleSupplierClick(supplier)}
                >
                  <div className={`status-dot ${supplier.status}`}></div>
                  <div className="supplier-item-info">
                    <strong>{supplier.name}</strong>
                    <span>{supplier.location}</span>
                  </div>
                  <span className="order-count">{supplier.orders}</span>
                </div>
              ))}
            </div>
          )}

          {/* Active Shipments */}
          <div className="shipments-section">
            <h3>
              <Truck size={20} />
              Active Shipments ({shipments.length})
            </h3>
            {shipments.map((shipment) => (
              <div key={shipment.id} className="shipment-item">
                <div className="shipment-route">
                  <span>{shipment.from}</span>
                  <Navigation size={14} className="route-arrow" />
                  <span>{shipment.to}</span>
                </div>
                <div className="shipment-details">
                  <span className="items-count">{shipment.items} items</span>
                </div>
                <div className="shipment-meta">
                  <span className={`status-badge ${shipment.status}`}>
                    {shipment.status.replace('_', ' ')}
                  </span>
                  <span className="eta">ETA: {shipment.eta}</span>
                </div>
                <button 
                  className="track-btn"
                  onClick={() => handleTrackShipment(shipment)}
                >
                  Track →
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;