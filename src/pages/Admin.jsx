import { useEffect, useMemo, useState } from 'react';
import {
  Activity, Eye, EyeOff, ExternalLink, GalleryHorizontal, Grid3X3,
  ImagePlus, LayoutDashboard, LogOut, Menu, Monitor, Package,
  Palette, Plus, RefreshCcw, Save, Search, Settings, Smartphone,
  Sparkles, Store, Tag, Trash2, Upload, X,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import { supabase, usernameToEmail } from '../lib/supabase';
import '../styles/admin.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Resumen', icon: LayoutDashboard },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'categories', label: 'Categorías', icon: Tag },
  { id: 'content', label: 'Contenido', icon: Sparkles },
  { id: 'gallery', label: 'Galería y tortas', icon: GalleryHorizontal },
  { id: 'appearance', label: 'Apariencia', icon: Palette },
  { id: 'preview', label: 'Vista previa', icon: Monitor },
  { id: 'activity', label: 'Actividad', icon: Activity },
  { id: 'settings', label: 'Configuración', icon: Settings },
];

const emptyProduct = {
  category_id: '', name: '', slug: '', short_description: '', price: '',
  image_url: '', image_path: '', sort_order: 0, featured: false,
  available: true, active: true,
};

const emptyCategory = { name: '', slug: '', description: '', sort_order: 0, active: true };
const emptyGallery = { title: '', alt_text: '', image_url: '', image_path: '', sort_order: 0, active: true };

const defaultContent = {
  'hero.eyebrow': 'Tradición desde 1978',
  'hero.title': 'Bienvenidos a La Chiquita',
  'hero.subtitle': 'Panadería, cafetería y sabores hechos con tradición.',
  'hero.primary_button': 'Ver productos',
  'about.title': 'Nuestra historia',
  'about.body': 'Una tradición familiar que hornea momentos especiales todos los días.',
  'contact.title': 'Visítanos',
  'contact.subtitle': 'Estamos listos para atenderte y preparar tu pedido.',
  'footer.tagline': 'Tradición, sabor y calidad desde 1978.',
  'business.whatsapp': '573203818931',
  'business.phone': '',
  'business.email': '',
  'business.address': '',
  'business.hours': 'Lunes a domingo',
  'appearance.primary': '#6f3d24',
  'appearance.secondary': '#d69b5b',
  'appearance.background': '#f6efe7',
  'appearance.surface': '#fffaf4',
  'appearance.text': '#321808',
  'appearance.radius': '18',
};

