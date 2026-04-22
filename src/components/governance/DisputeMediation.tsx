'use client';

import React, { useState, useEffect } from 'react';
import { Gavel, AlertCircle, CheckCircle, Scale, MessageCircle, Info } from 'lucide-react';
import { DisputeService, GovernanceService } from '@/services/api';
import { useAuth } from '@/context/AuthContext';
import { formatCurrency } from '@/lib/fare-calculator';

export default function DisputeMediation() {
  const { user } = useAuth();
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDispute, setSelectedDispute] = useState<any>(null);
  const [mediationVote, setMediationVote] = useState('');
  const [comment, setComment] = useState('');
  const [quorumReached, setQuorumReached] = useState(false);
  const [memberProfile, setMemberProfile] = useState<any>(null);

  useEffect(() => {
    fetchQueue();
    if (user) fetchMemberStatus();
  }, [user]);

  const fetchMemberStatus = async () => {
    if (!user) return;
    try {
      const profile = await GovernanceService.getMemberProfile(user.id);
      setMemberProfile(profile);
    } catch (err) {
      console.error('Error fetching member status:', err);
    }
  };

  const fetchQueue = async () => {
    try {
      const data = await DisputeService.getMediationQueue();
      setQueue(data || []);
    } catch (err) {
      console.error('Error fetching mediation queue:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCastVote = async () => {
    if (!user || !selectedDispute || !mediationVote) return;
    
    if (memberProfile?.verification_status !== 'verified') {
      alert('Community Court is only accessible to verified members of the cooperative.');
      return;
    }

    try {
      await DisputeService.castMediationVote(selectedDispute.id, user.id, mediationVote, comment);
      alert('Mediation vote cast successfully. Thank you for your service to the cooperative.');
      setSelectedDispute(null);
      fetchQueue();
    } catch (err) {
      console.error('Error casting mediation vote:', err);
      alert('Failed to cast vote. Ensure you are an eligible mediator.');
    }
  };

  if (loading) return <div className="p-8 text-center text-tertiary">Loading Justice Ledger...</div>;

  return (
    <div className="stagger-children">
      {queue.length === 0 ? (
        <div className="card-glass p-12 text-center">
          <CheckCircle size={48} color="var(--green-light)" className="mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-bold">The Court is Clear</h3>
          <p className="text-tertiary">There are currently no active disputes requiring mediation.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Dispute List */}
          <div className="flex flex-col gap-4">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <Scale size={20} color="var(--gold)" /> Pending Mediation
            </h3>
            {queue.map((dispute) => (
              <div 
                key={dispute.id} 
                onClick={() => setSelectedDispute(dispute)}
                className={`card-glass p-4 cursor-pointer transition-all ${selectedDispute?.id === dispute.id ? 'border-gold' : 'border-subtle'}`}
              >
                <div className="flex justify-between items-start mb-2">
                  <span className="badge badge-gold">TRIP #{dispute.trip_id.slice(0, 8)}</span>
                  <span className="text-xs text-tertiary">{new Date(dispute.created_at).toLocaleDateString()}</span>
                </div>
                <div className="font-bold mb-1">{dispute.reason}</div>
                <div className="text-sm text-tertiary">
                  Reporter: {dispute.reporter?.name} vs Accused: {dispute.accused?.name}
                </div>
              </div>
            ))}
          </div>

          {/* Mediation Interface */}
          {selectedDispute ? (
            <div className="card p-6 animate-fade-in">
              <h3 className="text-xl font-bold mb-6 flex items-center gap-2">
                <Gavel size={24} color="var(--gold)" /> Case Review
              </h3>
              
              <div className="bg-surface-200 rounded-xl p-4 mb-6">
                <div className="flex items-center gap-2 text-gold font-bold mb-2">
                  <Info size={16} /> Incident Description
                </div>
                <p className="text-sm leading-relaxed">{selectedDispute.reason}</p>
              </div>

              {/* Verified Badge Check */}
              {memberProfile?.verification_status !== 'verified' && (
                <div className="p-4 bg-sunset-subtle border-sunset rounded-xl mb-6 flex gap-3 items-center">
                  <AlertCircle size={20} color="var(--sunset)" />
                  <div className="text-[10px] font-bold text-sunset uppercase">Trust Gate Active: Only verified members can mediate.</div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-3 bg-surface-100 rounded-lg border border-subtle">
                  <div className="text-xs text-tertiary">TRIP FARE</div>
                  <div className="font-bold">{formatCurrency(selectedDispute.trips?.fare_total || 0)}</div>
                </div>
                <div className="p-3 bg-surface-100 rounded-lg border border-subtle">
                  <div className="text-xs text-tertiary">STATUS</div>
                  <div className="font-bold text-amber-500 uppercase">{selectedDispute.status}</div>
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-3">Community Verdict</label>
                <div className="grid grid-cols-1 gap-2">
                  {['Rider at Fault', 'Driver at Fault', 'Mutual Fault', 'Dismiss Case'].map((option) => (
                    <button
                      key={option}
                      onClick={() => setMediationVote(option)}
                      className={`btn btn-sm text-left px-4 h-12 ${mediationVote === option ? 'btn-primary' : 'btn-ghost border-subtle'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-bold mb-3">Mediation Comments</label>
                <textarea 
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  placeholder="Explain your verdict based on community rules..."
                  className="w-100 p-4 border-subtle rounded-xl text-sm"
                  rows={3}
                />
              </div>

              <button 
                onClick={handleCastVote}
                disabled={!mediationVote || memberProfile?.verification_status !== 'verified'}
                className="btn btn-primary w-100"
              >
                {memberProfile?.verification_status !== 'verified' ? 'Verify Identity to Mediate' : 'Submit Official Verdict'}
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center p-12 card-glass border-dashed opacity-50">
              <Scale size={48} className="mb-4" />
              <p>Select a case to begin mediation</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
