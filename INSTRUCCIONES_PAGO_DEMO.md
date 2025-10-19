# 🎯 Instrucciones para Arreglar Pago Simulado (DEMO)

## Problema Actual
- ❌ Error "Could not find the function public.simulate_payment in the schema cache"
- ❌ Error "new row violates row-level security policy for table 'payments'"
- ❌ Error 400 en `/profiles` por columna `kyc_status` no existente
- ❌ Warning de `aria-describedby` en diálogo de pago

## ✅ Solución Implementada

### 1. Ejecutar SQL en Supabase (OBLIGATORIO)

**Pasos:**
1. Ve a tu **Supabase Dashboard**
2. Navega a **SQL Editor**
3. Abre el archivo `complete_demo_payment_fix.sql`
4. **Copia TODO el contenido**
5. **Pégalo en el SQL Editor**
6. **Click en "Run"** para ejecutar

**⚠️ IMPORTANTE:** Ejecuta TODO el script de una vez. No por partes.

### 2. ¿Qué hace el SQL?

#### 🔧 Columnas Requeridas
- Agrega `payment_status` a `reservations` (si no existe)
- Agrega `kyc_status` a `profiles` (si no existe)

#### 👁️ Vista de Profiles
- Crea `v_profiles_basic` con columnas seguras expuestas
- Evita errores 400 por columnas no accesibles
- **Uso recomendado:** Reemplazar `profiles` por `v_profiles_basic` en queries críticas

#### 🚀 RPC con Doble Firma
- **Firma canónica:** `simulate_payment(p_method text, p_reservation_id uuid)`
- **Wrapper inverso:** `simulate_payment(p_reservation_id uuid, p_method text)`
- **Sin validaciones** - siempre aprueba para DEMO
- Incluye `NOTIFY pgrst` para recargar schema cache inmediatamente

#### 🔐 Políticas RLS de DEMO
- Permiten INSERT de pagos simulados desde el cliente
- Permiten UPDATE de `payment_status` a `'simulated'` o `'paid'`
- Permiten SELECT de pagos y reservas propias

### 3. Frontend - Triple Fallback Implementado

El código frontend ya tiene 3 niveles de protección:

```typescript
// NIVEL 1: RPC canónico
await supabase.rpc('simulate_payment', {
  p_method: method,
  p_reservation_id: reservationId,
});

// NIVEL 2: Wrapper con firma inversa (si NIVEL 1 falla)
await supabase.rpc('simulate_payment', {
  p_reservation_id: reservationId,
  p_method: method,
});

// NIVEL 3: Fallback directo con RLS (si ambos fallan)
await supabase.from('payments').insert([...]);
await supabase.from('reservations').update({...});
```

### 4. Accesibilidad Arreglada

- ✅ `DialogDescription` agregado a `PaymentMethodSelector`
- ✅ `aria-describedby` configurado correctamente
- ✅ No más warnings de accesibilidad

## 📊 Criterios de Aceptación (QA)

### ✅ Debe Pasar
1. **Pago simulado funciona siempre:**
   - ✅ RPC canónico OK → aprobado
   - ✅ RPC con error de schema → wrapper lo resuelve
   - ✅ Ambos RPCs fallan → fallback directo con RLS inserta y actualiza

2. **Errores eliminados:**
   - ✅ No más "Could not find the function ... in the schema cache"
   - ✅ No más "new row violates row-level security policy"
   - ✅ No más "Could not find the 'payment_status' column"
   - ✅ No más 400 en profiles
   - ✅ No más warnings de `aria-describedby`

3. **UI correcta:**
   - ✅ Tras pago: badge "Pago: Simulado"
   - ✅ Aparecen botones "Tu Gruero" y "Seguro RCV"
   - ✅ Todos los montos en Bs (nunca $)
   - ✅ UI se refresca automáticamente

4. **Propietario ve:**
   - ✅ Reserva marcada como pagada
   - ✅ Datos del arrendatario visibles

## 🧪 Cómo Probar

1. **Crear reserva:**
   - Usuario A: Crea vehículo
   - Usuario B: Solicita reserva
   - Usuario A: Aprueba reserva

2. **Simular pago:**
   - Usuario B: Va a "Mis reservas"
   - Click en "Ver detalles y pagar"
   - Selecciona Cashea o Mercantil
   - Click en "Aprobar pago"

3. **Verificar resultado:**
   - ✅ Toast: "Pago simulado registrado exitosamente"
   - ✅ Badge: "Pago: Simulado" visible
   - ✅ Botones "Tu Gruero" y "Seguro RCV" aparecen
   - ✅ Monto mostrado en Bs

4. **Verificar desde propietario:**
   - Usuario A: Ve "Reservas de mis autos"
   - ✅ Reserva aparece como "Pagado"

## 🔴 Si Persisten Errores

### Error: "Could not find function"
**Solución:** Ejecuta en SQL Editor:
```sql
NOTIFY pgrst, 'reload schema';
```

### Error 400 en profiles
**Solución:** Verifica que ejecutaste TODO el SQL, especialmente:
```sql
-- Debe existir esta vista
SELECT * FROM public.v_profiles_basic LIMIT 1;
```

### Error RLS en payments
**Solución:** Verifica políticas:
```sql
-- Debe existir esta política
SELECT * FROM pg_policies 
WHERE tablename = 'payments' 
AND policyname = 'demo_allow_insert_simulated_payments';
```

## 📝 Notas Importantes

⚠️ **SOLO PARA DEMO:**
Este setup aprueba pagos sin validaciones. Antes de producción:
1. Remover políticas `demo_*`
2. Agregar validaciones en el RPC
3. Implementar gateway de pago real

⚠️ **Caché de PostgREST:**
Si cambias funciones SQL, siempre ejecuta:
```sql
NOTIFY pgrst, 'reload schema';
```

## 🎉 Resultado Final

Después de ejecutar el SQL:
- ✅ Pago simulado **NUNCA FALLA**
- ✅ Triple fallback automático
- ✅ Sin errores de RLS
- ✅ Sin errores de schema cache
- ✅ Sin errores 400 en profiles
- ✅ UI responsive y accesible
- ✅ Montos siempre en Bs
- ✅ Tu Gruero y Seguro RCV visibles post-pago
