// backend/services/email-notification.service.js
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = 'SimShop <ttechashu@gmail.com>';

class EmailNotificationService {

  // ==========================================
  // 1. CÓDIGO DE VERIFICACIÓN
  // ==========================================
  async sendVerificationCode(email, code, name) {
    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${code} — Tu código de verificación SimShop`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2c3e50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🔐 Código de Verificación</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${name || 'Usuario'}</strong>,</p>
              <p>Tu código de verificación es:</p>
              <div style="background: white; border: 2px dashed #667eea; border-radius: 12px; padding: 20px; text-align: center; margin: 20px 0;">
                <span style="font-size: 40px; font-weight: bold; letter-spacing: 12px; color: #667eea;">${code}</span>
              </div>
              <p style="color: #666;">⏱️ Este código expira en <strong>10 minutos</strong>.</p>
              <p style="color: #999; font-size: 12px;">Si no solicitaste este código, ignora este email.</p>
            </div>
          </div>
        `
      });
      console.log(`✅ Email de verificación enviado a ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Código:', error.message);
      return false;
    }
  }

  // ==========================================
  // 2. BIENVENIDA
  // ==========================================
  async sendWelcomeEmail(user) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: '🎉 ¡Bienvenido a SimShop!',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 40px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0; font-size: 32px;">🎉 ¡Bienvenido!</h1>
              <p style="margin: 10px 0 0; opacity: 0.9;">Ya formas parte de SimShop</p>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${user.name}</strong>,</p>
              <p>Tu cuenta ha sido creada correctamente. Ya puedes explorar nuestro catálogo y realizar pedidos.</p>
              <div style="text-align: center; margin: 30px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://navutech.netlify.app'}" 
                   style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 40px; border-radius: 25px; text-decoration: none; font-weight: bold; font-size: 16px;">
                  Ir a la tienda →
                </a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">Correo automático — no respondas a este mensaje.</p>
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
  // 3. CAMBIO DE ESTADO DEL PEDIDO
  // ==========================================
  async sendOrderStatusEmail(email, userName, orderNumber, newStatus, trackingNumber) {
    const statusConfig = {
      procesando:  { emoji: '⚙️',  label: 'En proceso',    color: '#3498db', msg: 'Estamos preparando tu pedido.' },
      enviado:     { emoji: '🚚',  label: 'Enviado',        color: '#e67e22', msg: `Tu pedido está en camino. Tracking: <strong>${trackingNumber || 'N/A'}</strong>` },
      entregado:   { emoji: '✅',  label: 'Entregado',      color: '#27ae60', msg: '¡Tu pedido ha sido entregado!' },
      cancelado:   { emoji: '❌',  label: 'Cancelado',      color: '#e74c3c', msg: 'Tu pedido ha sido cancelado. Contacta con soporte si tienes dudas.' },
      pendiente:   { emoji: '⏳',  label: 'Pendiente',      color: '#95a5a6', msg: 'Tu pedido está pendiente de confirmación.' },
    };

    const cfg = statusConfig[newStatus] || { emoji: '📦', label: newStatus, color: '#667eea', msg: 'El estado de tu pedido ha cambiado.' };

    try {
      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `${cfg.emoji} Tu pedido #${orderNumber} — ${cfg.label}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: ${cfg.color}; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px; margin-bottom: 10px;">${cfg.emoji}</div>
              <h1 style="margin: 0;">Pedido ${cfg.label}</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${userName}</strong>,</p>
              <p>${cfg.msg}</p>
              <div style="background: white; border-left: 4px solid ${cfg.color}; padding: 15px 20px; margin: 20px 0; border-radius: 4px;">
                <strong>Pedido:</strong> #${orderNumber}<br>
                <strong>Estado:</strong> ${cfg.label}
                ${trackingNumber && newStatus === 'enviado' ? `<br><strong>Tracking:</strong> ${trackingNumber}` : ''}
              </div>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://navutech.netlify.app'}/perfil" 
                   style="background: ${cfg.color}; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                  Ver mis pedidos →
                </a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">Correo automático — no respondas a este mensaje.</p>
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
  // 4. CONFIRMACIÓN DE NUEVO PEDIDO
  // ==========================================
  async sendOrderConfirmation(email, userName, orderNumber, items, total) {
    try {
      const itemsHtml = (items || []).map(item => `
        <tr>
          <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.product?.name || item.name || 'Producto'}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${(item.price || 0).toFixed(2)}€</td>
        </tr>
      `).join('');

      await resend.emails.send({
        from: FROM,
        to: email,
        subject: `✅ Pedido confirmado #${orderNumber} — SimShop`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #27ae60; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <div style="font-size: 48px;">✅</div>
              <h1 style="margin: 0;">¡Pedido confirmado!</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${userName}</strong>, gracias por tu compra.</p>
              <table style="width: 100%; border-collapse: collapse; background: white; border-radius: 8px; overflow: hidden; margin: 20px 0;">
                <thead>
                  <tr style="background: #2c3e50; color: white;">
                    <th style="padding: 12px; text-align: left;">Producto</th>
                    <th style="padding: 12px; text-align: center;">Qty</th>
                    <th style="padding: 12px; text-align: right;">Precio</th>
                  </tr>
                </thead>
                <tbody>${itemsHtml}</tbody>
                <tfoot>
                  <tr style="background: #f0f0f0; font-weight: bold;">
                    <td colspan="2" style="padding: 12px;">TOTAL</td>
                    <td style="padding: 12px; text-align: right;">${(total || 0).toFixed(2)}€</td>
                  </tr>
                </tfoot>
              </table>
              <div style="text-align: center; margin: 25px 0;">
                <a href="${process.env.FRONTEND_URL || 'https://navutech.netlify.app'}/perfil"
                   style="background: #27ae60; color: white; padding: 12px 30px; border-radius: 25px; text-decoration: none; font-weight: bold;">
                  Ver mis pedidos →
                </a>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">Correo automático — no respondas a este mensaje.</p>
            </div>
          </div>
        `
      });
      console.log(`✅ Email confirmación pedido enviado a ${email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Confirmación Pedido:', error.message);
      return false;
    }
  }

  // ==========================================
  // 5. CONFIRMACIÓN DE CAMBIO DE CONTRASEÑA
  // ==========================================
  async sendPasswordChanged(user) {
    try {
      await resend.emails.send({
        from: FROM,
        to: user.email,
        subject: '🔒 Tu contraseña ha sido cambiada — SimShop',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background: #2c3e50; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
              <h1 style="margin: 0;">🔒 Contraseña actualizada</h1>
            </div>
            <div style="background: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px;">
              <p>Hola <strong>${user.name}</strong>,</p>
              <p>Tu contraseña ha sido cambiada correctamente.</p>
              <div style="background: #fff3cd; border-left: 4px solid #ffc107; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0;"><strong>⚠️ ¿No fuiste tú?</strong></p>
                <p style="margin: 8px 0 0;">Contacta con nosotros inmediatamente si no realizaste este cambio.</p>
              </div>
              <p style="color: #999; font-size: 12px; text-align: center;">Correo automático — no respondas si reconoces la acción.</p>
            </div>
          </div>
        `
      });
      console.log(`✅ Email cambio de contraseña enviado a ${user.email}`);
      return true;
    } catch (error) {
      console.error('❌ Error Email Contraseña:', error.message);
      return false;
    }
  }
}

module.exports = new EmailNotificationService();