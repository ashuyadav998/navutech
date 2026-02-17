// backend/services/email-notification.service.js
// ✅ Servicio UNIFICADO — reemplaza tanto email.service.js como email-notification.service.js
const nodemailer = require('nodemailer');

class EmailNotificationService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      host: 'smtp.gmail.com',
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD // Contraseña de aplicación de Google
      },
      connectionTimeout: 10000
    });

    // Verificar configuración al arrancar
    this.transporter.verify((error) => {
      if (error) {
        console.error('❌ Error en configuración de email:', error.message);
      } else {
        console.log('📧 Servidor de email listo');
      }
    });
  }

  // ==========================================
  // 1. BIENVENIDA
  // ==========================================
  async sendWelcomeEmail(user) {
    try {
      await this.transporter.sendMail({
        from: `"SimShop" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: '¡Bienvenido a SimShop! 🎉',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #eee; border-radius: 10px; overflow: hidden;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center;">
              <h1>¡Bienvenido a SimShop!</h1>
            </div>
            <div style="padding: 30px; background: #f9f9f9;">
              <h2>Hola ${user.name},</h2>
              <p>Gracias por registrarte. Estamos emocionados de tenerte con nosotros.</p>
              <p>Ya puedes explorar nuestro catálogo:</p>
              <ul>
                <li>📱 Tarjetas SIM prepago</li>
                <li>🎮 Gaming y Tecnología</li>
              </ul>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || '#'}" style="background: #3498db; color: white; padding: 12px 25px; text-decoration: none; border-radius: 5px;">Ir a la tienda</a>
              </div>
            </div>
          </div>
        `
      });
      console.log(`✅ Email de bienvenida enviado a ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Bienvenida:', error.message);
      return false;
    }
  }

  // ==========================================
  // 2. CÓDIGO DE VERIFICACIÓN
  // ==========================================
  async sendVerificationCode(email, code, name) {
    try {
      await this.transporter.sendMail({
        from: `"SimShop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: 'Código de Verificación - SimShop',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; text-align: center; border: 1px solid #ddd; padding: 20px;">
            <h1 style="color: #3498db;">Verificación de Cuenta</h1>
            <p>Hola ${name}, usa este código para completar tu proceso:</p>
            <div style="background: #f4f4f4; padding: 20px; font-size: 32px; font-weight: bold; letter-spacing: 10px; color: #3498db; border: 2px dashed #3498db; margin: 20px 0;">
              ${code}
            </div>
            <p>Este código expira en 10 minutos.</p>
          </div>
        `
      });
      console.log(`✅ Código de verificación enviado a ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Código:', error.message);
      throw error; // Re-lanzamos para que la ruta sepa que falló
    }
  }

  // ==========================================
  // 3. CONFIRMACIÓN DE PEDIDO
  // ✅ Acepta (order) con user populado, o (order, user) por separado
  // ==========================================
  async sendOrderConfirmation(order, user = null) {
    try {
      const recipient = user || order.user;
      const email = recipient?.email;
      const name = recipient?.name || 'Cliente';

      if (!email) {
        console.warn('⚠️ sendOrderConfirmation: sin email. Order:', order._id);
        return false;
      }

      const itemsHtml = order.items.map(item => `
        <p>${item.quantity}x ${item.product?.name || 'Producto'} — ${item.price}€</p>
      `).join('');

      await this.transporter.sendMail({
        from: `"SimShop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: `✅ Confirmación de Pedido #${order._id.toString().slice(-8).toUpperCase()}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #27ae60; color: white; padding: 20px; text-align: center;">
              <h1>✅ ¡Pedido Recibido!</h1>
            </div>
            <div style="padding: 20px; border: 1px solid #eee;">
              <p>Hola ${name}, hemos recibido tu pedido correctamente.</p>
              <div style="background: #f9f9f9; padding: 15px;">
                <h3>Resumen:</h3>
                ${itemsHtml}
                <hr>
                <p><strong>Total: ${order.totalAmount.toFixed(2)}€</strong></p>
              </div>
            </div>
          </div>
        `
      });
      console.log(`✅ Email de confirmación enviado a ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Confirmación:', error.message);
      return false;
    }
  }

  // ==========================================
  // 4. ACTUALIZACIÓN DE ESTADO
  // ✅ Firma principal: (order, oldStatus, newStatus) — order.user populado
  //    También compatible con llamada legacy: (order, userObject, newStatus)
  // ==========================================
  async sendOrderStatusUpdate(order, oldStatusOrUser, newStatus) {
    try {
      // Detectar si el segundo argumento es un string (oldStatus) o un objeto (user legacy)
      let recipient, oldStatus;
      if (typeof oldStatusOrUser === 'string') {
        oldStatus = oldStatusOrUser;
        recipient = order.user;
      } else {
        oldStatus = null;
        recipient = oldStatusOrUser;
      }

      const email = recipient?.email;
      const name = recipient?.name || 'Cliente';

      if (!email) {
        console.warn('⚠️ sendOrderStatusUpdate: sin email. Order:', order._id);
        return false;
      }

      const statusMessages = {
        procesando: { subject: '⚙️ Tu pedido está siendo preparado', title: 'Pedido en Preparación', message: 'Hemos comenzado a preparar tu pedido.', color: '#3498db' },
        enviado:    { subject: '📦 Tu pedido ha sido enviado',        title: 'Pedido Enviado',       message: 'Tu pedido está en camino. Puedes rastrearlo con el número de seguimiento.', color: '#9b59b6' },
        en_reparto: { subject: '🚚 Tu pedido está en reparto',        title: 'En Reparto',           message: 'Tu pedido está siendo entregado hoy.', color: '#e67e22' },
        entregado:  { subject: '✅ Tu pedido ha sido entregado',      title: 'Pedido Entregado',     message: '¡Esperamos que disfrutes tu compra!', color: '#27ae60' },
        cancelado:  { subject: '❌ Tu pedido ha sido cancelado',      title: 'Pedido Cancelado',     message: 'Si tienes dudas contacta con soporte.', color: '#e74c3c' }
      };

      const statusInfo = statusMessages[newStatus];
      if (!statusInfo) {
        console.log(`ℹ️ Sin plantilla para estado: ${newStatus}`);
        return false;
      }

      const trackingNumber = order.tracking?.trackingNumber || order.trackingNumber || null;
      const trackingUrl = order.tracking?.trackingUrl || null;

      await this.transporter.sendMail({
        from: `"SimShop" <${process.env.EMAIL_USER}>`,
        to: email,
        subject: statusInfo.subject,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${statusInfo.color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">${statusInfo.title}</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${name}</strong>,</p>
              <p>${statusInfo.message}</p>

              <div style="background: white; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <p><strong>Pedido:</strong> #${order._id.toString().slice(-8).toUpperCase()}</p>
                <p><strong>Total:</strong> ${new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(order.totalAmount)}</p>
                <p><strong>Estado:</strong> ${newStatus}</p>
              </div>

              ${trackingNumber ? `
                <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0;">
                  <p><strong>📦 Número de seguimiento:</strong></p>
                  <p style="font-size: 18px; font-weight: bold;">${trackingNumber}</p>
                  ${trackingUrl ? `<a href="${trackingUrl}" style="background: ${statusInfo.color}; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block; margin-top: 10px;">Rastrear pedido</a>` : ''}
                </div>
              ` : ''}

              <div style="text-align: center; padding: 20px; color: #999; font-size: 12px;">
                <p>Correo automático — no respondas a este mensaje.</p>
              </div>
            </div>
          </div>
        `
      });

      console.log(`✅ Email de estado "${newStatus}" enviado a ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Estado:', error.message);
      return false;
    }
  }
  // ==========================================
  // 5. CONFIRMACIÓN DE CAMBIO DE CONTRASEÑA
  // ==========================================
  async sendPasswordChanged(user) {
    try {
      await this.transporter.sendMail({
        from: `"SimShop" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: '🔒 Tu contraseña ha sido cambiada',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2c3e50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🔒 Contraseña actualizada</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${user.name}</strong>,</p>
              <p>Te confirmamos que la contraseña de tu cuenta ha sido cambiada correctamente.</p>
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>⚠️ ¿No fuiste tú?</strong></p>
                <p style="margin: 8px 0 0;">Si no realizaste este cambio, contacta con nosotros inmediatamente.</p>
              </div>
              <p style="color: #666; font-size: 12px; margin-top: 30px;">Correo automático — no respondas si reconoces la acción.</p>
            </div>
          </div>
        `
      });
      console.log(`✅ Email de cambio de contraseña enviado a ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Contraseña:', error.message);
      return false;
    }
  }

}

module.exports = new EmailNotificationService();