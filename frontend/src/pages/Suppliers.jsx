import React, { useState } from 'react';
import { Truck, MapPin, Phone, Mail, Star, TrendingUp } from 'lucide-react';
import './Suppliers.css';

// Mock data
const mockSuppliers = [
  {
    id: 'SUP-001',
    name: 'TechParts Ltd.',
    location: 'Shenzhen, China',
    contact: '+86 755 1234 5678',
    email: 'sales@techparts.com',
    rating: 4.8,
    orders: 145,
    onTimeDelivery: 96,
    qualityScore: 98,
    categories: ['Electronics', 'Components']
  },
  {
    id: 'SUP-002',
    name: 'Global Components',
    location: 'Mumbai, India',
    contact: '+91 22 1234 5678',
    email: 'info@globalcomp.in',
    rating: 4.6,
    orders: 98,
    onTimeDelivery: 94,
    qualityScore: 95,
    categories: ['Assembly', 'Parts']
  },
  {
    id: 'SUP-003',
    name: 'ElectroSupply Co.',
    location: 'Tokyo, Japan',
    contact: '+81 3 1234 5678',
    email: 'contact@electrosupply.jp',
    rating: 4.9,
    orders: 203,
    onTimeDelivery: 98,
    qualityScore: 99,
    categories: ['Electronics', 'Service']
  }
];

function Suppliers() {
  const [suppliers] = useState(mockSuppliers);

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h1>
          <Truck size={28} />
          Suppliers
        </h1>
        <button className="btn btn-primary">Add Supplier</button>
      </div>

      {/* Stats */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Truck size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Suppliers</p>
            <h3 className="stat-value">{suppliers.length}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Star size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Rating</p>
            <h3 className="stat-value">
              {(suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length).toFixed(1)}
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <TrendingUp size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">On-Time Delivery</p>
            <h3 className="stat-value">
              {Math.round(suppliers.reduce((sum, s) => sum + s.onTimeDelivery, 0) / suppliers.length)}%
            </h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Star size={24} style={{ color: '#6366f1' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Quality Score</p>
            <h3 className="stat-value">
              {Math.round(suppliers.reduce((sum, s) => sum + s.qualityScore, 0) / suppliers.length)}%
            </h3>
          </div>
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="suppliers-grid">
        {suppliers.map((supplier) => (
          <div key={supplier.id} className="supplier-card">
            <div className="supplier-header">
              <div className="supplier-avatar">
                {supplier.name.charAt(0)}
              </div>
              <div className="supplier-title">
                <h3>{supplier.name}</h3>
                <div className="rating">
                  <Star size={16} fill="#f59e0b" stroke="#f59e0b" />
                  <span>{supplier.rating}</span>
                </div>
              </div>
            </div>

            <div className="supplier-info">
              <div className="info-item">
                <MapPin size={16} />
                <span>{supplier.location}</span>
              </div>
              <div className="info-item">
                <Phone size={16} />
                <span>{supplier.contact}</span>
              </div>
              <div className="info-item">
                <Mail size={16} />
                <span>{supplier.email}</span>
              </div>
            </div>

            <div className="supplier-metrics">
              <div className="metric">
                <span className="metric-value">{supplier.orders}</span>
                <span className="metric-label">Total Orders</span>
              </div>
              <div className="metric">
                <span className="metric-value">{supplier.onTimeDelivery}%</span>
                <span className="metric-label">On-Time</span>
              </div>
              <div className="metric">
                <span className="metric-value">{supplier.qualityScore}%</span>
                <span className="metric-label">Quality</span>
              </div>
            </div>

            <div className="supplier-categories">
              {supplier.categories.map((cat, idx) => (
                <span key={idx} className="category-tag">{cat}</span>
              ))}
            </div>

            <div className="supplier-actions">
              <button className="btn-sm">View Profile</button>
              <button className="btn-sm btn-primary">New Order</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Suppliers;