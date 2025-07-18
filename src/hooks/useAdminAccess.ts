// src/hooks/useAdminAccess.ts
'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

interface AdminRole {
  role: 'super_admin' | 'admin' | 'support' | 'analytics';
  permissions: string[];
  is_active: boolean;
}

export function useAdminAccess() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminRole, setAdminRole] = useState<AdminRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current session
      const { data: { session }, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        throw sessionError;
      }

      if (!session) {
        setIsAdmin(false);
        setAdminRole(null);
        setLoading(false);
        return;
      }

      // Get user admin role directly - admin_roles.user_id references auth.users.id directly
      const { data: adminRole, error: adminRoleError } = await supabase
        .from('admin_roles')
        .select(`
          role,
          permissions,
          is_active
        `)
        .eq('user_id', session.user.id)
        .eq('is_active', true)
        .single();

      if (adminRoleError) {
        // No admin role found is not an error - user is just not an admin
        console.log('No admin role found for user:', session.user.id);
        setIsAdmin(false);
        setAdminRole(null);
        setLoading(false);
        return;
      }

      // Check if user has active admin role
      if (adminRole && adminRole.is_active) {
        setIsAdmin(true);
        setAdminRole({
          role: adminRole.role,
          permissions: adminRole.permissions || [],
          is_active: adminRole.is_active
        });
      } else {
        setIsAdmin(false);
        setAdminRole(null);
      }

    } catch (err) {
      console.error('Admin access check error:', err);
      setError(err instanceof Error ? err.message : 'Failed to check admin access');
      setIsAdmin(false);
      setAdminRole(null);
    } finally {
      setLoading(false);
    }
  };

  const hasPermission = (permission: string): boolean => {
    if (!adminRole || !adminRole.is_active) return false;
    
    // Super admin has all permissions
    if (adminRole.role === 'super_admin') return true;
    
    // Check specific permission
    return adminRole.permissions.includes(permission);
  };

  const isSuperAdmin = (): boolean => {
    return adminRole?.role === 'super_admin' && adminRole.is_active;
  };

  return {
    isAdmin,
    adminRole,
    loading,
    error,
    hasPermission,
    isSuperAdmin,
    refreshAdminAccess: checkAdminAccess
  };
}