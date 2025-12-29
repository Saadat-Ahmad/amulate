import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Sidebar from './components/Sidebar';
import Dashboard from './pages/Dashboard';
import HugoAI from './pages/HugoAI';
import Products from './pages/Products';
import Parts from './pages/Parts';
import Orders from './pages/Orders';
import Suppliers from './pages/Suppliers';
import Analytics from './pages/Analytics';
import MapView from './pages/MapView';
import './styles/App.css';

function App() {
  return (
    <Router>
      <div className="app">
        <Toaster position="top-right" />
        <Sidebar />
        <main className="main-content">
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/hugo-ai" element={<HugoAI />} />
            <Route path="/products" element={<Products />} />
            <Route path="/parts" element={<Parts />} />
            <Route path="/orders" element={<Orders />} />
            <Route path="/suppliers" element={<Suppliers />} />
            <Route path="/analytics" element={<Analytics />} />
            <Route path="/map" element={<MapView />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;