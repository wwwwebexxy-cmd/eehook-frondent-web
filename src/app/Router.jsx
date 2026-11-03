import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate, useLocation, useParams } from 'react-router-dom'
import AdminRoute from '../features/Dasboard/page/AdminRoute'
import ProtectedRoute from '../features/auth/page/ProtectedRoute'

// Keep the public shell small. Pages are fetched only when a route is visited,
// so the homepage does not pay the cost of the dashboard, checkout, and admin
// editor modules during its first render.
const Home = lazy(() => import('../features/home/Home'))
const Sale = lazy(() => import('../features/sale/page/Sale'))
const Single_product = lazy(() => import('../features/single product/page/Single_product'))
const Cart_page = lazy(() => import('../features/cart/page/Cart_Page'))
const Wishlist = lazy(() => import('../features/wishlist/page/Wishlist'))
const Offer_poster = lazy(() => import('../hooks/offers/page/Offer_poster'))
const OrderDashboard = lazy(() => import('../features/Dasboard/page/OrderDashboard'))
const About = lazy(() => import('../features/About/page/About'))
const Profile = lazy(() => import('../features/Profile/page/Profile'))
const MyOrder = lazy(() => import('../features/myOrders/page/My_orders'))
const PaymentSuccess = lazy(() => import('../features/cart/page/PaymentSuccess'))
const ContactUs = lazy(() => import('../components/Contact'))
const Login = lazy(() => import('../features/auth/page/Login'))
const AdminLogin = lazy(() => import('../features/auth/page/AdminLogin'))
const Signup = lazy(() => import('../features/auth/page/SignUp'))
const ForgotPassword = lazy(() => import('../features/auth/page/ForgotPassord'))
const ResetPassword = lazy(() => import('../features/auth/page/ResetPassword'))
const Checkout = lazy(() => import('../features/cart/page/CheckOut'))
const Invoice = lazy(() => import('../features/Dasboard/page/InvoicePrint'))
const Unauthorized = lazy(() => import('../features/auth/page/Unauthorized'))

function RouteLoading() {
    return (
        <div className="app-loading" role="status" aria-live="polite" aria-label="Loading page">
            <div className="app-loading-card" aria-hidden="true">
                <span className="skeleton app-loading-logo" />
                <span className="skeleton app-loading-line wide" />
                <span className="skeleton app-loading-line" />
            </div>
        </div>
    );
}
function LegacyOrderDetailsRedirect() {
    const { id } = useParams();
    return <Navigate to={`/eehook-dashboard/orders/${id}`} replace />;
}

function LegacyDashboardPathRedirect() {
    const location = useLocation();
    const nextPath = location.pathname.replace(/^\/(?:order-dashboard|orderdashboard)/i, "/eehook-dashboard");
    return <Navigate to={`${nextPath}${location.search}${location.hash}`} replace />;
}

function Router() {
    return (
        <Suspense fallback={<RouteLoading />}>
            <div>

            <Routes>
                <Route path='/' element={<Home />} />
                <Route path='shop' element={<Sale />} />
                <Route path='products' element={<Sale />} />
                <Route path='/about' element={<About />} />

                <Route path='profile' element={
                    <ProtectedRoute>
                        <Profile />
                    </ProtectedRoute>
                } />

                <Route path="/single/:slug/:id/p/:colorSlug/:storageSlug" element={<Single_product />} />
                <Route path="/single/:slug/:id/p/:colorSlug" element={<Single_product />} />
                <Route path="/single/:slug/:id/p/storage/:storageOnlySlug" element={<Single_product />} />
                <Route path="/single/:slug/:id/p" element={<Single_product />} />
                <Route path="/single/:id" element={<Single_product />} />

                <Route path="checkout" element={
                    <ProtectedRoute>
                        <Cart_page />
                    </ProtectedRoute>
                } />
                <Route path="wishlist" element={
                    <ProtectedRoute>
                        <Wishlist />
                    </ProtectedRoute>
                } />
                <Route path="checkoutpage" element={
                    <ProtectedRoute>
                        <Checkout />
                    </ProtectedRoute>
                } />

                <Route path="/offers" element={<Offer_poster />} />

                <Route path='myorders' element={
                    <ProtectedRoute>
                        <MyOrder />
                    </ProtectedRoute>
                } />

                <Route path='login' element={<Login />} />
                <Route path='admin-login' element={<AdminLogin />} />
                <Route path='eehook-dashboard/admin-login' element={<AdminLogin />} />
                <Route path='unauthorized' element={<Unauthorized />} />
                <Route path='signup' element={<Signup />} />
                <Route path='forgot-password' element={<ForgotPassword />} />
                <Route path="/reset-password/:uidb64/:token" element={<ResetPassword />} />


                <Route path="eehook-dashboard" element={
                    <AdminRoute>
                        <OrderDashboard />
                    </AdminRoute>
                } />
                <Route path="eehook-dashboard/product-variants" element={<AdminRoute><Navigate to="/eehook-dashboard/products" replace /></AdminRoute>} />
                <Route path="eehook-dashboard/product-variant-units" element={<AdminRoute><Navigate to="/eehook-dashboard/products" replace /></AdminRoute>} />
                <Route path="eehook-dashboard/product-images" element={<AdminRoute><Navigate to="/eehook-dashboard/products" replace /></AdminRoute>} />
                <Route path="eehook-dashboard/products/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/products/:id" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/products/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/offers/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/offers/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/hero-banners/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/hero-banners/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/promo-banners/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/promo-banners/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/hero-side-banners/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/hero-side-banners/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/coupons/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/coupons/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/trust-benefits/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/product-highlights/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/product-highlights/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/product-messages/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/product-messages/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/welcome-bonuses/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/welcome-bonuses/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/coupon-usages/new" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/coupon-usages/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/token-blacklist" element={<AdminRoute><Navigate to="/eehook-dashboard/token-blacklist/outstanding-tokens" replace /></AdminRoute>} />
                <Route path="eehook-dashboard/token-blacklist/outstanding-tokens" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/token-blacklist/blacklisted-tokens" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/:section" element={
                    <AdminRoute>
                        <OrderDashboard />
                    </AdminRoute>
                } />
                <Route path="eehook-dashboard/orders/:id" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/:section/:id/view" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route path="eehook-dashboard/:section/:id/edit" element={<AdminRoute><OrderDashboard /></AdminRoute>} />
                <Route
                    path="/eehook-dashboard/details/:id"
                    element={
                        <AdminRoute>
                            <LegacyOrderDetailsRedirect />
                        </AdminRoute>
                    }
                />
                <Route
                    path="/eehook-dashboard/invoice/:id"
                    element={
                        <AdminRoute>
                            <Invoice />
                        </AdminRoute>
                    }
                />
                <Route path="order-dashboard" element={<LegacyDashboardPathRedirect />} />
                <Route path="order-dashboard/*" element={<LegacyDashboardPathRedirect />} />
                <Route path="orderDashboard" element={<LegacyDashboardPathRedirect />} />
                <Route path="orderDashboard/*" element={<LegacyDashboardPathRedirect />} />
                <Route
                    path="/payment-success"
                    element={<PaymentSuccess />}
                />
                <Route path='contact' element={<ContactUs />} />

            </Routes>

            </div>
        </Suspense>
    )
}

export default Router
