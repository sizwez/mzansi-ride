/**
 * WhatsApp Integration Service
 * Mzansi Ride uses WhatsApp deep-links to bridge the gap between 
 * the platform and the user's primary social safety net.
 */

export const WhatsAppService = {
  /**
   * Generates a pre-filled WhatsApp message URL for sharing trip details.
   */
  generateTripShareLink(tripDetails: {
    driverName: string;
    vehiclePlate: string;
    destination: string;
    liveLocationUrl: string;
    shieldStatus: string;
  }) {
    const message = `🇿🇦 *Mzansi Ride: Shield Share*\n\n` +
      `Hey, I'm taking a ride. Here are my details for safety:\n\n` +
      `👤 *Driver:* ${tripDetails.driverName}\n` +
      `🚗 *Vehicle:* ${tripDetails.vehiclePlate}\n` +
      `📍 *Destination:* ${tripDetails.destination}\n` +
      `🛡️ *Shield Status:* ${tripDetails.shieldStatus}\n\n` +
      `🗺️ *Live Track:* ${tripDetails.liveLocationUrl}\n\n` +
      `_Powered by Mzansi Ride Cooperative_`;

    const encodedMessage = encodeURIComponent(message);
    return `https://wa.me/?text=${encodedMessage}`;
  },

  /**
   * Generates a community invite link or SOS alert link.
   */
  generateSOSAlertLink(location: string) {
    const message = `🚨 *URGENT SOS - MZANSI RIDE*\n\n` +
      `I have triggered an SOS panic alert at ${location}. Please check in on me immediately.`;
    
    return `https://wa.me/?text=${encodeURIComponent(message)}`;
  }
};
