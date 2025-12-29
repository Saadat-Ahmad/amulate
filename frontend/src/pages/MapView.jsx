import React, { useState, useEffect } from 'react';
import { Map, MapPin, Truck, Package } from 'lucide-react';
import './MapView.css';

function MapView() {
  const [suppliers, setSuppliers] = useState([
    {
      id: 1,
      name: 'TechParts Ltd.',
      location: 'Shenzhen, China',
      lat: 22.5431,
      lng: 114.0579,
      status: 'active',
      orders: 145
    },
    {
      id: 2,
      name: 'Global Components',
      location: 'Mumbai, India',
      lat: 19.0760,
      lng: 72.8777,
      status: 'active',
      orders: 98
    },
    {
      id: 3,
      name: 'ElectroSupply Co.',
      location: 'Tokyo, Japan',
      lat: 35.6762,
      lng: 139.6503,
      status: 'active',
      orders: 203
    },
    {
      id: 4,
      name: 'EuroParts GmbH',
      location: 'Munich, Germany',
      lat: 48.1351,
      lng: 11.5820,
      status: 'pending',
      orders: 67
    },
    {
      id: 5,
      name: 'Americas Supply',
      location: 'San Francisco, USA',
      lat: 37.7749,
      lng: -122.4194,
      status: 'active',
      orders: 156
    }
  ]);

  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [shipments, setShipments] = useState([
    { from: 'Shenzhen', to: 'Mumbai', status: 'in_transit', eta: '2025-01-05' },
    { from: 'Tokyo', to: 'Mumbai', status: 'in_transit', eta: '2025-01-03' },
    { from: 'Munich', to: 'Mumbai', status: 'pending', eta: '2025-01-10' }
  ]);

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
            Active Suppliers
          </span>
          <span className="legend-item">
            <span className="legend-dot pending"></span>
            Pending Orders
          </span>
          <span className="legend-item">
            <span className="legend-dot transit"></span>
            In Transit
          </span>
        </div>
      </div>

      <div className="map-container-wrapper">
        <div className="map-view">
          {/* Simplified 2D Map - Replace with react-globe.gl for 3D */}
          <div className="map-placeholder">
            <div className="map-background">
              {/* Supplier markers */}
              {suppliers.map((supplier, index) => (
                <div
                  key={supplier.id}
                  className={`supplier-marker ${supplier.status}`}
                  style={{
                    left: `${20 + index * 15}%`,
                    top: `${30 + (index % 3) * 20}%`
                  }}
                  onClick={() => setSelectedSupplier(supplier)}
                >
                  <MapPin size={24} />
                  <span className="marker-label">{supplier.name}</span>
                </div>
              ))}

              {/* Shipment routes */}
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
                <line
                  x1="20%"
                  y1="30%"
                  x2="35%"
                  y2="50%"
                  stroke="#667eea"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                  className="route-line"
                />
                <line
                  x1="50%"
                  y1="30%"
                  x2="35%"
                  y2="50%"
                  stroke="#10b981"
                  strokeWidth="2"
                  strokeDasharray="5,5"
                  markerEnd="url(#arrowhead)"
                  className="route-line"
                />
              </svg>
            </div>

            <div className="map-info-overlay">
              <Package size={48} />
              <h3>Interactive Supply Chain Map</h3>
              <p>Track your suppliers and shipments in real-time</p>
              <small>For full 3D globe visualization, integrate react-globe.gl</small>
            </div>
          </div>
        </div>

        <div className="map-sidebar">
          {/* Supplier Details */}
          {selectedSupplier ? (
            <div className="supplier-details">
              <h3>Supplier Details</h3>
              <div className="detail-card">
                <h4>{selectedSupplier.name}</h4>
                <div className="detail-row">
                  <MapPin size={16} />
                  <span>{selectedSupplier.location}</span>
                </div>
                <div className="detail-row">
                  <Package size={16} />
                  <span>{selectedSupplier.orders} orders</span>
                </div>
                <div className="detail-row">
                  <Truck size={16} />
                  <span className={`status-badge ${selectedSupplier.status}`}>
                    {selectedSupplier.status}
                  </span>
                </div>
                <button className="btn btn-primary" style={{ marginTop: '1rem', width: '100%' }}>
                  View Full Profile
                </button>
              </div>
            </div>
          ) : (
            <div className="supplier-list">
              <h3>All Suppliers ({suppliers.length})</h3>
              {suppliers.map((supplier) => (
                <div
                  key={supplier.id}
                  className="supplier-item"
                  onClick={() => setSelectedSupplier(supplier)}
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
            {shipments.map((shipment, index) => (
              <div key={index} className="shipment-item">
                <div className="shipment-route">
                  <span>{shipment.from}</span>
                  <div className="route-arrow">→</div>
                  <span>{shipment.to}</span>
                </div>
                <div className="shipment-meta">
                  <span className={`status-badge ${shipment.status}`}>
                    {shipment.status.replace('_', ' ')}
                  </span>
                  <span className="eta">ETA: {shipment.eta}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export default MapView;