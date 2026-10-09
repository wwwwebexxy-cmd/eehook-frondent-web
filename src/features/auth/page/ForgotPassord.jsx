import { useState } from "react";
import { Link } from "react-router-dom";
import client from "../../../lib/ApiClient";
import "./Forgotpassword.css";

function ForgotPassword() {

    const [email, setEmail] = useState("");
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState("");
    const neutralMessage = "If the account exists, a reset email will be sent.";

    const handleSubmit = async (e) => {

        e.preventDefault();

        setLoading(true);
        setMessage("");

        try {

            const response = await client.post("forgot-password/", {
                email,
            });

            setMessage(response.data?.message || neutralMessage);
            setEmail("");

        } catch (error) {

            // The backend intentionally returns the same acknowledgement for
            // registered and unregistered addresses. Keep that behaviour in UI.
            setMessage(error.response?.data?.message || neutralMessage);

        } finally {

            setLoading(false);

        }

    };

    return (

        <div className="forgot-container">

            <div className="forgot-box">

                <div className="auth-header">

                    <h1>Forgot Password?</h1>

                    <p>
                        Don't worry! It happens. Enter your registered email
                        address and we'll send you a password reset link.
                    </p>

                </div>

                <form onSubmit={handleSubmit}>

                    <input
                        type="email"
                        placeholder="Enter your email address"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />

                    <button type="submit">

                        {loading ? "Sending..." : "Send Reset Link"}

                    </button>

                    {message && <p className="password-reset-success" role="status">{message}</p>}

                </form>

                <Link
                    to="/login"
                    className="back-login"
                >
                    Back to Login
                </Link>

            </div>

        </div>

    );

}

export default ForgotPassword;
