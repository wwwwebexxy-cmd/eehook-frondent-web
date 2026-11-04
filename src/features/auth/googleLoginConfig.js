// The FedCM button handoff is unreliable in some mobile browsers and can
// appear to do nothing after a tap. Keep the existing popup + credential
// callback flow, but opt out of the FedCM button path explicitly.
export const GOOGLE_LOGIN_OPTIONS = Object.freeze({
    ux_mode: "popup",
    use_fedcm_for_button: false,
});
