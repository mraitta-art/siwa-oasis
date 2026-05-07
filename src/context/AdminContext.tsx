'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

interface AdminContextType {
  advancedMode: boolean;
  setAdvancedMode: (mode: boolean) => void;
  notifications: any[];
  notify: (msg: string, type?: 'success' | 'error' | 'warning', sticky?: boolean) => void;
  dismiss: (id: string) => void;
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

  const notify = (message: string, type: 'success' | 'error' | 'warning' = 'success', sticky: boolean = false) => {
    const id = Math.random().toString(36).substr(2, 9);
    setNotifications(prev => [...prev, { id, message, type, sticky }]);
    
    // Auto-dismiss if NOT sticky
    if (!sticky) {
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 5000);
    }
  };

  const dismiss = (id: string) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  return (
    <AdminContext.Provider value={{ advancedMode, setAdvancedMode: toggleAdvanced, notifications, notify, dismiss }}>
      {children}
      
      {/* GLOBAL TOAST RENDERING */}
      <div className="toast-container" style={{ position: 'fixed', bottom: '2rem', right: '2rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        {notifications.map(n => (
          <div key={n.id} className={`toast toast-${n.type} animate-in`} style={{
            background: n.type === 'error' ? '#ef4444' : n.type === 'warning' ? '#f59e0b' : '#10b981',
            color: '#fff', padding: '1rem 1.5rem', borderRadius: '12px', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.1)',
            display: 'flex', alignItems: 'center', gap: '1rem', minWidth: '300px', maxWidth: '500px',
            border: '1px solid rgba(255,255,255,0.1)', fontWeight: 600, position: 'relative'
          }}>
            <i className={`fas ${n.type === 'success' ? 'fa-check-circle' : n.type === 'error' ? 'fa-times-circle' : 'fa-exclamation-triangle'}`}></i>
            <div style={{ flex: 1 }}>{n.message}</div>
            <button 
              onClick={() => dismiss(n.id)}
              style={{ background: 'rgba(0,0,0,0.1)', border: 'none', color: '#fff', cursor: 'pointer', padding: '4px', borderRadius: '4px', display: 'flex', alignItems: 'center' }}
            >
              <i className="fas fa-times"></i>
            </button>
            {n.sticky && (
              <div style={{ position: 'absolute', top: '-10px', left: '10px', background: '#000', fontSize: '0.6rem', padding: '2px 8px', borderRadius: '4px', fontWeight: 900, color: '#D4AF37' }}>
                ACTION REQUIRED
              </div>
            )}
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
