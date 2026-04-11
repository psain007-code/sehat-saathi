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

// Session store — har user ki history yaad rahegi
const sessions = {}

const SYSTEM_PROMPT = `Aap Sehat Saathi hain — ek friendly health dost jo Hindi mein baat karta hai.

Pehle message pe HAMESHA ye likho:
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
- Pehle sirf naam poochho
- Jab naam aaye to sirf umar poochho
- Jab umar aaye to sirf mobile poochho
- Jab mobile aaye to ye bhejo:
"✅ [naam] bhai! Details note ho gayi!
Ab ye karo:
🔗 esanjeevaniopd.in kholo
📍 State: Rajasthan
📍 District: Hanumangarh
Doctor se FREE mein baat karo! 🏥"

Agar 3 chune:
- Turant likho: "🚨 TURANT 108 call karo bhai!"
- Phir poochho kya hua

Hamesha conversation yaad rakho — pichli baat ke hisaab se aage badho!
Hindi mein, short aur friendly rakho! Emojis zaroor use karo!`

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

// WhatsApp webhook route — session ke saath
app.post('/whatsapp', async (req, res) => {
  try {
    const userMsg = req.body.Body
    const from = req.body.From

    // Session initialize karo agar nahi hai
    if (!sessions[from]) {
      sessions[from] = []
    }

    // User message history mein add karo
    sessions[from].push({
      role: 'user',
      content: userMsg
    })

    // AI ko poori history bhejo
    const r = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: sessions[from]
    })

    const reply = r.content[0].text

    // AI reply bhi history mein save karo
    sessions[from].push({
      role: 'assistant',
      content: reply
    })

    // WhatsApp pe reply bhejo
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