import { useEffect, useState, useRef } from "react";
import ProductCard from "../components/ProductCard";
import TortasCarousel from "../components/TortasCarousel";
import { supabase } from "../lib/supabase";

const localProducts = {
  Panadería: [{ name: "Pan", description: "Crujiente por fuera, suave y esponjoso por dentro, hecho con amor desde 1978.", image: "/panaderia/pan.PNG" }],
  Bebidas: [{ name: "Kumis", description: "Fresco, cremoso y 100% artesanal.", image: "/bebidas/Kumis.png" }],
  Dulces: [
    { name: "Alfajor", description: "Doble galleta suave, arequipe y coco rallado.", image: "/dulces/Alfajores.png" },
    { name: "Milhoja", description: "Capas crujientes de hojaldre, arequipe y glaseado.", image: "/dulces/Milhojas.png" },
    { name: "Chiqui Galletas", description: "Divertidas, coloridas y llenas de sabor.", image: "/dulces/chiqui_galletas.PNG" },
  ],
  Especialidades: [{ name: "Pizza", description: "Masa suave y crujiente con salsa casera, queso y jamón.", image: "/especialidades/Pizza.png" }],
  Postres: [
    { name: "Copa de Chocolate", description: "Chocolate, crema suave y frutas frescas.", image: "/postres/Copa_chocolate.png" },
    { name: "Fresas con Crema", description: "Bizcocho, crema, salsa de fresa y galleta.", image: "/postres/Fresas_crema.png" },
    { name: "Leche Asada", description: "Un clásico de textura suave y sabor casero.", image: "/postres/leche_asada.JPG" },
    { name: "Brownie", description: "Chocolate intenso con textura suave y esponjosa.", image: "/postres/brownie.PNG" },
    { name: "Torta de Ahuyama", description: "Tradición, sabor casero y textura esponjosa.", image: "/postres/torta_ahuyama.jpg" },
    { name: "Tres Leches", description: "Bizcocho suave, tres leches, chocolate y fresa.", image: "/postres/tres_leches.JPG" },
    { name: "Postre de Oreo", description: "Cremoso y lleno del sabor de las galletas Oreo.", image: "/postres/oreo.JPG" },
    { name: "Torta de Queso", description: "Suave, cremosa y con el toque casero de la panadería.", image: "/postres/torta_queso.JPG" },
    { name: "Postre Milhoja", description: "Equilibrio perfecto entre textura y dulzura.", image: "/postres/postre_milhoja.jpg" },
  ],
};

function categorySlug(value) {
  return value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, "-");
}

export default function Products() {
  const [products, setProducts] = useState(localProducts);
  const categoriesRef = useRef({});
  const hasScrolledRef = useRef(false);

  useEffect(() => {
    async function loadProducts() {
      const { data, error } = await supabase
        .from("products")
        .select("name, short_description, image_url, price, categories(name)")
        .eq("active", true)
        .order("sort_order", { ascending: true });

      if (error || !data?.length) return;

      const grouped = data.reduce((result, product) => {
        const category = product.categories?.name || "Otros";
        if (!result[category]) result[category] = [];
        result[category].push({
          name: product.name,
          description: product.short_description || "Producto artesanal de Panadería La Chiquita.",
          image: product.image_url || "/placeholder-product.png",
          price: product.price,
        });
        return result;
      }, {});

      setProducts(grouped);
    }

    loadProducts();
  }, []);

  useEffect(() => {
    if (hasScrolledRef.current) return;
    const target = sessionStorage.getItem("scrollToCategory");
    if (!target) return;

    const timer = setTimeout(() => {
      const element = document.getElementById(target);
      if (element) {
        const y = element.getBoundingClientRect().top + window.pageYOffset - 70;
        window.scrollTo({ top: y, behavior: "smooth" });
      }
      sessionStorage.removeItem("scrollToCategory");
      hasScrolledRef.current = true;
    }, 100);

    return () => clearTimeout(timer);
  }, [products]);

  const scrollToCategory = (slug) => {
    const element = document.getElementById(slug);
    if (!element) return;
    const y = element.getBoundingClientRect().top + window.pageYOffset - 70;
    window.scrollTo({ top: y, behavior: "smooth" });
  };

  return (
    <main className="container mt-4">
      <h1 className="mb-4 text-center">Nuestros Productos</h1>

      <div className="d-flex justify-content-center gap-2 mb-4 flex-wrap">
        {Object.keys(products).map((category) => (
          <button
            key={category}
            className="btn"
            style={{ backgroundColor: "#e9b274", color: "#321808", border: "1px solid #af6a18", borderRadius: 20, padding: "8px 16px" }}
            onClick={() => scrollToCategory(categorySlug(category))}
          >
            {category.toUpperCase()}
          </button>
        ))}
      </div>

      {Object.entries(products).map(([category, items]) => (
        <section key={category} className="mb-5" ref={(element) => { categoriesRef.current[categorySlug(category)] = element; }}>
          <div id={categorySlug(category)} style={{ position: "relative", top: -40 }} />
          <h2 className="mb-3" style={{ color: "#321808" }}>{category.toUpperCase()}</h2>
          <div className="row g-3">
            {items.map((product) => (
              <div className="col-12 col-sm-6 col-md-4 col-lg-3" key={`${category}-${product.name}`}>
                <ProductCard name={product.name} description={product.description} image={product.image} />
                {product.price != null && <p className="fw-bold mt-2">${Number(product.price).toLocaleString("es-CO")}</p>}
              </div>
            ))}
          </div>
        </section>
      ))}

      {!products.Tortas && (
        <section className="mb-5 tortas-special-section">
          <div id="tortas" style={{ position: "relative", top: -40 }} />
          <TortasCarousel />
        </section>
      )}

      <div className="text-center my-5">
        <button className="btn" style={{ backgroundColor: "#af6a18", borderRadius: 20, padding: "10px 25px", color: "#faf7e7" }} onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          Volver Arriba
        </button>
      </div>
    </main>
  );
}
