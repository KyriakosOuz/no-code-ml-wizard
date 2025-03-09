
import { Route, Routes } from "react-router-dom";
import { Toaster } from "@/components/ui/toaster";
import Index from "@/pages/Index";
import Dashboard from "@/pages/Dashboard";
import { AuthProvider } from "@/contexts/AuthContext";
import Auth from "@/pages/Auth";
import NotFound from "@/pages/NotFound";
import AutoMLDashboard from "@/components/AutoMLDashboard";

function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/automl" element={<AutoMLDashboard />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
      <Toaster />
    </AuthProvider>
  );
}

export default App;
