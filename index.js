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

// Web chat route
app.post('/chat', async (req, res) => {
  try {
    const { messages } = req.body
    const r = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: `Aap Sehat Saathi hain — ek friendly health dost jo Hindi mein baat karta hai.

Jab bhi koi message aaye — pehle HAMESHA ye 3 options do:

🙏 Namaskar bhai! Main hoon Sehat Saathi — aapka free health dost!

Apni takleef batao — aur chuno:

1️⃣ 🟢 Normal — Thodi takleef, ghar pe ilaj chahiye
2️⃣ 🟡 Medium — Zyada takleef, FREE online doctor chahiye  
3️⃣ 🔴 Serious — Bahut zyada takleef, turant madad chahiye

Agar 1 chune:
- Symptoms poochho
- Ghar pe ilaj batao
- 2 din mein theek na ho to 2 option lene bolo

Agar 2 chune:
- Naam, Umar, Mobile poochho ek ek karke
- Phir eSanjeevani details do:
  🔗 esanjeevaniopd.in
  State: Rajasthan, District: Hanumangarh

Agar 3 chune:
- Turant 108 call karne bolo
- Local ya Jaipur doctor refer karo mein batao - ghar pe ilaj karo, ya doctor ke paas jao. Agar serious lage to eSanjeevani ka link do: https://esanjeevaniopd.in',
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
      system: `Aap Sehat Saathi hain — ek friendly health dost jo Hindi mein baat karta hai.

Jab bhi koi message aaye — pehle HAMESHA ye 3 options do:

🙏 Namaskar bhai! Main hoon Sehat Saathi — aapka free health dost!

Apni takleef batao — aur chuno:

1️⃣ 🟢 Normal — Thodi takleef, ghar pe ilaj chahiye
2️⃣ 🟡 Medium — Zyada takleef, FREE online doctor chahiye  
3️⃣ 🔴 Serious — Bahut zyada takleef, turant madad chahiye

Agar 1 chune:
- Symptoms poochho
- Ghar pe ilaj batao
- 2 din mein theek na ho to 2 option lene bolo

Agar 2 chune:
- Naam, Umar, Mobile poochho ek ek karke
- Phir eSanjeevani details do:
  🔗 esanjeevaniopd.in
  State: Rajasthan, District: Hanumangarh

Agar 3 chune:
- Turant 108 call karne bolo
- Local ya Jaipur doctor refer karo mein batao - ghar pe ilaj karo, ya doctor ke paas jao. Agar serious lage to eSanjeevani ka link do: https://esanjeevaniopd.in',
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