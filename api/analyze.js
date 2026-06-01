// Vercel Serverless Function
// 成分表の画像をGemini APIで解析し、苦手成分を検出する
// 無料枠: 1日1,500回まで無料（超過してもレート制限になるだけ）

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(405).end();

  const { image, mediaType, allergens } = req.body;
  if (!image) return res.status(400).json({ error: "image required" });

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const allergenList = allergens?.length ? allergens.join("、") : "";
  const prompt = allergenList
    ? `この画像に写っている成分表・原材料名・全成分を全て読み取ってください。
次に、以下の苦手成分・アレルゲンが含まれているか確認してください。
同義語・別名・放出体（例：ホルムアルデヒドならDMDMヒダントインなど）も含めて確認してください。
苦手成分リスト: ${allergenList}

以下のJSON形式のみで返してください（説明文・コードブロック不要）:
{"ingredients":["成分1","成分2"],"hits":["検出された苦手成分や関連物質"],"safe":true}`
    : `この画像に写っている成分表・原材料名・全成分を全て読み取ってください。
以下のJSON形式のみで返してください（説明文・コードブロック不要）:
{"ingredients":["成分1","成分2"],"hits":[],"safe":true}`;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{
            parts: [
              {
                inline_data: {
                  mime_type: mediaType || "image/jpeg",
                  data: image,
                },
              },
              { text: prompt },
            ],
          }],
          generationConfig: {
            temperature: 0.1,
            maxOutputTokens: 1200,
          },
        }),
      }
    );

    const data = await response.json();

    // レート制限エラーのハンドリング
    if (data.error?.code === 429) {
      return res.status(429).json({ error: "rate_limit", message: "本日の利用上限に達しました。明日またお試しください。" });
    }

    const text = (data.candidates?.[0]?.content?.parts?.[0]?.text || "")
      .replace(/```json|```/g, "")
      .trim();

    try {
      const result = JSON.parse(text);
      res.status(200).json(result);
    } catch {
      res.status(200).json({ error: "parse_failed", raw: text });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
