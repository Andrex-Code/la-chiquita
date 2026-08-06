import { useEffect, useMemo, useState } from 'react';
import { supabase, usernameToEmail } from '../lib/supabase';

const emptyProduct = {
  category_id: '',
  name: '',
  slug: '',
  short_description: '',
  price: '',
  image_url: '',
  image_path: '',
  sort_order: 0,
  featured: false,
  available: true,
  active: true,
};

function slugify(value) {
  return value.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);

  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session ?? null);
      setLoading(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) return;
    Promise.all([loadCategories(), loadProducts()]);
  }, [session]);

  async function loadCategories() {
    const { data, error } = await supabase
      .from('categories')
      .select('id, name, slug, sort_order, active')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) {
      setMessage(`No fue posible cargar las categorías: ${error.message}`);
      return;
    }

    const activeCategories = (data ?? []).filter((category) => category.active);
    setCategories(activeCategories);
    setForm((current) => current.category_id || activeCategories.length === 0
      ? current
      : { ...current, category_id: activeCategories[0].id });
  }

  async function loadProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*, categories(name)')
      .order('sort_order', { ascending: true })
      .order('name', { ascending: true });

    if (error) setMessage(`No fue posible cargar los productos: ${error.message}`);
    else setProducts(data ?? []);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('Ingresando...');

    const { error } = await supabase.auth.signInWithPassword({
      email: usernameToEmail(username),
      password,
    });

    if (error) setMessage('Usuario o contraseña incorrectos.');
    else {
      setMessage('');
      setPassword('');
    }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setMessage('Selecciona un archivo de imagen válido.');
      return;
    }
    if (file.size > 8 * 1024 * 1024) {
      setMessage('La imagen debe pesar menos de 8 MB.');
      return;
    }

    setUploading(true);
    setMessage('Subiendo imagen...');

    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `products/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('site-media').upload(path, file, {
      cacheControl: '3600',
      upsert: false,
      contentType: file.type,
    });

    if (error) {
      setMessage(`No fue posible subir la imagen: ${error.message}`);
      setUploading(false);
      return;
    }

    const { data } = supabase.storage.from('site-media').getPublicUrl(path);
    setForm((current) => ({ ...current, image_url: data.publicUrl, image_path: path }));
    setMessage('Imagen subida correctamente.');
    setUploading(false);
  }

  async function handleSave(event) {
    event.preventDefault();

    if (!form.category_id) {
      setMessage('Selecciona una categoría.');
      return;
    }

    setSaving(true);
    setMessage('Guardando...');

    const payload = {
      category_id: form.category_id,
      name: form.name.trim(),
      slug: form.slug.trim() || slugify(form.name),
      short_description: form.short_description.trim() || null,
      price: form.price === '' ? null : Number(form.price),
      image_url: form.image_url || null,
      image_path: form.image_path || null,
      sort_order: Number(form.sort_order) || 0,
      featured: form.featured,
      available: form.available,
      active: form.active,
    };

    const query = isEditing
      ? supabase.from('products').update(payload).eq('id', editingId)
      : supabase.from('products').insert(payload);

    const { error } = await query;

    if (error) {
      setMessage(error.code === '23505'
        ? 'Ya existe un producto con ese identificador. Cambia el nombre o el identificador.'
        : `No fue posible guardar: ${error.message}`);
      setSaving(false);
      return;
    }

    setMessage('Producto guardado correctamente.');
    resetForm();
    await loadProducts();
    setSaving(false);
  }

  function resetForm() {
    setEditingId(null);
    setForm({ ...emptyProduct, category_id: categories[0]?.id || '' });
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      category_id: product.category_id ?? '',
      name: product.name ?? '',
      slug: product.slug ?? '',
      short_description: product.short_description ?? '',
      price: product.price ?? '',
      image_url: product.image_url ?? '',
      image_path: product.image_path ?? '',
      sort_order: product.sort_order ?? 0,
      featured: Boolean(product.featured),
      available: Boolean(product.available),
      active: Boolean(product.active),
    });
    setMessage('Editando producto.');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeProduct(product) {
    if (!window.confirm(`¿Eliminar “${product.name}”? Esta acción no se puede deshacer.`)) return;

    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) {
      setMessage(`No fue posible eliminar: ${error.message}`);
      return;
    }

    if (product.image_path) {
      await supabase.storage.from('site-media').remove([product.image_path]);
    }

    setMessage('Producto eliminado correctamente.');
    await loadProducts();
  }

  async function signOut() {
    await supabase.auth.signOut({ scope: 'local' });
  }

  if (loading) return <main style={styles.center}>Cargando...</main>;

  if (!session) {
    return (
      <main style={styles.center}>
        <form onSubmit={handleLogin} style={styles.card}>
          <h1 style={styles.title}>Administración</h1>
          <p>Panadería La Chiquita</p>
          <label style={styles.label}>Usuario</label>
          <input style={styles.input} value={username} onChange={(event) => setUsername(event.target.value)} autoComplete="username" required />
          <label style={styles.label}>Contraseña</label>
          <input style={styles.input} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required />
          <button style={styles.primaryButton} type="submit">Iniciar sesión</button>
          {message && <p style={styles.message}>{message}</p>}
        </form>
      </main>
    );
  }

  return (
    <main style={styles.page}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Panel administrativo</h1>
          <p>Administra categorías, productos, precios, disponibilidad e imágenes.</p>
        </div>
        <button style={styles.secondaryButton} type="button" onClick={signOut}>Cerrar sesión</button>
      </header>

      <form onSubmit={handleSave} style={styles.card}>
        <h2>{isEditing ? 'Editar producto' : 'Agregar producto'}</h2>

        <div style={styles.grid}>
          <label style={styles.field}>
            <span style={styles.fieldTitle}>Categoría</span>
            <select style={styles.input} value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })} required>
              <option value="">Selecciona una categoría</option>
              {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
            </select>
          </label>

          <label style={styles.field}>
            <span style={styles.fieldTitle}>Nombre</span>
            <input style={styles.input} value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldTitle}>Identificador</span>
            <input style={styles.input} placeholder="Se genera automáticamente" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldTitle}>Precio</span>
            <input style={styles.input} type="number" min="0" step="100" placeholder="Opcional" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>

          <label style={styles.field}>
            <span style={styles.fieldTitle}>Orden dentro de la categoría</span>
            <input style={styles.input} type="number" min="0" step="1" value={form.sort_order} onChange={(event) => setForm({ ...form, sort_order: event.target.value })} />
          </label>

          <label style={styles.uploadLabel}>
            {uploading ? 'Subiendo...' : form.image_url ? 'Cambiar fotografía' : 'Seleccionar fotografía'}
            <input hidden type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
          </label>
        </div>

        {form.image_url && <img src={form.image_url} alt="Vista previa del producto" style={styles.preview} />}

        <label style={styles.field}>
          <span style={styles.fieldTitle}>Descripción corta</span>
          <textarea style={{ ...styles.input, minHeight: 100 }} value={form.short_description} onChange={(event) => setForm({ ...form, short_description: event.target.value })} />
        </label>

        <div style={styles.checks}>
          <label><input type="checkbox" checked={form.featured} onChange={(event) => setForm({ ...form, featured: event.target.checked })} /> Destacado</label>
          <label><input type="checkbox" checked={form.available} onChange={(event) => setForm({ ...form, available: event.target.checked })} /> Disponible</label>
          <label><input type="checkbox" checked={form.active} onChange={(event) => setForm({ ...form, active: event.target.checked })} /> Visible</label>
        </div>

        <div style={styles.actions}>
          <button style={styles.primaryButton} type="submit" disabled={uploading || saving}>{saving ? 'Guardando...' : isEditing ? 'Actualizar producto' : 'Crear producto'}</button>
          {isEditing && <button style={styles.secondaryButton} type="button" onClick={resetForm}>Cancelar</button>}
        </div>

        {message && <p style={styles.message}>{message}</p>}
      </form>

      <section style={styles.card}>
        <div style={styles.sectionHeader}>
          <h2 style={{ margin: 0 }}>Productos ({products.length})</h2>
          <button style={styles.secondaryButton} type="button" onClick={loadProducts}>Actualizar lista</button>
        </div>

        {products.length === 0 ? <p>No hay productos todavía.</p> : products.map((product) => (
          <article key={product.id} style={styles.productRow}>
            <div style={styles.productInfo}>
              {product.image_url
                ? <img src={product.image_url} alt="" style={styles.thumbnail} />
                : <div style={styles.thumbnailFallback}>🥐</div>}
              <div>
                <strong>{product.name}</strong>
                <div>{product.categories?.name || 'Sin categoría'} · {product.price == null ? 'Sin precio' : `$${Number(product.price).toLocaleString('es-CO')}`}</div>
                <small>{product.active ? 'Visible' : 'Oculto'} · {product.available ? 'Disponible' : 'Agotado'} · Orden {product.sort_order}</small>
              </div>
            </div>
            <div style={styles.actions}>
              <button style={styles.secondaryButton} type="button" onClick={() => startEdit(product)}>Editar</button>
              <button style={styles.dangerButton} type="button" onClick={() => removeProduct(product)}>Eliminar</button>
            </div>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  center: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8f3ed' },
  page: { maxWidth: 1120, margin: '0 auto', padding: '48px 24px', background: '#f8f3ed', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' },
  card: { width: '100%', background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 10px 30px rgba(75,45,25,.12)', marginBottom: 24 },
  title: { margin: 0, color: '#5d3824' },
  label: { display: 'block', marginTop: 14, marginBottom: 6, fontWeight: 700 },
  field: { display: 'block' },
  fieldTitle: { display: 'block', fontWeight: 700, marginBottom: 6, color: '#4b2d1d' },
  input: { width: '100%', padding: '12px 14px', border: '1px solid #d8c8bb', borderRadius: 10, marginBottom: 12, font: 'inherit', boxSizing: 'border-box', background: '#fff' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12, alignItems: 'end' },
  checks: { display: 'flex', gap: 18, flexWrap: 'wrap', margin: '8px 0 18px' },
  actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  primaryButton: { border: 0, borderRadius: 10, padding: '11px 18px', background: '#7a4428', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  secondaryButton: { border: '1px solid #7a4428', borderRadius: 10, padding: '10px 16px', background: '#fff', color: '#7a4428', cursor: 'pointer', fontWeight: 700 },
  dangerButton: { border: 0, borderRadius: 10, padding: '10px 16px', background: '#a83232', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  uploadLabel: { display: 'grid', placeItems: 'center', minHeight: 48, border: '1px dashed #7a4428', borderRadius: 10, cursor: 'pointer', color: '#7a4428', fontWeight: 700, marginBottom: 12 },
  message: { marginTop: 14, color: '#5d3824', fontWeight: 600 },
  preview: { width: 180, height: 140, objectFit: 'cover', borderRadius: 12, marginBottom: 14 },
  sectionHeader: { display: 'flex', justifyContent: 'space-between', gap: 16, alignItems: 'center', flexWrap: 'wrap', marginBottom: 10 },
  productRow: { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', flexWrap: 'wrap' },
  productInfo: { display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 },
  thumbnail: { width: 72, height: 72, objectFit: 'cover', borderRadius: 10, background: '#f1e2d2' },
  thumbnailFallback: { width: 72, height: 72, display: 'grid', placeItems: 'center', borderRadius: 10, background: '#f1e2d2', fontSize: 30 },
};
