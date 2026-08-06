import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';

function sanitizePasswordInput(value) {
  return value
    .replace(/[\u200B-\u200D\u2060\uFEFF]/g, '')
    .replace(/\u00A0/g, ' ');
}

export default function AdminLogin({ username, password, message, onUsername, onPassword, onSubmit }) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <main className="admin-login-shell">
      <form className="admin-login-card" onSubmit={onSubmit} noValidate>
        <div className="admin-login-brand">
          <div className="admin-login-logo">LC</div>
          <div><h1>La Chiquita</h1><p>Administra tu página sin complicaciones</p></div>
        </div>

        <div className="admin-form-stack">
          <div className="admin-field">
            <label htmlFor="admin-username">Usuario</label>
            <input
              id="admin-username"
              className="admin-input"
              value={username}
              onChange={onUsername}
              autoComplete="username"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              inputMode="email"
              enterKeyHint="next"
              required
            />
          </div>

          <div className="admin-field">
            <label htmlFor="admin-password">Contraseña</label>
            <div className="admin-password-field">
              <input
                id="admin-password"
                className="admin-input"
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(event) => onPassword(sanitizePasswordInput(event.target.value))}
                onBeforeInput={(event) => {
                  if (typeof event.data === 'string' && /[\u200B-\u200D\u2060\uFEFF]/.test(event.data)) {
                    event.preventDefault();
                  }
                }}
                onPaste={(event) => {
                  event.preventDefault();
                  onPassword(sanitizePasswordInput(event.clipboardData.getData('text')));
                }}
                autoComplete="current-password"
                autoCapitalize="none"
                autoCorrect="off"
                spellCheck={false}
                enterKeyHint="go"
                required
              />
              <button
                type="button"
                className="admin-password-toggle"
                onClick={() => setShowPassword((current) => !current)}
                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                aria-pressed={showPassword}
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
            <small className="admin-password-hint">Usa el botón del ojo para comprobar cada carácter.</small>
          </div>

          <button className="admin-btn primary admin-btn-block" type="submit">Entrar al panel</button>
          {message && <p className="admin-help" role="status" aria-live="polite">{message}</p>}
        </div>
      </form>
    </main>
  );
}
