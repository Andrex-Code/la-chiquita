export default function Hero() {
  return (
    <section className="hero position-relative text-center text-light" style={{ backgroundColor: '#321808' }}>
      <video autoPlay muted loop className="w-100" style={{ objectFit: 'cover', height: 'clamp(350px, 80vh, 100vh)', opacity: 0.5 }}>
        <source src="/video.mp4" type="video/mp4" />
        Tu navegador no soporta video HTML5.
      </video>
      <div className="position-absolute top-50 start-50 translate-middle px-3">
        <h1 className="fw-bold" style={{ fontSize: 'clamp(1.8rem, 8vw, 3.5rem)' }}>El sabor que acompaña tu día</h1>
        <p className="lead" style={{ fontSize: 'clamp(0.95rem, 3vw, 1.25rem)' }}>Tradición, calidad y frescura en cada bocado</p>
      </div>
    </section>
  );
}
