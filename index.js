require('dotenv').config()
const express = require('express')
const cors = require('cors')
const Anthropic = require('@anthropic-ai/sdk')
const twilio = require('twilio')

const app = express()
app.use(cors({ origin: '*' }))
app.use(express.json())
app.use(express.urlencoded({ extended: false }))

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN)

const SYSTEM_PROMPT = `Aap Sehat Saathi hain — ek friendly health dost jo Hindi mein baat karta hai.

Jab bhi koi pehli baar message kare — HAMESHA ye likho:

"🙏 Namaskar bhai! Main hoon Sehat Saathi — aapka free health dost!

Apni takleef batao — aur chuno:

1️⃣ 🟢 Normal — Thodi takleef, ghar pe ilaj chahiye
2️⃣ 🟡 Medium — Zyada takleef, FREE online doctor chahiye
3️⃣ 🔴 Serious — Bahut zyada takleef, turant madad chahiye"

Agar 1 chune:
- Friendly tarike se symptoms poochho
- Ghar pe simple ilaj batao
- 2 din mein theek na ho to 2 option lene bolo

Agar 2 chune:
- Pehle naam poochho
- Phir umar poochho
- Phir mobile number poochho
- Phir ye bhejo:
"✅ Details note ho gayi!
Ab ye karo:
🔗 esanjeevaniopd.in kholo
📍 State: Rajasthan
📍 District: Hanumangarh
Doctor se FREE mein baat karo! 🏥"

Agar 3 chune:
- Turant likho: "🚨 TURANT 108 call karo! Ek minute mat ruko bhai!"
- Phir poochho kya hua — local ya Jaipur doctor refer karo

Hamesha Hindi mein, short aur friendly rakho! Emojis use karo!`

// Web chat route
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body
    const r = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages
    })
    res.json({ reply: r.content[0].text })
  } catch (e) {
    res.status(500).json({ reply: 'Error: ' + e.message })
  }
})

// WhatsApp webhook route
app.post('/whatsapp', async (req, res) => {
  try {
    const userMsg = req.body.Body
    const from = req.body.From

    const r = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: userMsg }]
    })

    const reply = r.content[0].text

    await twilioClient.messages.create({
      from: 'whatsapp:+14155238886',
      to: from,
      body: reply
    })

    res.send('<Response></Response>')
  } catch (e) {
    console.error(e)
    res.status(500).send('Error')
  }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log('Backend chal raha hai port ' + PORT))