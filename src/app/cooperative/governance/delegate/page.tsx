'use client';

import { useState, useEffect } from 'react';
import { 
  Users, 
  Search, 
  Filter, 
  ChevronRight, 
  ShieldCheck, 
  Vote, 
  UserPlus, 
  XCircle,
  Award,
  ArrowLeft
} from 'lucide-react';
import { GovernanceService, RiderService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import Link from 'next/link';

export default function DelegateDirectory() {
  const { user } = useAuth();
  const [delegates, setDelegates] = useState<any[]>([]);
  const [myDelegations, setMyDelegations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('general');

  useEffect(() => {
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      // Mocked high-trust members for now, in real app would be a curated query
      const { data: members } = await (GovernanceService as any).supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id)
        .order('trust_score', { ascending: false })
        .limit(10);
      
      setDelegates(members || []);

      const mine = await GovernanceService.getMyDelegations(user.id);
      setMyDelegations(mine || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelegate = async (delegateId: string) => {
    try {
      await GovernanceService.delegatePower(delegateId, activeCategory);
      alert('Power delegated successfully.');
      loadData();
    } catch (err) {
      alert('Delegation failed.');
    }
  };

  const handleRevoke = async (category: string) => {
    try {
      await GovernanceService.revokeDelegation(category);
      alert('Delegation revoked.');
      loadData();
    } catch (err) {
      alert('Revocation failed.');
    }
  };

  const isAlreadyDelegated = (category: string) => {
    return myDelegations.find(d => d.category === category);
  };

  return (
    <div className="page-enter" style={{ minHeight: '100vh', background: '#0a0a0b', color: 'white', padding: '24px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '32px' }}>
         <Link href="/cooperative/governance" className="btn-icon">
            <ArrowLeft size={20} />
         </Link>
         <div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 800 }}>Delegate Directory</h1>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '0.8125rem' }}>Empower trusted representatives.</p>
         </div>
      </div>

      {/* Category Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', overflowX: 'auto', paddingBottom: '8px' }}>
         {['general', 'finance', 'safety', 'ops'].map(cat => (
            <button 
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={activeCategory === cat ? 'badge badge-sky' : 'badge badge-outline'}
              style={{ padding: '8px 16px', textTransform: 'capitalize', cursor: 'pointer' }}
            >
               {cat}
            </button>
         ))}
      </div>

      {/* Current Active Delegation */}
      {isAlreadyDelegated(activeCategory) && (
        <div className="card-glass" style={{ 
          padding: '16px', marginBottom: '32px', border: '1px solid var(--sky)', 
          background: 'rgba(0,210,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' 
        }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Vote size={20} color="var(--sky)" />
              <div>
                 <div style={{ fontSize: '0.875rem', fontWeight: 700 }}>Active Delegation: {activeCategory}</div>
                 <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>You are delegating to {myDelegations.find(d => d.category === activeCategory).delegate.name}</div>
              </div>
           </div>
           <button onClick={() => handleRevoke(activeCategory)} style={{ background: 'transparent', border: 'none', color: 'var(--ruby)', cursor: 'pointer' }}>
              <XCircle size={20} />
           </button>
        </div>
      )}

      {/* Search */}
      <div style={{ position: 'relative', marginBottom: '24px' }}>
         <Search style={{ position: 'absolute', left: '16px', top: '14px', color: 'var(--text-tertiary)' }} size={18} />
         <input 
            type="text" 
            placeholder="Search by name or member ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{ 
               width: '100%', padding: '14px 14px 14px 48px', borderRadius: '14px', 
               background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.05)', color: 'white' 
            }}
         />
      </div>

      {/* Delegate List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
         {delegates.filter(d => d.name.toLowerCase().includes(searchQuery.toLowerCase())).map((delegate) => (
            <div key={delegate.id} className="card-glass hover-scale" style={{ padding: '16px', display: 'flex', alignItems: 'center', gap: '16px' }}>
               <div className="avatar" style={{ background: 'var(--surface-300)' }}>
                  {delegate.name?.[0]}
               </div>
               <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                     <span style={{ fontWeight: 700 }}>{delegate.name}</span>
                     {delegate.trust_score > 90 && <Award size={14} color="var(--gold)" />}
                  </div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
                     Trust Score: {delegate.trust_score}% • {delegate.role}
                  </div>
               </div>
               <button 
                 onClick={() => handleDelegate(delegate.id)}
                 disabled={isAlreadyDelegated(activeCategory)}
                 className="btn btn-ghost" 
                 style={{ 
                   padding: '8px 12px', fontSize: '0.75rem', 
                   background: isAlreadyDelegated(activeCategory) ? 'transparent' : 'rgba(0,210,255,0.1)',
                   color: isAlreadyDelegated(activeCategory) ? 'var(--text-tertiary)' : 'var(--sky)' 
                 }}
               >
                  <UserPlus size={16} /> Delegate
               </button>
            </div>
         ))}
      </div>

      {/* Philosophy Card */}
      <div className="card-glass" style={{ marginTop: '40px', padding: '20px', background: 'rgba(255,215,0,0.03)', border: '1px solid rgba(255,215,0,0.1)' }}>
         <h4 style={{ fontSize: '0.875rem', fontWeight: 800, marginBottom: '12px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="var(--gold)" /> Liquid Democracy Notice
         </h4>
         <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Delegation is a tool for scale, not a loss of sovereignty. You can revoke your delegation at any time. If you cast a direct vote on a proposal, **your vote counts directly** and temporarily overrides your delegate's choice.
         </p>
      </div>

    </div>
  );
}
