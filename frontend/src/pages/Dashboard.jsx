import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      }
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontSize: '1.2rem' }}>Loading secure dashboard...</div>;
  }

  return (
    <div style={{ padding: '4rem 2rem', maxWidth: '800px', margin: '0 auto', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2.5rem', marginBottom: '1rem', color: '#111827' }}>
        Welcome, {profile?.full_name || 'User'}
      </h1>
      
      <div style={{ 
        background: 'white', 
        padding: '3rem', 
        borderRadius: '16px', 
        border: '1px solid #E5E7EB',
        boxShadow: '0 10px 25px rgba(0,0,0,0.05)',
        marginTop: '2rem'
      }}>
        <h2 style={{ color: '#991B1B', marginBottom: '1rem' }}>
          This dashboard is for {profile?.role || 'STUDENT'}
        </h2>
        <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
          (The full UI for this specific role will be built here later)
        </p>
        
        <button 
          onClick={async () => { await supabase.auth.signOut(); navigate('/'); }} 
          className="btn btn-primary"
        >
          Sign Out Securely
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
