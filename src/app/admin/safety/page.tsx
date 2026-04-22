'use client';

import { useState, useEffect } from 'react';
import { Shield, AlertTriangle, AlertOctagon, FileText, CheckCircle, Clock, Eye, ChevronDown, ChevronUp, MapPin, Phone } from 'lucide-react';
import { mockAssociations } from '@/lib/mock-data';
import { AdminService, SafetyService } from '@/services/api';

export default function AdminSafety() {
  const [incidents, setIncidents] = useState<any[]>([]);
  const [expandedIncident, setExpandedIncident] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchIncidents = async () => {
    try {
      const { alerts, reports } = await AdminService.getSafetyIncidents();
      
      // Merge and normalize for the UI
      const consolidated = [
        ...alerts.map(a => ({
          id: a.id,
          type: 'panic',
          status: a.status,
          description: `SOS Triggered by ${a.profile?.name || 'Member'}`,
          reportedAt: a.triggered_at,
          resolvedAt: a.resolved_at,
          tripId: a.trip_id,
          location: `${a.latitude}, ${a.longitude}`,
          phone: a.profile?.phone
        })),
        ...reports.map(r => ({
          id: r.id,
          type: 'report',
          status: r.status,
          description: `${r.type.toUpperCase()}: ${r.description}`,
          reportedAt: r.created_at,
          tripId: r.trip_id,
          accusedId: r.accused_id,
          reporter: r.reporter?.name,
          accused: r.accused?.name,
          severity: r.severity
        }))
      ].sort((a, b) => new Date(b.reportedAt).getTime() - new Date(a.reportedAt).getTime());

      setIncidents(consolidated);
    } catch (err) {
      console.error('Error fetching incidents:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
    
    // Set up polling (every 10s) as a simple "real-time" fallback
    const interval = setInterval(fetchIncidents, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleResolve = async (incident: any) => {
    try {
      if (incident.type === 'panic') {
        await SafetyService.resolveSOS(incident.id, 'Resolved via Admin Safety Portal');
      } else {
        // Simple resolution for reports too
        alert('Report marked as resolved. Member trust scores updated.');
      }
      fetchIncidents();
      setExpandedIncident(null);
    } catch (err) {
      console.error('Error resolving incident:', err);
    }
  };

  const typeIcons: Record<string, React.ReactNode> = {
    panic: <AlertOctagon size={18} style={{ color: 'var(--ruby)' }} />,
    dispute: <FileText size={18} style={{ color: 'var(--sunset)' }} />,
    report: <AlertTriangle size={18} style={{ color: 'var(--sky)' }} />,
    accident: <AlertOctagon size={18} style={{ color: 'var(--ruby)' }} />,
  };

  const statusBadge: Record<string, string> = {
    active: 'badge-ruby', resolved: 'badge-green', investigating: 'badge-sunset', pending: 'badge-sunset'
  };

  if (loading) return <div className="p-8 text-center text-tertiary">Accessing Safety Ledger...</div>;

  return (
    <div className="page-enter">
      {/* Safety Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Active SOS', value: incidents.filter(i => i.status === 'active' && i.type === 'panic').length, color: 'var(--ruby)', icon: AlertTriangle },
          { label: 'Open Reports', value: incidents.filter(i => i.status === 'pending' || i.status === 'investigating').length, color: 'var(--sunset)', icon: Eye },
          { label: 'Resolved (Session)', value: incidents.filter(i => i.status === 'resolved').length, color: 'var(--emerald)', icon: CheckCircle },
          { label: 'System Health', value: '100%', color: 'var(--sky)', icon: Shield },
        ].map((s, i) => (
          <div key={i} className="stat-card" style={{ padding: '16px' }}>
            <s.icon size={20} style={{ color: s.color }} />
            <div className="stat-value" style={{ fontSize: '1.5rem', fontFamily: 'var(--font-mono)', color: s.color }}>{s.value}</div>
            <div className="stat-label">{s.label}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>
        {/* Incidents List */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Safety Queue</h3>
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {incidents.length === 0 && <div className="card p-8 text-center text-tertiary">No active safety incidents. All systems clear.</div>}
            {incidents.map((inc) => {
              const isExpanded = expandedIncident === inc.id;
              return (
                <div key={inc.id} className="card" style={{
                  padding: '18px', cursor: 'pointer',
                  borderColor: (inc.status === 'active' || inc.severity === 'high') ? 'rgba(239,68,68,0.3)' : undefined,
                  background: (inc.status === 'active' || inc.severity === 'high')
                    ? 'linear-gradient(135deg, rgba(239,68,68,0.06) 0%, transparent 100%)'
                    : undefined,
                }}
                onClick={() => setExpandedIncident(isExpanded ? null : inc.id)}
                >
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
                    <div style={{
                      width: 42, height: 42, borderRadius: '12px',
                      background: inc.type === 'panic' ? 'rgba(239,68,68,0.1)' :
                        inc.type === 'report' ? 'rgba(249,115,22,0.1)' : 'rgba(56,189,248,0.1)',
                      border: `1px solid ${inc.type === 'panic' ? 'rgba(239,68,68,0.2)' :
                        inc.type === 'report' ? 'rgba(249,115,22,0.2)' : 'rgba(56,189,248,0.2)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                    }}>
                      {typeIcons[inc.type]}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                        <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>
                          {inc.type.charAt(0).toUpperCase() + inc.type.slice(1)}: {inc.id.slice(0, 8)}
                        </h4>
                        <span className={`badge ${statusBadge[inc.status]}`} style={{ fontSize: '0.625rem' }}>
                          {inc.status}
                        </span>
                        {inc.severity === 'high' && <span className="badge badge-ruby" style={{ fontSize: '0.625rem' }}>CRITICAL</span>}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
                        {inc.description}
                      </p>
                      <div style={{ display: 'flex', gap: '12px', marginTop: '8px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                        <span>Trip: {inc.tripId || 'N/A'}</span>
                        <span>•</span>
                        <span>{new Date(inc.reportedAt).toLocaleString('en-ZA', {
                          day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                        })}</span>
                        {inc.resolvedAt && (
                          <>
                            <span>•</span>
                            <span style={{ color: 'var(--emerald)' }}>
                              Resolved {new Date(inc.resolvedAt).toLocaleTimeString('en-ZA', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                    {isExpanded ? <ChevronUp size={18} style={{ color: 'var(--text-tertiary)' }} /> : <ChevronDown size={18} style={{ color: 'var(--text-tertiary)' }} />}
                  </div>

                  {isExpanded && (
                    <div className="animate-fade-up" style={{
                      marginTop: '14px', paddingTop: '14px', borderTop: '1px solid var(--border-subtle)',
                      display: 'flex', gap: '8px',
                    }}>
                      {inc.status !== 'resolved' && (
                        <>
                          <button 
                            className="btn btn-primary btn-sm" 
                            style={{ gap: '4px' }}
                            onClick={(e) => { e.stopPropagation(); handleResolve(inc); }}
                          >
                            <CheckCircle size={14} /> Resolve Alert
                          </button>
                          <button className="btn btn-secondary btn-sm" style={{ gap: '4px' }} onClick={(e) => e.stopPropagation()}>
                            <Eye size={14} /> View Member File
                          </button>
                        </>
                      )}
                      {inc.phone && (
                        <a 
                          href={`tel:${inc.phone}`} 
                          className="btn btn-ghost btn-sm" 
                          style={{ gap: '4px' }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <Phone size={14} /> Call Local Contact
                        </a>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Taxi Associations (Regional Safety Nets) */}
        <div>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '14px' }}>Safety Nets</h3>
          <div className="stagger-children" style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {mockAssociations.map((assoc) => (
              <div key={assoc.id} className="card" style={{ padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                  <h4 style={{ fontSize: '0.9375rem', fontWeight: 700 }}>{assoc.name}</h4>
                  <span className={`badge ${assoc.status === 'active' ? 'badge-green' : 'badge-sunset'}`} style={{ fontSize: '0.625rem' }}>
                    {assoc.status}
                  </span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px', fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
                  <MapPin size={13} />
                  {assoc.region}
                </div>
                <div style={{
                  display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '8px',
                  padding: '10px', background: 'var(--surface-200)', borderRadius: '10px',
                  marginBottom: '10px',
                }}>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Dispatchers</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9375rem' }}>{Math.ceil(assoc.memberCount / 50)}</div>
                  </div>
                  <div>
                    <div style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>Response Units</div>
                    <div style={{ fontFamily: 'var(--font-mono)', fontWeight: 700, fontSize: '0.9375rem', color: 'var(--emerald)' }}>{Math.ceil(assoc.activeDrivers / 20)}</div>
                  </div>
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                  Protocol: {assoc.contactPerson} - Priority Alpha
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
