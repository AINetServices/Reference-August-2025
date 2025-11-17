import React, { useState } from 'react';
import { SignIn } from './SignIn';
import { SignUp } from './SignUp';
import { ForgotPassword } from './ForgotPassword';

type AuthMode = 'signin' | 'signup' | 'forgot';

export function AuthPage() {
  const [mode, setMode] = useState<AuthMode>('signin');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {mode === 'signin' && (
          <SignIn
            onSwitchToSignUp={() => setMode('signup')}
            onSwitchToForgot={() => setMode('forgot')}
          />
        )}
        {mode === 'signup' && (
          <SignUp onSwitchToSignIn={() => setMode('signin')} />
        )}
        {mode === 'forgot' && (
          <ForgotPassword onSwitchToSignIn={() => setMode('signin')} />
        )}
      </div>
    </div>
  );
}