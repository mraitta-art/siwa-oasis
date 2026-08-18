'use client';

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

interface VerificationData {
  verificationStatus: 'unverified' | 'pending' | 'verified' | 'rejected';
  trustRejectionNote: string | null;
  idDocFrontUrl: string | null;
  idDocBackUrl: string | null;
  ownershipDocUrl: string | null;
}

const VERIFY_CSS = `
  .vv-root {
    font-family: 'Inter', 'Segoe UI', system-ui, sans-serif;
    color: #0f172a;
    max-width: 800px;
    margin: 0 auto;
    padding: 1.5rem 1rem;
  }
  .vv-card {
    background: #ffffff;
    border: 1px solid #eef0f5;
    border-radius: 24px;
    padding: 2rem;
    box-shadow: 0 10px 30px rgba(15,23,42,0.03);
  }
  .vv-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 2rem;
    border-bottom: 1px solid #f1f5f9;
    padding-bottom: 1.25rem;
    flex-wrap: wrap;
    gap: 1rem;
  }
  .vv-title {
    font-size: 1.5rem;
    fontWeight: 900;
    color: #0f172a;
    display: flex;
    align-items: center;
    gap: 0.75rem;
    margin: 0;
  }
  .vv-badge {
    font-size: 0.7rem;
    font-weight: 800;
    padding: 0.4rem 1rem;
    border-radius: 20px;
    text-transform: uppercase;
    letter-spacing: 1px;
  }
  .vv-badge.unverified { background: rgba(212,175,55,0.1); border: 1px solid rgba(212,175,55,0.3); color: #D4AF37; }
  .vv-badge.pending { background: rgba(59,130,246,0.1); border: 1px solid rgba(59,130,246,0.3); color: #3b82f6; }
  .vv-badge.verified { background: rgba(34,197,94,0.1); border: 1px solid rgba(34,197,94,0.3); color: #22c55e; }
  .vv-badge.rejected { background: rgba(239,68,68,0.1); border: 1px solid rgba(239,68,68,0.3); color: #ef4444; }

  .vv-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
    gap: 1.5rem;
    margin-bottom: 2rem;
  }
  .vv-upload-box {
    border: 2px dashed #e2e8f0;
    border-radius: 18px;
    padding: 1.75rem 1rem;
    text-align: center;
    background: #f8fafc;
    cursor: pointer;
    transition: all 0.2s;
    position: relative;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 220px;
  }
  .vv-upload-box:hover {
    border-color: #D4AF37;
    background: #fffbeb;
  }
  .vv-upload-box.has-file {
    border-color: #22c55e;
    border-style: solid;
    background: rgba(34,197,94,0.02);
  }
  .vv-preview-img {
    width: 100%;
    height: 160px;
    object-fit: contain;
    background: #f1f5f9;
    border-radius: 12px;
    margin-bottom: 0.75rem;
    border: 1px solid #e2e8f0;
  }
  .vv-doc-icon {
    width: 48px;
    height: 48px;
    border-radius: 12px;
    background: rgba(212,175,55,0.1);
    color: #D4AF37;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 1.25rem;
    margin-bottom: 1rem;
  }
  .vv-upload-box.has-file .vv-doc-icon {
    background: rgba(34,197,94,0.1);
    color: #22c55e;
  }

  .vv-label {
    font-size: 0.8rem;
    font-weight: 800;
    color: #1e293b;
    margin-bottom: 4px;
  }
  .vv-desc {
    font-size: 0.65rem;
    color: #94a3b8;
    line-height: 1.4;
    padding: 0 0.5rem;
  }
  .vv-submit-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    gap: 0.5rem;
    padding: 0.85rem 2rem;
    background: linear-gradient(135deg, #D4AF37, #f59e0b);
    color: #1a1000;
    border-radius: 12px;
    font-weight: 800;
    font-size: 0.85rem;
    border: none;
    cursor: pointer;
    box-shadow: 0 4px 14px rgba(212,175,55,0.25);
    transition: all 0.2s;
  }
  .vv-submit-btn:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(212,175,55,0.35);
  }
  .vv-submit-btn:disabled {
    opacity: 0.5;
    transform: none;
    box-shadow: none;
    cursor: not-allowed;
  }
`;

