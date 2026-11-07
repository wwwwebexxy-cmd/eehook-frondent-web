// The FedCM button handoff is unreliable in some mobile browsers and can
// appear to do nothing after a tap. Keep the existing popup + credential
// callback flow, but opt out of the FedCM button path explicitly.
export const GOOGLE_LOGIN_OPTIONS = Object.freeze({
    ux_mode: "popup",
    use_fedcm_for_button: false,
});

const GOOGLE_REDIRECT_ERRORS = Object.freeze({
    csrf: "Google sign-in could not pass the security check. Please try again.",
    disabled: "This account is disabled or is not allowed for this login area.",
    not_allowed: "This account is not allowed to sign in here.",
    unavailable: "Google sign-in is not configured. Please use email and password.",
    invalid_credential: "The Google credential is invalid or expired. Please try again.",
    provider_error: "Google sign-in could not be completed. Please try again.",
});

export function isIOSBrowser({
    userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "",
    platform = typeof navigator !== "undefined" ? navigator.platform : "",
    maxTouchPoints = typeof navigator !== "undefined" ? navigator.maxTouchPoints : 0,
} = {}) {
    return /iPad|iPhone|iPod/i.test(userAgent)
        || (platform === "MacIntel" && maxTouchPoints > 1);
}

export function getGoogleLoginOptions({
    origin = typeof window !== "undefined" ? window.location.origin : "",
    userAgent,
    platform,
    maxTouchPoints,
} = {}) {
    if (!isIOSBrowser({ userAgent, platform, maxTouchPoints })) {
        return GOOGLE_LOGIN_OPTIONS;
    }

    return {
        ux_mode: "redirect",
        login_uri: `${origin}/backend/google-login/redirect/`,
    };
}

export function getGoogleRedirectErrorMessage(code) {
    return GOOGLE_REDIRECT_ERRORS[code] || "Google sign-in could not be completed. Please try again.";
}
