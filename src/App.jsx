import { Routes, Route, useLocation } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import Navbar from "./components/Navbar";
import Home from "./pages/Home";
import Products from "./pages/Products";
import About from "./pages/About";
import Contact from "./pages/Contact";
import NuestraCocina from "./pages/NuestraCocina";
import Visitanos from "./pages/Visitanos";
import Admin from "./pages/Admin";
import ScrollToTopButton from "./components/ScrollToTopButton";
import ScrollRestoration from "./components/ScrollRestoration";
import Footer from "./components/Footer";
import WhatsAppButton from "./components/WhatsAppButton";
import { useEffect } from "react";

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        <Route path="/" element={<PageTransition><Home /></PageTransition>} />
        <Route path="/productos" element={<PageTransition><Products /></PageTransition>} />
        <Route path="/nosotros" element={<PageTransition><About /></PageTransition>} />
        <Route path="/contacto" element={<PageTransition><Contact /></PageTransition>} />
        <Route path="/nuestra-cocina" element={<PageTransition><NuestraCocina /></PageTransition>} />
        <Route path="/visitanos" element={<PageTransition><Visitanos /></PageTransition>} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </AnimatePresence>
  );
}

function PageTransition({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.4 }}
    >
      {children}
    </motion.div>
  );
}

function NavbarCloser() {
  const location = useLocation();

  useEffect(() => {
    const closeMenu = () => {
      const navbarCollapse = document.getElementById("navbarNav");
      const navbarToggler = document.querySelector('.navbar-toggler');

      if (navbarCollapse) {
        if (window.bootstrap) {
          const bsCollapse = window.bootstrap.Collapse.getInstance(navbarCollapse) ||
                            new window.bootstrap.Collapse(navbarCollapse, { toggle: false });
          if (bsCollapse._isShown()) bsCollapse.hide();
        } else if (navbarCollapse.classList.contains('show')) {
          navbarCollapse.classList.remove('show');
          if (navbarToggler) {
            navbarToggler.classList.add('collapsed');
            navbarToggler.setAttribute('aria-expanded', 'false');
          }
        }
      }
    };

    const timer = setTimeout(closeMenu, 10);
    return () => clearTimeout(timer);
  }, [location]);

  return null;
}

function App() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith('/admin');

  return (
    <>
      <ScrollRestoration />
      <NavbarCloser />
      {!isAdmin && <Navbar />}
      <AnimatedRoutes />
      {!isAdmin && <ScrollToTopButton />}
      {!isAdmin && <WhatsAppButton />}
      {!isAdmin && <Footer />}
    </>
  );
}

export default App;
