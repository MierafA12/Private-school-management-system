import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

const Dashboard = () => {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProfile = async () => {
      // 1. Check demo session first
      const demoRaw = localStorage.getItem('demo_session');
      if (demoRaw) {
        try {
          const parsed = JSON.parse(demoRaw);
          if (parsed && parsed.user) {
            setProfile({
              full_name: parsed.user.user_metadata?.full_name || 'Academic User',
              role: parsed.user.user_metadata?.role || 'STUDENT'
            });
            setLoading(false);
            return;
          }
        } catch (e) {}
      }

      // 2. Check Supabase auth session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate('/login');
        return;
      }

      const { data } = await supabase
        .from('profiles')
        .select('role, full_name')
        .eq('id', session.user.id)
        .single();

      if (data) {
        setProfile(data);
      } else {
        setProfile({
          full_name: session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'Academic User',
          role: session.user.user_metadata?.role || 'STUDENT'
        });
      }
      setLoading(false);
    };

    fetchProfile();
  }, [navigate]);

  const handleSignOut = async () => {
    localStorage.removeItem('demo_session');
    await supabase.auth.signOut();
    navigate('/login');
  };

  if (loading) {
    return <div style={{ padding: '4rem', textAlign: 'center', fontSize: '1.2rem', color: '#111827' }}>Loading portal dashboard...</div>;
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
          Portal Role: {profile?.role || 'STUDENT'}
        </h2>
        <p style={{ color: '#6B7280', marginBottom: '2rem' }}>
          You have successfully authenticated into the Private School Management System portal.
        </p>
        
        <button 
          onClick={handleSignOut} 
          className="btn btn-primary"
        >
          Sign Out Securely
        </button>
      </div>
    </div>
  );
};

export default Dashboard;
