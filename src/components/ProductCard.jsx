import { useState } from 'react';

function formatPrice(price) {
  if (price == null || price === '') return null;
  return `$${Number(price).toLocaleString('es-CO')}`;
}

export default function ProductCard({ name, description, price, image, available = true }) {
  const [imageFailed, setImageFailed] = useState(false);
  const formattedPrice = formatPrice(price);

  return (
    <article className="card h-100 shadow-sm border-0" style={{ borderRadius: 12, overflow: 'hidden' }}>
      <div
        className="product-image-container"
        style={{
          width: '100%',
          aspectRatio: '1 / 1',
          overflow: 'hidden',
          display: 'grid',
          placeItems: 'center',
          background: 'linear-gradient(135deg, #f6eadc, #ead0ad)',
        }}
      >
        {image && !imageFailed ? (
          <img
            src={image}
            alt={name}
            loading="lazy"
            width={320}
            height={320}
            onError={() => setImageFailed(true)}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ textAlign: 'center', color: '#7a4428', padding: 24 }}>
            <div style={{ fontSize: 42, lineHeight: 1 }}>🥐</div>
            <small>Fotografía próximamente</small>
          </div>
        )}
      </div>

      <div className="card-body d-flex flex-column" style={{ backgroundColor: '#faf7e7' }}>
        <h3 className="h5 card-title" style={{ color: '#321808' }}>{name}</h3>
        <p className="card-text flex-grow-1" style={{ color: '#654321' }}>{description}</p>
        <div className="d-flex justify-content-between align-items-center gap-2 flex-wrap">
          {formattedPrice && <strong style={{ color: '#8a4c20' }}>{formattedPrice}</strong>}
          {!available && <span className="badge text-bg-secondary">Agotado</span>}
        </div>
      </div>
    </article>
  );
}
