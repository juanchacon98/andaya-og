# Configuración de Verificación de Email - AndaYa

## Problema resuelto
- ✅ Enlaces de verificación ya no apuntan a localhost
- ✅ Página de éxito de verificación creada en `/auth/verify-success`
- ✅ Redirección automática al perfil después de verificar email

## Pasos para configurar Supabase

### 1. Configurar URLs en Supabase

Ve a tu proyecto en Supabase y navega a: **Authentication → URL Configuration**

#### Site URL
Configura la URL principal de tu aplicación:
```
https://preview--andaya-og.lovable.app
```
O tu URL de producción si ya está desplegada.

#### Redirect URLs (Whitelist)
Agrega las siguientes URLs permitidas (una por línea):
```
https://preview--andaya-og.lovable.app/auth/verify-success
https://preview--andaya-og.lovable.app/auth/callback
https://preview--andaya-og.lovable.app/perfil
```

**Importante:** Asegúrate de **eliminar o comentar** `http://localhost:3000` si no quieres que se use en producción.

### 2. Personalizar plantilla de email (Opcional)

Si quieres personalizar el email de verificación:

1. Ve a **Authentication → Email Templates**
2. Selecciona "Confirm signup"
3. En el template, asegúrate de que el enlace use:
   ```html
   <a href="{{ .ConfirmationURL }}">Verificar mi cuenta</a>
   ```

El `{{ .ConfirmationURL }}` ya incluirá automáticamente el `redirect_to` configurado en el código.

### 3. Verificar configuración de la aplicación

El código de registro en `src/pages/Register.tsx` ya está configurado para usar la URL correcta:

```typescript
const { error } = await supabase.auth.signUp({
  email,
  password,
  options: {
    emailRedirectTo: `${window.location.origin}/auth/verify-success`
  }
});
```

Esto garantiza que funciona tanto en:
- Preview: `https://preview--andaya-og.lovable.app/auth/verify-success`
- Producción: `https://tudominio.com/auth/verify-success`

### 4. Probar el flujo

1. Registra un nuevo usuario
2. Revisa tu email
3. Haz clic en el enlace de verificación
4. Deberías ser redirigido a `/auth/verify-success`
5. Después de 3 segundos (o haciendo clic en el botón), serás llevado a `/perfil`

## Estructura del flujo

```
Usuario se registra
    ↓
Recibe email con enlace
    ↓
Clic en enlace → /auth/verify-success
    ↓
Auto-redirect (3s) → /perfil
```

## Troubleshooting

### Problema: Sigo viendo localhost en los enlaces
**Solución:** Verifica que en Supabase → Authentication → URL Configuration:
- Site URL esté configurado correctamente
- localhost NO esté en la lista de Redirect URLs

### Problema: "Invalid redirect URL"
**Solución:** Asegúrate de que la URL exacta (`/auth/verify-success`) esté en la whitelist de Redirect URLs en Supabase.

### Problema: Email no llega
**Solución:** 
1. Revisa spam/correo no deseado
2. En desarrollo, puedes desactivar "Confirm email" en Supabase → Authentication → Providers → Email
3. Verifica que el dominio del correo esté validado en tu proveedor de email

## Notas adicionales

- La página `/auth/verify-success` NO requiere autenticación (no está protegida con ProtectedRoute)
- Supabase maneja automáticamente la validación del token en el enlace
- La sesión del usuario se establece automáticamente después de la verificación
