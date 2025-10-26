import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { X } from "lucide-react";

interface AuthDialogProps {
  onLogin: (user: any) => void;
  onClose: () => void;
}

export function AuthDialog({ onLogin, onClose }: AuthDialogProps) {
  const [isLogin, setIsLogin] = useState(true);
  const [step, setStep] = useState<'choice' | 'login' | 'signup' | 'profile'>('choice');
  const [formData, setFormData] = useState({
    username: '',
    password: '',
    name: '',
    age: '',
    gender: '',
    occupation: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Login failed');
        return;
      }
      
      onLogin(data.user);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleSignup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: formData.username,
          password: formData.password,
          name: formData.name,
          age: formData.age ? parseInt(formData.age) : undefined,
          gender: formData.gender || undefined,
          occupation: formData.occupation || undefined,
        }),
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        setError(data.error || 'Signup failed');
        return;
      }
      
      onLogin(data.user);
    } catch (err) {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
      <div className="backdrop-blur-xl rounded-3xl p-8 max-w-md w-full border shadow-2xl" style={{ backgroundColor: '#CAC3A8' }}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            {step === 'choice' ? 'Welcome to Mood.ai' : step === 'login' ? 'Login' : step === 'signup' ? 'Create Account' : 'Complete Your Profile'}
          </h2>
          <Button
            size="icon"
            variant="ghost"
            onClick={onClose}
            className="hover:bg-black/10"
          >
            <X className="w-5 h-5" />
          </Button>
        </div>

        {error && (
          <div className="mb-4 p-3 rounded-lg bg-red-100 border border-red-300">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {step === 'choice' && (
          <div className="space-y-4">
            <p className="text-gray-700 mb-6">Do you have an account?</p>
            <Button
              onClick={() => setStep('login')}
              className="w-full text-gray-900"
              style={{ backgroundColor: '#FABA85' }}
            >
              Yes, I have an account
            </Button>
            <Button
              onClick={() => setStep('signup')}
              className="w-full text-gray-900"
              style={{ backgroundColor: '#FABA85' }}
            >
              No, create new account
            </Button>
            <Button
              onClick={onClose}
              variant="outline"
              className="w-full text-gray-900 border-gray-300"
            >
              Continue as Guest
            </Button>
          </div>
        )}

        {step === 'login' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="username" className="text-gray-900">Username</Label>
              <Input
                id="username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Enter your username"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-gray-900">Password</Label>
              <Input
                id="password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Enter your password"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleLogin}
              disabled={loading || !formData.username || !formData.password}
              className="w-full text-gray-900"
              style={{ backgroundColor: '#FABA85' }}
            >
              {loading ? 'Logging in...' : 'Login'}
            </Button>
            <Button
              onClick={() => setStep('choice')}
              variant="ghost"
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === 'signup' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="signup-username" className="text-gray-900">Username *</Label>
              <Input
                id="signup-username"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                placeholder="Choose a username"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="signup-password" className="text-gray-900">Password *</Label>
              <Input
                id="signup-password"
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Choose a password (min 6 characters)"
                className="mt-1"
              />
            </div>
            <Button
              onClick={() => setStep('profile')}
              disabled={!formData.username || formData.password.length < 6}
              className="w-full text-gray-900"
              style={{ backgroundColor: '#FABA85' }}
            >
              Next: Profile Details
            </Button>
            <Button
              onClick={() => setStep('choice')}
              variant="ghost"
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}

        {step === 'profile' && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="name" className="text-gray-900">Full Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Enter your name"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="age" className="text-gray-900">Age</Label>
              <Input
                id="age"
                type="number"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Enter your age"
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="gender" className="text-gray-900">Gender</Label>
              <select
                id="gender"
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="w-full mt-1 px-3 py-2 border rounded-md"
              >
                <option value="">Select gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
                <option value="prefer_not_to_say">Prefer not to say</option>
              </select>
            </div>
            <div>
              <Label htmlFor="occupation" className="text-gray-900">Occupation</Label>
              <Input
                id="occupation"
                value={formData.occupation}
                onChange={(e) => setFormData({ ...formData, occupation: e.target.value })}
                placeholder="Enter your occupation"
                className="mt-1"
              />
            </div>
            <Button
              onClick={handleSignup}
              disabled={loading || !formData.name}
              className="w-full text-gray-900"
              style={{ backgroundColor: '#FABA85' }}
            >
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
            <Button
              onClick={() => setStep('signup')}
              variant="ghost"
              className="w-full"
            >
              Back
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
