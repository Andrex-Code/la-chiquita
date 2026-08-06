import { useEffect, useMemo, useState } from 'react';
import {
  ArrowLeft, Check, ChevronRight, Eye, ExternalLink, GalleryHorizontal,
  Home, ImagePlus, LayoutDashboard, LogOut, Menu, Package, Plus,
  RefreshCcw, Save, Search, Settings, Sparkles, Tag, Trash2, Upload, X,
} from 'lucide-react';
import ProductCard from '../components/ProductCard';
import AdminLogin from '../components/AdminLogin';
import { supabase, usernameToEmail } from '../lib/supabase';
import '../styles/admin.css';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
  { id: 'products', label: 'Productos', icon: Package },
  { id: 'content', label: 'Página', icon: Sparkles },
  { id: 'gallery', label: 'Tortas', icon: GalleryHorizontal },
  { id: 'settings', label: 'Ajustes', icon: Settings },
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
  'contact.title': 'Contáctanos',
  'contact.subtitle': 'Estamos listos para atenderte y preparar tu pedido.',
  'footer.tagline': 'Tradición, sabor y calidad desde 1978.',
  'business.whatsapp': '573203818931',
  'business.phone': '+57 320 3818 931',
  'business.email': 'lachiquitapanaderia1@gmail.com',
  'business.address': 'Cra 3 #10-02 Belalcázar, Caldas',
  'business.hours': 'Lunes a domingo',
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

function sanitizePassword(value) {
  return value
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');
}

