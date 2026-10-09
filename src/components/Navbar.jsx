import { useEffect, useMemo, useRef, useState } from "react";
import "./../Navbar.css";
import { useLocation, NavLink, useNavigate } from "react-router-dom";

import { FaShoppingBag, FaAngleDown, FaAngleUp } from "react-icons/fa";
import { LuSearch } from "react-icons/lu";
import { CgProfile } from "react-icons/cg";
import { FaHeart } from "react-icons/fa6";
import { AiOutlineDoubleRight } from "react-icons/ai";
import { IoClose } from "react-icons/io5";
import navbarlogo from './../assets/navbar-logo.png';

import eehook from '../assets/eehook.jpeg'
import WishlistQuery from "../features/wishlist/queries/WishlistQuery.jsx";
import Offer_Query from "../hooks/offers/queries/Offer_Query.jsx";
import Cart_query from "../features/cart/queries/Cart_query.jsx";
import ShopBy_categoryQuery from "../features/shop_by_category/queries/ShopBy_categoryQuery.jsx";
import Homepage_Query from "../features/home/queries/Homepage_Query.jsx";
import { getImageUrl } from "../utils/imageUrl.js";
import WelcomeBonusNotifications from "../features/welcomeBonus/components/WelcomeBonusNotifications.jsx";
function Navbar() {

    const location = useLocation();
    const isHomePage = location.pathname === "/";
    const { data: homepageData } = Homepage_Query({ enabled: isHomePage });
    const homepageCategories = Array.isArray(homepageData?.categories) ? homepageData.categories : [];
    const { data: rawData } = ShopBy_categoryQuery({ enabled: !isHomePage });
    const data = useMemo(() => (Array.isArray(rawData) ? rawData : []), [rawData]);
    const categories = homepageCategories.length > 0 ? homepageCategories : data;

    const { data: offers = [] } = Offer_Query();
    const offerActive = Array.isArray(offers) && offers.some((offer) => offer && offer.is_active !== false);



    const [showNavbar, setShowNavbar] = useState(true);
    const lastScrollY = useRef(0);

    useEffect(() => {
        const handleScroll = () => {
            const current = window.scrollY;
            if (current > lastScrollY.current && current > 100) {
                setShowNavbar(false);
            } else {
                setShowNavbar(true);
            }
            lastScrollY.current = current;
        };

        window.addEventListener("scroll", handleScroll);
        return () => window.removeEventListener("scroll", handleScroll);
    }, []);




    const { data: wishdata = [] } = WishlistQuery();
    const wishLength = wishdata.length;
    const { data: cart = {} } = Cart_query();

const cartLength = cart.total_items ?? 0;

    const navlinks = [
        { name: "Home", path: "/" },
        { name: "Shop", path: "/shop" },
        { name: "Categories", dropdown: true },
        { name: "New Arrivals", path: "/shop?sort=new" },
        { name: "Offers", path: "/shop?offer=true", offer: offerActive },
        { name: "About", path: "/about" },
    ];

    const [menuOpen, setMenuOpen] = useState(false);

    const [categoryOpen, setCategoryOpen] = useState(false);

    // shop dropdown 
    const [showMega, setShowMega] = useState(false);
    const [hoveredCategory, setHoveredCategory] = useState(null);
    const [hoveredSubcategory, setHoveredSubcategory] = useState(null);

    const urlPreview = useMemo(() => {
        const params = new URLSearchParams(location.search);
        const categoryId = params.get("category");
        const subcategoryId = params.get("subcategory");
        const category = categoryId
            ? categories.find((item) => String(item.id) === String(categoryId))
            : categories[0];
        const subcategory = category?.subcategories?.find(
            (item) => String(item.id) === String(subcategoryId)
        ) || null;

        return { category: category || categories[0] || null, subcategory };
    }, [categories, location.search]);

    const activeCategory = hoveredCategory || urlPreview.category;
    const activeSubcategory = hoveredSubcategory || urlPreview.subcategory;



    // search 
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchText, setSearchText] = useState("");

    const navigate = useNavigate();

    const goToSearch = () => {
        if (searchText.trim()) {
            navigate(`/shop?search=${encodeURIComponent(searchText)}`);
            setSearchOpen(false);
            setSearchText("");
        }
    };

    const handleSearch = (e) => {
        if (e.key === "Enter") {
            goToSearch();
        }
    };

    const closeSearch = () => {
        setSearchOpen(false);
        setSearchText("");
    };

    const closeMenu = () => setMenuOpen(false);

    return (
        <>
            {/* Top Navigation Wrapper    ${isHomePage && !scrolled ? "transparent" : "scrolled"}*/}
            <div className={`navbar ${showNavbar ? "show" : "hide"}`}>
                <div className="nav_main">
                    <button type="button" className="nav_toggle" onClick={() => setMenuOpen(true)} aria-label="Open navigation menu">
                        <AiOutlineDoubleRight size={30} />
                    </button>

                    <div className="nav_main2">
                        <NavLink to='/' className="logo-link">
                            <img src={navbarlogo} alt="Logo" className="navbar-logo" />
                        </NavLink>

                        <div className="link_flex">
                            <ul className="navLinks">
                                {navlinks.filter((item) => item.name !== "Offers" || item.offer).map((item) =>
                                    item.dropdown ? (

                                        <li key={item.name} className="nav_item dropdown" onMouseEnter={() => { setShowMega(true); setHoveredCategory(null); setHoveredSubcategory(null); }} onMouseLeave={() => setShowMega(false)}>
                                            <NavLink to="/shop" className="nav_link">
                                                Categories
                                            </NavLink>

                                            <div className={`mega_menu ${showMega ? "show" : ""}`} onMouseEnter={() => setShowMega(true)}>

                                                <div className="mega_menu_content">

                                                    {/* Category Columns */}
                                                    <div className="mega_categories">
                                                        {categories.map((category) => (
                                                            <div className="mega_column" key={category.id} className="mega_column" onMouseEnter={() => { setHoveredCategory(category); setHoveredSubcategory(null); }} >

                                                                <NavLink
                                                                    to={`/shop?category=${category.id}`}
                                                                    className="mega_title"
                                                                    onMouseEnter={() => { setHoveredCategory(category); setHoveredSubcategory(null); }}
                                                                >
                                                                    {category.name}
                                                                </NavLink>

                                                                <ul>
                                                                    {(category.subcategories || []).map((sub) => (
                                                                        <li key={sub.id} >
                                                                            <NavLink
                                                                                onMouseEnter={() => { setHoveredCategory(category); setHoveredSubcategory(sub); }}
                                                                                onClick={() => setShowMega(false)}
                                                                                to={`/shop?category=${category.id}&subcategory=${sub.id}`}
                                                                                className="mega_link"
                                                                            >
                                                                                {sub.name}
                                                                            </NavLink>
                                                                        </li>
                                                                    ))}
                                                                </ul>
                                                            </div>
                                                        ))}
                                                    </div>

                                                    {/* Image */}
                                                            {categories.length > 0 && (
                                                        <div className="mega_image">
                                                            <img
                                                                src={getImageUrl(activeSubcategory?.image || activeCategory?.image)}
                                                                alt={activeSubcategory?.name || activeCategory?.name}
                                                            />
                                                        </div>
                                                    )}

                                                </div>
                                            </div>
                                        </li>

                                    ) : (
                                        <li key={item.name}>
                                            <NavLink
                                                to={item.path}
                                                className={`nav_link ${location.pathname + location.search === item.path ? "nav_link active" : "nav_link"
                                                    }`}
                                            >
                                                {item.name}
                                            </NavLink>
                                        </li>

                                    )
                                )}
                            </ul>

                            <div className="search_main">

                                <div className="search_wrapper">
                                    <input
                                        className={`nav_search_input ${searchOpen ? "open" : ""}`}
                                        type="text"
                                        placeholder="Search products..."
                                        value={searchText}
                                        onChange={(e) => setSearchText(e.target.value)}
                                        onKeyDown={handleSearch}
                                    />

                                    {searchOpen && <button type="button" className="input-search-button input_search_icon" onClick={goToSearch} aria-label="Search products"><LuSearch size={20} /></button>}
                                </div>


                                {searchOpen ? (
                                    <button type="button" className="nav-icon-button" onClick={closeSearch} aria-label="Close search"><IoClose size={30} /></button>
                                ) : (
                                    <button type="button" className="nav-icon-button nav_icon search_icon" onClick={() => setSearchOpen(true)} aria-label="Open product search"><LuSearch size={23} /></button>

                                )}


                                <NavLink to="/profile" className="mobile_bottom_item">
                                    <div className="cart">
                                        <CgProfile size={22} />
                                    </div>
                                </NavLink>

                                <div className="desktop-notification"><WelcomeBonusNotifications /></div>

                                <NavLink to="/wishlist">
                                    <div className="cart">
                                        <FaHeart size={20} className="nav_icon" />
                                        <span>{wishLength}</span>
                                    </div>
                                </NavLink>

                                <NavLink to="/checkout">
                                    <div className="cart">
                                        <FaShoppingBag size={20} className="nav_icon" />
                                        <span>{cartLength}</span>
                                    </div>
                                </NavLink>

                            </div>
                        </div>
                    </div>
                </div>


                {/* searchbar dropdown under 718px */}

                {searchOpen && (
                    <div className="search_dropdown">
                        <input
                            type="text"
                            placeholder="Search products..."
                            value={searchText}
                            onChange={(e) => setSearchText(e.target.value)}
                            onKeyDown={handleSearch}
                            autoFocus
                        />
                        {searchOpen && <button type="button" className="input-search-button input_search_icon" onClick={goToSearch} aria-label="Search products"><LuSearch size={20} /></button>}
                    </div>
                )}

            </div>


            {/* Mobile Drawer Side Menu Overlay */}
            <div className={`mobile_menu ${menuOpen ? "show" : ""}`}>
                <div className="mobile_header">
                    <NavLink to='/' className="logo-link" style={{ marginTop: '5px' }}>
                        <img src={eehook} alt="Logo" className="navbar-logo" />
                    </NavLink>
                    <button type="button" className="mobile-close-button" onClick={() => setMenuOpen(false)} aria-label="Close navigation menu"><IoClose size={25} /></button>
                </div>
                <ul>
                    <li><NavLink to="/" onClick={closeMenu}>HOME</NavLink></li>
                    <li><NavLink to="/shop" onClick={closeMenu}>SHOP</NavLink></li>
                    <li>
                        <button type="button" className="mobile-category-toggle" onClick={() => setCategoryOpen(!categoryOpen)} aria-expanded={categoryOpen}>
                        <span>CATEGORIES</span>
                        <span>{categoryOpen ? <FaAngleUp size={20} /> : <FaAngleDown size={20} />}
                        </span>
                        </button>
                    </li>
                    {categoryOpen && (
                        <li className="mobile_categories">
                            {categories.map((cat) => (
                                <NavLink key={cat.id} to={`/shop?category=${cat.id}`} onClick={() => { setHoveredCategory(cat); setHoveredSubcategory(null); closeMenu(); }}>
                                    {cat.name}
                                </NavLink>
                            ))}
                        </li>
                    )}

                    {offerActive && (

                        <li><NavLink to="/shop?offer=true" onClick={closeMenu}>OFFERS</NavLink></li>
                    )}

                    <li><NavLink to="/shop?sort=new" onClick={closeMenu}>NEW ARRIVALS</NavLink></li>

                    <li><NavLink to="/about" onClick={closeMenu}>ABOUT US</NavLink></li>
                    <li><NavLink to="/contact" onClick={closeMenu}>CONTACT US</NavLink></li>
                </ul>
            </div>

            {/* ISOLATED GLOBAL MOBILE BOTTOM NAV BAR (Always locked strictly to bottom window layer) */}
            <div className="mobile_bottom">
                <NavLink to="/profile" className="mobile_bottom_item">
                    <CgProfile size={22} />
                </NavLink>

                <WelcomeBonusNotifications mobile />

                <NavLink to="/wishlist" className="mobile_bottom_item">
                    <div className="bottom_icon">
                        <FaHeart size={20} />
                        <span>{wishLength}</span>
                    </div>
                </NavLink>
                <NavLink to="/checkout" className="mobile_bottom_item">
                    <div className="bottom_icon">
                        <FaShoppingBag size={20} />
                        <span>{cartLength}</span>
                    </div>
                </NavLink>
            </div>
        </>
    );
}

export default Navbar;
