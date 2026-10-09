import React, { useEffect, useRef } from "react";
import '../styles/About.css';

import heroImg from "../../../assets/eehook_hero_tech.png";
import vibeImg from "../../../assets/eehook_lifestyle_vibe.png";
import AboutFirstimage from "../../../assets/About-first-img.png";
import AboutSecondimage from "../../../assets/About-second-img.png";

import { useNavigate } from "react-router-dom";

const About = () => {
    const navigate = useNavigate();

    const pillars = [
        {
            title: "Curated with Care",
            text: "Every item in our collection is handpicked. We test, we use, and we love the products we sell. If it's not good enough for us, it won't make it to you."
        },
        {
            title: "A Personal Touch",
            text: "We're a team of real people who love technology and beautiful design. When you shop with us, you're not just an order number—you're our guest."
        },
        {
            title: "Quality Over Quantity",
            text: "We don't want to sell you everything. We just want to sell you the right thing. Products that last, inspire, and bring joy to your everyday life."
        }
    ];

    return (
        <div className="about-modern-wrapper">
            
            {/* Hero Section */}
            <section className="about-modern-hero about-fade">
                <div className="hero-text-content">
                    <span className="hero-eyebrow">THE EEHOOK MANIFESTO</span>
                    <h1 className="hero-display">
                        We Don't Just Sell Tech.<br />
                        <span className="hero-italic">We Curate Lifestyles.</span>
                    </h1>
                    <p className="hero-subtext">
                        Welcome to a new era of e-commerce. A place where high-performance 
                        electronics meet the elegance of modern living. No clutter, just the best.
                    </p>
                    <button className="hero-modern-btn" onClick={() => navigate('/shop')}>
                        Explore the Collection <span className="arrow">→</span>
                    </button>
                </div>
                <div className="hero-image-content">
                    <div className="image-frame">
                        <img src={AboutFirstimage} alt="Modern Tech Workspace" />
                    </div>
                </div>
            </section>

            {/* Split Story Section */}
            <section className="about-modern-story about-fade">
                <div className="story-left">
                    <div className="story-sticky">
                        <h2>Born out of a desire for <i>better</i>.</h2>
                        <p>
                            We grew tired of the endless scroll. The chaotic marketplaces filled with 
                            subpar products. Eehook was built to be different—an oasis of quality in 
                            a sea of quantity. 
                        </p>
                        <p>
                            Every laptop, every fragrance, every accessory on our platform has been 
                            meticulously chosen because we believe you deserve nothing but excellence.
                        </p>

                        <div className="story-highlights">
                            <div className="highlight-box">
                                <span className="highlight-title">No Endless Scrolling</span>
                                <span className="highlight-text">We've done the hard work of finding the best products so you don't have to.</span>
                            </div>
                            <div className="highlight-box">
                                <span className="highlight-title">Built on Trust</span>
                                <span className="highlight-text">Every brand we partner with shares our commitment to craftsmanship and honesty.</span>
                            </div>
                        </div>

                    </div>
                </div>
                <div className="story-right">
                    <img src={AboutSecondimage} alt="Lifestyle Vibe" className="story-vibe-img" />
                </div>
            </section>

            {/* Values / Pillars - Humanized Grid */}
            <section className="about-human-values about-fade">
                <div className="values-header">
                    <h2>Our Philosophy</h2>
                    <p>What drives us every single day.</p>
                </div>
                <div className="values-grid">
                    {pillars.map((pillar, index) => (
                        <div className="value-card" key={index}>
                            <h3>{pillar.title}</h3>
                            <p>{pillar.text}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* Editorial Quote */}
            <section className="about-modern-quote about-fade">
                <blockquote>
                    "Technology should elevate your life, not complicate it. 
                    Design should inspire, not just function. This is the heart of eehook."
                </blockquote>
                <div className="quote-author">— The Eehook Team</div>
            </section>

        </div>
    );
};

export default About;
