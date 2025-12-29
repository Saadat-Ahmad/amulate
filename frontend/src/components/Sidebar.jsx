import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Bot,
  BarChart3,
  Package,
  ShoppingCart,
  Truck,
  Map,
  Settings,
  Bell,
  Boxes
} from 'lucide-react';
import './Sidebar.css';

const menuItems = [
  { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { path: '/hugo-ai', icon: Bot, label: 'Hugo AI' },
  { path: '/analytics', icon: BarChart3, label: 'Analytics' },
  { path: '/products', icon: Package, label: 'Products' },
  { path: '/parts', icon: Boxes, label: 'Parts' },
  { path: '/orders', icon: ShoppingCart, label: 'Orders' },
  { path: '/suppliers', icon: Truck, label: 'Suppliers' },
  { path: '/map', icon: Map, label: 'Supply Chain Map' },
];

function Sidebar() {
  const location = useLocation();

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <Bot size={32} className="logo-icon" />
        <h2>Hugo</h2>
        <p>AI Procurement</p>
      </div>

      <nav className="sidebar-nav">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`nav-item ${isActive ? 'active' : ''}`}
            >
              <Icon size={20} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="sidebar-footer">
        <Link to="/notifications" className="nav-item">
          <Bell size={20} />
          <span>Notifications</span>
          <span className="badge">3</span>
        </Link>
        <Link to="/settings" className="nav-item">
          <Settings size={20} />
          <span>Settings</span>
        </Link>
      </div>

      <div className="sidebar-user">
        <div className="user-avatar">FA</div>
        <div className="user-info">
          <strong>Faraz & Saadat</strong>
          <span>Admin</span>
        </div>
      </div>
    </aside>
  );
}

export default Sidebar;