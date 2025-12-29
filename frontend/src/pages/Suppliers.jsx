import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Truck, Star, MapPin, Phone, Mail, Plus, TrendingUp } from 'lucide-react';
import toast from 'react-hot-toast';
import './Suppliers.css';

function Suppliers() {
  const [suppliers, setSuppliers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    avgRating: 0,
    onTimeDelivery: 0,
    qualityScore: 0
  });

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    try {
      // For now, we'll use mock data that matches backend expectations
      // In production, create a backend endpoint: GET /api/suppliers
      const mockSuppliers = [
        {
          id: 1,
          name: 'TechParts Ltd.',
          location: 'Shenzhen, China',
          phone: '+86 755 1234 5678',
          email: 'sales@techparts.com',
          rating: 4.8,
          totalOrders: 145,
          onTimeDelivery: 96,
          qualityScore: 98,
          categories: ['Electronics', 'Components'],
          status: 'active'
        },
        {
          id: 2,
          name: 'Global Components',
          location: 'Mumbai, India',
          phone: '+91 22 1234 5678',
          email: 'info@globalcomp.in',
          rating: 4.6,
          totalOrders: 98,
          onTimeDelivery: 94,
          qualityScore: 95,
          categories: ['Assembly', 'Parts'],
          status: 'active'
        },
        {
          id: 3,
          name: 'ElectroSupply Co.',
          location: 'Tokyo, Japan',
          phone: '+81 3 1234 5678',
          email: 'contact@electrosupply.jp',
          rating: 4.9,
          totalOrders: 203,
          onTimeDelivery: 98,
          qualityScore: 99,
          categories: ['Electronics', 'Service'],
          status: 'active'
        }
      ];

      setSuppliers(mockSuppliers);

      // Calculate stats
      const avgRating = mockSuppliers.reduce((acc, s) => acc + s.rating, 0) / mockSuppliers.length;
      const avgOnTime = mockSuppliers.reduce((acc, s) => acc + s.onTimeDelivery, 0) / mockSuppliers.length;
      const avgQuality = mockSuppliers.reduce((acc, s) => acc + s.qualityScore, 0) / mockSuppliers.length;

      setStats({
        total: mockSuppliers.length,
        avgRating: avgRating.toFixed(1),
        onTimeDelivery: Math.round(avgOnTime),
        qualityScore: Math.round(avgQuality)
      });

    } catch (error) {
      console.error('Error loading suppliers:', error);
      toast.error('Failed to load suppliers');
    } finally {
      setLoading(false);
    }
  };

  const handleViewProfile = (supplier) => {
    toast.success(`Viewing profile for ${supplier.name}`);
    // Add navigation or modal logic here
  };

  const handleNewOrder = (supplier) => {
    toast.success(`Creating new order with ${supplier.name}`);
    // Add order creation logic here
  };

  const handleAddSupplier = () => {
    toast.success('Add new supplier form opened');
    // Add modal or navigation logic here
  };

  if (loading) {
    return <div className="loading">Loading suppliers...</div>;
  }

  return (
    <div className="suppliers-page">
      <div className="page-header">
        <h1>
          <Truck size={28} />
          Suppliers
        </h1>
        <button className="btn btn-primary" onClick={handleAddSupplier}>
          <Plus size={20} />
          Add Supplier
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid-4">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dbeafe' }}>
            <Truck size={24} style={{ color: '#3b82f6' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Total Suppliers</p>
            <h3 className="stat-value">{stats.total}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fef3c7' }}>
            <Star size={24} style={{ color: '#f59e0b' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Avg Rating</p>
            <h3 className="stat-value">{stats.avgRating}</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#dcfce7' }}>
            <TrendingUp size={24} style={{ color: '#10b981' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">On-Time Delivery</p>
            <h3 className="stat-value">{stats.onTimeDelivery}%</h3>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#e0e7ff' }}>
            <Star size={24} style={{ color: '#667eea' }} />
          </div>
          <div className="stat-content">
            <p className="stat-label">Quality Score</p>
            <h3 className="stat-value">{stats.qualityScore}%</h3>
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
              <div className="supplier-info">
                <h3>{supplier.name}</h3>
                <div className="rating">
                  <Star size={16} fill="#f59e0b" color="#f59e0b" />
                  <span>{supplier.rating}</span>
                </div>
              </div>
            </div>

            <div className="supplier-contact">
              <div className="contact-item">
                <MapPin size={16} />
                <span>{supplier.location}</span>
              </div>
              <div className="contact-item">
                <Phone size={16} />
                <span>{supplier.phone}</span>
              </div>
              <div className="contact-item">
                <Mail size={16} />
                <span>{supplier.email}</span>
              </div>
            </div>

            <div className="supplier-metrics">
              <div className="metric">
                <span className="metric-value">{supplier.totalOrders}</span>
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
              <button className="btn-secondary" onClick={() => handleViewProfile(supplier)}>
                View Profile
              </button>
              <button className="btn btn-primary" onClick={() => handleNewOrder(supplier)}>
                New Order
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Suppliers;