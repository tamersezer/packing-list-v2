import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProductList } from './components/products/ProductList';
import { PackingListPage } from './components/packing/PackingListPage';
import { PackingListForm } from './components/packing/PackingListForm';
import { ThemeProvider } from './context/ThemeContext';
import { ToastContainer } from 'react-toastify';
import { Sidebar } from './components/layout/Sidebar';

export const App: React.FC = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-white dark:bg-gray-900">
          <Sidebar 
            isOpen={isSidebarOpen} 
            onToggle={() => setIsSidebarOpen(!isSidebarOpen)} 
          />

          <div className={`
            transition-all duration-300 ease-in-out
            ${isSidebarOpen ? 'ml-64' : 'ml-0'}
          `}>
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="fixed top-4 left-4 z-10 p-2 rounded-md bg-white dark:bg-gray-800 shadow-lg"
            >
              <svg className="h-6 w-6 text-gray-600 dark:text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>

            <Routes>
              <Route path="/" element={<Navigate to="/packing-list" replace />} />
              <Route path="/packing-list" element={<PackingListPage />} />
              <Route path="/packing-list/new" element={<PackingListForm />} />
              <Route path="/packing-list/:id" element={<PackingListForm />} />
              <Route path="/products" element={<ProductList />} />
            </Routes>
          </div>
        </div>
        <ToastContainer position="top-right" />
      </Router>
    </ThemeProvider>
  );
}; 