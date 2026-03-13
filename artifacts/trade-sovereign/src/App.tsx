import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { CartProvider } from "@/contexts/CartContext";

// Lib setup
import "@/lib/fetch-interceptor";

// Pages
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Marketplace from "@/pages/Marketplace";
import MediaStore from "@/pages/MediaStore";
import Dashboard from "@/pages/Dashboard";
import Subscriptions from "@/pages/Subscriptions";
import Orders from "@/pages/Orders";
import Rewards from "@/pages/Rewards";
import Admin from "@/pages/Admin";
import AiChat from "@/pages/AiChat";
import DynamicPage from "@/pages/DynamicPage";
import NotFound from "@/pages/not-found";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/marketplace" component={Marketplace} />
      <Route path="/media" component={MediaStore} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/subscriptions" component={Subscriptions} />
      <Route path="/orders" component={Orders} />
      <Route path="/rewards" component={Rewards} />
      <Route path="/admin" component={Admin} />
      <Route path="/chat" component={AiChat} />
      <Route path="/pages/:slug" component={DynamicPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <TooltipProvider>
            <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
              <Router />
            </WouterRouter>
            <Toaster />
          </TooltipProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
