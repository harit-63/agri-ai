// Mandi data service
// --------------------------------------------------
// इस file का काम केवल mandi data से related logic रखना है.
// App.jsx में API की details नहीं रखेंगे.
//
// अभी Government resource पर direct usable API endpoint
// स्पष्ट उपलब्ध नहीं है, इसलिए हम fake price नहीं दिखाएँगे.
// Actual data source connect करने पर केवल इसी file को update
// करना होगा.
// --------------------------------------------------

const MANDI_SERVICE_STATUS = 'not_connected'

/**
 * Mandi service status
 */
export function getMandiServiceStatus() {
  return MANDI_SERVICE_STATUS
}

/**
 * Mandi price search
 *
 * @param {Object} params
 * @param {string} params.crop - फसल का नाम
 * @param {string} params.city - मंडी / शहर
 *
 * @returns {Promise<Object>}
 */
export async function searchMandiPrices({ crop, city }) {
  const cleanCrop = crop?.trim()
  const cleanCity = city?.trim()

  if (!cleanCrop || !cleanCity) {
    throw new Error(
      'फसल और मंडी/शहर दोनों की जानकारी जरूरी है।'
    )
  }

  // ------------------------------------------------
  // IMPORTANT
  // ------------------------------------------------
  // यहाँ अभी कोई नकली price return नहीं किया गया है।
  //
  // अगला चरण:
  // इस function को verified mandi data source से connect करेंगे।
  // ------------------------------------------------

  return {
    success: false,
    connected: false,
    message:
      'सरकारी मंडी डेटा सेवा अभी connect नहीं की गई है।',
    crop: cleanCrop,
    city: cleanCity,
  }
}