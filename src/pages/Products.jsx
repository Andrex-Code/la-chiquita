import { useEffect, useMemo, useState } from 'react';
import ProductCard from '../components/ProductCard';
import TortasCarousel from '../components/TortasCarousel';
import { supabase } from '../lib/supabase';

const fallbackProducts = {
  Panadería: [{ name: 'Pan', description: 'Crujiente por fuera, suave y esponjoso por dentro, hecho con amor desde 1978.', image_url: '/panaderia/pan.PNG', available: true }],
  Bebidas: [{ name: 'Kumis', description: 'Fresco, cremoso y 100% artesanal.', image_url: '/bebidas/Kumis.png', available: true }],
  Dulces: [
    { name: 'Alfajor', description: 'Doble galleta suave, arequipe y coco rallado.', image_url: '/dulces/Alfajores.png', available: true },
    { name: 'Milhoja', description: 'Capas crujientes de hojaldre, arequipe y glaseado.', image_url: '/dulces/Milhojas.png', available: true },
    { name: 'Chiqui Galletas', description: 'Divertidas, coloridas y llenas de sabor.', image_url: '/dulces/chiqui_galletas.PNG', available: true },
  ],
  Especialidades: [{ name: 'Pizza', description: 'Masa suave y crujiente con salsa casera, queso y jamón.', image_url: '/especialidades/Pizza.png', available: true }],
  Postres: [
    { name: 'Copa de Chocolate', description: 'Chocolate, crema suave y frutas frescas.', image_url: '/postres/Copa_chocolate.png', available: true },
    { name: 'Fresas con Crema', description: 'Bizcocho, crema, salsa de fresa y galleta.', image_url: '/postres/Fresas_crema.png', available: true },
    { name: 'Leche Asada', description: 'Un clásico de textura suave y sabor casero.', image_url: '/postres/leche_asada.JPG', available: true },
    { name: 'Brownie', description: 'Chocolate intenso con textura suave y esponjosa.', image_url: '/postres/brownie.PNG', available: true },
    { name: 'Torta de Ahuyama', description: 'Tradición, sabor casero y textura esponjosa.', image_url: '/postres/torta_ahuyama.jpg', available: true },
    { name: 'Tres Leches', description: 'Bizcocho suave, tres leches, chocolate y fresa.', image_url: '/postres/tres_leches.JPG', available: true },
    { name: 'Postre de Oreo', description: 'Cremoso y lleno del sabor de las galletas Oreo.', image_url: '/postres/oreo.JPG', available: true },
    { name: 'Porción de Torta de Queso', description: 'Suave, cremosa y con el toque casero de la panadería.', image_url: '/postres/torta_queso.JPG', available: true },
    { name: 'Postre Milhoja', description: 'Equilibrio perfecto entre textura y dulzura.', image_url: '/postres/postre_milhoja.jpg', available: true },
  ],
};

function categorySlug(value) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');
}

export default function Products() {
  const [products, setProducts] = useState(fallbackProducts);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    let active = true;

    async function loadCatalog() {
      setLoading(true);
      setNotice('');

      const { data, error } = await supabase
        .from('products')
        .select('id, name, short_description, image_url, price, available, sort_order, categories!inner(name, sort_order, active)')
        .eq('active', true)
        .eq('categories.active', true)
        .order('sort_order', { foreignTable: 'categories', ascending: true })
        .order('sort_order', { ascending: true })
        .order('name', { ascending: true });

      if (!active) return;

      if (error) {
        console.error('No fue posible cargar el catálogo:', error);
        setNotice('Mostramos el catálogo de respaldo mientras recuperamos la conexión.');
        setLoading(false);
        return;
      }

      const grouped = (data ?? []).reduce((result, product) => {
        const category = product.categories?.name || 'Otros';
        if (!result[category]) result[category] = [];
        result[category].push({
          id: product.id,
          name: product.name,
          description: product.short_description || 'Producto artesanal de Panadería La Chiquita.',
          image_url: product.image_url,
          price: product.price,
          available: product.available,
        });
        return result;
      }, {});

      if (Object.keys(grouped).length > 0) {
        setProducts(grouped);
      } else {
        setNotice('Aún no hay productos publicados.');
        setProducts({});
      }

      setLoading(false);
    }

    loadCatalog();
    return () => { active = false; };
  }, []);

  const categories = useMemo(() => Object.keys(products), [products]);

  function scrollToCategory(slug) {
    const element = document.getElementById(slug);
    if (!element) return;
    const y = element.getBoundingClientRect().top + window.pageYOffset - 90;
    window.scrollTo({ top: y, behavior: 'smooth' });
  }

  return (
    <main className="container py-4">
      <h1 className="mb-3 text-center">Nuestros Productos</h1>
      <p className="text-center mb-4" style={{ color: '#654321' }}>Tradición y sabor artesanal desde 1978.</p>

      {notice && <div className="alert alert-light border text-center" role="status">{notice}</div>}
      {loading && <p className="text-center">Cargando catálogo...</p>}

      {categories.length > 0 && (
        <nav className="d-flex justify-content-center gap-2 mb-5 flex-wrap" aria-label="Categorías de productos">
          {categories.map((category) => (
            <button
              key={category}
              type="button"
              className="btn"
              style={{ backgroundColor: '#e9b274', color: '#321808', border: '1px solid #af6a18', borderRadius: 20, padding: '8px 16px' }}
              onClick={() => scrollToCategory(categorySlug(category))}
            >
              {category.toUpperCase()}
            </button>
          ))}
        </nav>
      )}

      {Object.entries(products).map(([category, items]) => (
        <section key={category} className="mb-5" aria-labelledby={`${categorySlug(category)}-title`}>
          <div id={categorySlug(category)} style={{ position: 'relative', top: -80 }} />
          <h2 id={`${categorySlug(category)}-title`} className="mb-3" style={{ color: '#321808' }}>{category.toUpperCase()}</h2>
          <div className="row g-4">
            {items.map((product) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={product.id || `${category}-${product.name}`}>
                <ProductCard
                  name={product.name}
                  description={product.description}
                  image={product.image_url}
                  price={product.price}
                  available={product.available}
                />
              </div>
            ))}
          </div>
        </section>
      ))}

      <section className="mb-5 tortas-special-section" aria-label="Galería de tortas">
        <div id="tortas" style={{ position: 'relative', top: -80 }} />
        <TortasCarousel />
      </section>

      <div className="text-center my-5">
        <button type="button" className="btn" style={{ backgroundColor: '#af6a18', borderRadius: 20, padding: '10px 25px', color: '#faf7e7' }} onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          Volver arriba
        </button>
      </div>
    </main>
  );
}
