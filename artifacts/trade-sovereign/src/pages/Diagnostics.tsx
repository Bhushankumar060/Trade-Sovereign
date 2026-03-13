import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { CheckCircle, XCircle, AlertTriangle, RefreshCw, ChevronDown, ChevronUp, Copy, ExternalLink, Zap, Database, Shield, Brain, CreditCard, Server } from "lucide-react";
import { Button, Badge } from "@/components/ui/design-system";
import { apiFetch } from "@/lib/fetch-interceptor";
import { cn } from "@/lib/utils";
import { getAuth } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface CheckItem {
  status: "ok" | "error" | "warn";
  message: string;
  detail?: string;
}

interface DiagnosticsData {
  status: "healthy" | "degraded" | "partial";
  uptime: number;
  responseTimeMs: number;
  checks: Record<string, CheckItem>;
  firebase_setup_guide: Record<string, string>;
}

const ENDPOINTS = [
  { label: "Health Check", url: "/api/healthz", method: "GET" },
  { label: "Products", url: "/api/products?limit=1", method: "GET" },
  { label: "Categories", url: "/api/categories", method: "GET" },
  { label: "Subscription Plans", url: "/api/subscriptions/plans", method: "GET" },
  { label: "Media", url: "/api/media?limit=1", method: "GET" },
  { label: "Pages", url: "/api/pages", method: "GET" },
  { label: "AI Settings", url: "/api/ai/settings", method: "GET" },
  { label: "Rewards Leaderboard", url: "/api/rewards/leaderboard", method: "GET" },
  { label: "Auth (me)", url: "/api/auth/me", method: "GET", expectAuth: true },
  { label: "Admin Stats", url: "/api/admin/stats", method: "GET", expectAdmin: true },
];

const CHECK_ICONS: Record<string, any> = {
  env_database_url: Database,
  env_gemini: Brain,
  env_razorpay: CreditCard,
  env_firebase_admin: Shield,
  env_firebase_client: Shield,
  database_connection: Database,
  database_tables: Database,
  ai_settings: Brain,
};

const CHECK_LABELS: Record<string, string> = {
  env_database_url: "Database URL",
  env_gemini: "Gemini AI Key",
  env_razorpay: "Razorpay Keys",
  env_firebase_admin: "Firebase Admin",
  env_firebase_client: "Firebase Client",
  database_connection: "DB Connection",
  database_tables: "DB Tables & Seed Data",
  ai_settings: "AI Configuration",
};

function StatusIcon({ status, size = 18 }: { status: "ok" | "error" | "warn" | "loading"; size?: number }) {
  if (status === "ok") return <CheckCircle size={size} className="text-emerald-400" />;
  if (status === "error") return <XCircle size={size} className="text-red-400" />;
  if (status === "warn") return <AlertTriangle size={size} className="text-yellow-400" />;
  return <RefreshCw size={size} className="text-muted-foreground animate-spin" />;
}

function EndpointRow({ label, url, method, expectAuth, expectAdmin }: typeof ENDPOINTS[0]) {
  const [status, setStatus] = useState<"loading" | "ok" | "warn" | "error">("loading");
  const [code, setCode] = useState<number | null>(null);

  useEffect(() => {
    const base = import.meta.env.BASE_URL.replace(/\/$/, "");
    fetch(base + url)
      .then(r => {
        setCode(r.status);
        if (r.status === 200) setStatus("ok");
        else if ((r.status === 401 && expectAuth) || (r.status === 403 && expectAdmin)) setStatus("warn");
        else setStatus("error");
      })
      .catch(() => setStatus("error"));
  }, [url, expectAuth, expectAdmin]);

  const statusLabel = code
    ? code === 200 ? "OK" : code === 401 ? "Needs Auth" : code === 403 ? "Needs Admin" : `Error ${code}`
    : "Checking...";

  return (
    <div className="flex items-center justify-between py-3 border-b border-white/5 last:border-0">
      <div className="flex items-center gap-3">
        <StatusIcon status={status} size={16} />
        <span className="text-sm font-medium">{label}</span>
        <code className="text-xs text-muted-foreground font-mono bg-white/5 px-2 py-0.5 rounded">{method} {url}</code>
        {(expectAuth || expectAdmin) && (
          <Badge variant="outline" className="text-[10px]">{expectAdmin ? "Admin only" : "Auth required"}</Badge>
        )}
      </div>
      <span className={cn("text-xs font-mono", {
        "text-emerald-400": status === "ok",
        "text-yellow-400": status === "warn",
        "text-red-400": status === "error",
        "text-muted-foreground": status === "loading",
      })}>{statusLabel}</span>
    </div>
  );
}