export default function VendorVerificationPage() {
  const router = useRouter();
  const [data, setData] = useState<VerificationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Form files state
  const [idFrontFile, setIdFrontFile] = useState<File | null>(null);
  const [idBackFile, setIdBackFile] = useState<File | null>(null);
  const [ownershipFile, setOwnershipFile] = useState<File | null>(null);

  // Preview URLs
  const [idFrontPreview, setIdFrontPreview] = useState<string | null>(null);
  const [idBackPreview, setIdBackPreview] = useState<string | null>(null);
  const [ownershipPreview, setOwnershipPreview] = useState<string | null>(null);

  // File Inputs
  const frontInputRef = useRef<HTMLInputElement>(null);
  const backInputRef = useRef<HTMLInputElement>(null);
  const ownerInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetch('/api/vendor/verification')
      .then(r => r.json())
      .then((d: any) => {
        if (!d.error) {
          setData(d);
          if (d.idDocFrontUrl) setIdFrontPreview(d.idDocFrontUrl);
          if (d.idDocBackUrl) setIdBackPreview(d.idDocBackUrl);
          if (d.ownershipDocUrl) setOwnershipPreview(d.ownershipDocUrl);
        }
      })
      .catch(() => setError('Failed to load verification status'))
      .finally(() => setLoading(false));
  }, []);

  const handleFileChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setFile: React.Dispatch<React.SetStateAction<File | null>>,
    setPreview: React.Dispatch<React.SetStateAction<string | null>>
  ) => {
    const file = e.target.files?.[0];
    if (file) {
      setFile(file);
      const isImg = file.type.startsWith('image/');
      if (isImg) {
        setPreview(URL.createObjectURL(file));
      } else {
        setPreview('/file-placeholder.png'); // PDF/doc placeholder
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    const formData = new FormData();
    if (idFrontFile) formData.append('idFront', idFrontFile);
    if (idBackFile) formData.append('idBack', idBackFile);
    if (ownershipFile) formData.append('ownershipDoc', ownershipFile);

    try {
      const res = await fetch('/api/vendor/verification', {
        method: 'POST',
        body: formData,
      });

      const result = await res.json();
      if (!res.ok) {
        setError(result.error || 'Failed to submit verification');
      } else {
        setSuccess('Documents submitted for review! Your verification status is now Pending Review.');
        setData(prev => prev ? { ...prev, verificationStatus: 'pending' } : null);
        setTimeout(() => {
          router.push('/vendor');
        }, 3000);
      }
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="vv-root" style={{ textAlign: 'center', padding: '10rem 2rem' }}>
        <i className="fas fa-circle-notch fa-spin fa-2x" style={{ color: '#D4AF37' }} />
        <p style={{ marginTop: '1rem', color: '#64748b' }}>Loading Verification Center...</p>
      </div>
    );
  }

  const status = data?.verificationStatus || 'unverified';
  const showUploads = status === 'unverified' || status === 'rejected';

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: VERIFY_CSS }} />
      <div className="vv-root">
        <Link href="/vendor" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.8rem', textDecoration: 'none', fontWeight: 700, marginBottom: '1.5rem' }}>
          <i className="fas fa-arrow-left" /> Back to Dashboard
        </Link>

        <div className="vv-card">
          <div className="vv-header">
            <div>
              <h1 className="vv-title">
                <i className="fas fa-shield-halved" style={{ color: '#D4AF37' }} />
                Identity & Ownership Verification
              </h1>
              <p style={{ margin: '4px 0 0', fontSize: '0.78rem', color: '#64748b', fontWeight: 500 }}>
                Audit queue for authentic heritage status & dashboard authority.
              </p>
            </div>
            <span className={`vv-badge ${status}`}>
              {status === 'pending' ? 'PENDING REVIEW' : status}
            </span>
          </div>

          {/* Status Alert Banner */}
          {status === 'verified' && (
            <div style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: 16, padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <i className="fas fa-check-circle" style={{ color: '#22c55e', fontSize: '1.5rem', marginTop: '0.1rem' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 800, color: '#16a34a' }}>✓ Profile Fully Verified</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  Thank you! Your identity and ownership documents have been audited and approved. Your minisite features the gold **Trusted Vendor** badge and is permanently visible.
                </p>
              </div>
            </div>
          )}

          {status === 'pending' && (
            <div style={{ background: 'rgba(59,130,246,0.05)', border: '1px solid rgba(59,130,246,0.2)', borderRadius: 16, padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <i className="fas fa-hourglass-half" style={{ color: '#3b82f6', fontSize: '1.5rem', marginTop: '0.1rem' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 800, color: '#2563eb' }}>⏳ Review in Progress</h4>
                <p style={{ margin: 0, fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  Your documents are currently in our verification audit queue. The admin team will inspect the files within 1-2 business days. Your listing visibility remains protected.
                </p>
              </div>
            </div>
          )}

          {status === 'rejected' && (
            <div style={{ background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 16, padding: '1.25rem', marginBottom: '2rem', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <i className="fas fa-triangle-exclamation" style={{ color: '#ef4444', fontSize: '1.5rem', marginTop: '0.1rem' }} />
              <div>
                <h4 style={{ margin: '0 0 4px', fontSize: '0.88rem', fontWeight: 800, color: '#dc2626' }}>❌ Documents Rejected</h4>
                <p style={{ margin: '0 0 8px', fontSize: '0.8rem', color: '#64748b', lineHeight: 1.5 }}>
                  The verification request was rejected by the admin team.
                </p>
                <div style={{ background: 'rgba(239,68,68,0.08)', borderRadius: 8, padding: '0.5rem 0.75rem', fontSize: '0.75rem', color: '#b91c1c', fontWeight: 600 }}>
                  Reason: &quot;{data?.trustRejectionNote || 'Uploaded files are unreadable or invalid.'}&quot;
                </div>
                <p style={{ margin: '8px 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                  Please re-upload clear, legible copies of all three requested documents below.
                </p>
              </div>
            </div>
          )}

          {status === 'unverified' && (
            <div style={{ background: 'rgba(212,175,55,0.06)', border: '1px solid rgba(212,175,55,0.2)', borderRadius: 16, padding: '1.25rem', marginBottom: '2rem' }}>
              <p style={{ margin: 0, fontSize: '0.8rem', color: '#5a4a3a', lineHeight: 1.6, fontWeight: 500 }}>
                ⚠️ **Why verify?** Verification provides transparency, confirms you are the authentic manager of this listing, and displays the **Trusted Vendor** badge on your page. **Unverified business accounts are hidden automatically 30 days after registration.**
              </p>
            </div>
          )}

          {error && (
            <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '0.75rem 1rem', color: '#991b1b', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              <i className="fas fa-exclamation-circle" style={{ marginRight: 6 }} /> {error}
            </div>
          )}

          {success && (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: 12, padding: '0.75rem 1rem', color: '#166534', fontSize: '0.8rem', fontWeight: 600, marginBottom: '1.5rem' }}>
              <i className="fas fa-check-circle" style={{ marginRight: 6 }} /> {success}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {/* Hidden File inputs */}
            <input
              type="file"
              ref={frontInputRef}
              style={{ display: 'none' }}
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, setIdFrontFile, setIdFrontPreview)}
              disabled={!showUploads || submitting}
            />
            <input
              type="file"
              ref={backInputRef}
              style={{ display: 'none' }}
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, setIdBackFile, setIdBackPreview)}
              disabled={!showUploads || submitting}
            />
            <input
              type="file"
              ref={ownerInputRef}
              style={{ display: 'none' }}
              accept="image/*,application/pdf"
              onChange={(e) => handleFileChange(e, setOwnershipFile, setOwnershipPreview)}
              disabled={!showUploads || submitting}
            />

            <div className="vv-grid">
              {/* Document 1: ID Front */}
              <div 
                className={`vv-upload-box ${(idFrontFile || data?.idDocFrontUrl) ? 'has-file' : ''}`}
                onClick={() => showUploads && frontInputRef.current?.click()}
              >
                {idFrontPreview ? (
                  idFrontPreview.endsWith('.pdf') ? (
                    <div style={{ padding: '2rem 0', color: '#D4AF37' }}>
                      <i className="fas fa-file-pdf fa-3x" />
                      <div style={{ fontSize: '0.7rem', marginTop: 5, fontWeight: 700 }}>ID_FRONT.PDF</div>
                    </div>
                  ) : (
                    <img src={idFrontPreview} alt="ID Front Preview" className="vv-preview-img" />
                  )
                ) : (
                  <div className="vv-doc-icon">
                    <i className="fas fa-address-card" />
                  </div>
                )}
                <div className="vv-label">National ID (Front)</div>
                <div className="vv-desc">Legible photo/scan of ID card or passport front page.</div>
                {showUploads && (
                  <span style={{ fontSize: '0.62rem', color: '#D4AF37', fontWeight: 800, marginTop: '0.75rem', textTransform: 'uppercase' }}>
                    {idFrontFile ? '✓ Change Image' : '➕ Upload file'}
                  </span>
                )}
              </div>

              {/* Document 2: ID Back */}
              <div 
                className={`vv-upload-box ${(idBackFile || data?.idDocBackUrl) ? 'has-file' : ''}`}
                onClick={() => showUploads && backInputRef.current?.click()}
              >
                {idBackPreview ? (
                  idBackPreview.endsWith('.pdf') ? (
                    <div style={{ padding: '2rem 0', color: '#D4AF37' }}>
                      <i className="fas fa-file-pdf fa-3x" />
                      <div style={{ fontSize: '0.7rem', marginTop: 5, fontWeight: 700 }}>ID_BACK.PDF</div>
                    </div>
                  ) : (
                    <img src={idBackPreview} alt="ID Back Preview" className="vv-preview-img" />
                  )
                ) : (
                  <div className="vv-doc-icon">
                    <i className="fas fa-id-card-clip" />
                  </div>
                )}
                <div className="vv-label">National ID (Back)</div>
                <div className="vv-desc">Legible photo/scan of card back showing address & expiration.</div>
                {showUploads && (
                  <span style={{ fontSize: '0.62rem', color: '#D4AF37', fontWeight: 800, marginTop: '0.75rem', textTransform: 'uppercase' }}>
                    {idBackFile ? '✓ Change Image' : '➕ Upload file'}
                  </span>
                )}
              </div>

              {/* Document 3: Ownership Proof */}
              <div 
                className={`vv-upload-box ${(ownershipFile || data?.ownershipDocUrl) ? 'has-file' : ''}`}
                onClick={() => showUploads && ownerInputRef.current?.click()}
              >
                {ownershipPreview ? (
                  ownershipPreview.endsWith('.pdf') ? (
                    <div style={{ padding: '2rem 0', color: '#D4AF37' }}>
                      <i className="fas fa-file-pdf fa-3x" />
                      <div style={{ fontSize: '0.7rem', marginTop: 5, fontWeight: 700 }}>OWNERSHIP_PROOF.PDF</div>
                    </div>
                  ) : (
                    <img src={ownershipPreview} alt="Ownership Proof Preview" className="vv-preview-img" />
                  )
                ) : (
                  <div className="vv-doc-icon">
                    <i className="fas fa-file-contract" />
                  </div>
                )}
                <div className="vv-label">Ownership Proof</div>
                <div className="vv-desc">Trade license, tax card, title deed, or official authorization letter.</div>
                {showUploads && (
                  <span style={{ fontSize: '0.62rem', color: '#D4AF37', fontWeight: 800, marginTop: '0.75rem', textTransform: 'uppercase' }}>
                    {ownershipFile ? '✓ Change Image' : '➕ Upload file'}
                  </span>
                )}
              </div>
            </div>

            {showUploads && (
              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button
                  type="submit"
                  className="vv-submit-btn"
                  disabled={submitting || (!idFrontFile && !data?.idDocFrontUrl) || (!idBackFile && !data?.idDocBackUrl) || (!ownershipFile && !data?.ownershipDocUrl)}
                >
                  {submitting ? (
                    <><i className="fas fa-circle-notch fa-spin" /> Submitting files...</>
                  ) : (
                    <><i className="fas fa-paper-plane" /> Submit Verification Request</>
                  )}
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </>
  );
}
