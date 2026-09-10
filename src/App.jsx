import { useState } from 'react'
import './App.css'

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000'

function App() {
  // =========================
  // Crop Suggestion
  // =========================
  const [soil, setSoil] = useState('')
  const [season, setSeason] = useState('')
  const [cropResult, setCropResult] = useState('')

  const suggestCrop = () => {
    if (!soil || !season) {
      setCropResult('कृपया मिट्टी और मौसम दोनों चुनें।')
      return
    }

    if (soil === 'black' && season === 'kharif') {
      setCropResult(
        '🌱 कपास, सोयाबीन या मक्का उपयुक्त हो सकते हैं।'
      )
    } else if (soil === 'black' && season === 'rabi') {
      setCropResult(
        '🌾 गेहूं, चना या सरसों उपयुक्त हो सकते हैं।'
      )
    } else if (soil === 'alluvial' && season === 'kharif') {
      setCropResult(
        '🌱 धान, मक्का या सोयाबीन उपयुक्त हो सकते हैं।'
      )
    } else if (soil === 'alluvial' && season === 'rabi') {
      setCropResult(
        '🌾 गेहूं, चना या मटर उपयुक्त हो सकते हैं।'
      )
    } else {
      setCropResult(
        '🌱 मिट्टी और मौसम के अनुसार फसल का चयन करें।'
      )
    }
  }

  // =========================
  // Disease Detection
  // =========================
  const [selectedImage, setSelectedImage] = useState(null)

  const handleImageChange = (event) => {
    const file = event.target.files?.[0]

    if (!file) {
      return
    }

    const imageUrl = URL.createObjectURL(file)
    setSelectedImage(imageUrl)
  }

  // =========================
  // Weather
  // =========================
  const [city, setCity] = useState('')
  const [weather, setWeather] = useState(null)
  const [weatherLoading, setWeatherLoading] = useState(false)
  const [weatherError, setWeatherError] = useState('')

  const getWeather = async () => {
    const cleanCity = city.trim()

    if (!cleanCity) {
      setWeatherError('कृपया शहर का नाम लिखें।')
      setWeather(null)
      return
    }

    setWeatherLoading(true)
    setWeatherError('')
    setWeather(null)

    try {
      const geoResponse = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          cleanCity
        )}&count=1&language=hi&format=json`
      )

      if (!geoResponse.ok) {
        throw new Error('Location search failed')
      }

      const geoData = await geoResponse.json()

      if (!geoData.results || geoData.results.length === 0) {
        throw new Error('शहर नहीं मिला।')
      }

      const location = geoData.results[0]

      const weatherResponse = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${location.latitude}&longitude=${location.longitude}&current=temperature_2m,relative_humidity_2m,wind_speed_10m&timezone=auto`
      )

      if (!weatherResponse.ok) {
        throw new Error('Weather search failed')
      }

      const weatherData = await weatherResponse.json()

      setWeather({
        city: location.name,
        country: location.country,
        temperature: weatherData.current?.temperature_2m,
        humidity: weatherData.current?.relative_humidity_2m,
        wind: weatherData.current?.wind_speed_10m,
      })
    } catch (error) {
      setWeatherError(
        error.message || 'मौसम की जानकारी प्राप्त नहीं हो सकी।'
      )
    } finally {
      setWeatherLoading(false)
    }
  }

  // =========================
  // Mandi Bhav
  // =========================
  const [mandiCrop, setMandiCrop] = useState('')
  const [mandiCity, setMandiCity] = useState('')
  const [mandiResult, setMandiResult] = useState(null)
  const [mandiLoading, setMandiLoading] = useState(false)
  const [mandiError, setMandiError] = useState('')

  const showMandi = async () => {
    const cleanCrop = mandiCrop.trim()
    const cleanCity = mandiCity.trim()

    if (!cleanCrop || !cleanCity) {
      setMandiError(
        'कृपया फसल और मंडी/शहर दोनों भरें।'
      )
      setMandiResult(null)
      return
    }

    setMandiLoading(true)
    setMandiError('')
    setMandiResult(null)

    try {
      // आज की तारीख: DD/MM/YYYY
      const today = new Date()

      const arrivalDate = `${String(
        today.getDate()
      ).padStart(2, '0')}/${String(
        today.getMonth() + 1
      ).padStart(2, '0')}/${today.getFullYear()}`

      const params = new URLSearchParams({
        state: 'Rajasthan',
        district: cleanCity,
        commodity: cleanCrop,
        arrivalDate,
      })

      const apiUrl = `${API_BASE_URL}/api/mandi?${params.toString()}`

      const response = await fetch(apiUrl)

      // HTTP error handling
      if (!response.ok) {
        let errorData = null

        try {
          errorData = await response.json()
        } catch {
          errorData = null
        }

        // Rate limit
        if (response.status === 429) {
          throw new Error(
            'सरकारी मंडी सेवा अभी व्यस्त है। कृपया कुछ देर बाद फिर प्रयास करें।'
          )
        }

        // Backend/API error
        if (errorData?.apiStatus === 429) {
          throw new Error(
            'सरकारी मंडी सेवा अभी व्यस्त है। कृपया कुछ देर बाद फिर प्रयास करें।'
          )
        }

        throw new Error(
          errorData?.message ||
            'Backend से मंडी डेटा प्राप्त नहीं हो सका।'
        )
      }

      // JSON response
      const data = await response.json()

      if (!data.success) {
        if (
          data.apiStatus === 429 ||
          data.apiError?.error === 'Rate limit exceeded'
        ) {
          throw new Error(
            'सरकारी मंडी सेवा अभी व्यस्त है। कृपया कुछ देर बाद फिर प्रयास करें।'
          )
        }

        throw new Error(
          data.message ||
            'मंडी डेटा प्राप्त नहीं हो सका।'
        )
      }

      setMandiResult(data)
    } catch (error) {
      console.error('Mandi frontend error:', error)

      if (
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('NetworkError')
      ) {
        setMandiError(
          'Backend से कनेक्शन नहीं हो पा रहा। कृपया backend server चालू करें।'
        )
      } else {
        setMandiError(
          error.message ||
            'मंडी भाव प्राप्त नहीं हो सका।'
        )
      }
    } finally {
      setMandiLoading(false)
    }
  }

  return (
    <div className="app">

      {/* =========================
          Header
      ========================= */}
      <header className="header">
        <div>
          <h1>🌾 Agri AI</h1>
          <p>किसानों के लिए स्मार्ट कृषि सहायक</p>
        </div>
      </header>

      <main className="container">

        {/* =========================
            Hero
        ========================= */}
        <section className="hero">
          <h2>Smart Farming Assistant</h2>

          <p>
            फसल चयन, बीमारी की पहचान, मौसम और मंडी जानकारी —
            एक ही जगह।
          </p>
        </section>

        <section className="cards">

          {/* =========================
              Crop Suggestion
          ========================= */}
          <div className="card">
            <div className="card-icon">🌱</div>

            <h3>Crop Suggestion</h3>

            <p>
              मिट्टी और मौसम के आधार पर फसल का सुझाव प्राप्त करें।
            </p>

            <label>मिट्टी</label>

            <select
              value={soil}
              onChange={(e) => setSoil(e.target.value)}
            >
              <option value="">मिट्टी चुनें</option>
              <option value="black">काली मिट्टी</option>
              <option value="alluvial">जलोढ़ मिट्टी</option>
            </select>

            <label>मौसम</label>

            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
            >
              <option value="">मौसम चुनें</option>
              <option value="kharif">खरीफ</option>
              <option value="rabi">रबी</option>
            </select>

            <button onClick={suggestCrop}>
              फसल सुझाव देखें
            </button>

            {cropResult && (
              <div className="result">
                {cropResult}
              </div>
            )}
          </div>

          {/* =========================
              Disease Detection
          ========================= */}
          <div className="card">
            <div className="card-icon">📷</div>

            <h3>Disease Detection</h3>

            <p>
              पौधे की फोटो upload करके बीमारी की पहचान की
              दिशा में आगे बढ़ें।
            </p>

            <label className="upload-box">
              <span>📤 फोटो चुनें</span>

              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
            </label>

            {selectedImage && (
              <div className="image-preview">
                <img
                  src={selectedImage}
                  alt="Selected plant"
                />

                <p>
                  फोटो successfully upload हुई।
                </p>
              </div>
            )}
          </div>

          {/* =========================
              Live Weather
          ========================= */}
          <div className="card">
            <div className="card-icon">☁️</div>

            <h3>Live Weather</h3>

            <p>
              किसी भी शहर का current मौसम देखें।
            </p>

            <input
              type="text"
              placeholder="जैसे Kota"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />

            <button onClick={getWeather}>
              {weatherLoading
                ? 'मौसम खोज रहे हैं...'
                : 'मौसम देखें'}
            </button>

            {weatherError && (
              <div className="error">
                {weatherError}
              </div>
            )}

            {weather && (
              <div className="result weather-result">

                <strong>
                  📍 {weather.city}, {weather.country}
                </strong>

                <div className="weather-grid">

                  <span>
                    🌡️ तापमान
                    <b>
                      {weather.temperature}°C
                    </b>
                  </span>

                  <span>
                    💧 नमी
                    <b>
                      {weather.humidity}%
                    </b>
                  </span>

                  <span>
                    💨 हवा
                    <b>
                      {weather.wind} km/h
                    </b>
                  </span>

                </div>
              </div>
            )}
          </div>

          {/* =========================
              Mandi Bhav
          ========================= */}
          <div className="card">
            <div className="card-icon">💰</div>

            <h3>Mandi Bhav</h3>

            <p>
              फसल और मंडी/शहर डालकर आज का सरकारी
              मंडी डेटा खोजें।
            </p>

            <input
              type="text"
              placeholder="फसल जैसे Wheat"
              value={mandiCrop}
              onChange={(e) =>
                setMandiCrop(e.target.value)
              }
            />

            <input
              type="text"
              placeholder="जिला जैसे Jaipur"
              value={mandiCity}
              onChange={(e) =>
                setMandiCity(e.target.value)
              }
            />

            <button onClick={showMandi}>
              {mandiLoading
                ? 'मंडी डेटा खोज रहे हैं...'
                : 'मंडी भाव देखें'}
            </button>

            {mandiError && (
              <div className="error">
                {mandiError}
              </div>
            )}

            {mandiResult && (
              <div className="result">

                <strong>
                  💰 सरकारी मंडी डेटा
                </strong>

                <p>
                  उपलब्ध रिकॉर्ड:{' '}
                  <b>{mandiResult.count}</b>
                </p>

                {mandiResult.records?.length > 0 ? (

                  <div className="mandi-records">

                    {mandiResult.records.map(
                      (record, index) => (

                        <div
                          className="mandi-record"
                          key={record.id || index}
                        >

                          <p>
                            <b>
                              {record.Commodity ||
                                record.commodity ||
                                'फसल'}
                            </b>
                          </p>

                          <p>
                            मंडी:{' '}
                            {record.Market ||
                              record.market ||
                              mandiCity}
                          </p>

                          <p>
                            न्यूनतम:{' '}
                            {record.Min_Price ??
                              record.min_price ??
                              'NA'}
                          </p>

                          <p>
                            अधिकतम:{' '}
                            {record.Max_Price ??
                              record.max_price ??
                              'NA'}
                          </p>

                          <p>
                            मॉडल:{' '}
                            {record.Modal_Price ??
                              record.modal_price ??
                              'NA'}
                          </p>

                          <small>
                            तारीख:{' '}
                            {record.Arrival_Date ||
                              record.arrival_date ||
                              'NA'}
                          </small>

                        </div>
                      )
                    )}

                  </div>

                ) : (

                  <p>
                    आज इस जिले और फसल के लिए कोई रिकॉर्ड नहीं मिला।
                  </p>

                )}

              </div>
            )}
          </div>

        </section>
      </main>

      {/* =========================
          Footer
      ========================= */}
      <footer className="footer">
        <p>
          🌾 Agri AI — Smart Technology for Smart Farming
        </p>
      </footer>

    </div>
  )
}

export default App