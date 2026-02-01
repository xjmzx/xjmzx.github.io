import { BrowserRouter, Route, Routes } from "react-router-dom";
import { ScrollToTop } from "./components/ScrollToTop";

import Index from "./pages/Index";
import LNDDebian from "./pages/guides/LNDDebian";
import LNDUbuntu from "./pages/guides/LNDUbuntu";
import PhoenixdDebian from "./pages/guides/PhoenixdDebian";
import PhoenixdUbuntu from "./pages/guides/PhoenixdUbuntu";
import { NIP19Page } from "./pages/NIP19Page";
import NotFound from "./pages/NotFound";

export function AppRouter() {
  return (
    <BrowserRouter>
      <ScrollToTop />
      <Routes>
        <Route path="/" element={<Index />} />
        
        {/* Guide Routes */}
        <Route path="/lnd/debian" element={<LNDDebian />} />
        <Route path="/lnd/ubuntu" element={<LNDUbuntu />} />
        <Route path="/phoenixd/debian" element={<PhoenixdDebian />} />
        <Route path="/phoenixd/ubuntu" element={<PhoenixdUbuntu />} />
        
        {/* NIP-19 route for npub1, note1, naddr1, nevent1, nprofile1 */}
        <Route path="/:nip19" element={<NIP19Page />} />
        {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </BrowserRouter>
  );
}
export default AppRouter;