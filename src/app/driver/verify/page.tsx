'use client';

import React, { useState, useEffect } from 'react';
import { Shield, FileCheck, Camera, Calendar, AlertCircle, ChevronRight, CheckCircle2, Lock } from 'lucide-react';
import { VerificationService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';

export default function VerificationCenter() {
  const { user } = useAuth();
  const [status, setStatus] = useState<string>('pending');
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeStep, setActiveStep] = useState<number>(0);

  useEffect(() => {
    const fetchStatus = async () => {
      try {
        if (!user) return;
        const data = await VerificationService.getVerificationStatus(user.id);
        setStatus(data.status);
        setDocuments(data.documents);
      } catch (err) {
        console.error('Error fetching verification status:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatus();
  }, [user]);

  const docTypes = [
    { id: 'id_card', label: 'ID Document', icon: <FileCheck size={20} />, desc: 'South African ID or Passport' },
    { id: 'pdp', label: 'Professional Permit (PrDP)', icon: <Calendar size={20} />, desc: 'Mandatory for public transport' },
    { id: 'vehicle_registration', label: 'Vehicle Papers', icon: <Shield size={20} />, desc: 'Proof of registration & ownership' },
    { id: 'insurance', label: 'Double Business Insurance', icon: <Lock size={20} />, desc: 'Specific passenger liability cover' },
  ];

  const getDocStatus = (type: string) => {
    const doc = documents.find(d => d.doc_type === type);
    return doc?.status || 'missing';
  };

  return (
    <div className="page-enter" style={{ padding: '24px 16px' }}>
      <header style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>
          Verification Center
        </h1>
        <p style={{ color: 'var(--text-tertiary)', fontSize: '0.9375rem' }}>
          Finalize your trust profile to stay active on the shield.
        </p>
      </header>

      {/* Global Status Banner */}
      <div className="card-glass" style={{
        padding: '24px', borderRadius: '20px', marginBottom: '32px',
        border: `1px solid ${status === 'verified' ? 'var(--green-light)' : 'var(--border-gold)'}`,
        background: status === 'verified' ? 'rgba(0,168,107,0.05)' : 'rgba(244,169,0,0.05)',
        display: 'flex', alignItems: 'center', gap: '16px'
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%', 
          background: status === 'verified' ? 'var(--green-light)' : 'var(--gold)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white'
        }}>
          {status === 'verified' ? <CheckCircle2 size={32} /> : <Shield size={32} />}
        </div>
        <div>
          <div style={{ fontSize: '1.125rem', fontWeight: 700 }}>
            {status === 'verified' ? 'Co-op Trusted Member' : 'Trust Under Review'}
          </div>
          <div style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
            {status === 'verified' 
              ? 'Your account is fully compliant with SA safety standards.' 
              : 'Please complete the missing items below to access all benefits.'}
          </div>
        </div>
      </div>

      {/* Verification Steps */}
      <h3 style={{ fontSize: '1.125rem', fontWeight: 700, marginBottom: '20px' }}>Trust Checklist</h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {docTypes.map((doc, i) => {
          const docStatus = getDocStatus(doc.id);
          return (
            <div key={doc.id} className="list-item" style={{ 
              padding: '20px', display: 'flex', alignItems: 'center', gap: '16px',
              opacity: docStatus === 'verified' ? 0.7 : 1
            }}>
              <div style={{
                width: 44, height: 44, borderRadius: '12px',
                background: 'var(--surface-200)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: docStatus === 'verified' ? 'var(--green-light)' : 'var(--text-tertiary)'
              }}>
                {docStatus === 'verified' ? <CheckCircle2 size={24} /> : doc.icon}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{doc.label}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>{doc.desc}</div>
              </div>
              <div>
                {docStatus === 'missing' ? (
                  <button className="btn btn-secondary" style={{ padding: '6px 12px', fontSize: '0.75rem' }}>
                    Upload
                  </button>
                ) : (
                  <span className={`badge ${docStatus === 'verified' ? 'badge-green' : 'badge-gold'}`}>
                    {docStatus.toUpperCase()}
                  </span>
                )}
              </div>
            </div>
          );
        })}

        {/* Biometric Check Mockup Item */}
        <div className="list-item" style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '16px', border: '1px dashed var(--border-gold)', background: 'rgba(244,169,0,0.02)' }}>
          <div style={{
            width: 44, height: 44, borderRadius: '12px',
            background: 'var(--surface-200)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            color: 'var(--gold)'
          }}>
            <Camera size={24} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: '0.9375rem', fontWeight: 700 }}>Biometric Liveness Check</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>Binding your identity to our human shield.</div>
          </div>
          <button className="btn btn-primary" style={{ padding: '6px 12px', fontSize: '0.75rem', background: 'var(--gradient-gold)', border: 'none' }}>
            Start Scan
          </button>
        </div>
      </div>

      {/* Safety Compliance Note */}
      <div style={{
        marginTop: '40px', padding: '20px', borderRadius: '16px',
        background: 'var(--surface-100)', border: '1px solid var(--border-subtle)',
        display: 'flex', gap: '14px'
      }}>
        <AlertCircle size={20} color="var(--sky)" style={{ flexShrink: 0 }} />
        <p style={{ fontSize: '0.8125rem', color: 'var(--text-tertiary)', lineHeight: '1.5' }}>
          <strong>Compliance Notice:</strong> PDP verification results are synced with national licensing databases. Fraudulent submissions will result in immediate cooperative expulsion and legal handover.
        </p>
      </div>

      <div style={{ marginTop: '32px' }}>
        <button onClick={() => window.history.back()} style={{
          width: '100%', padding: '16px', background: 'none', border: 'none',
          color: 'var(--text-tertiary)', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
        }}>
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}
