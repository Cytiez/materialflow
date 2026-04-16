const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const rateLimit = require('express-rate-limit')
const dotenv = require('dotenv')

dotenv.config()

const app = express()
const PORT = process.env.PORT || 5000

// Security middleware
app.use(helmet())
app.use(cors({
  origin: process.env.CLIENT_URL,
  credentials: true
}))
app.use(express.json())
app.use('/uploads', express.static('uploads'))

// Rate limiting global
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: { success: false, message: 'Terlalu banyak request, coba lagi nanti' }
})
app.use('/api', limiter)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ success: true, message: 'MaterialFlow API berjalan' })
})

// Error handler global
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan pada server'
  })
})

app.listen(PORT, () => {
  console.log(`Server berjalan di port ${PORT}`)
})