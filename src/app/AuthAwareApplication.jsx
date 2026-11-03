import { useLocation } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

import App from "./App.jsx";
import { GOOGLE_CLIENT_ID } from "../features/auth/googleConfig";

function AuthAwareApplication() {
    const location = useLocation();
    const authPage = ["/login", "/signup"].includes(location.pathname.toLowerCase());
    const app = <App />;

    return authPage && GOOGLE_CLIENT_ID ? (
        <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>{app}</GoogleOAuthProvider>
    ) : app;
}

export default AuthAwareApplication;
