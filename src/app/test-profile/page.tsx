'use client';

import { useAuth } from '@/contexts/auth-context';
import { useEffect, useState } from 'react';

export default function TestProfile() {
  const { user, profile, loading } = useAuth();
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    if (profile) {
      setProfileData(profile);
    }
  }, [profile]);

  if (loading) {
    return <div className="p-8">Loading...</div>;
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Profile Test</h1>
      
      <div className="space-y-6">
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">User Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(user, null, 2)}
          </pre>
        </div>

        <div className="bg-blue-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Profile Info</h2>
          <pre className="text-sm overflow-auto">
            {JSON.stringify(profile, null, 2)}
          </pre>
        </div>

        <div className="bg-green-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Subscription Status</h2>
          <p><strong>subscription_status:</strong> {profile?.subscription_status || 'Not found'}</p>
          <p><strong>subscription_tier:</strong> {(profile as any)?.subscription_tier || 'Not found'}</p>
          <p><strong>user_type:</strong> {profile?.user_type || 'Not found'}</p>
        </div>

        <div className="bg-yellow-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Template Access Test</h2>
          <p>Current tier: {profile?.subscription_status || 'free'}</p>
          <p>Can access free templates: ✅</p>
          <p>Can access basic templates: {(profile?.subscription_status === 'basic' || profile?.subscription_status === 'premium' || profile?.subscription_status === 'enterprise') ? '✅' : '❌'}</p>
          <p>Can access premium templates: {(profile?.subscription_status === 'premium' || profile?.subscription_status === 'enterprise') ? '✅' : '❌'}</p>
          <p>Can access enterprise templates: {profile?.subscription_status === 'enterprise' ? '✅' : '❌'}</p>
        </div>
      </div>
    </div>
  );
}
