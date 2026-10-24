import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import "../Heropage.css";
import { getImageUrl } from "../../../utils/imageUrl";

import Hero_Query from "../queries/Hero_Query";
import PromoBanners_Query from "../queries/PromoBanners_Query";
import HeroSideBanner_Query from "../queries/HeroSideBanner_Query";
import defaultHeroImage from "../../../assets/eehook_hero_tech.png";
import defaultHeroSideImage from "../../../assets/eehook_lifestyle_vibe.png";

const DEFAULT_HERO_SLIDES = [
  {
    id: "default-tech-hero",
    subtitle: "Technology, thoughtfully curated",
    title: "Elevate your everyday",
    description: "Discover premium electronics and modern lifestyle essentials selected for the way you live.",
    button_text: "Shop now",
    image: defaultHeroImage,
  },
];

const DEFAULT_SIDE_BANNER = {
  image: defaultHeroSideImage,
  link: "/shop",
};

const getHeroImageUrl = (image) => image === defaultHeroImage || image === defaultHeroSideImage
  ? image
  : getImageUrl(image);

const getHeroCopy = (...values) => {
  return values
    .map((value) => String(value ?? "").trim())
    .find((text) => text && text !== ".") || "";
};

const Heropage = ({ heroBanners, promoBanners: providedPromoBanners, heroSideBanner: providedSideBanner }) => {

  // An empty homepage response is not an intentional override. Keep the
  // dedicated hero endpoint available, then fall back to the bundled hero
  // image when the API has no active banners configured.
  const hasHeroBanners = Array.isArray(heroBanners) && heroBanners.length > 0;
  const { data: rawHeroSlides } = Hero_Query({ enabled: !hasHeroBanners });
  const queriedHeroSlides = Array.isArray(rawHeroSlides) ? rawHeroSlides : [];
  const heroSlides = (hasHeroBanners ? heroBanners : queriedHeroSlides).length > 0
    ? (hasHeroBanners ? heroBanners : queriedHeroSlides)
    : DEFAULT_HERO_SLIDES;

  const hasPromoBanners = Array.isArray(providedPromoBanners);
  const { data: rawPromoBanners } = PromoBanners_Query({ enabled: !hasPromoBanners });
  const promoBanners = hasPromoBanners ? providedPromoBanners : (Array.isArray(rawPromoBanners) ? rawPromoBanners : []);

  const hasSideBanner = providedSideBanner !== undefined;
  const { data: queriedSideBanner } = HeroSideBanner_Query({ enabled: !hasSideBanner });
  const heroSideBanner = hasSideBanner
    ? providedSideBanner
    : (queriedSideBanner?.image ? queriedSideBanner : DEFAULT_SIDE_BANNER);

  const [currentSlide, setCurrentSlide] = useState(0);

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

  const activeHero = heroSlides[currentSlide] || heroSlides[0];
  const activePromo = promoBanners[currentPromo] || promoBanners[0];
  const heroRatio = imageRatios[`hero-${activeHero?.id ?? currentSlide}`] || (16 / 7);
  const sideBannerKey = heroSideBanner?.id ?? heroSideBanner?.image ?? "default";
  const sideRatio = imageRatios[`side-${sideBannerKey}`] || (16 / 7);
  const promoRatio = imageRatios[`promo-${activePromo?.id ?? currentPromo}`] || (16 / 3);

  useEffect(() => {
    if (promoBanners.length === 0) return;

    const promoTimer = setInterval(() => {
      setCurrentPromo((prev) => (prev === promoBanners.length - 1 ? 0 : prev + 1));
    }, 4000);
    return () => clearInterval(promoTimer);
  }, [promoBanners.length]);

  const nextPromo = () => setCurrentPromo((prev) => (prev === promoBanners.length - 1 ? 0 : prev + 1));
  const prevPromo = () => setCurrentPromo((prev) => (prev === 0 ? promoBanners.length - 1 : prev - 1));

  const nextSlide = () => {
    setCurrentSlide((prev) => (prev === heroSlides.length - 1 ? 0 : prev + 1));
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev === 0 ? heroSlides.length - 1 : prev - 1));
  };

  return (
    <div className="hero-page-wrapper">
      
      {/* Top Promo Carousel (Visa Banner Equivalent) */}
      {promoBanners.length > 0 && <div className="top-promo-carousel" style={{ aspectRatio: promoRatio }}>
        <button className="promo-nav-btn left" onClick={prevPromo}>‹</button>
        
        <div className="promo-slides">
          {promoBanners.map((promo, index) => (
            <div 
              key={promo.id} 
              className={`promo-slide ${currentPromo === index ? "active" : ""}`}
            >
              {promo.link ? (
                <a href={promo.link} target="_blank" rel="noopener noreferrer" style={{ display: 'block', width: '100%', height: '100%' }}>
                  <img 
                    src={getImageUrl(promo.image)} 
                    alt="Promo Banner" 
                    onLoad={(event) => rememberImageRatio(`promo-${promo.id ?? index}`, event)}
                    style={{ width: "100%", height: "100%" }}
                  />
                </a>
              ) : (
                <img 
                  src={getImageUrl(promo.image)} 
                  alt="Promo Banner" 
                  onLoad={(event) => rememberImageRatio(`promo-${promo.id ?? index}`, event)}
                  style={{ width: "100%", height: "100%" }}
                />
              )}
            </div>
          ))}
        </div>

        <button className="promo-nav-btn right" onClick={nextPromo}>›</button>
      </div>}

      <section
        className={`hero-split-layout ${heroSideBanner?.image ? "" : "single"}`}
        style={{ "--hero-ratio": heroRatio, "--side-ratio": sideRatio }}
      >
        
        {/* Main Carousel (Left) */}
        <div className="hero-carousel-section">
          {heroSlides.map((slide, index) => (
            <div
              key={slide.id}
              className={`hero-slide ${
                currentSlide === index ? "active" : ""
              }`}
            >

              <img
                src={getHeroImageUrl(slide.image || slide.banner_image || slide.image_url)}
                alt={slide.title || slide.heading || "Featured collection"}
                className="hero-image"
                onLoad={(event) => rememberImageRatio(`hero-${slide.id ?? index}`, event)}
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
        </div>

        {/* Fixed Side Banner (Right) */}
        {heroSideBanner?.image && <div className="hero-fixed-banner-section">
          <div className="fixed-banner-content">
             {heroSideBanner?.link ? (
               <a href={heroSideBanner.link} target="_blank" rel="noopener noreferrer">
                 <img
                   src={getHeroImageUrl(heroSideBanner.image)}
                   alt="Promotional Banner"
                   className="fixed-banner-image"
                   onLoad={(event) => rememberImageRatio(`side-${sideBannerKey}`, event)}
                 />
               </a>
             ) : (
                 <img
                   src={getHeroImageUrl(heroSideBanner?.image)}
                   alt="Promotional Banner"
                   className="fixed-banner-image"
                   onLoad={(event) => rememberImageRatio(`side-${sideBannerKey}`, event)}
                 />
             )}
          </div>
        </div>}

      </section>
    </div>
  );
};

export default Heropage;
