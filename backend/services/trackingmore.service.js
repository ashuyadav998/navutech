// backend/services/trackingmore.service.js
const axios = require('axios');

const API_KEY = process.env.TRACKINGMORE_API_KEY;
const API_URL = 'https://api.trackingmore.com/v4';

class TrackingMoreService {
  constructor() {
    this.headers = {
      'Tracking-Api-Key': API_KEY,
      'Content-Type': 'application/json'
    };
  }

  // ==========================================
  // 1. CREAR TRACKING
  // ==========================================
  async createTracking(trackingNumber, carrier = 'correos-spain', orderNumber) {
    try {
      const response = await axios.post(
        `${API_URL}/trackings/create`,
        {
          tracking_number: trackingNumber,
          courier_code: carrier,
          order_number: orderNumber,
          customer_name: '',
          title: `Pedido #${orderNumber}`
        },
        { headers: this.headers }
      );

      console.log(`✅ Tracking creado en Trackingmore: ${trackingNumber}`);
      return {
        success: true,
        trackingNumber,
        carrier,
        data: response.data
      };
    } catch (error) {
      console.error('❌ Error crear tracking Trackingmore:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ==========================================
  // 2. OBTENER ESTADO DEL TRACKING
  // ==========================================
  async getTracking(trackingNumber, carrier = 'correos-spain') {
    try {
      const response = await axios.get(
        `${API_URL}/trackings/${carrier}/${trackingNumber}`,
        { headers: this.headers }
      );

      const tracking = response.data.data;

      // Mapear estado de Trackingmore a nuestros estados
      const statusMap = {
        'pending': 'pendiente',
        'notfound': 'pendiente',
        'transit': 'enviado',
        'pickup': 'enviado',
        'delivered': 'entregado',
        'undelivered': 'enviado',
        'exception': 'enviado',
        'expired': 'cancelado'
      };

      return {
        success: true,
        trackingNumber,
        carrier: tracking.courier_code,
        status: statusMap[tracking.status] || 'enviado',
        originStatus: tracking.status,
        lastUpdate: tracking.updated_at,
        events: tracking.origin_info?.trackinfo?.map(event => ({
          date: event.Date,
          time: event.StatusDate,
          location: event.Details || '',
          description: event.StatusDescription || '',
          status: event.Status || ''
        })) || []
      };
    } catch (error) {
      console.error('❌ Error obtener tracking:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || error.message
      };
    }
  }

  // ==========================================
  // 3. ACTUALIZAR TODOS LOS TRACKINGS ACTIVOS
  // ==========================================
  async updateAllActiveTrackings() {
    try {
      const response = await axios.get(
        `${API_URL}/trackings/get`,
        {
          headers: this.headers,
          params: {
            page: 1,
            limit: 100,
            status: 'transit,pickup' // Solo en tránsito
          }
        }
      );

      console.log(`✅ Trackings activos: ${response.data.data?.length || 0}`);
      return response.data.data || [];
    } catch (error) {
      console.error('❌ Error listar trackings:', error.response?.data || error.message);
      return [];
    }
  }

  // ==========================================
  // 4. ELIMINAR TRACKING (si es necesario)
  // ==========================================
  async deleteTracking(trackingNumber, carrier = 'correos-spain') {
    try {
      await axios.delete(
        `${API_URL}/trackings/${carrier}/${trackingNumber}`,
        { headers: this.headers }
      );
      console.log(`✅ Tracking eliminado: ${trackingNumber}`);
      return { success: true };
    } catch (error) {
      console.error('❌ Error eliminar tracking:', error.response?.data || error.message);
      return { success: false, error: error.message };
    }
  }

  // ==========================================
  // 5. DETECTAR TRANSPORTISTA AUTOMÁTICAMENTE
  // ==========================================
  async detectCarrier(trackingNumber) {
    try {
      const response = await axios.post(
        `${API_URL}/trackings/detect`,
        { tracking_number: trackingNumber },
        { headers: this.headers }
      );

      const carriers = response.data.data || [];
      // Preferir correos-es si está en la lista
      const correos = carriers.find(c => c.courier_code === 'correos-spain');
      return correos ? 'correos-spain' : carriers[0]?.courier_code || 'correos-spain';
    } catch (error) {
      console.error('❌ Error detectar transportista:', error.message);
      return 'correos-spain'; // Fallback
    }
  }
}

module.exports = new TrackingMoreService();
