import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Heropage.css";
import { getImageUrl } from "../../../utils/imageUrl";

import Hero_Query from "../queries/Hero_Query";
import PromoBanners_Query from "../queries/PromoBanners_Query";
import HeroSideBanner_Query from "../queries/HeroSideBanner_Query";
import { resolveBannerList } from "./heroContent";

const getHeroCopy = (...values) => {
  return values
    .map((value) => String(value ?? "").trim())
    .find((text) => text && text !== ".") || "";
};

const Heropage = ({ heroBanners, promoBanners: providedPromoBanners, heroSideBanner: providedSideBanner }) => {
  const hasHeroBanners = Array.isArray(heroBanners) && heroBanners.length > 0;
  const heroQuery = Hero_Query({ enabled: !hasHeroBanners });
  const heroSlides = resolveBannerList({
    provided: hasHeroBanners ? heroBanners : undefined,
    fetched: heroQuery.data,
  });
  const heroLoading = !hasHeroBanners && heroQuery.isLoading;

  const hasPromoBanners = Array.isArray(providedPromoBanners);
  const promoQuery = PromoBanners_Query({ enabled: !hasPromoBanners });
  const promoBanners = resolveBannerList({
    provided: hasPromoBanners ? providedPromoBanners : undefined,
    fetched: promoQuery.data,
  });
  const promoLoading = !hasPromoBanners && promoQuery.isLoading;

  const hasSideBanners = providedSideBanner !== undefined;
  const sideQuery = HeroSideBanner_Query({ enabled: !hasSideBanners });
  const sideBanners = resolveBannerList({
    provided: hasSideBanners ? providedSideBanner : undefined,
    fetched: sideQuery.data,
  });
  const sideLoading = !hasSideBanners && sideQuery.isLoading;

  const [currentSlide, setCurrentSlide] = useState(0);
  const [currentSideBanner, setCurrentSideBanner] = useState(0);
  const [loadedImages, setLoadedImages] = useState({});

  // Auto Slide
  useEffect(() => {

    if (heroSlides.length === 0) return;

    const timer = setInterval(() => {

      setCurrentSlide((prev) =>
        prev === heroSlides.length - 1 ? 0 : prev + 1
      );

    }, 5000);

    return () => clearInterval(timer);

  }, [heroSlides.length]);

  // Top Promo Carousel Logic
  const [currentPromo, setCurrentPromo] = useState(0);
  const [imageRatios, setImageRatios] = useState({});

  const rememberImageRatio = (key, event) => {
    const { naturalWidth, naturalHeight } = event.currentTarget;

    if (!naturalWidth || !naturalHeight) return;

    const ratio = naturalWidth / naturalHeight;

    setImageRatios((current) => (
      current[key] === ratio ? current : { ...current, [key]: ratio }
    ));
  };

  const markImageLoaded = (key, event) => {
    rememberImageRatio(key, event);
    setLoadedImages((current) => current[key] ? current : { ...current, [key]: true });
  };

  const activeHero = heroSlides[currentSlide] || heroSlides[0];
  const activePromo = promoBanners[currentPromo] || promoBanners[0];
  const normalizedSideBannerIndex = sideBanners.length
    ? currentSideBanner % sideBanners.length
    : 0;
  const activeSideBanner = sideBanners.length
    ? sideBanners[normalizedSideBannerIndex]
    : null;
  const heroRatio = imageRatios[`hero-${activeHero?.id ?? currentSlide}`] || (16 / 7);
  const sideBannerKey = activeSideBanner?.id ?? activeSideBanner?.image ?? "default";
  const sideRatio = imageRatios[`side-${sideBannerKey}`] || (16 / 7);
  const promoRatio = imageRatios[`promo-${activePromo?.id ?? currentPromo}`] || (16 / 3);

  const hasHeroSlot = heroLoading || heroSlides.length > 0;
  const hasSideSlot = sideLoading || sideBanners.length > 0;
  const hasPromoSlot = promoLoading || promoBanners.length > 0;

  useEffect(() => {
    if (promoBanners.length === 0) return;

    const promoTimer = setInterval(() => {
      setCurrentPromo((prev) => (prev === promoBanners.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(promoTimer);
  }, [promoBanners.length]);

  useEffect(() => {
    if (sideBanners.length < 2) return undefined;

    const sideBannerTimer = setInterval(() => {
      setCurrentSideBanner((previous) => (previous + 1) % sideBanners.length);
    }, 5000);

    return () => clearInterval(sideBannerTimer);
  }, [sideBanners.length]);

  if (!hasHeroSlot && !hasSideSlot && !hasPromoSlot) return null;

  const nextPromo = () => setCurrentPromo((prev) => (prev === promoBanners.length - 1 ? 0 : prev + 1));
  const prevPromo = () => setCurrentPromo((prev) => (prev === 0 ? promoBanners.length - 1 : prev - 1));

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  const nextSideBanner = () => {
    if (sideBanners.length < 2) return;
    setCurrentSideBanner((previous) => (previous + 1) % sideBanners.length);
  };

  const prevSideBanner = () => {
    if (sideBanners.length < 2) return;
    setCurrentSideBanner((previous) => (previous === 0 ? sideBanners.length - 1 : previous - 1));
  };

  return (
    <div className="hero-page-wrapper">
      
      {/* Top Promo Carousel (Visa Banner Equivalent) */}
      {promoLoading ? (
        <div className="top-promo-carousel promo-loading-skeleton skeleton" role="status" aria-label="Loading promotional banner" />
      ) : promoBanners.length > 0 && <div className="top-promo-carousel" style={{ aspectRatio: promoRatio }}>
        <button className="promo-nav-btn left" onClick={prevPromo}>‹</button>
        
        <div
          className="promo-slides"
          style={{ transform: `translateX(-${currentPromo * 100}%)` }}
        >
          {promoBanners.map((promo, index) => (
            <div
              key={promo.id ?? index}
              className={`promo-slide ${currentPromo === index ? "active" : ""}`}
            >
              {!loadedImages[`promo-${promo.id ?? index}`] && <div className="media-loading-skeleton skeleton" aria-hidden="true" />}
              {promo.link ? (
                <a href={promo.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                  <img
                    src={getImageUrl(promo.image)} 
                    alt="Promo Banner" 
                    className={loadedImages[`promo-${promo.id ?? index}`] ? "media-is-ready" : "media-is-loading"}
                    onLoad={(event) => markImageLoaded(`promo-${promo.id ?? index}`, event)}
                    style={{ width: "100%", height: "100%" }}
                  />
                </a>
              ) : (
                <img
                  src={getImageUrl(promo.image)} 
                  alt="Promo Banner" 
                  className={loadedImages[`promo-${promo.id ?? index}`] ? "media-is-ready" : "media-is-loading"}
                  onLoad={(event) => markImageLoaded(`promo-${promo.id ?? index}`, event)}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
          ))}
        </div>

        <button className="promo-nav-btn right" onClick={nextPromo}>›</button>
      </div>}

      <section
        className={`hero-split-layout ${hasHeroSlot && hasSideSlot ? "" : "single"}`}
        style={{ "--hero-ratio": heroRatio, "--side-ratio": sideRatio }}
      >
        
        {/* Main Carousel (Left) */}
        {heroLoading ? (
          <div className="hero-carousel-section hero-loading-skeleton skeleton" role="status" aria-label="Loading hero banner" />
        ) : heroSlides.length > 0 && <div className="hero-carousel-section">
          <div
            className="hero-slides-track"
            style={{ transform: `translateX(-${currentSlide * 100}%)` }}
          >
            {heroSlides.map((slide, index) => (
              <div
                key={slide.id ?? index}
                className={`hero-slide ${
                  currentSlide === index ? "active" : ""
                }`}
              >

              {!loadedImages[`hero-${slide.id ?? index}`] && <div className="media-loading-skeleton skeleton" aria-hidden="true" />}

              <img
                src={getImageUrl(slide.image || slide.banner_image || slide.image_url)}
                alt={slide.title || slide.heading || "Featured collection"}
                className={`hero-image ${loadedImages[`hero-${slide.id ?? index}`] ? "media-is-ready" : "media-is-loading"}`}
                onLoad={(event) => markImageLoaded(`hero-${slide.id ?? index}`, event)}
              />

              <div className="hero-overlay"></div>

              <div className="hero-content">
                {getHeroCopy(slide.subtitle, slide.eyebrow) && (
                  <span className="hero-subtitle">
                    {getHeroCopy(slide.subtitle, slide.eyebrow)}
                  </span>
                )}

                {getHeroCopy(slide.title, slide.heading) && (
                  <h1>{getHeroCopy(slide.title, slide.heading)}</h1>
                )}

                {getHeroCopy(slide.description, slide.text) && (
                  <p>{getHeroCopy(slide.description, slide.text)}</p>
                )}

                {getHeroCopy(slide.button_text) && (
                  <Link to="/shop" className="shop-btn-premium">
                    {getHeroCopy(slide.button_text)} <span className="arrow">→</span>
                  </Link>
                )}

              </div>

              </div>
            ))}
          </div>
          
          {/* Navigation Arrows */}
          <button className="carousel-nav-btn prev-btn" onClick={prevSlide}>
            ‹
          </button>
          <button className="carousel-nav-btn next-btn" onClick={nextSlide}>
            ›
          </button>

          <div className="hero-dots">

            {heroSlides.map((_, index) => (
              <button
                key={index}
                className={`modern-dot ${
                  currentSlide === index ? "active-modern-dot" : ""
                }`}
                onClick={() => setCurrentSlide(index)}
                aria-label={`Go to slide ${index + 1}`}
              >
              </button>
            ))}

          </div>
        </div>}

        {/* Rotating Side Banners (Right) */}
        {sideLoading ? (
          <div className="hero-fixed-banner-section side-banner-loading-skeleton skeleton" role="status" aria-label="Loading side promotional banner" />
        ) : sideBanners.length > 0 && <div className="hero-fixed-banner-section" aria-label="Promotional side banners">
          <div className="fixed-banner-content">
            <div
              className="side-banner-track"
              style={{ transform: `translateX(-${normalizedSideBannerIndex * 100}%)` }}
            >
              {sideBanners.map((banner, index) => {
                const bannerKey = banner.id ?? banner.image ?? index;
                return (
                  <div className="side-banner-slide" key={bannerKey}>
                    {!loadedImages[`side-${bannerKey}`] && <div className="media-loading-skeleton skeleton" aria-hidden="true" />}
                    {banner.link ? (
                      <a href={banner.link} target="_blank" rel="noopener noreferrer">
                        <img
                          src={getImageUrl(banner.image)}
                          alt="Promotional Banner"
                          className={`fixed-banner-image ${loadedImages[`side-${bannerKey}`] ? "media-is-ready" : "media-is-loading"}`}
                          onLoad={(event) => markImageLoaded(`side-${bannerKey}`, event)}
                        />
                      </a>
                    ) : (
                      <img
                        src={getImageUrl(banner.image)}
                        alt="Promotional Banner"
                        className={`fixed-banner-image ${loadedImages[`side-${bannerKey}`] ? "media-is-ready" : "media-is-loading"}`}
                        onLoad={(event) => markImageLoaded(`side-${bannerKey}`, event)}
                      />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {sideBanners.length > 1 && (
            <>
              <button
                type="button"
                className="carousel-nav-btn side-banner-nav-btn side-banner-prev"
                onClick={prevSideBanner}
                aria-label="Previous side banner"
              >
                ‹
              </button>
              <button
                type="button"
                className="carousel-nav-btn side-banner-nav-btn side-banner-next"
                onClick={nextSideBanner}
                aria-label="Next side banner"
              >
                ›
              </button>
            </>
          )}
          {sideBanners.length > 1 && (
            <div className="side-banner-dots" aria-label="Choose promotional side banner">
              {sideBanners.map((banner, index) => (
                <button
                  type="button"
                  key={banner.id ?? index}
                  className={index === normalizedSideBannerIndex ? "active" : ""}
                  onClick={() => setCurrentSideBanner(index)}
                  aria-label={`Show side banner ${index + 1}`}
                />
              ))}
            </div>
          )}
        </div>}

      </section>
    </div>
  );
};

export default Heropage;