function ProductEditor({ open, product, categories, editing, saving, uploading, onChange, onUpload, onClose, onSave, onDelete }) {
  if (!open) return null;
  const category = categories.find((item) => item.id === product.category_id)?.name;
  return (
    <div className="admin-editor-layer" role="dialog" aria-modal="true" aria-label={editing ? 'Editar producto' : 'Nuevo producto'}>
      <div className="admin-editor-panel">
        <header className="admin-editor-header">
          <button className="admin-icon-btn" type="button" onClick={onClose}><ArrowLeft size={21} /></button>
          <div><strong>{editing ? 'Editar producto' : 'Nuevo producto'}</strong><small>{editing ? 'Actualiza la información y guarda' : 'Completa los datos para publicarlo'}</small></div>
          <button className="admin-icon-btn" type="button" onClick={onClose}><X size={20} /></button>
        </header>

        <form className="admin-editor-body" onSubmit={onSave}>
          <section className="admin-editor-main">
            <div className="admin-step-card">
              <div className="admin-step-heading"><span>1</span><div><h3>Foto del producto</h3><p>Esta será la primera imagen que verá el cliente.</p></div></div>
              <label className="admin-upload admin-upload-large">
                {product.image_url ? <img src={product.image_url} alt="Vista previa del producto" /> : <div><ImagePlus size={34} /><strong>Agregar fotografía</strong><small>Toca aquí para elegir una imagen</small></div>}
                <input hidden type="file" accept="image/*" onChange={onUpload} />
              </label>
            </div>

            <div className="admin-step-card">
              <div className="admin-step-heading"><span>2</span><div><h3>Información básica</h3><p>Nombre, categoría, descripción y precio.</p></div></div>
              <div className="admin-form-stack">
                <div className="admin-field"><label>Nombre del producto</label><input className="admin-input" value={product.name} onChange={(e) => onChange({ ...product, name: e.target.value })} placeholder="Ej. Pan de queso" required autoFocus /></div>
                <div className="admin-field"><label>Categoría</label><select className="admin-select" value={product.category_id} onChange={(e) => onChange({ ...product, category_id: e.target.value })} required><option value="">Selecciona una categoría</option>{categories.filter((item) => item.active).map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div>
                <div className="admin-field"><label>Descripción</label><textarea className="admin-textarea" value={product.short_description} onChange={(e) => onChange({ ...product, short_description: e.target.value })} placeholder="Describe brevemente el producto" /></div>
                <div className="admin-form-grid"><div className="admin-field"><label>Precio</label><input className="admin-input" type="number" min="0" step="100" value={product.price} onChange={(e) => onChange({ ...product, price: e.target.value })} placeholder="2000" /></div><div className="admin-field"><label>Orden</label><input className="admin-input" type="number" min="0" value={product.sort_order} onChange={(e) => onChange({ ...product, sort_order: e.target.value })} /></div></div>
              </div>
            </div>

            <div className="admin-step-card">
              <div className="admin-step-heading"><span>3</span><div><h3>Estado en la página</h3><p>Controla cómo lo verán tus clientes.</p></div></div>
              <div className="admin-option-list">
                <label className="admin-option"><div><strong>Visible en la página</strong><small>Ocúltalo sin eliminarlo.</small></div><input type="checkbox" checked={product.active} onChange={(e) => onChange({ ...product, active: e.target.checked })} /></label>
                <label className="admin-option"><div><strong>Disponible</strong><small>Desactívalo para mostrar “Agotado”.</small></div><input type="checkbox" checked={product.available} onChange={(e) => onChange({ ...product, available: e.target.checked })} /></label>
                <label className="admin-option"><div><strong>Destacado</strong><small>Úsalo para promociones o favoritos.</small></div><input type="checkbox" checked={product.featured} onChange={(e) => onChange({ ...product, featured: e.target.checked })} /></label>
              </div>
            </div>
          </section>

          <aside className="admin-editor-preview">
            <div className="admin-preview-label"><Eye size={17} /> Así se verá</div>
            <ProductCard name={product.name || 'Nombre del producto'} description={product.short_description || 'La descripción aparecerá aquí.'} price={product.price} image={product.image_url} available={product.available} />
            <p className="admin-help">Categoría: {category || 'Sin seleccionar'}</p>
          </aside>

          <footer className="admin-editor-actions">
            {editing && <button type="button" className="admin-btn danger" onClick={onDelete}><Trash2 size={17} /> Eliminar</button>}
            <button type="button" className="admin-btn secondary" onClick={onClose}>Cancelar</button>
            <button type="submit" className="admin-btn primary" disabled={saving || uploading}><Save size={17} /> {saving ? 'Guardando...' : 'Guardar producto'}</button>
          </footer>
        </form>
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
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [gallery, setGallery] = useState([]);
  const [content, setContent] = useState(defaultContent);
  const [productForm, setProductForm] = useState(emptyProduct);
  const [editingProductId, setEditingProductId] = useState(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [categoryForm, setCategoryForm] = useState(emptyCategory);
  const [galleryForm, setGalleryForm] = useState(emptyGallery);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, next) => setSession(next));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadEverything(); }, [session]);

  const filteredProducts = useMemo(() => products.filter((product) => {
    const query = `${product.name} ${product.short_description || ''}`.toLowerCase();
    return query.includes(search.toLowerCase()) && (categoryFilter === 'all' || product.category_id === categoryFilter);
  }), [products, search, categoryFilter]);

  const stats = useMemo(() => ({
    total: products.length,
    visible: products.filter((item) => item.active).length,
    unavailable: products.filter((item) => !item.available).length,
    missingImage: products.filter((item) => !item.image_url).length,
  }), [products]);

  async function loadEverything() {
    setLoading(true);
    const [productResult, categoryResult, galleryResult, contentResult] = await Promise.all([
      supabase.from('products').select('*, categories(name)').order('sort_order').order('name'),
      supabase.from('categories').select('*').order('sort_order').order('name'),
      supabase.from('gallery').select('*').order('sort_order').order('created_at'),
      supabase.from('site_content').select('section, content_key, value'),
    ]);
    if (productResult.error) setMessage(productResult.error.message); else setProducts(productResult.data ?? []);
    if (!categoryResult.error) setCategories(categoryResult.data ?? []);
    if (!galleryResult.error) setGallery(galleryResult.data ?? []);
    if (!contentResult.error) {
      const next = { ...defaultContent };
      (contentResult.data ?? []).forEach((item) => { next[`${item.section}.${item.content_key}`] = item.value ?? ''; });
      setContent(next);
    }
    setLoading(false);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('Ingresando...');
    const cleanPassword = sanitizePassword(password);
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password: cleanPassword });
    if (error) setMessage('Usuario o contraseña incorrectos.'); else { setMessage(''); setPassword(''); }
  }

  function openNewProduct() {
    setEditingProductId(null);
    setProductForm({ ...emptyProduct, category_id: categories[0]?.id || '' });
    setEditorOpen(true);
  }

  function openProduct(product) {
    setEditingProductId(product.id);
    setProductForm({
      category_id: product.category_id || '', name: product.name || '', slug: product.slug || '',
      short_description: product.short_description || '', price: product.price ?? '', image_url: product.image_url || '',
      image_path: product.image_path || '', sort_order: product.sort_order || 0, featured: Boolean(product.featured),
      available: Boolean(product.available), active: Boolean(product.active),
    });
    setEditorOpen(true);
  }

  async function uploadImage(event, folder, onComplete) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) return setMessage('Selecciona una imagen válida.');
    if (file.size > 8 * 1024 * 1024) return setMessage('La imagen debe pesar menos de 8 MB.');
    setUploading(true);
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `${folder}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('site-media').upload(path, file, { contentType: file.type, cacheControl: '3600' });
    if (error) setMessage(error.message);
    else {
      const { data } = supabase.storage.from('site-media').getPublicUrl(path);
      onComplete({ image_url: data.publicUrl, image_path: path });
      setMessage('Imagen cargada correctamente.');
    }
    setUploading(false);
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
    const query = editingProductId ? supabase.from('products').update(payload).eq('id', editingProductId) : supabase.from('products').insert(payload);
    const { error } = await query;
    if (error) setMessage(error.code === '23505' ? 'Ya existe un producto con ese nombre o identificador.' : error.message);
    else { setMessage('Producto guardado correctamente.'); setEditorOpen(false); await loadEverything(); }
    setSaving(false);
  }

  async function removeProduct() {
    const product = products.find((item) => item.id === editingProductId);
    if (!product || !window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) return setMessage(error.message);
    if (product.image_path) await supabase.storage.from('site-media').remove([product.image_path]);
    setEditorOpen(false);
    setMessage('Producto eliminado.');
    await loadEverything();
  }

  async function saveContentGroup(prefix) {
    setSaving(true);
    for (const [fullKey, value] of Object.entries(content).filter(([key]) => key.startsWith(`${prefix}.`))) {
      const [, contentKey] = fullKey.split('.');
      const { data } = await supabase.from('site_content').select('id').eq('section', prefix).eq('content_key', contentKey).maybeSingle();
      const query = data?.id ? supabase.from('site_content').update({ value }).eq('id', data.id) : supabase.from('site_content').insert({ section: prefix, content_key: contentKey, value });
      const { error } = await query;
      if (error) { setMessage(error.message); setSaving(false); return; }
    }
    setMessage('Cambios guardados en la página.');
    setSaving(false);
  }

  async function addCategory(event) {
    event.preventDefault();
    const payload = { ...categoryForm, name: categoryForm.name.trim(), slug: categoryForm.slug.trim() || slugify(categoryForm.name), sort_order: Number(categoryForm.sort_order) || 0 };
    const { error } = await supabase.from('categories').insert(payload);
    if (error) setMessage(error.message); else { setCategoryForm(emptyCategory); setMessage('Categoría creada.'); await loadEverything(); }
  }

  async function addGallery(event) {
    event.preventDefault();
    if (!galleryForm.image_url) return setMessage('Primero agrega una imagen.');
    const { error } = await supabase.from('gallery').insert({ ...galleryForm, sort_order: Number(galleryForm.sort_order) || 0 });
    if (error) setMessage(error.message); else { setGalleryForm(emptyGallery); setMessage('Foto agregada a la galería.'); await loadEverything(); }
  }

  async function removeGallery(item) {
    if (!window.confirm('¿Eliminar esta fotografía?')) return;
    const { error } = await supabase.from('gallery').delete().eq('id', item.id);
    if (error) return setMessage(error.message);
    if (item.image_path) await supabase.storage.from('site-media').remove([item.image_path]);
    await loadEverything();
  }

  async function signOut() { await supabase.auth.signOut({ scope: 'local' }); }

  if (loading && !session) return <main className="admin-login-shell">Cargando...</main>;
  if (!session) return <AdminLogin username={username} password={password} message={message} onUsername={(e) => setUsername(e.target.value)} onPassword={(value) => setPassword(value)} onSubmit={handleLogin} />;

  return (
    <div className="admin-app">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : ''}`}>
        <div className="admin-brand"><div className="admin-brand-logo">LC</div><div><strong>La Chiquita</strong><small>Panel de administración</small></div></div>
        <nav className="admin-nav">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={`admin-nav-button ${activeView === id ? 'active' : ''}`} onClick={() => { setActiveView(id); setSidebarOpen(false); }}><Icon size={19} /> {label}</button>)}</nav>
        <div className="admin-sidebar-footer"><a className="admin-sidebar-link" href="/" target="_blank" rel="noreferrer"><ExternalLink size={18} /> Ver página</a><button className="admin-nav-button" onClick={signOut}><LogOut size={18} /> Cerrar sesión</button></div>
      </aside>

      <main className="admin-main">
        <header className="admin-topbar">
          <div className="admin-top-title"><button className="admin-icon-btn admin-mobile-menu" onClick={() => setSidebarOpen(true)}><Menu size={21} /></button><div><h1>{NAV_ITEMS.find((item) => item.id === activeView)?.label}</h1><p>{activeView === 'products' ? 'Toca un producto para editarlo o usa “Agregar producto”.' : 'Administra la página de forma sencilla.'}</p></div></div>
          <div className="admin-top-actions"><button className="admin-btn secondary" onClick={loadEverything}><RefreshCcw size={17} /> <span>Actualizar</span></button><a className="admin-btn primary" href="/" target="_blank" rel="noreferrer"><Eye size={17} /> <span>Ver página</span></a></div>
        </header>

        <section className="admin-content">
          {activeView === 'dashboard' && <div className="admin-grid"><div className="admin-welcome"><div><span className="admin-eyebrow">PANEL DE LA CHIQUITA</span><h2>¿Qué quieres actualizar hoy?</h2><p>Usa las acciones rápidas. Cada opción te lleva directamente a lo que necesitas editar.</p></div><button className="admin-btn primary admin-btn-large" onClick={openNewProduct}><Plus size={20} /> Agregar producto</button></div><div className="admin-grid stats"><div className="admin-card admin-stat"><strong>{stats.total}</strong><span>Productos</span></div><div className="admin-card admin-stat"><strong>{stats.visible}</strong><span>Visibles</span></div><div className="admin-card admin-stat"><strong>{stats.unavailable}</strong><span>Agotados</span></div><div className="admin-card admin-stat"><strong>{stats.missingImage}</strong><span>Sin fotografía</span></div></div><div className="admin-action-grid"><button onClick={() => setActiveView('products')}><Package /><div><strong>Administrar productos</strong><small>Precios, fotos y disponibilidad</small></div><ChevronRight /></button><button onClick={() => setActiveView('content')}><Home /><div><strong>Editar la página</strong><small>Portada, historia y contacto</small></div><ChevronRight /></button><button onClick={() => setActiveView('gallery')}><GalleryHorizontal /><div><strong>Galería de tortas</strong><small>Subir y eliminar fotografías</small></div><ChevronRight /></button><button onClick={() => setActiveView('settings')}><Settings /><div><strong>Ajustes del negocio</strong><small>Categorías y datos de contacto</small></div><ChevronRight /></button></div></div>}

          {activeView === 'products' && <div className="admin-products-view"><div className="admin-section-toolbar"><div><h2>Catálogo</h2><p>{filteredProducts.length} productos encontrados</p></div><button className="admin-btn primary admin-add-product" onClick={openNewProduct}><Plus size={18} /> Agregar producto</button></div><div className="admin-filter-bar"><div className="admin-search"><Search size={18} /><input className="admin-input" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Buscar por nombre" /></div><select className="admin-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}><option value="all">Todas las categorías</option>{categories.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></div><div className="admin-product-grid">{filteredProducts.map((product) => <button key={product.id} className="admin-product-tile" onClick={() => openProduct(product)}>{product.image_url ? <img src={product.image_url} alt={product.name} /> : <div className="admin-product-placeholder">🥐</div>}<div className="admin-product-tile-body"><div><strong>{product.name}</strong><small>{product.categories?.name || 'Sin categoría'}</small></div><span>{formatMoney(product.price)}</span><div className="admin-product-status"><span className={product.active ? 'ok' : 'muted'}>{product.active ? 'Visible' : 'Oculto'}</span><span className={product.available ? 'ok' : 'warning'}>{product.available ? 'Disponible' : 'Agotado'}</span></div></div></button>)}</div>{filteredProducts.length === 0 && <div className="admin-empty"><Package size={38} /><h3>No encontramos productos</h3><p>Cambia los filtros o agrega uno nuevo.</p><button className="admin-btn primary" onClick={openNewProduct}><Plus size={18} /> Agregar producto</button></div>}</div>}

          {activeView === 'content' && <div className="admin-page-editor"><div className="admin-page-preview"><span className="admin-eyebrow">VISTA PREVIA</span><div className="admin-preview-hero"><small>{content['hero.eyebrow']}</small><h2>{content['hero.title']}</h2><p>{content['hero.subtitle']}</p><button className="admin-btn primary">{content['hero.primary_button']}</button></div><div className="admin-preview-section"><h3>{content['about.title']}</h3><p>{content['about.body']}</p></div></div><div className="admin-editor-sections"><div className="admin-card"><div className="admin-card-header"><div><h2>Portada</h2><p>Lo primero que ve el cliente.</p></div></div><div className="admin-form-stack">{[['Texto pequeño','hero.eyebrow'],['Título principal','hero.title'],['Subtítulo','hero.subtitle'],['Texto del botón','hero.primary_button']].map(([label,key]) => <div className="admin-field" key={key}><label>{label}</label><input className="admin-input" value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} /></div>)}<button className="admin-btn primary" onClick={() => saveContentGroup('hero')}><Save size={17} /> Guardar portada</button></div></div><div className="admin-card"><div className="admin-card-header"><div><h2>Historia</h2><p>Texto de la sección “Nosotros”.</p></div></div><div className="admin-form-stack"><div className="admin-field"><label>Título</label><input className="admin-input" value={content['about.title']} onChange={(e) => setContent({ ...content, 'about.title': e.target.value })} /></div><div className="admin-field"><label>Historia</label><textarea className="admin-textarea" value={content['about.body']} onChange={(e) => setContent({ ...content, 'about.body': e.target.value })} /></div><button className="admin-btn primary" onClick={() => saveContentGroup('about')}><Save size={17} /> Guardar historia</button></div></div></div></div>}

          {activeView === 'gallery' && <div className="admin-gallery-layout"><form className="admin-card admin-gallery-uploader" onSubmit={addGallery}><div className="admin-card-header"><div><h2>Agregar fotografía</h2><p>Se mostrará en la sección de tortas.</p></div></div><label className="admin-upload admin-upload-large">{galleryForm.image_url ? <img src={galleryForm.image_url} alt="Nueva fotografía" /> : <div><Upload size={34} /><strong>Elegir fotografía</strong><small>Toca aquí para subirla</small></div>}<input hidden type="file" accept="image/*" onChange={(e) => uploadImage(e, 'gallery', (image) => setGalleryForm((current) => ({ ...current, ...image })))} /></label><div className="admin-field"><label>Título opcional</label><input className="admin-input" value={galleryForm.title} onChange={(e) => setGalleryForm({ ...galleryForm, title: e.target.value })} /></div><button className="admin-btn primary admin-btn-block" disabled={uploading}><ImagePlus size={17} /> Agregar a la galería</button></form><div><div className="admin-section-toolbar"><div><h2>Fotos publicadas</h2><p>{gallery.length} fotografías</p></div></div><div className="admin-gallery-grid">{gallery.map((item) => <article className="admin-gallery-card" key={item.id}><img src={item.image_url} alt={item.alt_text || item.title || 'Torta'} /><div><strong>{item.title || 'Sin título'}</strong><button className="admin-icon-btn danger" onClick={() => removeGallery(item)}><Trash2 size={17} /></button></div></article>)}</div></div></div>}

          {activeView === 'settings' && <div className="admin-settings-grid"><div className="admin-card"><div className="admin-card-header"><div><h2>Información del negocio</h2><p>Datos que aparecen en contacto y pie de página.</p></div></div><div className="admin-form-stack">{[['WhatsApp','business.whatsapp'],['Teléfono','business.phone'],['Correo','business.email'],['Dirección','business.address'],['Horarios','business.hours']].map(([label,key]) => <div className="admin-field" key={key}><label>{label}</label><input className="admin-input" value={content[key]} onChange={(e) => setContent({ ...content, [key]: e.target.value })} /></div>)}<button className="admin-btn primary" onClick={() => saveContentGroup('business')}><Save size={17} /> Guardar información</button></div></div><div className="admin-card"><div className="admin-card-header"><div><h2>Categorías</h2><p>Organizan los productos del catálogo.</p></div></div><div className="admin-category-list">{categories.map((item) => <div key={item.id}><div><Tag size={17} /><span><strong>{item.name}</strong><small>{products.filter((product) => product.category_id === item.id).length} productos</small></span></div><span className={item.active ? 'admin-pill ok' : 'admin-pill muted'}>{item.active ? 'Activa' : 'Oculta'}</span></div>)}</div><form className="admin-form-stack admin-category-form" onSubmit={addCategory}><h3>Nueva categoría</h3><div className="admin-field"><label>Nombre</label><input className="admin-input" value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} required /></div><button className="admin-btn secondary"><Plus size={17} /> Crear categoría</button></form></div></div>}
        </section>
      </main>

      <nav className="admin-bottom-nav">{NAV_ITEMS.map(({ id, label, icon: Icon }) => <button key={id} className={activeView === id ? 'active' : ''} onClick={() => setActiveView(id)}><Icon size={20} /><span>{label}</span></button>)}</nav>
      {activeView === 'products' && !editorOpen && <button className="admin-mobile-fab" onClick={openNewProduct}><Plus size={24} /><span>Agregar producto</span></button>}
      {sidebarOpen && <button aria-label="Cerrar menú" className="admin-backdrop" onClick={() => setSidebarOpen(false)} />}
      <ProductEditor open={editorOpen} product={productForm} categories={categories} editing={Boolean(editingProductId)} saving={saving} uploading={uploading} onChange={setProductForm} onUpload={(event) => uploadImage(event, 'products', (image) => setProductForm((current) => ({ ...current, ...image })))} onClose={() => setEditorOpen(false)} onSave={saveProduct} onDelete={removeProduct} />
      {message && <button className="admin-toast" onClick={() => setMessage('')}><Check size={18} /> {message}</button>}
    </div>
  );
}
