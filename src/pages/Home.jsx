import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useState, useEffect, useRef } from "react";

const recommendedProducts = [
  {
    name: "Milhoja",
    description: "Capas crujientes de hojaldre rellenas de suave arequipe y cubiertas con un delicioso glaseado. Un clásico irresistible para los amantes del dulce.",
    image: "/dulces/Milhojas.png",
    category: "DULCES",
    categorySlug: "dulces"
  },
  {
    name: "Porcion de Torta de Queso",
    description: "Suave, cremosa y con ese toque casero que conquista paladares. Un postre tradicional que combina la sencillez del queso con el sabor auténtico de nuestra panadería. ¡No te quedes sin probarla!",
    image: "/postres/torta_queso.JPG",
    category: "POSTRES",
    categorySlug: "postres"
  },
  {
    name: "Pizza",
    description: "Masa suave y crujiente, cubierta con salsa casera, queso derretido y jamón. ¡Un pedazo de sabor irresistible que te hará querer más!",
    image: "/especialidades/Pizza.png",
    category: "ESPECIALIDADES",
    categorySlug: "especialidades"
  },
  {
    name: "Kumis",
    description: "Fresco, cremoso y 100% artesanal. ¡El sabor de casa en cada sorbo!",
    image: "/bebidas/Kumis.png",
    category: "BEBIDAS",
    categorySlug: "bebidas"
  },
];

// Producto estrella de la semana - Ahora con video
const featuredProduct = {
  name: "Milhoja",
  description: "Nuestra milhoja es un postre exquisito que combina la tradición y la calidad. Capas crujientes de hojaldre rellenas de suave arequipe y cubiertas con un delicioso glaseado. Un clásico irresistible para los amantes del dulce que se ha convertido en el favorito de nuestros clientes esta semana.",
  video: "/videos/milhoja_postre.mp4",
  category: "POSTRES",
  rating: 5
};

