'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, Users, Car, DollarSign, MapPin, Clock, ArrowUpRight, BarChart3, Activity } from 'lucide-react';
import { weeklyRideData, monthlyGrowthData, demandHeatmapData, mockAdminStats } from '@/lib/mock-data';
import { formatCurrency } from '@/lib/fare-calculator';

export default function AdminAnalytics() {
  const [mounted, setMounted] = useState(false);
  const stats = mockAdminStats;

  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const maxRevenue = Math.max(...weeklyRideData.map(d => d.revenue));
  const maxDemand = Math.max(...demandHeatmapData.map(d => d.demand));
  const totalWeeklyRevenue = weeklyRideData.reduce((s, d) => s + d.revenue, 0);
  const totalWeeklyRides = weeklyRideData.reduce((s, d) => s + d.rides, 0);

  return (
    <div className="page-enter">
      {/* Revenue Overview */}
      <div style={{
        background: 'linear-gradient(135deg, rgba(244,169,0,0.1) 0%, rgba(0,168,107,0.06) 100%)',
        border: '1px solid rgba(244,169,0,0.2)',
        borderRadius: '20px', padding: '28px', marginBottom: '28px',
        display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '24px',
      }}>
        {[
          { label: 'Revenue Today', value: formatCurrency(stats.revenueToday), change: '+5.3%', icon: DollarSign },
          { label: 'Revenue This Month', value: formatCurrency(stats.revenueThisMonth), change: '+12.5%', icon: TrendingUp },
          { label: 'Weekly Revenue', value: formatCurrency(totalWeeklyRevenue), change: '+8.1%', icon: BarChart3 },
          { label: 'Avg per Trip', value: formatCurrency(stats.revenueToday / stats.completedTripsToday), change: '+2.3%', icon: Activity },
        ].map((s, i) => (
          <div key={i}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
              <s.icon size={16} style={{ color: 'var(--gold)' }} />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-tertiary)', fontWeight: 500 }}>{s.label}</span>
            </div>
            <div style={{ fontFamily: 'var(--font-mono)', fontSize: '1.5rem', fontWeight: 700, marginBottom: '4px' }}>
              {s.value}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '0.75rem', color: 'var(--emerald)', fontWeight: 600 }}>
              <ArrowUpRight size={13} /> {s.change}
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '28px' }}>
        {/* Revenue Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Weekly Revenue</h3>
            <span className="badge badge-gold" style={{ fontSize: '0.6875rem' }}>
              {formatCurrency(totalWeeklyRevenue)}
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px' }}>
            {weeklyRideData.map((d, i) => (
              <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                  R{(d.revenue / 1000).toFixed(0)}k
                </span>
                <div style={{
                  width: '100%', borderRadius: '6px 6px 2px 2px',
                  background: 'linear-gradient(180deg, var(--emerald) 0%, rgba(52,211,153,0.3) 100%)',
                  height: `${(d.revenue / maxRevenue) * 140}px`,
                  transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                  transitionDelay: `${i * 60}ms`,
                  boxShadow: '0 -2px 8px rgba(52,211,153,0.15)',
                }} />
                <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{d.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ride Volume Chart */}
        <div className="card" style={{ padding: '24px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '1rem', fontWeight: 700 }}>Weekly Ride Volume</h3>
            <span className="badge badge-sky" style={{ fontSize: '0.6875rem' }}>
              {totalWeeklyRides.toLocaleString()} rides
            </span>
          </div>
          <div style={{ display: 'flex', alignItems: 'flex-end', gap: '10px', height: '180px' }}>
            {weeklyRideData.map((d, i) => {
              const maxRides = Math.max(...weeklyRideData.map(x => x.rides));
              return (
                <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.6rem', color: 'var(--text-tertiary)', fontFamily: 'var(--font-mono)' }}>
                    {d.rides.toLocaleString()}
                  </span>
                  <div style={{
                    width: '100%', borderRadius: '6px 6px 2px 2px',
                    background: 'linear-gradient(180deg, var(--sky) 0%, rgba(56,189,248,0.3) 100%)',
                    height: `${(d.rides / maxRides) * 140}px`,
                    transition: 'height 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
                    transitionDelay: `${i * 60}ms`,
                    boxShadow: '0 -2px 8px rgba(56,189,248,0.15)',
                  }} />
                  <span style={{ fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>{d.day}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Demand Heat Map & Growth */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
        {/* Demand Heat Map */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Demand Heatmap (Today)</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
            {demandHeatmapData.map((d, i) => {
              const intensity = d.demand / maxDemand;
              return (
                <div key={i} style={{
                  aspectRatio: '1',
                  borderRadius: '8px',
                  background: intensity > 0.8 ? 'var(--ruby)' :
                    intensity > 0.6 ? 'var(--sunset)' :
                    intensity > 0.4 ? 'var(--gold)' :
                    intensity > 0.2 ? 'rgba(244,169,0,0.3)' : 'var(--surface-300)',
                  display: 'flex', flexDirection: 'column',
                  alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.5625rem', fontWeight: 600,
                  color: intensity > 0.5 ? 'white' : 'var(--text-tertiary)',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  cursor: 'pointer',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.15)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.boxShadow = 'none';
                }}
                >
                  <span>{d.hour}</span>
                  <span style={{ fontFamily: 'var(--font-mono)' }}>{d.demand}%</span>
                </div>
              );
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px', fontSize: '0.6875rem', color: 'var(--text-tertiary)' }}>
            <span>Low demand</span>
            <div style={{ display: 'flex', gap: '3px' }}>
              {['var(--surface-300)', 'rgba(244,169,0,0.3)', 'var(--gold)', 'var(--sunset)', 'var(--ruby)'].map((c, i) => (
                <div key={i} style={{ width: 16, height: 8, borderRadius: '2px', background: c }} />
              ))}
            </div>
            <span>High demand</span>
          </div>
        </div>

        {/* Growth Trends */}
        <div className="card" style={{ padding: '24px' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '16px' }}>Growth Trends (6 months)</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {monthlyGrowthData.map((d, i) => (
              <div key={i}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 500, width: '36px', color: 'var(--text-tertiary)' }}>{d.month}</span>
                  <div style={{ display: 'flex', gap: '16px', fontSize: '0.75rem' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--sky)' }}>{d.riders.toLocaleString()} riders</span>
                    <span style={{ fontFamily: 'var(--font-mono)', color: 'var(--green-light)' }}>{d.drivers.toLocaleString()} drivers</span>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '4px', height: '8px' }}>
                  <div style={{
                    flex: d.riders, borderRadius: '4px',
                    background: 'linear-gradient(90deg, var(--sky), rgba(56,189,248,0.5))',
                    transition: 'flex 0.6s ease', transitionDelay: `${i * 80}ms`,
                  }} />
                  <div style={{
                    flex: d.drivers, borderRadius: '4px',
                    background: 'linear-gradient(90deg, var(--green-light), rgba(0,168,107,0.5))',
                    transition: 'flex 0.6s ease', transitionDelay: `${i * 80 + 40}ms`,
                  }} />
                </div>
              </div>
            ))}
          </div>
          <div style={{ display: 'flex', gap: '16px', marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--sky)' }} /> Riders
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.75rem', color: 'var(--text-tertiary)' }}>
              <div style={{ width: 10, height: 10, borderRadius: '2px', background: 'var(--green-light)' }} /> Drivers
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
