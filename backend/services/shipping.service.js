// backend/services/real-shipping.service.js
//
// ╔══════════════════════════════════════════════════════════════════╗
// ║  ADAPTADOR PARA TRANSPORTISTA REAL                               ║
// ║  Reemplaza mock-shipping.service.js cuando tengas API real       ║
// ║                                                                  ║
// ║  PASOS PARA ACTIVAR:                                             ║
// ║  1. Rellena las credenciales en .env (ver sección ENV)           ║
// ║  2. Implementa los 3 métodos marcados con TODO                   ║
// ║  3. En shipping.automation.js y tracking.routes.js cambia:       ║
// ║       require('./mock-shipping.service')                         ║
// ║     por:                                                         ║
// ║       require('./real-shipping.service')                         ║
// ╚══════════════════════════════════════════════════════════════════╝
//
// VARIABLES .env necesarias (añade las de tu transportista):
// ----------------------------------------------------------
// CARRIER_API_URL=https://api.transportista.com
// CARRIER_API_KEY=tu_api_key
// CARRIER_CONTRACT_CODE=tu_codigo_contrato
// CARRIER_SENDER_NAME=SimShop
// CARRIER_SENDER_STREET=Calle Principal 123
// CARRIER_SENDER_CITY=Madrid
// CARRIER_SENDER_POSTAL=28001
// CARRIER_SENDER_PHONE=910000000
// CARRIER_SENDER_EMAIL=tienda@simshop.com
//
// EJEMPLOS DE APIS REALES:
// - Correos: https://api.correos.es  (OAuth2 + SOAP)
// - MRW:     https://www.mrw.es/api  (REST + Basic Auth)
// - GLS:     https://api.gls-group.eu (REST + API Key)
// - SEUR:    https://api.seur.com    (REST + OAuth2)
// - DHL:     https://api.dhl.com     (REST + API Key)

const axios = require('axios');

class RealShippingService {

  constructor() {
    this.apiUrl      = process.env.CARRIER_API_URL;
    this.apiKey      = process.env.CARRIER_API_KEY;
    this.contract    = process.env.CARRIER_CONTRACT_CODE;

    // Datos del remitente (tu tienda)
    this.sender = {
      name:    process.env.CARRIER_SENDER_NAME   || 'SimShop',
      street:  process.env.CARRIER_SENDER_STREET || '',
      city:    process.env.CARRIER_SENDER_CITY   || '',
      postal:  process.env.CARRIER_SENDER_POSTAL || '',
      phone:   process.env.CARRIER_SENDER_PHONE  || '',
      email:   process.env.CARRIER_SENDER_EMAIL  || ''
    };
  }

  // ════════════════════════════════════════════════════════
  // MÉTODO 1: createShipment
  // Crea el envío en la API del transportista y devuelve
  // el número de tracking y datos básicos.
  //
  // ENTRADA: orderData (mismo formato que usa el mock)
  //   orderData.customer.name
  //   orderData.shippingAddress.street / city / postalCode / province
  //   orderData.phone
  //   orderData.orderNumber
  //   orderData.weight
  //
  // SALIDA ESPERADA (no cambies los nombres de los campos):
  //   { trackingNumber, carrier, status, estimatedDelivery, createdAt }
  // ════════════════════════════════════════════════════════
  async createShipment(orderData) {

    // TODO: Implementa la llamada a la API de tu transportista
    // Ejemplo genérico REST:
    //
    // const response = await axios.post(`${this.apiUrl}/shipments`, {
    //   apiKey:    this.apiKey,
    //   contract:  this.contract,
    //   sender: {
    //     name:    this.sender.name,
    //     address: this.sender.street,
    //     city:    this.sender.city,
    //     zip:     this.sender.postal,
    //     phone:   this.sender.phone
    //   },
    //   recipient: {
    //     name:    orderData.customer.name,
    //     address: orderData.shippingAddress.street,
    //     city:    orderData.shippingAddress.city,
    //     zip:     orderData.shippingAddress.postalCode,
    //     phone:   orderData.phone
    //   },
    //   parcel: {
    //     weight:    orderData.weight || 1,
    //     reference: orderData.orderNumber
    //   }
    // });
    //
    // return {
    //   trackingNumber:    response.data.trackingCode,
    //   carrier:           'Correos Express',
    //   status:            'en_preparacion',
    //   estimatedDelivery: new Date(response.data.estimatedDate),
    //   createdAt:         new Date()
    // };

    throw new Error('createShipment no implementado — rellena el TODO en real-shipping.service.js');
  }

