export const normalizeBannerList = (value) => {
    if (Array.isArray(value)) return value.filter((banner) => banner?.image);
    if (Array.isArray(value?.results)) return value.results.filter((banner) => banner?.image);
    return value?.image ? [value] : [];
};

export const resolveBannerList = ({ provided, fetched }) => (
    normalizeBannerList(provided !== undefined ? provided : fetched)
);
