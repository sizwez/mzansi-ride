'use client';

import React, { useState, useEffect } from 'react';
import { Phone, PhoneOff, Mic, MicOff, ShieldCheck, User, Globe } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface CallOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  calleeName: string;
}

export default function CallOverlay({ isOpen, onClose, calleeName }: CallOverlayProps) {
  const [callStatus, setCallStatus] = useState<'connecting' | 'active' | 'ended'>('connecting');
  const [isMuted, setIsMuted] = useState(false);
  const [timer, setTimer] = useState(0);

  useEffect(() => {
    if (isOpen && callStatus === 'connecting') {
      const timeout = setTimeout(() => setCallStatus('active'), 2500);
      return () => clearTimeout(timeout);
    }
  }, [isOpen, callStatus]);

  useEffect(() => {
    let interval: any;
    if (callStatus === 'active') {
      interval = setInterval(() => setTimer(t => t + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [callStatus]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleEndCall = () => {
    setCallStatus('ended');
    setTimeout(() => {
      onClose();
      setCallStatus('connecting');
      setTimer(0);
    }, 1500);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 100 }}
          style={{
            position: 'fixed', inset: 0, zIndex: 9999,
            background: 'rgba(10, 14, 26, 0.95)',
            backdropFilter: 'blur(30px)',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            justifyContent: 'center', padding: '24px'
          }}
        >
          {/* Privacy Header */}
          <div style={{
            position: 'absolute', top: 40, display: 'flex', alignItems: 'center', gap: '8px',
            background: 'rgba(0,168,107,0.1)', padding: '8px 16px', borderRadius: '20px',
            border: '1px solid rgba(0,168,107,0.3)', color: 'var(--green-light)',
            fontSize: '0.75rem', fontWeight: 600
          }}>
            <ShieldCheck size={14} /> PRIVATE CO-OP CONNECTION (NO NUMBER SHARED)
          </div>

          {/* Caller Profile */}
          <div style={{ textAlign: 'center', marginBottom: '64px' }}>
            <div style={{
              width: 120, height: 120, borderRadius: '50%', background: 'var(--surface-200)',
              border: '4px solid var(--border-subtle)', margin: '0 auto 24px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative'
            }}>
              <User size={64} color="var(--text-tertiary)" />
              {callStatus === 'active' && (
                <motion.div
                  animate={{ scale: [1, 1.2, 1], opacity: [0.3, 0, 0.3] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  style={{
                    position: 'absolute', inset: -10, borderRadius: '50%',
                    border: '2px solid var(--green-light)'
                  }}
                />
              )}
            </div>
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '8px' }}>{calleeName}</h2>
            <p style={{ color: 'var(--text-tertiary)', fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <Globe size={16} /> 
              {callStatus === 'connecting' ? 'Connecting Securely...' : callStatus === 'active' ? formatTime(timer) : 'Call Ended'}
            </p>
          </div>

          {/* Call Controls */}
          <div style={{ display: 'flex', gap: '32px', alignItems: 'center' }}>
            <button 
              onClick={() => setIsMuted(!isMuted)}
              style={{
                width: 64, height: 64, borderRadius: '50%', border: '1px solid var(--border-subtle)',
                background: isMuted ? 'var(--surface-200)' : 'transparent',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: isMuted ? 'var(--gold)' : 'white', cursor: 'pointer', transition: 'all 0.2s'
              }}
            >
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
            </button>

            <button 
              onClick={handleEndCall}
              style={{
                width: 80, height: 80, borderRadius: '50%', background: 'var(--ruby)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', cursor: 'pointer', boxShadow: '0 0 30px rgba(239, 68, 68, 0.4)',
                border: 'none'
              }}
            >
              <PhoneOff size={32} />
            </button>

            <div style={{ width: 64, height: 64 }} /> {/* Spacer for balance */}
          </div>

          <div style={{ position: 'absolute', bottom: 40, color: 'var(--text-tertiary)', fontSize: '0.75rem', maxWidth: '300px', textAlign: 'center' }}>
            This call is routed through the Mzansi Ride private signaling network. Your personal phone number is never exposed to the other party.
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
