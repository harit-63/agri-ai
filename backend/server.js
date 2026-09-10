require('dotenv').config()

const express = require('express')
const cors = require('cors')
const axios = require('axios')

const app = express()
const PORT = process.env.PORT || 5000

const MANDI_API_URL =
  'https://api.data.gov.in/resource/35985678-0d79-46b4-9ed6-6f13308a1d24'

app.use(cors())
app.use(express.json())

app.get('/', (req, res) => {
  res.json({
    success: true,
    message: 'Agri AI Backend is running'
  })
})

app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    status: 'healthy'
  })
})

app.get('/api/mandi', async (req, res) => {
  try {
    const {
      state = 'Rajasthan',
      district = 'Jaipur',
      commodity = '',
      arrivalDate = ''
    } = req.query

    if (!process.env.DATA_GOV_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'DATA_GOV_API_KEY is missing'
      })
    }

    const params = {
      'api-key': process.env.DATA_GOV_API_KEY,
      format: 'json',
      offset: 0,
      limit: 10,
      'filters[State]': state,
      'filters[District]': district
    }

    if (commodity) {
      params['filters[Commodity]'] = commodity
    }

    if (arrivalDate) {
      params['filters[Arrival_Date]'] = arrivalDate
    }

    console.log('Mandi request:', {
      state,
      district,
      commodity,
      arrivalDate
    })

    const response = await axios.get(MANDI_API_URL, {
      params,
      timeout: 15000
    })

    const records = response.data?.records || []

    console.log('Mandi records:', records.length)

    res.json({
      success: true,
      count: records.length,
      records
    })
  } catch (error) {
    console.error('Mandi API Error:')
    console.error('Status:', error.response?.status)
    console.error('Data:', error.response?.data)
    console.error('Message:', error.message)

    res.status(500).json({
      success: false,
      message: 'Mandi API request failed',
      apiStatus: error.response?.status || null,
      apiError: error.response?.data || error.message
    })
  }
})

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Agri AI Backend running at http://localhost:${PORT}`)
})