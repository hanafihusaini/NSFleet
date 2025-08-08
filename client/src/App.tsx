import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/Landing";
import Home from "@/pages/Home";
import BookingForm from "@/pages/BookingForm";
import BookingStatus from "@/pages/BookingStatus";
import Applications from "@/pages/Applications";
import Calendar from "@/pages/Calendar";
import Reports from "@/pages/Reports";
import Users from "@/pages/Users";
import Drivers from "@/pages/Drivers";
import Vehicles from "@/pages/Vehicles";
import NotFound from "@/pages/not-found";

function Router() {
  const { isAuthenticated, isLoading, user } = useAuth() as { isAuthenticated: boolean; isLoading: boolean; user?: any };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gov-blue mx-auto mb-4"></div>
          <p>Memuatkan...</p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Landing} />
      ) : (
        <>
          <Route path="/" component={user?.role === 'user' ? BookingForm : Applications} />
          <Route path="/booking" component={BookingForm} />
          <Route path="/status" component={BookingStatus} />
          <Route path="/applications" component={Applications} />
          <Route path="/calendar" component={Calendar} />
          <Route path="/reports" component={Reports} />
          <Route path="/users" component={Users} />
          <Route path="/drivers" component={Drivers} />
          <Route path="/vehicles" component={Vehicles} />
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