  // ════════════════════════════════════════════════════════
  // MÉTODO 2: createLabel
  // Descarga la etiqueta PDF del transportista en base64.
  //
  // ENTRADA:
  //   orderData      — mismo objeto que createShipment
  //   trackingNumber — el que devolvió createShipment
  //
  // SALIDA ESPERADA (no cambies los nombres):
  //   { labelData (base64), format: 'pdf', trackingNumber, shipmentCost }
  // ════════════════════════════════════════════════════════
  async createLabel(orderData, trackingNumber) {

    // TODO: Descarga la etiqueta de la API
    // Muchas APIs devuelven la etiqueta en la misma llamada de createShipment.
    // Si es así, guarda el base64 en createShipment y reutilízalo aquí.
    //
    // Ejemplo genérico:
    //
    // const response = await axios.get(
    //   `${this.apiUrl}/labels/${trackingNumber}`,
    //   {
    //     headers: { Authorization: `Bearer ${this.apiKey}` },
    //     responseType: 'arraybuffer'   // recibir bytes del PDF
    //   }
    // );
    //
    // const base64 = Buffer.from(response.data).toString('base64');
    //
    // return {
    //   labelData:    base64,
    //   format:       'pdf',
    //   trackingNumber,
    //   shipmentCost: parseFloat(response.headers['x-shipment-cost'] || '0')
    // };

    throw new Error('createLabel no implementado — rellena el TODO en real-shipping.service.js');
  }

  // ════════════════════════════════════════════════════════
  // MÉTODO 3: getTrackingStatus  (opcional pero recomendado)
  // Consulta el estado actual del envío en la API.
  // Se puede llamar desde un cron job para actualizar estados.
  //
  // ENTRADA: trackingNumber
  // SALIDA:  { currentStatus, events: [{ status, description, timestamp, location }] }
  // ════════════════════════════════════════════════════════
  async getTrackingStatus(trackingNumber) {

    // TODO: Consulta el estado en la API
    //
    // const response = await axios.get(
    //   `${this.apiUrl}/tracking/${trackingNumber}`,
    //   { headers: { Authorization: `Bearer ${this.apiKey}` } }
    // );
    //
    // return {
    //   currentStatus: this._mapStatus(response.data.status),
    //   events: response.data.events.map(e => ({
    //     status:      this._mapStatus(e.status),
    //     description: e.description,
    //     timestamp:   new Date(e.date),
    //     location:    e.location || ''
    //   }))
    // };

    throw new Error('getTrackingStatus no implementado');
  }

  // ════════════════════════════════════════════════════════
  // HELPER: mapear estados del transportista a los de la app
  // Cada transportista usa sus propios nombres de estado.
  // Ajusta el mapeo según la documentación de tu API.
  // ════════════════════════════════════════════════════════
  _mapStatus(carrierStatus) {
    const map = {
      // Correos
      'ADMITIDO':           'en_preparacion',
      'EN_CAMINO':          'enviado',
      'EN_REPARTO':         'en_reparto',
      'ENTREGADO':          'entregado',
      'DEVUELTO':           'devuelto',

      // MRW (ejemplo)
      'RECOGIDO':           'en_preparacion',
      'EN_TRANSITO':        'enviado',
      'EN_DESTINO':         'en_reparto',
      'ENTREGA_OK':         'entregado',

      // DHL (ejemplo)
      'transit':            'enviado',
      'out_for_delivery':   'en_reparto',
      'delivered':          'entregado',
      'exception':          'incidencia'
    };

    return map[carrierStatus?.toUpperCase()] || 'en_preparacion';
  }
}

module.exports = new RealShippingService();