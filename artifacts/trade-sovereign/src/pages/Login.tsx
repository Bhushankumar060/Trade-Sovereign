import { useState } from "react";
import { Link, useLocation } from "wouter";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button, Card, Input, Label } from "@/components/ui/design-system";
import { useToast } from "@/hooks/use-toast";
import { Activity, AlertCircle, ExternalLink } from "lucide-react";

const FIREBASE_ERROR_MAP: Record<string, { message: string; fix?: string; fixUrl?: string }> = {
  "auth/api-key-not-valid.-please-pass-a-valid-api-key.": {
    message: "Firebase API key is invalid.",
    fix: "Authentication is not enabled in Firebase Console, or the API key is wrong. Click to see setup guide.",
    fixUrl: "/diagnostics",
  },
  "auth/invalid-api-key": {
    message: "Firebase API key is invalid.",
    fix: "Check VITE_FIREBASE_API_KEY in your Replit Secrets.",
    fixUrl: "/diagnostics",
  },
  "auth/user-not-found": {
    message: "No account found with this email.",
    fix: "Try registering a new account instead.",
  },
  "auth/wrong-password": {
    message: "Incorrect password.",
    fix: "Double-check your password or use 'Forgot Password'.",
  },
  "auth/invalid-credential": {
    message: "Email or password is incorrect.",
    fix: "Check your credentials and try again.",
  },
  "auth/too-many-requests": {
    message: "Too many failed attempts. Account temporarily locked.",
    fix: "Wait a few minutes before trying again.",
  },
  "auth/network-request-failed": {
    message: "Network error — could not reach Firebase.",
    fix: "Check your internet connection.",
  },
  "auth/operation-not-allowed": {
    message: "Email/Password login is not enabled.",
    fix: "Enable Email/Password in Firebase Console > Authentication > Sign-in method.",
    fixUrl: "/diagnostics",
  },
  "auth/configuration-not-found": {
    message: "Firebase project not found or misconfigured.",
    fix: "Check all VITE_FIREBASE_* secrets match your Firebase project.",
    fixUrl: "/diagnostics",
  },
};

function parseFirebaseError(error: any): { message: string; fix?: string; fixUrl?: string } {
  const code = error?.code as string;
  if (code && FIREBASE_ERROR_MAP[code]) return FIREBASE_ERROR_MAP[code];
  const raw = error?.message ?? "An unexpected error occurred.";
  if (raw.toLowerCase().includes("api-key-not-valid") || raw.toLowerCase().includes("api key not valid")) {
    return FIREBASE_ERROR_MAP["auth/api-key-not-valid.-please-pass-a-valid-api-key."];
  }
  return { message: raw };
}

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorInfo, setErrorInfo] = useState<{ message: string; fix?: string; fixUrl?: string } | null>(null);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorInfo(null);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Welcome back", description: "Successfully logged in." });
      setLocation("/dashboard");
    } catch (error: any) {
      const info = parseFirebaseError(error);
      setErrorInfo(info);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setErrorInfo(null);
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      toast({ title: "Welcome!", description: "Signed in with Google." });
      setLocation("/dashboard");
    } catch (error: any) {
      const info = parseFirebaseError(error);
      setErrorInfo(info);
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute inset-0 z-0">
        <img src={`${import.meta.env.BASE_URL}images/hero-bg.png`} className="w-full h-full object-cover opacity-50 blur-xl" alt="bg" />
      </div>

      <Card className="w-full max-w-md relative z-10 p-8">
        <div className="flex justify-center mb-8">
          <div className="w-12 h-12 bg-primary/10 border border-primary/20 rounded-xl flex items-center justify-center">
            <Activity className="w-6 h-6 text-primary" />
          </div>
        </div>

        <h2 className="text-2xl font-display font-bold text-center mb-2">Access Portal</h2>
        <p className="text-muted-foreground text-center mb-8 text-sm">Enter your credentials to continue.</p>

        {errorInfo && (
          <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-red-300">Login Failed</p>
                <p className="text-xs text-red-400 mt-1">{errorInfo.message}</p>
                {errorInfo.fix && (
                  <p className="text-xs text-muted-foreground mt-2">{errorInfo.fix}</p>
                )}
                {errorInfo.fixUrl && (
                  <Link href={errorInfo.fixUrl} className="inline-flex items-center gap-1 text-xs text-primary hover:underline mt-2">
                    Open Diagnostics Panel <ExternalLink size={10} />
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="commander@sovereign.net" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>
            Authenticate
          </Button>
        </form>

        <div className="relative my-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-xs text-muted-foreground">
            <span className="bg-card px-3">or continue with</span>
          </div>
        </div>

        <Button
          variant="glass"
          className="w-full gap-2"
          isLoading={googleLoading}
          onClick={handleGoogle}
          type="button"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Sign in with Google
        </Button>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          No account?{" "}
          <Link href="/register" className="text-primary hover:underline">Request access</Link>
        </p>

        <p className="text-center mt-3 text-xs text-muted-foreground">
          Having trouble?{" "}
          <Link href="/diagnostics" className="text-muted-foreground hover:text-primary transition-colors">Run diagnostics</Link>
        </p>
      </Card>
    </div>
  );
}
