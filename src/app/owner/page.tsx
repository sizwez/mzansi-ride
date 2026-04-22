'use client';

import React, { useState, useEffect } from 'react';
import { 
  Car, Users, TrendingUp, DollarSign, 
  MapPin, AlertTriangle, ShieldCheck, 
  ChevronRight, Activity, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { OwnerService } from '@/services/api';
import { formatCurrency } from '@/lib/fare-calculator';

export default function OwnerDashboard() {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newVehicle, setNewVehicle] = useState({
    make: '', model: '', plateNumber: '', year: new Date().getFullYear().toString(), color: ''
  });

  useEffect(() => {
    if (!user) return;
    const fetchMetrics = async () => {
      try {
        const data = await OwnerService.getFleetMetrics(user.id);
        setMetrics(data);
      } catch (err) {
        console.error('Error fetching fleet metrics:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMetrics();
  }, [user]);

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);
    try {
      await OwnerService.registerVehicle(user.id, newVehicle);
      // Refresh metrics
      const data = await OwnerService.getFleetMetrics(user.id);
      setMetrics(data);
      setIsModalOpen(false);
      setNewVehicle({ make: '', model: '', plateNumber: '', year: new Date().getFullYear().toString(), color: '' });
      alert('Vehicle successfully registered to the cooperative!');
    } catch (err: any) {
      console.error('Registration error:', err);
      alert('Registration failed: ' + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen">
        <Activity className="animate-pulse" color="var(--gold)" size={48} />
        <p className="mt-4 text-tertiary">Syncing Fleet Data...</p>
      </div>
    );
  }

  return (
    <div className="page-enter p-4 md:p-8 max-w-6xl mx-auto pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 style={{ fontSize: '2rem', fontWeight: 800 }}>Fleet Command</h1>
          <p style={{ color: 'var(--text-tertiary)' }}>Managing {metrics?.vehicleCount} Cooperative Vehicles</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="btn btn-primary" 
          style={{ background: 'var(--gradient-gold)', border: 'none' }}
        >
          <Plus size={18} /> Register New Vehicle
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-gold-subtle rounded-lg">
              <DollarSign size={20} color="var(--gold)" />
            </div>
            <span className="text-tertiary text-sm font-semibold">FLEET REVENUE</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{formatCurrency(metrics?.totalEarnings || 0)}</div>
          <div className="text-green-light text-xs font-bold mt-1">↑ 12% vs last week</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sky-subtle rounded-lg">
              <Activity size={20} color="var(--sky)" />
            </div>
            <span className="text-tertiary text-sm font-semibold">TOTAL TRIPS</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>{metrics?.totalTrips}</div>
          <div className="text-tertiary text-xs mt-1">Across all vehicles</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-subtle rounded-lg">
              <ShieldCheck size={20} color="var(--emerald)" />
            </div>
            <span className="text-tertiary text-sm font-semibold">FLEET HEALTH</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>98.2%</div>
          <div className="text-emerald text-xs font-bold mt-1">Optimal Performance</div>
        </div>
        <div className="card p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-sunset-subtle rounded-lg">
              <AlertTriangle size={20} color="var(--sunset)" />
            </div>
            <span className="text-tertiary text-sm font-semibold">PENDING TASKS</span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>2</div>
          <div className="text-sunset text-xs font-bold mt-1">Services Required</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Vehicle List */}
        <div className="lg:col-span-2">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Car size={20} color="var(--gold)" /> Active Fleet Inventory
          </h3>
          <div className="flex flex-col gap-3">
            {metrics?.vehicles.map((v: any) => (
              <div key={v.id} className="card-glass p-4 hover-gold transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-surface-200 rounded-xl flex items-center justify-center font-bold text-lg">
                      {v.plate.slice(-3)}
                    </div>
                    <div>
                      <div className="font-bold">{v.make} {v.model}</div>
                      <div className="text-xs text-tertiary font-mono">{v.plate}</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-bold text-emerald">{formatCurrency(v.earnings)}</div>
                    <div className="text-xs text-tertiary">Accumulated Today</div>
                  </div>
                  <ChevronRight size={18} className="text-tertiary ml-2" />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Sidebar: Real-time Feed */}
        <div>
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Users size={20} color="var(--sky)" /> Live Activity Feed
          </h3>
          <div className="card-glass p-1 h-[400px] overflow-y-auto">
            <div className="p-4 border-b border-subtle">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-green-light/10 rounded-full flex items-center justify-center">
                  <TrendingUp size={14} color="var(--green-light)" />
                </div>
                <div>
                  <div className="text-sm font-bold">Trip Completed</div>
                  <div className="text-xs text-tertiary">Vehicle ZT-45-GP just earned R145</div>
                </div>
              </div>
            </div>
            <div className="p-4 border-b border-subtle">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-sky/10 rounded-full flex items-center justify-center">
                  <MapPin size={14} color="var(--sky)" />
                </div>
                <div>
                  <div className="text-sm font-bold">Driver Online</div>
                  <div className="text-xs text-tertiary">Sipho M. is now active in Soweto</div>
                </div>
              </div>
            </div>
            <div className="p-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 bg-sunset/10 rounded-full flex items-center justify-center">
                  <AlertTriangle size={14} color="var(--sunset)" />
                </div>
                <div>
                  <div className="text-sm font-bold">Service Alert</div>
                  <div className="text-xs text-tertiary">Vehicle BK-99-GP requires oil change</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Register Vehicle Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div className="card-glass w-full max-w-md p-8 animate-scale-in" style={{ border: '1px solid var(--border-gold)' }}>
            <h2 className="text-2xl font-black mb-1">Add New Vehicle</h2>
            <p className="text-tertiary text-xs uppercase tracking-widest mb-6">Cooperative Fleet Expansion</p>
            
            <form onSubmit={handleRegister} className="flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Make</label>
                  <input 
                    type="text" required placeholder="name e.g. Toyota" 
                    className="p-3 bg-surface-200 border-subtle rounded-xl text-sm"
                    value={newVehicle.make}
                    onChange={e => setNewVehicle({...newVehicle, make: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Model</label>
                  <input 
                    type="text" required placeholder="e.g. Corolla" 
                    className="p-3 bg-surface-200 border-subtle rounded-xl text-sm"
                    value={newVehicle.model}
                    onChange={e => setNewVehicle({...newVehicle, model: e.target.value})}
                  />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">License Plate</label>
                <input 
                  type="text" required placeholder="e.g. ZT-45-GP" 
                  className="p-3 bg-surface-200 border-subtle rounded-xl text-sm font-mono"
                  value={newVehicle.plateNumber}
                  onChange={e => setNewVehicle({...newVehicle, plateNumber: e.target.value})}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Year</label>
                  <input 
                    type="number" required 
                    className="p-3 bg-surface-200 border-subtle rounded-xl text-sm"
                    value={newVehicle.year}
                    onChange={e => setNewVehicle({...newVehicle, year: e.target.value})}
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider opacity-60">Color</label>
                  <input 
                    type="text" required placeholder="e.g. White" 
                    className="p-3 bg-surface-200 border-subtle rounded-xl text-sm"
                    value={newVehicle.color}
                    onChange={e => setNewVehicle({...newVehicle, color: e.target.value})}
                  />
                </div>
              </div>

              <div className="mt-4 flex gap-3">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="btn btn-ghost flex-1"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="btn btn-primary flex-2"
                  style={{ background: 'var(--gradient-gold)', border: 'none' }}
                >
                  {isSubmitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
