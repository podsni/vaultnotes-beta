import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VaultProvider } from "@/contexts/VaultContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import Home from "./pages/Home";
import CreateVault from "./pages/CreateVault";
import SignIn from "./pages/SignIn";
import Vault from "./pages/Vault";
import NoteEditor from "./pages/NoteEditor";
import Trash from "./pages/Trash";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <TooltipProvider>
        <VaultProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/create" element={<CreateVault />} />
              <Route path="/signin" element={<SignIn />} />
              <Route path="/vault" element={<Vault />} />
              <Route path="/vault/note/:noteId" element={<NoteEditor />} />
              <Route path="/vault/trash" element={<Trash />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </VaultProvider>
      </TooltipProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
