import React, { useState } from 'react';
import { supabase } from './supabaseClient'; // Adjust path if needed

export const Auth = () => {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const { error } = await supabase.auth.signInWithOtp({ email });
    
    if (error) {
      setErrorMessage(error.message);
    } else {
      setSent(true);
    }
    setLoading(false);
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#000', padding: '20px' }}>
      <div style={{ background: '#fff', padding: '40px', borderRadius: '24px', width: '100%', maxWidth: '400px', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
        
        <h1 style={{ fontFamily: 'serif', fontSize: '36px', textAlign: 'center', marginBottom: '8px', color: '#F6B45A' }}>Omnia</h1>
        <p style={{ textAlign: 'center', color: '#888', fontSize: '11px', letterSpacing: '3px', marginBottom: '30px' }}>LIGHT SCAPE PRO</p>

        {sent ? (
          <div style={{ background: '#e6ffed', padding: '20px', borderRadius: '12px', textAlign: 'center' }}>
            <p style={{ fontWeight: 'bold', color: '#2d8a5f' }}>Check your email!</p>
            <p style={{ fontSize: '12px', color: '#555', marginTop: '8px' }}>We sent a magic link to {email}</p>
            <button onClick={() => setSent(false)} style={{ marginTop: '16px', background: 'none', border: 'none', color: '#888', textDecoration: 'underline', cursor: 'pointer' }}>
              Use different email
            </button>
          </div>
        ) : (
          <form onSubmit={handleLogin}>
            <label style={{ display: 'block', fontSize: '10px', fontWeight: 'bold', color: '#111', marginBottom: '6px', letterSpacing: '1px' }}>EMAIL</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@company.com"
              required
              style={{ width: '100%', padding: '14px', border: '1px solid #ddd', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
            />
            {errorMessage && <p style={{ color: 'red', fontSize: '12px', marginBottom: '10px' }}>{errorMessage}</p>}
            <button
              type="submit"
              disabled={loading}
              style={{ width: '100%', background: '#111', color: '#fff', padding: '14px', border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '12px', letterSpacing: '2px', cursor: 'pointer' }}
            >
              {loading ? 'SENDING...' : 'SEND MAGIC LINK'}
            </button>
          </form>
        )}

        <p style={{ textAlign: 'center', fontSize: '9px', color: '#ccc', marginTop: '30px', letterSpacing: '2px' }}>© 2025 OMNIA DESIGN SUITE</p>
      </div>
    </div>
  );
};
