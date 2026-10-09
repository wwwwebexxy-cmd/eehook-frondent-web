const API_URL = import.meta.env.VITE_API_URL;

export const getImageUrl = (imagePath) => {
    if (!imagePath) return null;

    if (/^(https?:)?\/\//i.test(imagePath)) {
        return imagePath;
    }

    return `${API_URL.replace(/\/$/, "")}/${String(imagePath).replace(/^\//, "")}`;
};
