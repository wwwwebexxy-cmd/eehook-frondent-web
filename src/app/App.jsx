import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import './../App.css';
import client from "../lib/ApiClient";
import { clearAuthSession, saveAuthSession } from "../features/auth/authUtils";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Router from './Router';
import ScrollToTop from '../components/ScrollToTop';

function App() {

    const location = useLocation();
    const [authReady, setAuthReady] = useState(false);
    const normalizedPath = location.pathname.toLowerCase();
    const isAdminPage = normalizedPath.startsWith("/eehook-dashboard") || normalizedPath.startsWith("/orderdashboard") || normalizedPath.startsWith("/order-dashboard");
    const isProtectedPage = ["/profile", "/checkout", "/checkoutpage", "/wishlist", "/myorders"]
        .some((path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`));
    const requiresAuthReady = isAdminPage || isProtectedPage;

    useEffect(() => {
        let active = true;
        // Restore the session in the background for public pages. Protected
        // pages still wait for the answer so an expired session cannot render
        // a private screen briefly before the redirect runs.
        setAuthReady(!requiresAuthReady);
        client.get("auth/session/", {
            params: { scope: isAdminPage ? "admin" : "customer" },
            skipAuthRefresh: true,
            skipAuthRedirect: true,
            timeout: 5000,
        })
            .then((response) => {
                if (active) saveAuthSession(response.data);
            })
            .catch((error) => {
                if (error.response?.status === 401) clearAuthSession();
            })
            .finally(() => {
                if (active) setAuthReady(true);
            });
        return () => { active = false; };
    }, [isAdminPage, requiresAuthReady]);

    if (requiresAuthReady && !authReady) return <div aria-live="polite" aria-label="Loading application" className="app-loading"><div className="app-loading-card" aria-hidden="true"><span className="skeleton app-loading-logo" /><span className="skeleton app-loading-line wide" /><span className="skeleton app-loading-line" /></div></div>;

    return (
        <>
            <ScrollToTop />

            {!isAdminPage && <Navbar />}

            <div style={{ minHeight: 'calc(100vh - 64px)' }}>
                <Router />
            </div>

            {!isAdminPage && <Footer />}
        </>
    );
}

export default App;
