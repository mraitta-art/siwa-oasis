'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  advancedMode: boolean;
  setAdvancedMode: (mode: boolean) => void;
  notifications: any[];
  notify: (msg: string, type?: 'success' | 'error' | 'warning') => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [advancedMode, setAdvancedMode] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  // Load preference
  useEffect(() => {
    const saved = localStorage.getItem('siwa_advanced_mode');
    if (saved === 'true') setAdvancedMode(true);
  }, []);

  const toggleAdvanced = (mode: boolean) => {
    setAdvancedMode(mode);
    localStorage.setItem('siwa_advanced_mode', String(mode));
    notify(mode ? 'Advanced Mode Activated' : 'Standard Mode Activated', 'success');
  };

  const notify = (message: string, type: 'success' | 'error' | 'warning' = 'success') => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== id));
    }, 4000);
  };

  return (
    <AdminContext.Provider value={{ advancedMode, setAdvancedMode: toggleAdvanced, notifications, notify }}>
      {children}
      
      {/* GLOBAL TOAST RENDERING */}
      <div className="toast-container">
        {notifications.map(n => (
          <div key={n.id} className={`toast toast-${n.type} animate-in`}>
            <i className={`fas ${n.type === 'success' ? 'fa-check-circle' : n.type === 'error' ? 'fa-times-circle' : 'fa-exclamation-triangle'}`}></i>
            {n.message}
          </div>
        ))}
      </div>
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (!context) throw new Error('useAdmin must be used within AdminProvider');
  return context;
}