function FirebaseStatus() {
  const [fbStatus, setFbStatus] = useState<"loading" | "ok" | "error">("loading");
  const [fbError, setFbError] = useState<string>("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    const a = getAuth();
    if (!a.app.options.apiKey) {
      setFbStatus("error");
      setFbError("Firebase API key not found in environment variables.");
      return;
    }
    const apiKey = a.app.options.apiKey;
    const projectId = a.app.options.projectId;
    fetch(`https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${apiKey}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ idToken: "test" }),
    })
      .then(r => r.json())
      .then(data => {
        if (data.error?.message === "INVALID_ID_TOKEN" || data.error?.message?.includes("INVALID")) {
          setFbStatus("ok");
          setFbError("");
        } else if (data.error?.message?.toLowerCase().includes("api key not valid") || data.error?.status === "INVALID_ARGUMENT") {
          setFbStatus("error");
          setFbError(`API key invalid: The key "${apiKey?.substring(0, 8)}..." was rejected by Firebase. This usually means Authentication is not enabled in your Firebase project.`);
          setExpanded(true);
        } else if (data.error) {
          setFbStatus("ok");
        } else {
          setFbStatus("ok");
        }
      })
      .catch(() => {
        setFbStatus("error");
        setFbError("Could not reach Firebase servers. Check your network.");
      });
  }, []);

  return (
    <div className={cn("rounded-xl border p-4", {
      "border-emerald-500/30 bg-emerald-500/5": fbStatus === "ok",
      "border-red-500/30 bg-red-500/5": fbStatus === "error",
      "border-white/10 bg-white/5": fbStatus === "loading",
    })}>
      <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpanded(!expanded)}>
        <div className="flex items-center gap-3">
          <StatusIcon status={fbStatus} />
          <div>
            <p className="font-medium text-sm">Firebase Authentication</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {fbStatus === "loading" ? "Verifying Firebase connection..." : fbStatus === "ok" ? "Firebase is reachable and keys are valid" : fbError}
            </p>
          </div>
        </div>
        {fbStatus === "error" && (
          <button className="text-muted-foreground hover:text-white transition-colors">
            {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          </button>
        )}
      </div>

      {fbStatus === "error" && expanded && (
        <div className="mt-4 space-y-3 border-t border-white/10 pt-4">
          <p className="text-sm font-semibold text-yellow-400">How to fix this:</p>
          <ol className="space-y-2">
            {[
              { step: "1", text: "Open Firebase Console", url: "https://console.firebase.google.com", action: "Open Console" },
              { step: "2", text: 'Go to Build > Authentication > Sign-in method, and Enable "Email/Password"', url: null, action: null },
              { step: "3", text: "Go to Authentication > Settings > Authorized domains, add your Replit domain", url: null, action: null },
              { step: "4", text: "Go to Project Settings > General > Your Apps, copy the Web API Key", url: null, action: null },
              { step: "5", text: "In Replit Secrets, update VITE_FIREBASE_API_KEY with the copied key", url: null, action: null },
              { step: "6", text: "Restart all workflows after updating secrets", url: null, action: null },
            ].map((item) => (
              <li key={item.step} className="flex items-start gap-3 text-xs text-muted-foreground">
                <span className="w-5 h-5 rounded-full bg-red-500/20 text-red-400 flex items-center justify-center font-bold flex-shrink-0 mt-0.5">{item.step}</span>
                <span className="flex-1">{item.text}</span>
                {item.url && (
                  <a href={item.url} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-primary hover:underline flex-shrink-0">
                    {item.action} <ExternalLink size={10} />
                  </a>
                )}
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}

export default function Diagnostics() {
  const [expanded, setExpanded] = useState<string | null>(null);

  const { data, isLoading, refetch, dataUpdatedAt } = useQuery<DiagnosticsData>({
    queryKey: ["diagnostics"],
    queryFn: async () => {
      const r = await apiFetch("/api/healthz/detailed");
      return r.json();
    },
    refetchInterval: 30000,
  });

  const overallStatus = data?.status;
  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : null;

  const totalChecks = Object.values(data?.checks ?? {}).length;
  const okChecks = Object.values(data?.checks ?? {}).filter(c => c.status === "ok").length;
  const errorChecks = Object.values(data?.checks ?? {}).filter(c => c.status === "error").length;
  const warnChecks = Object.values(data?.checks ?? {}).filter(c => c.status === "warn").length;

  return (
    <div className="min-h-screen py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
                <Zap className="w-5 h-5 text-primary" />
              </div>
              <h1 className="text-2xl font-display font-bold">System Diagnostics</h1>
            </div>
            <p className="text-muted-foreground text-sm">Real-time health check for all Trade Sovereign systems</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>}
            <Button variant="glass" size="sm" onClick={() => refetch()} className="gap-2">
              <RefreshCw className="w-3 h-3" /> Refresh
            </Button>
          </div>
        </div>

        {/* Overall Status Banner */}
        <div className={cn("rounded-xl border p-5 mb-8 flex items-center gap-4", {
          "border-emerald-500/30 bg-emerald-500/5": overallStatus === "healthy",
          "border-red-500/30 bg-red-500/5": overallStatus === "degraded",
          "border-yellow-500/30 bg-yellow-500/5": overallStatus === "partial",
          "border-white/10 bg-white/5": !overallStatus,
        })}>
          {isLoading ? (
            <RefreshCw className="w-8 h-8 text-muted-foreground animate-spin" />
          ) : overallStatus === "healthy" ? (
            <CheckCircle className="w-8 h-8 text-emerald-400" />
          ) : overallStatus === "degraded" ? (
            <XCircle className="w-8 h-8 text-red-400" />
          ) : (
            <AlertTriangle className="w-8 h-8 text-yellow-400" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-lg capitalize">
              {isLoading ? "Running diagnostics..." : `System ${overallStatus ?? "checking"}`}
            </p>
            <p className="text-sm text-muted-foreground">
              {!isLoading && `${okChecks}/${totalChecks} checks passed · ${errorChecks} errors · ${warnChecks} warnings · ${data?.responseTimeMs}ms response`}
            </p>
          </div>
          {data && (
            <div className="flex gap-3">
              <div className="text-center">
                <p className="text-2xl font-bold text-emerald-400">{okChecks}</p>
                <p className="text-xs text-muted-foreground">Passing</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-red-400">{errorChecks}</p>
                <p className="text-xs text-muted-foreground">Errors</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-yellow-400">{warnChecks}</p>
                <p className="text-xs text-muted-foreground">Warnings</p>
              </div>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {/* Firebase Client Check */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Shield size={14} /> Firebase Authentication
            </h2>
            <FirebaseStatus />
          </section>

          {/* Backend System Checks */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Server size={14} /> Backend Systems
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] divide-y divide-white/5">
              {Object.entries(data?.checks ?? {}).map(([key, check]) => {
                const Icon = CHECK_ICONS[key] ?? Server;
                const isOpen = expanded === key;
                return (
                  <div key={key}>
                    <button
                      className="w-full flex items-center justify-between p-4 text-left hover:bg-white/5 transition-colors"
                      onClick={() => setExpanded(isOpen ? null : key)}
                    >
                      <div className="flex items-center gap-3">
                        <StatusIcon status={check.status} size={16} />
                        <div>
                          <p className="text-sm font-medium">{CHECK_LABELS[key] ?? key}</p>
                          <p className="text-xs text-muted-foreground">{check.message}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge variant={check.status === "ok" ? "success" : check.status === "warn" ? "warning" : "destructive"} className="text-[10px]">
                          {check.status.toUpperCase()}
                        </Badge>
                        {check.detail && (isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />)}
                      </div>
                    </button>
                    {check.detail && isOpen && (
                      <div className="px-4 pb-4">
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 text-sm text-red-300">
                          <p className="font-semibold mb-1">How to fix:</p>
                          <p>{check.detail}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isLoading && [1,2,3,4,5].map(i => (
                <div key={i} className="p-4 flex items-center gap-3 animate-pulse">
                  <div className="w-4 h-4 rounded-full bg-white/10" />
                  <div className="h-3 bg-white/10 rounded w-48" />
                </div>
              ))}
            </div>
          </section>

          {/* API Endpoints */}
          <section>
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
              <Zap size={14} /> API Endpoints
            </h2>
            <div className="rounded-xl border border-white/10 bg-white/[0.02] px-4">
              {ENDPOINTS.map(ep => (
                <EndpointRow key={ep.url} {...ep} />
              ))}
            </div>
          </section>

          {/* Firebase Setup Guide */}
          {data?.firebase_setup_guide && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                <Shield size={14} /> Firebase Setup Guide
              </h2>
              <div className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
                {Object.entries(data.firebase_setup_guide).map(([key, value]) => (
                  <div key={key} className="flex items-start gap-3 text-sm">
                    <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {key.replace("step", "")}
                    </span>
                    <span className="text-muted-foreground flex-1">{value}</span>
                    {value.includes("http") && (
                      <a href={value.match(/https?:\/\/[^\s]+/)?.[0]} target="_blank" rel="noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs flex-shrink-0">
                        Open <ExternalLink size={10} />
                      </a>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Server Info */}
          {data && (
            <section>
              <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wider mb-3">Server Info</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "Uptime", value: `${Math.floor(data.uptime / 60)}m ${Math.floor(data.uptime % 60)}s` },
                  { label: "Response Time", value: `${data.responseTimeMs}ms` },
                  { label: "Status", value: data.status },
                  { label: "Environment", value: "Development" },
                ].map(item => (
                  <div key={item.label} className="glass-card rounded-xl p-4 text-center">
                    <p className="text-lg font-bold font-mono">{item.value}</p>
                    <p className="text-xs text-muted-foreground mt-1">{item.label}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
