import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

import './../App.css';
import client from "../lib/ApiClient";
import { clearAuthSession, hasAuthSession, saveAuthSession } from "../features/auth/authUtils";
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import Router from './Router';
import ScrollToTop from '../components/ScrollToTop';

function App() {

    const location = useLocation();
    const normalizedPath = location.pathname.toLowerCase();
    const isAdminPage = normalizedPath.startsWith("/eehook-dashboard") || normalizedPath.startsWith("/orderdashboard") || normalizedPath.startsWith("/order-dashboard");
    const isProtectedPage = ["/profile", "/checkout", "/checkoutpage", "/wishlist", "/myorders"]
        .some((path) => normalizedPath === path || normalizedPath.startsWith(`${path}/`));
    const requiresAuthReady = isAdminPage || isProtectedPage;
    const [authReady, setAuthReady] = useState(() => !requiresAuthReady);

    useEffect(() => {
        let active = true;
        // Anonymous public pages do not need a session probe. The expected
        // 401 response was being counted as a browser error by Lighthouse.
        if (!requiresAuthReady && !hasAuthSession()) {
            return () => { active = false; };
        }
        // Restore the session in the background for public pages. Protected
        // pages still wait for the answer so an expired session cannot render
        // a private screen briefly before the redirect runs. Public pages do
        // not use authReady as a render gate, so no synchronous state update
        // is needed here.
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
