import { useState } from "react";
import { Link, useLocation } from "wouter";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { Button, Card, Input, Label } from "@/components/ui/design-system";
import { useToast } from "@/hooks/use-toast";
import { Shield } from "lucide-react";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      await updateProfile(cred.user, { displayName: name });
      
      // Call backend to ensure profile sync via the interceptor immediately
      window.__FIREBASE_TOKEN__ = await cred.user.getIdToken();
      await fetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${window.__FIREBASE_TOKEN__}` },
        body: JSON.stringify({ displayName: name })
      });

      toast({ title: "Access Granted", description: "Account initialized successfully." });
      setLocation("/dashboard");
    } catch (error: any) {
      toast({ title: "Registration Failed", description: error.message, variant: "destructive" });
    } finally {
      setLoading(false);
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
            <Shield className="w-6 h-6 text-primary" />
          </div>
        </div>
        
        <h2 className="text-2xl font-display font-bold text-center mb-2">Initialize Account</h2>
        <p className="text-muted-foreground text-center mb-8 text-sm">Join the Sovereign network.</p>

        <form onSubmit={handleRegister} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="name">Display Name</Label>
            <Input id="name" required value={name} onChange={(e) => setName(e.target.value)} placeholder="Ghost Protocol" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="commander@sovereign.net" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Security Key</Label>
            <Input id="password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" />
          </div>
          <Button type="submit" className="w-full" isLoading={loading}>
            Establish Identity
          </Button>
        </form>

        <p className="text-center mt-6 text-sm text-muted-foreground">
          Already active? <Link href="/login" className="text-primary hover:underline">Authenticate</Link>
        </p>
      </Card>
    </div>
  );
}