export default function Home() {
  const [hoveredProduct, setHoveredProduct] = useState(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const videoRef = useRef(null);
  const [videoDimensions, setVideoDimensions] = useState({ width: "100%", height: "auto" });
  const [featuredVideoLoaded, setFeaturedVideoLoaded] = useState(false);

  // Optimización del video - mantener relación de aspecto
  useEffect(() => {
    const handleVideoLoad = () => {
      if (videoRef.current) {
        // Mantener la relación de aspecto natural del video
        const video = videoRef.current;
        const naturalWidth = video.videoWidth;
        const naturalHeight = video.videoHeight;
        
        if (naturalWidth > 0 && naturalHeight > 0) {
          const aspectRatio = naturalHeight / naturalWidth;
          const containerWidth = video.parentElement.offsetWidth;
          const calculatedHeight = containerWidth * aspectRatio;
          
          setVideoDimensions({
            width: "100%",
            height: `${calculatedHeight}px`
          });
        }
      }
    };

    const videoElement = videoRef.current;
    if (videoElement) {
      videoElement.addEventListener('loadedmetadata', handleVideoLoad);
      videoElement.addEventListener('resize', handleVideoLoad);
    }

    return () => {
      if (videoElement) {
        videoElement.removeEventListener('loadedmetadata', handleVideoLoad);
        videoElement.removeEventListener('resize', handleVideoLoad);
      }
    };
  }, []);

  // Componente de estrellas de rating
  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span
        key={index}
        style={{
          color: index < rating ? "#ffc107" : "#e4e5e9",
          fontSize: "1.5rem",
          margin: "0 2px",
          textShadow: "0 2px 4px rgba(0,0,0,0.2)"
        }}
      >
        ★
      </span>
    ));
  };

  return (
    <main className="container mt-4">
      {/* Sección de Bienvenida con fondo de Cristo Rey */}
      <div className="welcome-section">
        <div className="welcome-content">
          <h1 className="welcome-title">
            Bienvenidos a La Chiquita
          </h1>
          <p className="welcome-subtitle">
            Disfruta lo mejor del pan artesanal, hecho con amor.
          </p>

          {/* 📺 Video optimizado */}
          <div 
            className="welcome-video-container" 
            style={{ 
              maxWidth: "300px",       // ← Contenedor más angosto
              width: "100%",
              aspectRatio: "9/16",     // ← RELACIÓN VERTICAL 9:16 (alto > ancho)
              margin: "0 auto",
              borderRadius: "12px",
              overflow: "hidden",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
              backgroundColor: "#000"
            }}
          >
            <video
              className="welcome-video"
              src="/videos/home.mp4"
              controls
              muted
              autoPlay
              loop
              preload="metadata"
              style={{ 
                width: "100%",
                height: "100%",
                objectFit: "cover",    // ← El video cubre el espacio vertical
                display: "block"
              }}
            />
          </div>
        </div>
      </div>

      {/* 🏆 SECCIÓN "EL MÁS COMPRADO DE LA SEMANA" */}
      <div style={{
        background: "linear-gradient(135deg, #fffaf0 0%, #fff5e6 100%)",
        borderRadius: "20px",
        margin: "3rem 0",
        padding: "2.5rem 2rem",
        border: "2px solid #ffeeba",
        textAlign: "center"
      }}>
        {/* Badge con efecto de respiración */}
        <div style={{
          backgroundColor: "#ffd700",
          color: "#321808",
          padding: "12px 30px",
          borderRadius: "25px",
          fontWeight: "bold",
          fontSize: "1.2rem",
          marginBottom: "2rem",
          display: "inline-block",
          boxShadow: "0 0 5px rgba(255, 215, 0, 0.4), 0 0 10px rgba(255, 215, 0, 0.3), 0 0 15px rgba(255, 215, 0, 0.2), 0 0 20px rgba(255, 215, 0, 0.1)",
          border: "2px solid #ffc107",
          animation: `
            shake 2s infinite,
            borderGlow 3s infinite ease-in-out
          `
        }}>
          ⭐ PRODUCTO MÁS VENDIDO DE LA SEMANA ⭐
        </div>

        <div className="row justify-content-center align-items-center">
          {/* Video del producto en lugar de imagen */}
          <div className="col-md-4 text-center mb-4 mb-md-0">
            <div style={{
              width: "100%",
              maxWidth: "300px",
              height: "300px",
              margin: "0 auto",
              overflow: "hidden",
              borderRadius: "15px",
              boxShadow: "0 6px 20px rgba(0,0,0,0.15)",
              border: "3px solid #ffd700",
              backgroundColor: "#000",
              position: "relative"
            }}>
              {!featuredVideoLoaded && (
                <div 
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "loading 1.5s infinite",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "15px"
                  }}
                >
                  <span style={{ color: "#888", fontSize: "14px" }}>Cargando video...</span>
                </div>
              )}
              <video
                src={featuredProduct.video}
                controls
                muted
                autoPlay
                loop
                preload="metadata"
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: "15px",
                  opacity: featuredVideoLoaded ? 1 : 0,
                  transition: "opacity 0.3s ease-in-out"
                }}
                onLoadedData={() => setFeaturedVideoLoaded(true)}
                onError={(e) => {
                  console.error("Error cargando el video:", e);
                }}
              />
            </div>
          </div>

          {/* Información del producto */}
          <div className="col-md-8 text-center text-md-start">
            <h2 style={{
              color: "#321808",
              fontSize: "2rem",
              fontWeight: "bold",
              marginBottom: "1rem"
            }}>
              {featuredProduct.name}
            </h2>
            
            <p style={{
              color: "#654321",
              fontSize: "1.1rem",
              lineHeight: "1.6",
              marginBottom: "1.5rem"
            }}>
              {featuredProduct.description}
            </p>

            {/* Rating */}
            <div style={{ marginBottom: "1.5rem" }}>
              <div style={{ marginBottom: "0.5rem" }}>
                {renderStars(featuredProduct.rating)}
              </div>
              <span style={{
                color: "#666",
                fontSize: "0.9rem"
              }}>
              </span>
            </div>

            
          </div>
        </div>
      </div>

      {/* Sección de Recomendados */}
      <h2 className="recommended-title">Recomendados</h2>

      <div className="row g-3">
        {recommendedProducts.map((product, index) => (
          <div 
            className="col-6 col-md-3 product-card-container" 
            key={index}
            onMouseEnter={() => setHoveredProduct(index)}
            onMouseLeave={() => setHoveredProduct(null)}
            style={{ position: "relative" }}
          >
            <div className={`product-overlay ${hoveredProduct === index ? 'active' : ''}`}>
              <h5 className="text-center mb-3">
                {product.category}
              </h5>
              <Link 
                to={`/productos#${product.categorySlug}`}
                className="btn"
                onClick={() => {
                  sessionStorage.setItem('scrollToCategory', product.categorySlug);
                }}
              >
                Ver más
              </Link>
            </div>
            
            <ProductCard {...product} />
          </div>
        ))}
      </div>

      <div className="text-center my-5">
        <Link to="/productos" className="btn btn-primary btn-lg">
          Ver todos los productos
        </Link>
      </div>

      {/* Sección "Conócenos" - IMAGEN CORREGIDA */}
      <div className="about-section animate-fade-in-up">
        <div className="row">
          <div className="col-12 text-center mb-4">
            <h2 className="about-title">NUESTRA HISTORIA</h2>
          </div>
        </div>
        
        <div className="row align-items-center">
          <div className="col-md-6 order-md-1 order-2">
            <div className="about-text-content">
              <p className="about-text">
                Desde 1978, en <strong>La Chiquita</strong> hemos mantenido viva la tradición 
                de la panadería artesanal. Cada mañana amasamos con dedicación, 
                usando ingredientes frescos y recetas transmitidas por generaciones.
              </p>
              <p className="about-text">
                Nuestro compromiso es brindarte el auténtico sabor casero, 
                ese que te transporta a los mejores momentos en familia.
              </p>
            </div>
          </div>
          
          <div className="col-md-6 text-center order-md-2 order-1">
            <div style={{ 
              position: "relative", 
              width: "100%", 
              maxWidth: "400px",
              margin: "0 auto",
              overflow: "hidden",
              borderRadius: "12px",
              boxShadow: "0 4px 12px rgba(0,0,0,0.15)"
            }}>
              {!imageLoaded && (
                <div 
                  style={{
                    position: "absolute",
                    top: 0,
                    left: 0,
                    width: "100%",
                    height: "100%",
                    background: "linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%)",
                    backgroundSize: "200% 100%",
                    animation: "loading 1.5s infinite",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    borderRadius: "12px",
                    minHeight: "300px"
                  }}
                >
                  <span style={{ color: "#888", fontSize: "14px" }}>Cargando...</span>
                </div>
              )}
              <img 
                src="/apariencia/fondo_home.JPG"
                alt="Panadera La Chiquita"
                className="about-image"
                loading="lazy"
                onLoad={() => setImageLoaded(true)}
                onError={(e) => {
                  e.target.src = "/placeholder-panaderia.jpg";
                }}
                style={{
                  width: "100%",
                  height: "auto", // Cambiado a auto para mantener proporciones
                  display: "block",
                  borderRadius: "12px",
                  opacity: imageLoaded ? 1 : 0,
                  transition: "opacity 0.3s ease-in-out"
                }}
              />
            </div>
          </div>
        </div>
        
        {/* Botón debajo de la imagen en móviles */}
        <div className="row">
          <div className="col-12 text-center order-3">
            <div className="about-button-container">
              <Link 
                to="/nosotros" 
                className="btn about-btn"
              >
                Descubre nuestra historia
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Sección de Ubicación con Google Maps */}
      <div className="row align-items-center location-section animate-fade-in-up">
        <div className="col-md-6">
          <h2 className="location-title">VISÍTANOS</h2>
          <p className="location-text">
            Estamos ubicados en el corazón de Belalcázar, Caldas. Ven y disfruta 
            de nuestros productos recién horneados en un ambiente familiar y acogedor.
          </p>
          <p className="location-address">
            <strong>Dirección:</strong> Cra 3 #10-02, Belalcazar, Caldas
          </p>
          <div className="location-info">
            <p><strong>Horario de atención:</strong></p>
            <p>Lunes a Domingo y Festivos : 6:15 AM - 9:00 PM</p>
          </div>
        </div>
        <div className="col-md-6 text-center">
          {/* Contenedor del mapa con diseño responsivo */}
          <div className="map-container" style={{
            width: "100%",
            overflow: "hidden",
            borderRadius: "12px",
            position: "relative",
            paddingBottom: "56.25%",
            height: 0
          }}>
            <iframe
              src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d295.41983789832904!2d-75.81253278392496!3d4.992767080948355!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x8e47852c68f4ff7b%3A0x14670897885c7eee!2sPanaderia%20La%20Chiquita!5e0!3m2!1ses-419!2sco!4v1757275659145!5m2!1ses-419!2sco"
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "100%",
                border: 0
              }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              title="Ubicación de Panadería La Chiquita"
            ></iframe>
          </div>
          <div className="text-center mt-3">
            <a
              href="https://www.google.com/maps/place/Panaderia+La+Chiquita/@4.9927671,-75.8125328,20.75z/data=!4m14!1m7!3m6!1s0x8e47852c68f4ff7b:0x14670897885c7eee!2sPanaderia+La+Chiquita!8m2!3d4.9927209!4d-75.8124735!16s%2Fg%2F11hzwrqm_2!3m5!1s0x8e47852c68f4ff7b:0x14670897885c7eee!8m2!3d4.9927209!4d-75.8124735!16s%2Fg%2F11hzwrqm_2?entry=ttu&g_ep=EgoyMDI5MDkwMy.4wIKXMDSoASAFQAw%3D%3D"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              Abrir en Google Maps
            </a>
          </div>
        </div>
      </div>

      {/* Estilos CSS en línea para las animaciones */}
      <style>
        {`
          @keyframes shake {
            0%, 100% { transform: translateX(0) rotate(0); }
            10%, 30%, 50%, 70%, 90% { transform: translateX(-2px) rotate(-1deg); }
            20%, 40%, 60%, 80% { transform: translateX(2px) rotate(1deg); }
          }
          
          @keyframes borderGlow {
            0%, 100% { 
              box-shadow: 0 0 5px rgba(255, 215, 0, 0.4),
                          0 0 10px rgba(255, 215, 0, 0.3),
                          0 0 15px rgba(255, 215, 0, 0.2),
                          0 0 20px rgba(255, 215, 0, 0.1);
              border-color: #ffc107;
            }
            50% { 
              box-shadow: 0 0 10px rgba(255, 215, 0, 0.8),
                          0 0 20px rgba(255, 215, 0, 0.6),
                          0 0 30px rgba(255, 215, 0, 0.4),
                          0 0 40px rgba(255, 215, 0, 0.2);
              border-color: #ffeb3b;
            }
          }
        `}
      </style>
    </main>
  );
}