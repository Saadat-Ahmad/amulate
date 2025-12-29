import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Package, AlertTriangle, CheckCircle, ChevronDown, ChevronUp } from 'lucide-react';
import './Products.css';

function Products() {
  const [products, setProducts] = useState([]);
  const [expandedProduct, setExpandedProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      // Load build capacity for all models
      const models = ['S1_V1', 'S1_V2', 'S2_V1', 'S2_V2', 'S3_V1', 'S3_V2'];
      const capacities = await Promise.all(
        models.map(model =>
          axios.post('/api/build-capacity', { scooter_model: model })
            .then(res => ({ model, ...res.data }))
            .catch(() => ({ model, max_units: 0, error: true }))
        )
      );
      
      setProducts(capacities);
    } catch (error) {
      console.error('Error loading products:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (model) => {
    setExpandedProduct(expandedProduct === model ? null : model);
  };

  const getStatusInfo = (maxUnits) => {
    if (maxUnits === 0) return { label: 'Critical', color: '#ef4444', icon: AlertTriangle };
    if (maxUnits < 10) return { label: 'Low Stock', color: '#f59e0b', icon: AlertTriangle };
    return { label: 'In Stock', color: '#10b981', icon: CheckCircle };
  };

  if (loading) {
    return <div className="loading">Loading products...</div>;
  }

  return (
    <div className="products-page">
      <div className="page-header">
        <h1>
          <Package size={28} />
          Scooter Models
        </h1>
      </div>

      <div className="products-grid">
        {products.map((product) => {
          const status = getStatusInfo(product.max_units);
          const StatusIcon = status.icon;
          const isExpanded = expandedProduct === product.model;

          return (
            <div key={product.model} className="product-card">
              <div className="product-header">
                <div className="product-title">
                  <h3>{product.model}</h3>
                  <span className="model-id">Model ID: {product.model}</span>
                </div>
                <div className="product-status" style={{ color: status.color }}>
                  <StatusIcon size={20} />
                  {status.label}
                </div>
              </div>

              <div className="product-stats">
                <div className="stat">
                  <Package size={16} />
                  <span>{product.total_parts_in_bom || 0} parts</span>
                </div>
                <div className="stat">
                  {product.bottleneck_materials?.length > 0 ? (
                    <>
                      <AlertTriangle size={16} style={{ color: '#f59e0b' }} />
                      <span>{product.bottleneck_materials.length} low stock</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle size={16} style={{ color: '#10b981' }} />
                      <span>{product.sufficient_materials?.length || 0} in stock</span>
                    </>
                  )}
                </div>
              </div>

              <div className="build-capacity">
                <div className="capacity-label">Build Capacity</div>
                <div className="capacity-value" style={{ color: status.color }}>
                  {product.max_units} units
                </div>
              </div>

              <button
                className="expand-button"
                onClick={() => toggleExpand(product.model)}
              >
                {isExpanded ? (
                  <>
                    <ChevronUp size={16} />
                    Hide parts
                  </>
                ) : (
                  <>
                    <ChevronDown size={16} />
                    Show parts
                  </>
                )}
              </button>

              {isExpanded && (
                <div className="parts-list">
                  <h4>Assembly Parts</h4>
                  {product.bottleneck_materials && product.bottleneck_materials.length > 0 ? (
                    <>
                      <div className="parts-section">
                        <h5 className="bottleneck-title">
                          <AlertTriangle size={14} />
                          Bottleneck Parts
                        </h5>
                        {product.bottleneck_materials.map((part, index) => (
                          <div key={index} className="part-item critical">
                            <div className="part-info">
                              <strong>{part.part_id}</strong>
                              <span className="part-name">{part.part_name}</span>
                            </div>
                            <div className="part-stats-grid">
                              <div>
                                <label>Current Stock</label>
                                <span className="value">{part.available_stock}</span>
                              </div>
                              <div>
                                <label>Required/Unit</label>
                                <span className="value">{part.required_per_unit}</span>
                              </div>
                              <div>
                                <label>Can Build</label>
                                <span className="value critical">{part.units_possible} units</span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <div className="no-parts">
                      <CheckCircle size={24} style={{ color: '#10b981' }} />
                      <p>All parts are sufficiently stocked!</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default Products;