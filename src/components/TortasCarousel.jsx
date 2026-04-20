import React from 'react';
import Slider from 'react-slick';

const TortasCarousel = () => {
  const settings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000,
    centerMode: true,
    centerPadding: '0px',
    arrows: true,
    adaptiveHeight: false
  };

  const tortas = [
    {
      image: "/tortas/torta_cafe.JPG"
    },
    {
      image: "/tortas/torta1.JPG"
    },
    {
      image: "/tortas/torta2.JPG"
    },
    {
      image: "/tortas/torta3.jpg"
    },
    {
      image: "/tortas/torta4.png"
    }
  ];

  // Función para abrir WhatsApp
  const openWhatsApp = () => {
    const phoneNumber = "573203818931"; // Reemplaza con tu número de WhatsApp
    const message = "¡Hola! Estoy interesado/a en hacer un pedido de tortas. ¿Podrían ayudarme?";
    const whatsappURL = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappURL, '_blank');
  };

  return (
    <div className="tortas-section">
      <h2 className="text-center mb-4" style={{ color: "#321808" }}>TORTAS</h2>
      
      {/* Título general para todas las tortas */}
      <div className="text-center mb-4">
        <h3 className="tortas-general-title" style={{ color: "#654321", fontStyle: "italic" }}>
          GRAN VARIEDAD DE TORTAS DE TRES LECHES
        </h3>
      </div>
      
      <div className="tortas-carousel-container">
        <Slider {...settings}>
          {tortas.map((torta, index) => (
            <div key={index} className="torta-slide">
              <div className="torta-card">
                <div className="image-container" style={{
                  width: '100%',
                  height: 'clamp(250px, 60vw, 350px)',
                  background: 'linear-gradient(135deg, #faf7e7 0%, #e9b274 100%)',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  overflow: 'hidden'
                }}>
                  <img 
                    src={torta.image} 
                    alt="Torta de tres leches"
                    className="torta-image"
                    style={{
                      maxWidth: '100%',
                      maxHeight: '100%',
                      objectFit: 'contain'
                    }}
                    onError={(e) => {
                      e.target.src = "/placeholder-torta.jpg";
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </Slider>
      </div>

      {/* Botón "Haz tu pedido ya" */}
      <div className="text-center mt-4">
        <button 
          className="btn whatsapp-btn"
          onClick={openWhatsApp}
          style={{
            backgroundColor: "#25D366", // Color verde de WhatsApp
            color: "white",
            border: "none",
            borderRadius: "30px",
            padding: "15px 30px",
            fontSize: "1.2rem",
            fontWeight: "bold",
            boxShadow: "0 4px 8px rgba(0, 0, 0, 0.2)",
            transition: "all 0.3s ease",
            display: "inline-flex",
            alignItems: "center",
            gap: "10px"
          }}
          onMouseEnter={(e) => {
            e.target.style.backgroundColor = "#128C7E";
            e.target.style.transform = "translateY(-3px)";
            e.target.style.boxShadow = "0 6px 12px rgba(0, 0, 0, 0.3)";
          }}
          onMouseLeave={(e) => {
            e.target.style.backgroundColor = "#25D366";
            e.target.style.transform = "translateY(0)";
            e.target.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
          }}
        >
          <i className="fab fa-whatsapp" style={{ fontSize: "1.5rem" }}></i>
          HAZ TU PEDIDO YA
        </button>
      </div>
    </div>
  );
};

export default TortasCarousel;