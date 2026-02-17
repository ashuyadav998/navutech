const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');

class MockShippingService {
  /**
   * Crear envío simulado
   */
  async createShipment(orderData) {
    const trackingNumber = this.generateTrackingNumber();
    const carrier = orderData.carrier || 'correos';

    console.log(`📦 Envío simulado creado con tracking: ${trackingNumber}`);

    return {
      trackingNumber,
      carrier: this.getCarrierName(carrier),
      status: 'en_preparacion',
      estimatedDelivery: this.calculateEstimatedDelivery(),
      createdAt: new Date()
    };
  }

  /**
   * Generar etiqueta PDF
   */
  async createLabel(orderData, trackingNumber) {
    return new Promise((resolve, reject) => {
      try {
        const doc = new PDFDocument({ size: 'A6', margin: 20 });
        const chunks = [];

        // Capturar el PDF en memoria
        doc.on('data', chunk => chunks.push(chunk));
        doc.on('end', () => {
          const pdfBuffer = Buffer.concat(chunks);
          const base64Data = pdfBuffer.toString('base64');
          
          resolve({
            labelData: base64Data,
            format: 'pdf',
            trackingNumber,
            shipmentCost: 5.99
          });
        });

        // ============================================
        // DISEÑO DE LA ETIQUETA (como tu ejemplo)
        // ============================================

        // Header con fondo
        doc.rect(0, 0, 300, 60).fill('#667eea');
        
        doc.fontSize(20).fillColor('#ffffff').font('Helvetica-Bold')
           .text('SIMSHOP LOGISTICS', 20, 15, { align: 'left' });
        
        doc.fontSize(10).fillColor('#ffffff').font('Helvetica')
           .text('(ETIQUETA DE PRUEBA)', 20, 40);

        // Resetear color
        doc.fillColor('#000000');

        // DESTINATARIO
        doc.fontSize(12).font('Helvetica-Bold')
           .text('DESTINATARIO:', 20, 80);

        doc.fontSize(10).font('Helvetica')
           .text(orderData.customer?.name || 'Cliente', 20, 100)
           .text(orderData.shippingAddress?.street || '', 20, 115)
           .text(
             `${orderData.shippingAddress?.postalCode || ''} ${orderData.shippingAddress?.city || ''}`, 
             20, 130
           )
           .text(orderData.shippingAddress?.province || '', 20, 145)
           .text(`Tel: ${orderData.phone || 'Sin teléfono'}`, 20, 160);

        // NÚMERO DE SEGUIMIENTO (destacado)
        doc.fontSize(12).font('Helvetica-Bold')
           .text('NÚMERO DE SEGUIMIENTO:', 20, 190);

        doc.fontSize(16).font('Helvetica-Bold')
           .text(trackingNumber, 20, 210);

        // Información adicional
        doc.fontSize(9).font('Helvetica')
           .text(`Pedido: #${orderData.orderNumber || 'N/A'}`, 20, 240)
           .text(`Peso: ${orderData.weight || 0.5} kg`, 20, 255)
           .text(`Fecha: ${new Date().toLocaleDateString('es-ES')}`, 20, 270)
           .text(
             `Entrega estimada: ${this.calculateEstimatedDelivery().toLocaleDateString('es-ES')}`, 
             20, 285
           );

        // REMITENTE
        doc.fontSize(8).font('Helvetica')
           .text('REMITENTE:', 20, 310)
           .text('SimShop - C/ Principal 123, 28001 Madrid', 20, 325);

        // Aviso de prueba
        doc.fontSize(8).font('Helvetica-Bold').fillColor('#e74c3c')
           .text('⚠ ETIQUETA DE PRUEBA', 20, 350)
           .text('No válida para envío real. Solo para testing.', 20, 365);

        // Código de barras simulado
        doc.fontSize(24).fillColor('#000000').font('Helvetica')
           .text('|||  ||  |||||  ||  |||', 20, 385);

        doc.end();

      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Generar número de tracking único
   */
  generateTrackingNumber() {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    return `MOCK-${dateStr}-${random}`;
  }

  /**
   * Calcular fecha estimada de entrega
   */
  calculateEstimatedDelivery() {
    const date = new Date();
    date.setDate(date.getDate() + 3); // 3 días hábiles
    return date;
  }

  /**
   * Obtener nombre del transportista
   */
  getCarrierName(carrier) {
    const carriers = {
      correos: 'Correos Express (Simulado)',
      dhl: 'DHL (Simulado)',
      fedex: 'FedEx (Simulado)',
      ups: 'UPS (Simulado)',
      mrw: 'MRW (Simulado)'
    };
    return carriers[carrier] || 'Transportista Simulado';
  }
}

module.exports = new MockShippingService();