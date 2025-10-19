# Configuración del Sistema de Pagos Simulados

Este documento describe la configuración necesaria para habilitar el sistema de pagos simulados en AndaYa.

## Cambios en la Base de Datos

Ejecuta las siguientes consultas SQL en tu panel de Supabase:

### 1. Agregar campo payment_status a reservations

```sql
-- Agregar columna payment_status a la tabla reservations
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS payment_status text DEFAULT 'pending';

-- Crear índice para mejorar el rendimiento de consultas
CREATE INDEX IF NOT EXISTS idx_reservations_payment_status 
ON reservations(payment_status);
```

### 2. Actualizar enum de payment_method (si es necesario)

Si el enum `payment_method` solo contiene 'full' y 'cashea_sim', necesitas agregar 'mercantil_sim':

```sql
-- Agregar nuevo valor al enum (solo si no existe)
ALTER TYPE payment_method ADD VALUE IF NOT EXISTS 'mercantil_sim';
```

### 3. Agregar campos adicionales a payments (opcionales pero recomendados)

```sql
-- Agregar metadatos para identificar pagos simulados
ALTER TABLE payments 
ADD COLUMN IF NOT EXISTS simulated boolean DEFAULT false;

-- Crear índice para consultas de pagos simulados
CREATE INDEX IF NOT EXISTS idx_payments_simulated 
ON payments(simulated) WHERE simulated = true;
```

### 4. Actualizar las columnas existentes de reservations (si es necesario)

Si tu tabla de reservations tiene campos adicionales que se mencionan en el código (como `final_total_bs`, `total_price_bs`, `pricing_mode`, etc.), asegúrate de que existan:

```sql
-- Estos son ejemplos - ajusta según tu esquema real
ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS final_total_bs numeric;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS total_price_bs numeric;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS pricing_mode text;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS start_at timestamp with time zone;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS end_at timestamp with time zone;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS hourly_rate_bs numeric;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS overage_hours numeric DEFAULT 0;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS late_fee_per_hour_bs numeric;

ALTER TABLE reservations 
ADD COLUMN IF NOT EXISTS rejection_reason text;
```

## Configuración de Emails Transaccionales (Pendiente)

Para enviar emails de confirmación de pago, necesitarás configurar un servicio de email como Resend:

1. Crea una cuenta en [resend.com](https://resend.com)
2. Verifica tu dominio
3. Crea una API key
4. Agrega el secret `RESEND_API_KEY` en tu proyecto de Supabase
5. Crea una edge function para enviar emails (o actualiza la existente)

### Plantilla de Email de Confirmación para Arrendatario

```
Asunto: Pago simulado recibido — Reserva {reservation_id}

Hola {renter_name},

Tu pago ha sido procesado exitosamente (simulación para demo).

Detalles del pago:
- Monto: Bs {amount}
- Método: {payment_method}
- Vehículo: {vehicle_title}
- Fechas: {start_date} a {end_date}

[Ver mi reserva]

Este es un correo generado automáticamente en modo simulación para demostración.
```

### Plantilla de Email de Notificación para Propietario

```
Asunto: Tu reserva {reservation_id} fue pagada (simulación)

Hola {owner_name},

La reserva de tu vehículo ha sido pagada (simulación para demo).

Detalles:
- Arrendatario: {renter_name}
- Vehículo: {vehicle_title}
- Fechas: {start_date} a {end_date}
- Monto: Bs {amount}

Contacta al arrendatario para coordinar la entrega del vehículo.

[Ver detalles de la reserva]
```

## Permisos y Políticas RLS

Asegúrate de que las políticas RLS de la tabla `payments` permitan:

1. **Inserción**: Solo a través de la edge function (con service_role)
2. **Lectura**: Solo el arrendatario y el propietario de la reserva asociada, y admins

```sql
-- Política de lectura para payments
CREATE POLICY "Users can view their own payments"
ON payments FOR SELECT
TO authenticated
USING (
  reservation_id IN (
    SELECT id FROM reservations 
    WHERE renter_id = auth.uid() OR owner_id = auth.uid()
  )
);

-- Política para admins
CREATE POLICY "Admins can view all payments"
ON payments FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM user_roles 
    WHERE user_id = auth.uid() 
    AND role IN ('admin_primary', 'admin_security')
  )
);
```

## Testing del Flujo

### Caso de prueba 1: Pago con Cashea
1. Crea una reserva como arrendatario
2. Espera a que el propietario la apruebe
3. Abre los detalles de la reserva
4. Haz clic en "Pagar reserva"
5. Selecciona "Confirmar simulación"
6. Elige Cashea
7. Completa el formulario con datos de prueba
8. Verifica que el pago se registre correctamente

### Caso de prueba 2: Pago con Mercantil
1. Repite los pasos 1-5 del caso anterior
2. Elige Mercantil
3. Completa el formulario de transferencia
4. Verifica que el pago se registre correctamente

### Verificación en Admin
1. Accede al panel de admin
2. Ve a "Gestión de Pagos"
3. Verifica que los pagos simulados aparezcan con el badge correcto
4. Verifica que los totales se calculen correctamente

## Colores de Marca

- **Cashea**: `#FFD400` (amarillo)
- **Mercantil**: `#0D529E` (azul corporativo)

Estos colores están configurados en los componentes `CasheaPaymentOption` y `MercantilPaymentOption`.

## Próximos Pasos para Producción

Cuando estés listo para integrar pagos reales:

1. **Cashea**: Contacta con Cashea para obtener credenciales de API y documentación
2. **Mercantil**: Contacta con Banco Mercantil para integración de pagos electrónicos
3. Reemplaza la edge function `simulate-payment` con integraciones reales
4. Configura webhooks para recibir confirmaciones de pago
5. Implementa manejo de errores y reintentos para pagos fallidos
6. Configura notificaciones por SMS además de email
7. Implementa sistema de reembolsos si es necesario

## Soporte y Debugging

Para revisar logs de la edge function:
1. Ve a Supabase Dashboard > Edge Functions
2. Selecciona `simulate-payment`
3. Revisa los logs en tiempo real

Para ver eventos de auditoría:
```sql
SELECT * FROM audit_logs 
WHERE action = 'payment_simulated' 
ORDER BY created_at DESC 
LIMIT 50;
```
