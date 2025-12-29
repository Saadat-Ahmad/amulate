import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, Filter, Package, AlertTriangle, TrendingUp, TrendingDown } from 'lucide-react';
import './Parts.css';

function Parts() {
  const [parts, setParts] = useState([]);
  const [filteredParts, setFilteredParts] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadParts();
  }, []);

  useEffect(() => {
    filterParts();
  }, [searchTerm, filterStatus, parts]);

  const loadParts = async () => {
    try {
      const response = await axios.get('/api/inventory-summary');
      setParts(response.data.materials || []);
    } catch (error) {
      console.error('Error loading parts:', error);
    } finally {
      setLoading(false);
    }
  };

  const filterParts = () => {
    let filtered = parts;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(part =>
        part.part_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        part.part_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (filterStatus !== 'all') {
      filtered = filtered.filter(part => {
        const stockPercent = (part.current_stock / part.reorder_point) * 100;
        if (filterStatus === 'critical' && stockPercent < 50) return true;
        if (filterStatus === 'low' && stockPercent >= 50 && stockPercent < 100) return true;
        if (filterStatus === 'good' && stockPercent >= 100) return true;
        return false;
      });
    }

    setFilteredParts(filtered);
  };

  const getStockStatus = (part) => {
    const stockPercent = (part.current_stock / part.reorder_point) * 100;
    if (stockPercent < 50) return { label: 'Critical', color: '#ef4444', class: 'critical' };
    if (stockPercent < 100) return { label: 'Low Stock', color: '#f59e0b', class: 'low' };
    return { label: 'Good Stock', color: '#10b981', class: 'good' };
  };

  if (loading) {
    return <div className="loading">Loading parts inventory...</div>;
  }

  return (
    <div className="parts-page">
      <div className="page-header">
        <h1>
          <Package size={28} />
          Parts Inventory
        </h1>
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-box">
          <Search size={20} />
          <input
            type="text"
            placeholder="Search parts by ID or name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-buttons">
          <button
            className={`filter-btn ${filterStatus === 'all' ? 'active' : ''}`}
            onClick={() => setFilterStatus('all')}
          >
            All ({parts.length})
          </button>
          <button
            className={`filter-btn critical ${filterStatus === 'critical' ? 'active' : ''}`}
            onClick={() => setFilterStatus('critical')}
          >
            Critical ({parts.filter(p => (p.current_stock / p.reorder_point) * 100 < 50).length})
          </button>
          <button
            className={`filter-btn low ${filterStatus === 'low' ? 'active' : ''}`}
            onClick={() => setFilterStatus('low')}
          >
            Low Stock ({parts.filter(p => {
              const pct = (p.current_stock / p.reorder_point) * 100;
              return pct >= 50 && pct < 100;
            }).length})
          </button>
          <button
            className={`filter-btn good ${filterStatus === 'good' ? 'active' : ''}`}
            onClick={() => setFilterStatus('good')}
          >
            Good Stock ({parts.filter(p => (p.current_stock / p.reorder_point) * 100 >= 100).length})
          </button>
        </div>
      </div>

      {/* Parts Table */}
      <div className="parts-table-container">
        <table className="parts-table">
          <thead>
            <tr>
              <th>Part ID</th>
              <th>Part Name</th>
              <th>Category</th>
              <th>Current Stock</th>
              <th>Reorder Point</th>
              <th>Unit Price</th>
              <th>Total Value</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {filteredParts.map((part) => {
              const status = getStockStatus(part);
              const stockPercent = Math.min((part.current_stock / part.reorder_point) * 100, 100);

              return (
                <tr key={part.part_id} className={status.class}>
                  <td className="part-id">{part.part_id}</td>
                  <td className="part-name">{part.part_name}</td>
                  <td>
                    <span className="category-badge">{part.category}</span>
                  </td>
                  <td>
                    <div className="stock-cell">
                      <strong>{part.current_stock}</strong>
                      <div className="stock-bar">
                        <div
                          className="stock-fill"
                          style={{
                            width: `${stockPercent}%`,
                            background: status.color
                          }}
                        />
                      </div>
                    </div>
                  </td>
                  <td>{part.reorder_point}</td>
                  <td>${part.unit_price.toFixed(2)}</td>
                  <td className="value-cell">
                    ${(part.current_stock * part.unit_price).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </td>
                  <td>
                    <span className={`status-badge ${status.class}`}>
                      {status.label}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredParts.length === 0 && (
          <div className="no-results">
            <Package size={48} />
            <p>No parts found matching your criteria</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default Parts;