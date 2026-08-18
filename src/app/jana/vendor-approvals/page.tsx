'use client';

import React, { useState, useEffect } from 'react';

type RegistrationMode = 'open' | 'approval_required';
type TabType = 'pending' | 'approved' | 'rejected';

interface Vendor {
  id: string;
  userId: string;
  display_name: string;
  email: string;
  phone?: string;
  business_name: string;
  category: string;
  created_at: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason?: string;
}

export default function VendorApprovalsPage() {
  const [mode, setMode] = useState<RegistrationMode | null>(null);
  const [modeLoading, setModeLoading] = useState(true);
  
  const [activeTab, setActiveTab] = useState<TabType>('pending');
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [vendorsLoading, setVendorsLoading] = useState(true);
  
  const [rejectReasons, setRejectReasons] = useState<Record<string, string>>({});
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchMode();
  }, []);

  useEffect(() => {
    fetchVendors();
  }, [activeTab]);

  const fetchMode = async () => {
    setModeLoading(true);
    try {
      const res = await fetch('/api/jana/vendor-approvals?setting=mode');
      if (res.ok) {
        const data = await res.json();
        setMode(data.mode);
      }
    } catch (error) {
      console.error('Failed to fetch mode', error);
    } finally {
      setModeLoading(false);
    }
  };

  const fetchVendors = async () => {
    setVendorsLoading(true);
    try {
      const res = await fetch(`/api/jana/vendor-approvals?status=${activeTab}`);
      if (res.ok) {
        const data = await res.json();
        setVendors(Array.isArray(data) ? data : data.vendors || []);
      } else {
        setVendors([]);
      }
    } catch (error) {
      console.error('Failed to fetch vendors', error);
      setVendors([]);
    } finally {
      setVendorsLoading(false);
    }
  };

  const handleModeChange = async (newMode: RegistrationMode) => {
    setMode(newMode);
    try {
      await fetch('/api/jana/vendor-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mode: newMode }),
      });
    } catch (error) {
      console.error('Failed to change mode', error);
    }
  };

  const handleAction = async (userId: string, action: 'approve' | 'reject' | 'revoke', reason?: string) => {
    setActionLoading(userId);
    try {
      const res = await fetch('/api/jana/vendor-approvals', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, action, reason }),
      });
      if (res.ok) {
        fetchVendors();
        if (action === 'reject') {
          setRejectReasons((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
        }
      }
    } catch (error) {
      console.error(`Failed to ${action} vendor`, error);
    } finally {
      setActionLoading(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  return (
    <div className="admin-container">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap');
        @import url('https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css');

        .admin-container {
          font-family: 'Inter', sans-serif;
          background-color: #0f172a;
          color: #f8fafc;
          min-height: 100vh;
          padding: 40px;
          box-sizing: border-box;
        }
        
        .header {
          margin-bottom: 40px;
        }
        
        .header h1 {
          font-size: 32px;
          font-weight: 700;
          margin: 0 0 8px 0;
          color: #f8fafc;
        }
        
        .header p {
          color: #94a3b8;
          margin: 0;
          font-size: 16px;
        }

        .settings-card {
          background: #1e293b;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 32px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .settings-info h2 {
          margin: 0 0 4px 0;
          font-size: 18px;
          font-weight: 600;
        }

        .settings-info p {
          margin: 0;
          color: #94a3b8;
          font-size: 14px;
        }

        .toggle-group {
          display: flex;
          background: #0f172a;
          border-radius: 8px;
          padding: 4px;
        }

        .toggle-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 10px 20px;
          border-radius: 6px;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .toggle-btn.active {
          background: #D4AF37;
          color: #0f172a;
        }

        .tabs {
          display: flex;
          gap: 16px;
          margin-bottom: 24px;
          border-bottom: 1px solid #1e293b;
          padding-bottom: 1px;
        }

        .tab-btn {
          background: transparent;
          border: none;
          color: #94a3b8;
          padding: 12px 24px;
          font-size: 15px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          color: #cbd5e1;
        }

        .tab-btn.active {
          color: #D4AF37;
          border-bottom-color: #D4AF37;
        }

        .vendor-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
          gap: 24px;
        }

        .vendor-card {
          background: #1e293b;
          border-radius: 12px;
          padding: 24px;
          border: 1px solid rgba(255, 255, 255, 0.05);
          transition: transform 0.2s ease, box-shadow 0.2s ease;
          display: flex;
          flex-direction: column;
        }

        .vendor-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
        }

        .vendor-header {
          display: flex;
          justify-content: space-between;
          align-items: flex-start;
          margin-bottom: 16px;
        }

        .vendor-name {
          font-size: 18px;
          font-weight: 600;
          margin: 0 0 4px 0;
          color: #f8fafc;
        }

        .vendor-business {
          font-size: 14px;
          color: #D4AF37;
          margin: 0;
          font-weight: 500;
        }

        .badge {
          padding: 4px 10px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          text-transform: uppercase;
        }

        .badge.pending {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }

        .badge.approved {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }

        .badge.rejected {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }

        .vendor-details {
          margin-bottom: 24px;
          flex-grow: 1;
        }

        .detail-row {
          display: flex;
          align-items: center;
          gap: 12px;
          margin-bottom: 8px;
          color: #94a3b8;
          font-size: 14px;
        }

        .detail-row i {
          width: 16px;
          text-align: center;
        }

        .actions {
          display: flex;
          flex-direction: column;
          gap: 12px;
          margin-top: auto;
        }

        .action-row {
          display: flex;
          gap: 12px;
        }

        .btn {
          flex: 1;
          padding: 10px 16px;
          border-radius: 6px;
          border: none;
          font-size: 14px;
          font-weight: 500;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          transition: all 0.2s ease;
        }

        .btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }

        .btn-approve {
          background: #10b981;
          color: white;
        }
        .btn-approve:hover:not(:disabled) { background: #059669; }

        .btn-reject {
          background: #ef4444;
          color: white;
        }
        .btn-reject:hover:not(:disabled) { background: #dc2626; }

        .btn-revoke {
          background: #f59e0b;
          color: white;
        }
        .btn-revoke:hover:not(:disabled) { background: #d97706; }

        .reject-reason-input {
          width: 100%;
          background: #0f172a;
          border: 1px solid #334155;
          border-radius: 6px;
          padding: 12px;
          color: #f8fafc;
          font-family: inherit;
          font-size: 14px;
          resize: vertical;
          min-height: 80px;
          box-sizing: border-box;
          margin-bottom: 12px;
        }
        
        .reject-reason-input:focus {
          outline: none;
          border-color: #D4AF37;
        }

        .rejection-notice {
          background: rgba(239, 68, 68, 0.1);
          border-left: 3px solid #ef4444;
          padding: 12px;
          border-radius: 4px;
          margin-bottom: 16px;
          font-size: 13px;
          color: #fca5a5;
        }

        /* Skeleton Loading */
        .skeleton {
          background: linear-gradient(90deg, #1e293b 25%, #334155 50%, #1e293b 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes loading {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .empty-state {
          text-align: center;
          padding: 60px 20px;
          color: #94a3b8;
          background: #1e293b;
          border-radius: 12px;
          border: 1px dashed #334155;
        }

        .empty-state i {
          font-size: 48px;
          margin-bottom: 16px;
          color: #475569;
        }

        .empty-state h3 {
          margin: 0 0 8px 0;
          color: #f8fafc;
          font-weight: 500;
        }
      `}</style>

      <div className="header">
        <h1>Vendor Approvals</h1>
        <p>Manage pending vendor registration requests</p>
      </div>

      <div className="settings-card">
        <div className="settings-info">
          <h2>Registration Mode</h2>
          <p>Control how new vendors join the platform</p>
        </div>
        
        <div className="toggle-group">
          {modeLoading ? (
            <div className="skeleton" style={{ width: 240, height: 38, borderRadius: 6 }}></div>
          ) : (
            <>
              <button 
                className={`toggle-btn ${mode === 'open' ? 'active' : ''}`}
                onClick={() => handleModeChange('open')}
              >
                Open
              </button>
              <button 
                className={`toggle-btn ${mode === 'approval_required' ? 'active' : ''}`}
                onClick={() => handleModeChange('approval_required')}
              >
                Approval Required
              </button>
            </>
          )}
        </div>
      </div>

      <div className="tabs">
        <button 
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending
        </button>
        <button 
          className={`tab-btn ${activeTab === 'approved' ? 'active' : ''}`}
          onClick={() => setActiveTab('approved')}
        >
          Approved
        </button>
        <button 
          className={`tab-btn ${activeTab === 'rejected' ? 'active' : ''}`}
          onClick={() => setActiveTab('rejected')}
        >
          Rejected
        </button>
      </div>

      {vendorsLoading ? (
        <div className="vendor-grid">
          {[1, 2, 3].map((i) => (
            <div key={i} className="vendor-card">
              <div className="vendor-header">
                <div>
                  <div className="skeleton" style={{ width: 150, height: 24, marginBottom: 8 }}></div>
                  <div className="skeleton" style={{ width: 100, height: 16 }}></div>
                </div>
                <div className="skeleton" style={{ width: 70, height: 24, borderRadius: 20 }}></div>
              </div>
              <div className="vendor-details">
                <div className="skeleton" style={{ width: '80%', height: 16, marginBottom: 12 }}></div>
                <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 12 }}></div>
                <div className="skeleton" style={{ width: '70%', height: 16 }}></div>
              </div>
              <div className="skeleton" style={{ width: '100%', height: 40, borderRadius: 6 }}></div>
            </div>
          ))}
        </div>
      ) : vendors.length === 0 ? (
        <div className="empty-state">
          <i className={`fas fa-${activeTab === 'pending' ? 'inbox' : activeTab === 'approved' ? 'check-circle' : 'times-circle'}`}></i>
          <h3>No {activeTab} vendors</h3>
          <p>There are currently no vendors in this list.</p>
        </div>
      ) : (
        <div className="vendor-grid">
          {vendors.map((vendor) => (
            <div key={vendor.id} className="vendor-card">
              <div className="vendor-header">
                <div>
                  <h3 className="vendor-name">{vendor.display_name}</h3>
                  <p className="vendor-business">{vendor.business_name}</p>
                </div>
                <span className={`badge ${vendor.approval_status}`}>
                  {vendor.approval_status}
                </span>
              </div>

              <div className="vendor-details">
                <div className="detail-row">
                  <i className="fas fa-envelope"></i>
                  <span>{vendor.email}</span>
                </div>
                {vendor.phone && (
                  <div className="detail-row">
                    <i className="fas fa-phone"></i>
                    <span>{vendor.phone}</span>
                  </div>
                )}
                <div className="detail-row">
                  <i className="fas fa-tag"></i>
                  <span>{vendor.category}</span>
                </div>
                <div className="detail-row">
                  <i className="fas fa-clock"></i>
                  <span>{formatDate(vendor.created_at)}</span>
                </div>
              </div>

              {vendor.approval_status === 'pending' && (
                <div className="actions">
                  <textarea 
                    className="reject-reason-input"
                    placeholder="Reason for rejection (optional)"
                    value={rejectReasons[vendor.userId] || ''}
                    onChange={(e) => setRejectReasons({ ...rejectReasons, [vendor.userId]: e.target.value })}
                  />
                  <div className="action-row">
                    <button 
                      className="btn btn-approve"
                      onClick={() => handleAction(vendor.userId, 'approve')}
                      disabled={actionLoading === vendor.userId}
                    >
                      <i className="fas fa-check"></i> Approve
                    </button>
                    <button 
                      className="btn btn-reject"
                      onClick={() => handleAction(vendor.userId, 'reject', rejectReasons[vendor.userId])}
                      disabled={actionLoading === vendor.userId}
                    >
                      <i className="fas fa-times"></i> Reject
                    </button>
                  </div>
                </div>
              )}

              {vendor.approval_status === 'approved' && (
                <div className="actions">
                  <button 
                    className="btn btn-revoke"
                    onClick={() => handleAction(vendor.userId, 'revoke')}
                    disabled={actionLoading === vendor.userId}
                  >
                    <i className="fas fa-ban"></i> Revoke Access
                  </button>
                </div>
              )}

              {vendor.approval_status === 'rejected' && (
                <div className="actions">
                  {vendor.rejection_reason && (
                    <div className="rejection-notice">
                      <i className="fas fa-info-circle"></i> {vendor.rejection_reason}
                    </div>
                  )}
                  <button 
                    className="btn btn-approve"
                    onClick={() => handleAction(vendor.userId, 'approve')}
                    disabled={actionLoading === vendor.userId}
                  >
                    <i className="fas fa-redo"></i> Re-Approve
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
