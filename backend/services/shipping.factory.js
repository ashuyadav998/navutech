const { Shippo } = require('shippo');
const shippoClient = new Shippo({ apiKeyHeader: process.env.SHIPPO_API_KEY.trim() });

async function createRegistration(order) {
  try {
    const shipment = await shippoClient.shipments.create({
      addressFrom: {
        name: "Tienda Central", street1: "215 Clayton St.", city: "San Francisco",
        state: "CA", zip: "94117", country: "US", phone: "5553419393", email: "soporte@tuapp.com"
      },
      addressTo: {
        name: order.user?.name || "Cliente",
        street1: order.shippingAddress?.street || "814 Mission St.",
        city: order.shippingAddress?.city || "San Francisco",
        state: "CA", zip: "94103", country: "US",
        phone: String(order.phone || "5553419393")
      },
      parcels: [{ length: "10", width: "10", height: "10", distanceUnit: "in", weight: "2", massUnit: "lb" }],
      async: false
    });

    const selectedRate = shipment.rates.find(r => r.provider === 'USPS' || r.provider === 'Shippo') || shipment.rates[0];
    if (!selectedRate) throw new Error("No hay tarifas disponibles");

    const transaction = await shippoClient.transactions.create({
      rate: selectedRate.objectId,
      labelFileType: "PDF",
      async: false
    });

    if (transaction.status === "ERROR") throw new Error(transaction.messages[0]?.text);

    // Retornamos el objectId para descargar la etiqueta luego
    return {
      trackingNumber: transaction.trackingNumber,
      carrier: transaction.provider,
      shipmentCost: parseFloat(transaction.amount),
      trackingUrl: transaction.trackingUrlProvider,
      labelUrl: transaction.labelUrl, // URL directa de Shippo
      labelData: transaction.objectId // ID de transacción para recuperación
    };
  } catch (error) {
    console.error("❌ Error Shippo:", error.message);
    throw error;
  }
}

module.exports = { createRegistration };