function slugify(value) {
  return value.trim().toLowerCase().normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatMoney(value) {
  if (value === '' || value == null) return 'Sin precio';
  return `$${Number(value).toLocaleString('es-CO')}`;
}

function Login({ username, password, message, onUsername, onPassword, onSubmit }) {
  return (
    <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={onSubmit}>
        <div className="admin-login-brand">
          <div className="admin-login-logo">LC</div>
          <div><h1>La Chiquita</h1><p>Editor visual del sitio</p></div>
        </div>
        <div className="admin-form-stack">
          <div className="admin-field">
            <label>Usuario</label>
            <input className="admin-input" value={username} onChange={onUsername} autoComplete="username" required />
          </div>
          <div className="admin-field">
            <label>Contraseña</label>
            <input className="admin-input" type="password" value={password} onChange={onPassword} autoComplete="current-password" required />
          </div>
          <button className="admin-btn primary" type="submit">Entrar al editor</button>
          {message && <p>{message}</p>}
        </div>
      </form>
    </main>
  );
}

function ProductPreview({ product, category, mobile = false }) {
  const colors = { primary: '#6f3d24', secondary: '#d69b5b' };
  return (
    <div className={`admin-preview-frame ${mobile ? 'mobile' : ''}`}>
      <div className="admin-preview-browser"><span className="admin-preview-dot" /><span className="admin-preview-dot" /><span className="admin-preview-dot" /></div>
      <div className="admin-preview-content">
        <div className="admin-preview-hero">
          <small style={{ color: colors.primary }}>PANADERÍA LA CHIQUITA</small>
          <h3 style={{ color: colors.primary }}>Nuestros Productos</h3>
          <span className="admin-badge">{category || 'Categoría'}</span>
        </div>
        <ProductCard
          name={product.name || 'Nombre del producto'}
          description={product.short_description || 'La descripción aparecerá aquí mientras editas.'}
          price={product.price}
          image={product.image_url}
          available={product.available}
        />
      </div>
    </div>
  );
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeView, setActiveView] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [previewMobile, setPreviewMobile] = useState(false);

  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [content, setContent] = useState(defaultContent);

  const [productForm, setProductForm] = useState(emptyProduct);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [galleryForm, setGalleryForm] = useState(emptyGallery);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editingCategoryId, setEditingCategoryId] = useState(null);
  const [editingGalleryId, setEditingGalleryId] = useState(null);

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (session) loadEverything();
  }, [session]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const matchesSearch = `${product.name} ${product.short_description || ''}`.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || product.category_id === categoryFilter;
    const matchesStatus = statusFilter === 'all'
      || (statusFilter === 'visible' && product.active)
      || (statusFilter === 'hidden' && !product.active)
      || (statusFilter === 'available' && product.available)
      || (statusFilter === 'soldout' && !product.available)
      || (statusFilter === 'featured' && product.featured);
    return matchesSearch && matchesCategory && matchesStatus;
  }), [products, search, categoryFilter, statusFilter]);

  const stats = useMemo(() => ({
    products: products.length,
    visible: products.filter((item) => item.active).length,
    soldout: products.filter((item) => !item.available).length,
    featured: products.filter((item) => item.featured).length,
  }), [products]);

  async function loadEverything() {
    setLoading(true);
    await Promise.all([loadCategories(), loadProducts(), loadGallery(), loadContent()]);
    setLoading(false);
  }

  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*, categories(name)').order('sort_order').order('name');
    if (error) setMessage(`Productos: ${error.message}`); else setProducts(data ?? []);
  }

  async function loadCategories() {
    const { data, error } = await supabase.from('categories').select('*').order('sort_order').order('name');
    if (error) setMessage(`Categorías: ${error.message}`);
    else {
      setCategories(data ?? []);
      setProductForm((current) => current.category_id || !(data?.length)
        ? current : { ...current, category_id: data[0].id });
    }
  }

  async function loadGallery() {
    const { data, error } = await supabase.from('gallery').select('*').order('sort_order').order('created_at');
    if (!error) setGallery(data ?? []);
  }

  async function loadContent() {
    const { data, error } = await supabase.from('site_content').select('section, content_key, value');
    if (error) return;
    const next = { ...defaultContent };
    (data ?? []).forEach((item) => { next[`${item.section}.${item.content_key}`] = item.value ?? ''; });
    setContent(next);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('Ingresando...');
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) setMessage('Usuario o contraseña incorrectos.');
    else { setMessage(''); setPassword(''); }
  }

  async function uploadImage(event, folder, onComplete) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Selecciona una imagen válida.');
    if (file.size > 8 * 1024 * 1024) return setMessage('La imagen debe pesar menos de 8 MB.');
    setUploading(true);
    const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${folder}/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('site-media').upload(path, file, { contentType: file.type, cacheControl: '3600' });
    if (error) setMessage(error.message);
    else {
      const { data } = supabase.storage.from('site-media').getPublicUrl(path);
      onComplete({ image_url: data.publicUrl, image_path: path });
      setMessage('Imagen subida correctamente.');
    }
    setUploading(false);
  }

  function selectProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      category_id: product.category_id || '', name: product.name || '', slug: product.slug || '',
      short_description: product.short_description || '', price: product.price ?? '',
      image_url: product.image_url || '', image_path: product.image_path || '', sort_order: product.sort_order || 0,
      featured: Boolean(product.featured), available: Boolean(product.available), active: Boolean(product.active),
    });
  }

  function resetProduct() {
    setEditingProductId(null);
    setProductForm({ ...emptyProduct, category_id: categories[0]?.id || '' });
  }

  async function saveProduct(event) {
    event.preventDefault();
    if (!productForm.category_id) return setMessage('Selecciona una categoría.');
    setSaving(true);
    const payload = {
      ...productForm,
      name: productForm.name.trim(),
      slug: productForm.slug.trim() || slugify(productForm.name),
      short_description: productForm.short_description.trim() || null,
      price: productForm.price === '' ? null : Number(productForm.price),
      image_url: productForm.image_url || null,
      image_path: productForm.image_path || null,
      sort_order: Number(productForm.sort_order) || 0,
    };
    const query = editingProductId
      ? supabase.from('products').update(payload).eq('id', editingProductId)
      : supabase.from('products').insert(payload);
    const { error } = await query;
    if (error) setMessage(error.code === '23505' ? 'Ya existe un producto con ese identificador.' : error.message);
    else { setMessage('Producto guardado.'); await loadProducts(); if (!editingProductId) resetProduct(); }
    setSaving(false);
  }

  async function removeProduct(product) {
    if (!window.confirm(`¿Eliminar “${product.name}”?`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) return setMessage(error.message);
    if (product.image_path) await supabase.storage.from('site-media').remove([product.image_path]);
    if (editingProductId === product.id) resetProduct();
    setMessage('Producto eliminado.');
    await loadProducts();
  }

  function selectCategory(category) {
    setEditingCategoryId(category.id);
    setCategoryForm({ name: category.name, slug: category.slug, description: category.description || '', sort_order: category.sort_order || 0, active: category.active });
  }

  async function saveCategory(event) {
    event.preventDefault();
    setSaving(true);
    const payload = { ...categoryForm, name: categoryForm.name.trim(), slug: categoryForm.slug.trim() || slugify(categoryForm.name), sort_order: Number(categoryForm.sort_order) || 0 };
    const query = editingCategoryId ? supabase.from('categories').update(payload).eq('id', editingCategoryId) : supabase.from('categories').insert(payload);
    const { error } = await query;
    if (error) setMessage(error.message);
    else { setMessage('Categoría guardada.'); setEditingCategoryId(null); setCategoryForm(emptyCategory); await loadCategories(); await loadProducts(); }
    setSaving(false);
  }

  async function removeCategory(category) {
    const count = products.filter((item) => item.category_id === category.id).length;
    if (count > 0) return setMessage(`No puedes eliminarla: contiene ${count} productos.`);
    if (!window.confirm(`¿Eliminar “${category.name}”?`)) return;
    const { error } = await supabase.from('categories').delete().eq('id', category.id);
    if (error) setMessage(error.message); else { setMessage('Categoría eliminada.'); await loadCategories(); }
  }

  async function saveContentGroup(prefix) {
    setSaving(true);
    const entries = Object.entries(content).filter(([key]) => key.startsWith(`${prefix}.`));
    for (const [fullKey, value] of entries) {
      const [, contentKey] = fullKey.split('.');
      const { data } = await supabase.from('site_content').select('id').eq('section', prefix).eq('content_key', contentKey).maybeSingle();
      const query = data?.id
        ? supabase.from('site_content').update({ value }).eq('id', data.id)
        : supabase.from('site_content').insert({ section: prefix, content_key: contentKey, value });
      const { error } = await query;
      if (error) { setMessage(error.message); setSaving(false); return; }
    }
    setMessage('Contenido guardado.');
    setSaving(false);
  }

  async function saveGallery(event) {
    event.preventDefault();
    if (!galleryForm.image_url) return setMessage('Sube una imagen primero.');
    setSaving(true);
    const payload = { ...galleryForm, sort_order: Number(galleryForm.sort_order) || 0 };
    const query = editingGalleryId ? supabase.from('gallery').update(payload).eq('id', editingGalleryId) : supabase.from('gallery').insert(payload);
    const { error } = await query;
    if (error) setMessage(error.message);
    else { setMessage('Imagen guardada en la galería.'); setEditingGalleryId(null); setGalleryForm(emptyGallery); await loadGallery(); }
    setSaving(false);
  }

  async function removeGallery(item) {
    if (!window.confirm('¿Eliminar esta imagen de la galería?')) return;
    const { error } = await supabase.from('gallery').delete().eq('id', item.id);
    if (error) return setMessage(error.message);
    if (item.image_path) await supabase.storage.from('site-media').remove([item.image_path]);
    await loadGallery();
  }

  async function signOut() { await supabase.auth.signOut({ scope: 'local' }); }

  if (loading && !session) return <main className="admin-login-shell">Cargando...</main>;
  if (!session) return <Login username={username} password={password} message={message} onUsername={(e) => setUsername(e.target.value)} onPassword={(e) => setPassword(e.target.value)} onSubmit={handleLogin} />;

  const selectedCategoryName = categories.find((item) => item.id === productForm.category_id)?.name;

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand"><div className="admin-brand-logo">LC</div><div><strong>La Chiquita</strong><small>Editor visual</small></div></div>
        <nav className="admin-nav">
          {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
            <button key={id} className={`admin-nav-button ${activeView === id ? 'active' : ''}`} onClick={() => { setActiveView(id); setSidebarOpen(false); }}>
              <Icon size={18} /> {label}
            </button>
          ))}
        </nav>
        <div className="admin-sidebar-footer">
          <a className="admin-sidebar-link" href="/" target="_blank" rel="noreferrer"><ExternalLink size={17} /> Ver sitio</a>
          <button className="admin-nav-button" onClick={signOut}><LogOut size={18} /> Cerrar sesión</button>
        </div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <button className="admin-btn secondary admin-mobile-header" onClick={() => setSidebarOpen(true)}><Menu size={18} /></button>
            <div><h1>{NAV_ITEMS.find((item) => item.id === activeView)?.label}</h1><p>Los cambios guardados se reflejan en la página.</p></div>
          </div>
          <div className="admin-top-actions">
            <button className="admin-btn secondary" onClick={loadEverything}><RefreshCcw size={17} /><span>Actualizar</span></button>
            <a className="admin-btn primary" href="/" target="_blank" rel="noreferrer"><Eye size={17} /><span>Ver sitio</span></a>
          </div>
        </header>

        <section className="admin-content">
          {activeView === 'dashboard' && (
            <div className="admin-grid">
              <div className="admin-grid stats">
                {[
                  ['Productos', stats.products, Package], ['Visibles', stats.visible, Eye],
                  ['Agotados', stats.soldout, EyeOff], ['Destacados', stats.featured, Sparkles],
                ].map(([label, value, Icon]) => <div className="admin-card admin-stat" key={label}><div className="admin-stat-icon"><Icon size={21} /></div><strong>{value}</strong><span>{label}</span></div>)}
              </div>
              <div className="admin-grid two">
                <div className="admin-card">
                  <div className="admin-card-header"><div><h2>Acciones rápidas</h2><p>Edita las partes más usadas del sitio.</p></div></div>
                  <div className="admin-actions">
                    <button className="admin-btn primary" onClick={() => { resetProduct(); setActiveView('products'); }}><Plus size={17} /> Agregar producto</button>
                    <button className="admin-btn secondary" onClick={() => setActiveView('content')}><Sparkles size={17} /> Editar portada</button>
                    <button className="admin-btn secondary" onClick={() => setActiveView('gallery')}><ImagePlus size={17} /> Subir fotografía</button>
                    <button className="admin-btn secondary" onClick={() => setActiveView('preview')}><Monitor size={17} /> Revisar página</button>
                  </div>
                </div>
                <div className="admin-card">
                  <div className="admin-card-header"><div><h2>Estado del catálogo</h2><p>{categories.length} categorías configuradas</p></div></div>
                  {categories.map((category) => <div key={category.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '9px 0', borderBottom: '1px solid #eee2d7' }}><span>{category.name}</span><strong>{products.filter((p) => p.category_id === category.id).length}</strong></div>)}
                </div>
              </div>
            </div>
          )}

          {activeView === 'products' && (
            <div className="admin-grid three">
              <div className="admin-card">
                <div className="admin-card-header"><div><h2>Productos</h2><p>{filteredProducts.length} resultados</p></div><button className="admin-btn primary" onClick={resetProduct}><Plus size={17} /></button></div>
                <div className="admin-form-stack">
                  <div className="admin-search"><Search size={17} /><input className="admin-input" placeholder="Buscar producto" value={search} onChange={(e) => setSearch(e.target.value)} /></div>
                  <select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">Todas las categorías</option>{categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select>
                  <select className="admin-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}><option value="all">Todos los estados</option><option value="visible">Visibles</option><option value="hidden">Ocultos</option><option value="available">Disponibles</option><option value="soldout">Agotados</option><option value="featured">Destacados</option></select>
                </div>
                <div className="admin-list" style={{ marginTop: 14 }}>
                  {filteredProducts.map((product) => <button key={product.id} className={`admin-list-item ${editingProductId === product.id ? 'active' : ''}`} onClick={() => selectProduct(product)}>{product.image_url ? <img className="admin-list-thumb" src={product.image_url} alt="" /> : <div className="admin-list-thumb" style={{ display: 'grid', placeItems: 'center' }}>🥐</div>}<div className="admin-list-copy"><strong>{product.name}</strong><span>{product.categories?.name || 'Sin categoría'} · {formatMoney(product.price)}</span></div></button>)}
                </div>
              </div>

              <form className="admin-card" onSubmit={saveProduct}>
                <div className="admin-card-header"><div><h2>{editingProductId ? 'Editar producto' : 'Nuevo producto'}</h2><p>Los cambios se ven inmediatamente en la vista previa.</p></div>{editingProductId && <button type="button" className="admin-btn ghost" onClick={resetProduct}><X size={18} /></button>}</div>
                <div className="admin-form-stack">
                  <label className="admin-upload">{productForm.image_url ? <img src={productForm.image_url} alt="Vista previa" /> : <div><Upload size={28} /><strong style={{ display: 'block', marginTop: 8 }}>Subir fotografía</strong><small>JPG, PNG o WEBP · máximo 8 MB</small></div>}<input hidden type="file" accept="image/*" onChange={(e) => uploadImage(e, 'products', (image) => setProductForm((current) => ({ ...current, ...image })))} /></label>
                  <div className="admin-form-grid">
                    <div className="admin-field"><label>Nombre</label><input className="admin-input" value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} required /></div>
                    <div className="admin-field"><label>Categoría</label><select className="admin-select" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })} required><option value="">Selecciona</option>{categories.filter((c) => c.active).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></div>
                    <div className="admin-field"><label>Precio</label><input className="admin-input" type="number" min="0" step="100" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
                    <div className="admin-field"><label>Orden</label><input className="admin-input" type="number" min="0" value={productForm.sort_order} onChange={(e) => setProductForm({ ...productForm, sort_order: e.target.value })} /></div>
                  </div>
                  <div className="admin-field"><label>Descripción</label><textarea className="admin-textarea" value={productForm.short_description} onChange={(e) => setProductForm({ ...productForm, short_description: e.target.value })} /></div>
                  <details><summary style={{ cursor: 'pointer', fontWeight: 700 }}>Opciones avanzadas</summary><div className="admin-field" style={{ marginTop: 12 }}><label>Identificador</label><input className="admin-input" placeholder="Se genera automáticamente" value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })} /></div></details>
                  <div className="admin-switch-row">
                    <label className="admin-switch"><input type="checkbox" checked={productForm.active} onChange={(e) => setProductForm({ ...productForm, active: e.target.checked })} /> Visible</label>
                    <label className="admin-switch"><input type="checkbox" checked={productForm.available} onChange={(e) => setProductForm({ ...productForm, available: e.target.checked })} /> Disponible</label>
                    <label className="admin-switch"><input type="checkbox" checked={productForm.featured} onChange={(e) => setProductForm({ ...productForm, featured: e.target.checked })} /> Destacado</label>
                  </div>
                  <div className="admin-actions"><button className="admin-btn primary" disabled={saving || uploading}><Save size={17} /> {saving ? 'Guardando...' : 'Guardar producto'}</button>{editingProductId && <button type="button" className="admin-btn danger" onClick={() => removeProduct(products.find((p) => p.id === editingProductId))}><Trash2 size={17} /> Eliminar</button>}</div>
                </div>
              </form>

              <div className="admin-preview-shell"><div className="admin-preview-toolbar"><strong>Vista previa en vivo</strong><div className="admin-actions"><button className={`admin-btn ${!previewMobile ? 'primary' : 'secondary'}`} onClick={() => setPreviewMobile(false)}><Monitor size={16} /></button><button className={`admin-btn ${previewMobile ? 'primary' : 'secondary'}`} onClick={() => setPreviewMobile(true)}><Smartphone size={16} /></button></div></div><ProductPreview product={productForm} category={selectedCategoryName} mobile={previewMobile} /></div>
            </div>
          )}

          {activeView === 'categories' && (
            <div className="admin-grid two">
              <div className="admin-card"><div className="admin-card-header"><div><h2>Categorías</h2><p>Ordena las secciones del catálogo.</p></div></div><table className="admin-table"><thead><tr><th>Categoría</th><th>Productos</th><th>Estado</th><th /></tr></thead><tbody>{categories.map((category) => <tr key={category.id}><td><strong>{category.name}</strong><br /><small>{category.slug}</small></td><td>{products.filter((p) => p.category_id === category.id).length}</td><td><span className={`admin-badge ${category.active ? 'success' : 'muted'}`}>{category.active ? 'Activa' : 'Oculta'}</span></td><td><div className="admin-actions"><button className="admin-btn secondary" onClick={() => selectCategory(category)}>Editar</button><button className="admin-btn danger" onClick={() => removeCategory(category)}><Trash2 size={16} /></button></div></td></tr>)}</tbody></table></div>
              <form className="admin-card" onSubmit={saveCategory}><div className="admin-card-header"><div><h2>{editingCategoryId ? 'Editar categoría' : 'Nueva categoría'}</h2><p>Controla el nombre, orden y visibilidad.</p></div></div><div className="admin-form-stack"><div className="admin-field"><label>Nombre</label><input className="admin-input" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required /></div><div className="admin-field"><label>Descripción</label><textarea className="admin-textarea" value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div><div className="admin-form-grid"><div className="admin-field"><label>Identificador</label><input className="admin-input" value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} /></div><div className="admin-field"><label>Orden</label><input className="admin-input" type="number" value={categoryForm.sort_order} onChange={(e) => setCategoryForm({ ...categoryForm, sort_order: e.target.value })} /></div></div><label className="admin-switch"><input type="checkbox" checked={categoryForm.active} onChange={(e) => setCategoryForm({ ...categoryForm, active: e.target.checked })} /> Categoría visible</label><div className="admin-actions"><button className="admin-btn primary" disabled={saving}><Save size={17} /> Guardar</button>{editingCategoryId && <button type="button" className="admin-btn secondary" onClick={() => { setEditingCategoryId(null); setCategoryForm(emptyCategory); }}>Cancelar</button>}</div></div></form>
            </div>
          )}

          {activeView === 'content' && (
            <div className="admin-grid two">
              <div className="admin-grid">
                <div className="admin-card"><div className="admin-card-header"><div><h2>Portada</h2><p>Edita el primer bloque que ven los clientes.</p></div></div><div className="admin-form-stack">{[['Eyebrow','hero.eyebrow'],['Título principal','hero.title'],['Subtítulo','hero.subtitle'],['Texto del botón','hero.primary_button']].map(([label,key]) => <div className="admin-field" key={key}><label>{label}</label><input className="admin-input" value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} /></div>)}<button className="admin-btn primary" onClick={() => saveContentGroup('hero')}><Save size={17} /> Guardar portada</button></div></div>
                <div className="admin-card"><div className="admin-card-header"><div><h2>Historia y contacto</h2><p>Textos institucionales del sitio.</p></div></div><div className="admin-form-stack"><div className="admin-field"><label>Título de historia</label><input className="admin-input" value={content['about.title']} onChange={(e) => setContent({ ...content, 'about.title': e.target.value })} /></div><div className="admin-field"><label>Historia</label><textarea className="admin-textarea" value={content['about.body']} onChange={(e) => setContent({ ...content, 'about.body': e.target.value })} /></div><div className="admin-actions"><button className="admin-btn primary" onClick={() => saveContentGroup('about')}>Guardar historia</button></div></div></div>
              </div>
              <div className="admin-preview-shell"><div className="admin-preview-frame"><div className="admin-preview-browser"><span className="admin-preview-dot" /><span className="admin-preview-dot" /><span className="admin-preview-dot" /></div><div className="admin-preview-content"><div className="admin-preview-hero"><small>{content['hero.eyebrow']}</small><h2>{content['hero.title']}</h2><p>{content['hero.subtitle']}</p><button className="admin-btn primary">{content['hero.primary_button']}</button></div><div className="admin-card" style={{ boxShadow: 'none' }}><h3>{content['about.title']}</h3><p>{content['about.body']}</p></div></div></div></div>
            </div>
          )}

          {activeView === 'gallery' && (
            <div className="admin-grid two">
              <div className="admin-card"><div className="admin-card-header"><div><h2>Galería</h2><p>Administra fotografías de tortas y preparaciones.</p></div></div><div className="admin-gallery-grid">{gallery.map((item) => <div className="admin-gallery-card" key={item.id}>{item.image_url ? <img src={item.image_url} alt={item.alt_text || item.title || ''} /> : <div className="admin-preview-placeholder">Imagen</div>}<div className="admin-gallery-card-body"><strong>{item.title || 'Sin título'}</strong><div className="admin-actions" style={{ marginTop: 10 }}><button className="admin-btn secondary" onClick={() => { setEditingGalleryId(item.id); setGalleryForm(item); }}>Editar</button><button className="admin-btn danger" onClick={() => removeGallery(item)}><Trash2 size={15} /></button></div></div></div>)}</div>{gallery.length === 0 && <div className="admin-empty">Todavía no hay imágenes cargadas desde el panel.</div>}</div>
              <form className="admin-card" onSubmit={saveGallery}><div className="admin-card-header"><div><h2>{editingGalleryId ? 'Editar imagen' : 'Agregar imagen'}</h2><p>Se mostrará en las galerías del sitio.</p></div></div><div className="admin-form-stack"><label className="admin-upload">{galleryForm.image_url ? <img src={galleryForm.image_url} alt="" /> : <div><ImagePlus size={30} /><strong style={{ display: 'block', marginTop: 8 }}>Seleccionar fotografía</strong></div>}<input hidden type="file" accept="image/*" onChange={(e) => uploadImage(e, 'gallery', (image) => setGalleryForm((current) => ({ ...current, ...image })))} /></label><div className="admin-field"><label>Título</label><input className="admin-input" value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} /></div><div className="admin-field"><label>Texto alternativo</label><input className="admin-input" value={galleryForm.alt_text} onChange={(e) => setGalleryForm({ ...galleryForm, alt_text: e.target.value })} /></div><div className="admin-field"><label>Orden</label><input className="admin-input" type="number" value={galleryForm.sort_order} onChange={(e) => setGalleryForm({ ...galleryForm, sort_order: e.target.value })} /></div><label className="admin-switch"><input type="checkbox" checked={galleryForm.active} onChange={(e) => setGalleryForm({ ...galleryForm, active: e.target.checked })} /> Visible</label><button className="admin-btn primary" disabled={saving || uploading}><Save size={17} /> Guardar imagen</button></div></form>
            </div>
          )}

          {activeView === 'appearance' && (
            <div className="admin-grid two"><div className="admin-card"><div className="admin-card-header"><div><h2>Identidad visual</h2><p>Ajusta los colores de la experiencia.</p></div></div><div className="admin-form-grid">{[['Color principal','appearance.primary'],['Color secundario','appearance.secondary'],['Fondo','appearance.background'],['Superficie','appearance.surface'],['Texto','appearance.text']].map(([label,key]) => <div className="admin-field" key={key}><label>{label}</label><div style={{ display: 'flex', gap: 8 }}><input type="color" value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} style={{ width: 52, height: 44, border: 0, background: 'transparent' }} /><input className="admin-input" value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} /></div></div>)}</div><div className="admin-field" style={{ marginTop: 14 }}><label>Redondeo de tarjetas: {content['appearance.radius']}px</label><input type="range" min="4" max="32" value={content['appearance.radius']} onChange={(e) => setContent({ ...content, 'appearance.radius': e.target.value })} /></div><button className="admin-btn primary" style={{ marginTop: 16 }} onClick={() => saveContentGroup('appearance')}><Save size={17} /> Guardar apariencia</button></div><div className="admin-preview-shell"><div className="admin-preview-frame" style={{ background: content['appearance.background'], borderRadius: Number(content['appearance.radius']) }}><div className="admin-preview-browser" style={{ background: content['appearance.primary'] }} /><div className="admin-preview-content"><div className="admin-preview-hero" style={{ background: `linear-gradient(135deg, ${content['appearance.secondary']}, ${content['appearance.surface']})`, borderRadius: Number(content['appearance.radius']) }}><h2 style={{ color: content['appearance.text'] }}>Panadería La Chiquita</h2><button className="admin-btn primary" style={{ background: content['appearance.primary'] }}>Ver productos</button></div></div></div></div></div>
          )}

          {activeView === 'preview' && (
            <div className="admin-card"><div className="admin-card-header"><div><h2>Vista previa del sitio</h2><p>Revisa el resultado en escritorio o móvil.</p></div><div className="admin-actions"><button className={`admin-btn ${!previewMobile ? 'primary' : 'secondary'}`} onClick={() => setPreviewMobile(false)}><Monitor size={17} /> Escritorio</button><button className={`admin-btn ${previewMobile ? 'primary' : 'secondary'}`} onClick={() => setPreviewMobile(true)}><Smartphone size={17} /> Móvil</button></div></div><div className={`admin-preview-frame ${previewMobile ? 'mobile' : ''}`}><div className="admin-preview-browser"><span className="admin-preview-dot" /><span className="admin-preview-dot" /><span className="admin-preview-dot" /></div><div className="admin-preview-content"><div className="admin-preview-hero"><small>{content['hero.eyebrow']}</small><h2>{content['hero.title']}</h2><p>{content['hero.subtitle']}</p></div><div style={{ display: 'grid', gridTemplateColumns: previewMobile ? '1fr' : 'repeat(3, 1fr)', gap: 14 }}>{products.filter((p) => p.active).slice(0, 6).map((p) => <ProductCard key={p.id} name={p.name} description={p.short_description} image={p.image_url} price={p.price} available={p.available} />)}</div></div></div></div>
          )}

          {activeView === 'activity' && (
            <div className="admin-card"><div className="admin-card-header"><div><h2>Actividad reciente</h2><p>Últimos elementos modificados en el catálogo.</p></div></div><table className="admin-table"><thead><tr><th>Elemento</th><th>Tipo</th><th>Estado</th><th>Última actualización</th></tr></thead><tbody>{products.slice().sort((a,b) => new Date(b.updated_at) - new Date(a.updated_at)).slice(0,20).map((item) => <tr key={item.id}><td><strong>{item.name}</strong></td><td>Producto</td><td>{item.active ? 'Visible' : 'Oculto'}</td><td>{new Date(item.updated_at || item.created_at).toLocaleString('es-CO')}</td></tr>)}</tbody></table></div>
          )}

          {activeView === 'settings' && (
            <div className="admin-grid two"><div className="admin-card"><div className="admin-card-header"><div><h2>Información del negocio</h2><p>Datos de contacto usados en el sitio.</p></div></div><div className="admin-form-stack">{[['WhatsApp','business.whatsapp'],['Teléfono','business.phone'],['Correo','business.email'],['Dirección','business.address'],['Horarios','business.hours']].map(([label,key]) => <div className="admin-field" key={key}><label>{label}</label><input className="admin-input" value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} /></div>)}<button className="admin-btn primary" onClick={() => saveContentGroup('business')}><Save size={17} /> Guardar información</button></div></div><div className="admin-card"><div className="admin-card-header"><div><h2>Cuenta</h2><p>Sesión administrativa actual.</p></div></div><div className="admin-form-stack"><div className="admin-field"><label>Usuario conectado</label><input className="admin-input" value="carlos.valencia" disabled /></div><button className="admin-btn secondary" onClick={signOut}><LogOut size={17} /> Cerrar sesión</button><a className="admin-btn secondary" href="/" target="_blank" rel="noreferrer"><Store size={17} /> Abrir página pública</a></div></div></div>
          )}
        </section>
      </main>

      {sidebarOpen && <button aria-label="Cerrar menú" onClick={() => setSidebarOpen(false)} style={{ position: 'fixed', inset: 0, border: 0, background: 'rgba(0,0,0,.35)', zIndex: 25 }} />}
      {message && <div className="admin-toast" onClick={() => setMessage('')}>{message}</div>}
    </div>
  );
}
