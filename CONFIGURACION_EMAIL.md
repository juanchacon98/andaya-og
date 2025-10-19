# Configuración de Email y Redirección de Autenticación

## Problema Resuelto
Este documento explica cómo se corrigió el problema de redirección a localhost después de confirmar el email de registro.

## Cambios Realizados en el Código

### 1. Actualización del Registro (`src/pages/Register.tsx`)
```typescript
// Antes (redirigía a la raíz, sin callback específico)
emailRedirectTo: `${window.location.origin}/`

// Ahora (usa variable de entorno y callback específico)
const SITE_URL = import.meta.env.VITE_SITE_URL ?? window.location.origin;
emailRedirectTo: `${SITE_URL}/auth/callback`
```

### 2. Nueva Página de Callback (`src/pages/AuthCallback.tsx`)
- Procesa los tokens del hash URL (`#access_token=...`)
- Verifica la sesión con Supabase
- Redirige a `/perfil` en caso de éxito
- Maneja errores con opciones de reenvío

### 3. Variable de Entorno (`.env`)
```bash
# En desarrollo (localhost)
VITE_SITE_URL=http://localhost:5173

# En preview (Lovable)
VITE_SITE_URL=https://preview--andaya-og.lovable.app

# En producción
VITE_SITE_URL=https://andaya-og.lovable.app
```

## Configuración en Supabase Dashboard

### 1. Authentication → URL Configuration

#### Site URL
```
https://preview--andaya-og.lovable.app
```
O tu dominio de producción cuando publiques.

#### Additional Redirect URLs (una por línea)
```
https://preview--andaya-og.lovable.app/auth/callback
https://andaya-og.lovable.app/auth/callback
http://localhost:5173/auth/callback
http://localhost:3000/auth/callback
```

**Nota:** Los localhost solo son necesarios para desarrollo local.

### 2. Email Templates → Confirm signup

Asegúrate de que el botón use `{{ .RedirectTo }}`:

```html
<a href="{{ .RedirectTo }}" style="...">
  Confirmar mi correo
</a>
```

Si `{{ .RedirectTo }}` no está disponible, usa:
```html
<a href="{{ .SiteURL }}/auth/callback" style="...">
  Confirmar mi correo
</a>
```

**NUNCA hardcodees localhost** en las plantillas.

## Flujo de Confirmación

1. Usuario se registra en `/registro`
2. Recibe email con link: `https://preview--andaya-og.lovable.app/auth/callback#access_token=...`
3. Hace clic en el enlace
4. `AuthCallback.tsx` procesa los tokens
5. Verifica la sesión
6. Redirige a `/perfil`

## Variables de Entorno en Lovable

Para agregar `VITE_SITE_URL` en tu proyecto Lovable:

1. Ve a **Project Settings** → **Environment Variables**
2. Agrega:
   - **Key:** `VITE_SITE_URL`
   - **Value:** `https://preview--andaya-og.lovable.app` (o tu dominio)
3. Guarda y redeploy

## Checklist de Prueba

- [ ] Crear usuario nuevo en preview
- [ ] Verificar que el email llega
- [ ] Clic en "Confirmar mi correo"
- [ ] Verifica que abre: `https://preview--andaya-og.lovable.app/auth/callback`
- [ ] Verifica que NO abre localhost
- [ ] Confirma que crea sesión y redirige a `/perfil`
- [ ] Repetir en localhost (dev) - debe funcionar también

## Problemas Comunes

### Email redirige a localhost
**Causa:** `VITE_SITE_URL` no está configurado o Supabase tiene localhost en Site URL  
**Solución:** 
1. Configura `VITE_SITE_URL` en Lovable
2. Actualiza Site URL en Supabase Dashboard

### "Requested path is invalid"
**Causa:** La URL de callback no está en Additional Redirect URLs  
**Solución:** Agrega todas las URLs (preview, prod, localhost) en Supabase

### Email no llega
**Causa:** Email provider no configurado o en spam  
**Solución:** Revisa spam, configura Resend o SMTP en Supabase

### Sesión no se crea después de confirmar
**Causa:** Tokens inválidos o expirados  
**Solución:** Revisa logs en consola, reenvía confirmación

## Soporte

Si el problema persiste:
1. Revisa la consola del navegador en `/auth/callback`
2. Verifica que todos los URLs en Supabase están correctos
3. Confirma que `VITE_SITE_URL` está configurado
4. Prueba limpiar cookies y caché

## Para Producción

Cuando publiques tu app:

1. Actualiza `VITE_SITE_URL` con tu dominio real
2. Agrega el dominio a Additional Redirect URLs en Supabase
3. Actualiza Site URL en Supabase
4. Si usas Resend, actualiza las plantillas con el nuevo dominio
5. Prueba el flujo completo en producción
