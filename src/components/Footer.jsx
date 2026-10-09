import "./../Footer.css";

// import eehook from './../assets/eehook.jpeg'
import visa from './../assets/visa-payment.png'
import master from './../assets/master-payment.png'
import amc from './../assets/american-exp-payment.png'
import footerlogo from './../assets/footer-logo.png'
import apple from './../assets/apple-payment.png'
import { Link } from 'react-router-dom';
import { FaFacebookF, FaInstagram, FaPhoneAlt, FaEnvelope, FaMapMarkerAlt, } from "react-icons/fa";
function Footer() {
    const whatsappUrl = `https://wa.me/971501234567?text=${encodeURIComponent("Hello")}`;


    return (
        <div>

            <footer className="footer">

                <div className="footer-container">

                    <div className="footer-column brand">
                        <img src={footerlogo} alt="Logo" className="footer-logo" />
                    </div>

                    <div className="footer-column social-column">
                        <h3>Follow Us</h3>

                        <div className="social-icons">
                            <a href="https://www.instagram.com/eehookuae/" target="_blank" rel="noreferrer" aria-label="eehook UAE on Instagram">
                                <FaInstagram />
                            </a>
                            <a href="https://www.facebook.com/eehookuae/" target="_blank" rel="noreferrer" aria-label="eehook UAE on Facebook">
                                <FaFacebookF />
                            </a>
                        </div>
                    </div>

                    <div className="footer-column">
                        <h3>Quick Links</h3>

                        <ul>
                            <li><Link to="/">Home</Link></li>
                            <li><Link to="/shop">Shop</Link></li>
                            <li><Link to="/shop">Categories</Link></li>
                            <li><Link to="/shop?offer=true">Offers</Link></li>
                            <li><Link to="/about">About Us</Link></li>
                            <li><Link to="/contact">Contact Us</Link></li>
                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Customer Care</h3>

                        <ul>
                            <li><Link to="/profile">My Account</Link></li>
                            <li><Link to="/myorders">Track Order</Link></li>
                            <li><Link to="/myorders">Shipping &amp; Delivery</Link></li>

                        </ul>
                    </div>

                    <div className="footer-column">
                        <h3>Contact Us</h3>

                        <ul className="contact">
                            <li><a href={whatsappUrl} target="_blank" rel="noopener noreferrer"><FaPhoneAlt /> +971 50 123 4567</a></li>

                            <li>
                                <FaEnvelope />  <a href="mailto:info@eehook.com">info@eehook.com</a>
                            </li>

                            <li>
                                <FaMapMarkerAlt /> Dubai, United Arab Emirates
                            </li>
                        </ul>
                    </div>

                    <div className="footer-column payment">
                        <h3>We Accept</h3>

                        <div className="payment-icons">
                            <img src={visa} alt="payments" />
                            <img src={master} alt="" />
                            <img src={amc} alt="" />
                            <img src={apple} alt="" />
                        </div>
                    </div>

                </div>

            </footer>

            <div className="copyright">
                © 2026 eehook. All Rights Reserved.
            </div>

        </div>
    )
}

export default Footer

