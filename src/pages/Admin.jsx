import { useEffect, useMemo, useState } from 'react';
import { supabase, usernameToEmail } from '../lib/supabase';

const emptyProduct = { name: '', slug: '', short_description: '', price: '', image_url: '', image_path: '', featured: false, available: true, active: true };

export default function Admin() {
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [products, setProducts] = useState([]);
  const [form, setForm] = useState(emptyProduct);
  const [editingId, setEditingId] = useState(null);
  const isEditing = useMemo(() => Boolean(editingId), [editingId]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => { setSession(data.session ?? null); setLoading(false); });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => setSession(nextSession));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => { if (session) loadProducts(); }, [session]);

  async function loadProducts() {
    const { data, error } = await supabase.from('products').select('*').order('sort_order').order('created_at', { ascending: false });
    if (error) setMessage(error.message); else setProducts(data ?? []);
  }

  async function handleLogin(event) {
    event.preventDefault();
    setMessage('Ingresando...');
    const { error } = await supabase.auth.signInWithPassword({ email: usernameToEmail(username), password });
    if (error) setMessage('Usuario o contraseña incorrectos.');
    else { setMessage(''); setPassword(''); }
  }

  async function handleImageUpload(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { setMessage('Selecciona un archivo de imagen.'); return; }
    if (file.size > 8 * 1024 * 1024) { setMessage('La imagen debe pesar menos de 8 MB.'); return; }

    setUploading(true);
    setMessage('Subiendo imagen...');
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const path = `products/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabase.storage.from('site-media').upload(path, file, { cacheControl: '3600', upsert: false });

    if (error) setMessage(error.message);
    else {
      const { data } = supabase.storage.from('site-media').getPublicUrl(path);
      setForm((current) => ({ ...current, image_url: data.publicUrl, image_path: path }));
      setMessage('Imagen subida correctamente.');
    }
    setUploading(false);
  }

  async function handleSave(event) {
    event.preventDefault();
    setMessage('Guardando...');
    const payload = {
      ...form,
      slug: form.slug.trim() || form.name.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
      price: form.price === '' ? null : Number(form.price),
    };
    const query = isEditing ? supabase.from('products').update(payload).eq('id', editingId) : supabase.from('products').insert(payload);
    const { error } = await query;
    if (error) { setMessage(error.message); return; }
    setMessage('Producto guardado correctamente.');
    setForm(emptyProduct); setEditingId(null); await loadProducts();
  }

  function startEdit(product) {
    setEditingId(product.id);
    setForm({
      name: product.name ?? '', slug: product.slug ?? '', short_description: product.short_description ?? '',
      price: product.price ?? '', image_url: product.image_url ?? '', image_path: product.image_path ?? '',
      featured: Boolean(product.featured), available: Boolean(product.available), active: Boolean(product.active),
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function removeProduct(product) {
    if (!window.confirm('¿Eliminar este producto?')) return;
    const { error } = await supabase.from('products').delete().eq('id', product.id);
    if (error) { setMessage(error.message); return; }
    if (product.image_path) await supabase.storage.from('site-media').remove([product.image_path]);
    await loadProducts();
  }

  async function signOut() { await supabase.auth.signOut({ scope: 'local' }); }

  if (loading) return <main style={styles.center}>Cargando...</main>;
  if (!session) return (
    <main style={styles.center}>
      <form onSubmit={handleLogin} style={styles.card}>
        <h1 style={styles.title}>Administración</h1><p>Panadería La Chiquita</p>
        <label style={styles.label}>Usuario</label>
        <input style={styles.input} value={username} onChange={(e) => setUsername(e.target.value)} autoComplete="username" required />
        <label style={styles.label}>Contraseña</label>
        <input style={styles.input} type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
        <button style={styles.primaryButton} type="submit">Iniciar sesión</button>
        {message && <p style={styles.message}>{message}</p>}
      </form>
    </main>
  );

  return (
    <main style={styles.page}>
      <div style={styles.header}><div><h1 style={styles.title}>Panel administrativo</h1><p>Administra productos, precios, disponibilidad e imágenes.</p></div><button style={styles.secondaryButton} onClick={signOut}>Cerrar sesión</button></div>
      <form onSubmit={handleSave} style={styles.card}>
        <h2>{isEditing ? 'Editar producto' : 'Agregar producto'}</h2>
        <div style={styles.grid}>
          <input style={styles.input} placeholder="Nombre" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input style={styles.input} placeholder="Identificador (opcional)" value={form.slug} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
          <input style={styles.input} type="number" min="0" step="100" placeholder="Precio" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
          <label style={styles.uploadLabel}>{uploading ? 'Subiendo...' : 'Seleccionar fotografía'}<input hidden type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} /></label>
        </div>
        {form.image_url && <img src={form.image_url} alt="Vista previa" style={styles.preview} />}
        <textarea style={{ ...styles.input, minHeight: 90 }} placeholder="Descripción corta" value={form.short_description} onChange={(e) => setForm({ ...form, short_description: e.target.value })} />
        <div style={styles.checks}>
          <label><input type="checkbox" checked={form.featured} onChange={(e) => setForm({ ...form, featured: e.target.checked })} /> Destacado</label>
          <label><input type="checkbox" checked={form.available} onChange={(e) => setForm({ ...form, available: e.target.checked })} /> Disponible</label>
          <label><input type="checkbox" checked={form.active} onChange={(e) => setForm({ ...form, active: e.target.checked })} /> Visible</label>
        </div>
        <div style={styles.actions}><button style={styles.primaryButton} type="submit" disabled={uploading}>{isEditing ? 'Actualizar' : 'Crear producto'}</button>{isEditing && <button style={styles.secondaryButton} type="button" onClick={() => { setEditingId(null); setForm(emptyProduct); }}>Cancelar</button>}</div>
        {message && <p style={styles.message}>{message}</p>}
      </form>
      <section style={styles.card}>
        <h2>Productos</h2>
        {products.length === 0 ? <p>No hay productos todavía.</p> : products.map((product) => (
          <article key={product.id} style={styles.productRow}>
            <div style={styles.productInfo}>{product.image_url && <img src={product.image_url} alt="" style={styles.thumbnail} />}<div><strong>{product.name}</strong><div>{product.price == null ? 'Sin precio' : `$${Number(product.price).toLocaleString('es-CO')}`}</div><small>{product.active ? 'Visible' : 'Oculto'} · {product.available ? 'Disponible' : 'No disponible'}</small></div></div>
            <div style={styles.actions}><button style={styles.secondaryButton} onClick={() => startEdit(product)}>Editar</button><button style={styles.dangerButton} onClick={() => removeProduct(product)}>Eliminar</button></div>
          </article>
        ))}
      </section>
    </main>
  );
}

const styles = {
  center: { minHeight: '100vh', display: 'grid', placeItems: 'center', padding: 24, background: '#f8f3ed' }, page: { maxWidth: 1100, margin: '0 auto', padding: '48px 24px', background: '#f8f3ed', minHeight: '100vh' },
  header: { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', marginBottom: 24, flexWrap: 'wrap' }, card: { width: '100%', maxWidth: 900, background: '#fff', borderRadius: 18, padding: 24, boxShadow: '0 10px 30px rgba(75,45,25,.12)', marginBottom: 24 },
  title: { margin: 0, color: '#5d3824' }, label: { display: 'block', marginTop: 14, marginBottom: 6, fontWeight: 700 }, input: { width: '100%', padding: '12px 14px', border: '1px solid #d8c8bb', borderRadius: 10, marginBottom: 12, font: 'inherit', boxSizing: 'border-box' },
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: 12 }, checks: { display: 'flex', gap: 18, flexWrap: 'wrap', margin: '8px 0 18px' }, actions: { display: 'flex', gap: 10, flexWrap: 'wrap' },
  primaryButton: { border: 0, borderRadius: 10, padding: '11px 18px', background: '#7a4428', color: '#fff', cursor: 'pointer', fontWeight: 700 }, secondaryButton: { border: '1px solid #7a4428', borderRadius: 10, padding: '10px 16px', background: '#fff', color: '#7a4428', cursor: 'pointer', fontWeight: 700 }, dangerButton: { border: 0, borderRadius: 10, padding: '10px 16px', background: '#a83232', color: '#fff', cursor: 'pointer', fontWeight: 700 },
  uploadLabel: { display: 'grid', placeItems: 'center', minHeight: 48, border: '1px dashed #7a4428', borderRadius: 10, cursor: 'pointer', color: '#7a4428', fontWeight: 700 }, message: { marginTop: 14, color: '#5d3824', fontWeight: 600 }, preview: { width: 160, height: 120, objectFit: 'cover', borderRadius: 12, marginBottom: 14 },
  productRow: { display: 'flex', justifyContent: 'space-between', gap: 20, alignItems: 'center', padding: '16px 0', borderBottom: '1px solid #eee', flexWrap: 'wrap' }, productInfo: { display: 'flex', alignItems: 'center', gap: 14 }, thumbnail: { width: 70, height: 70, objectFit: 'cover', borderRadius: 10 },
};
