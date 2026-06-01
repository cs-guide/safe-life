// Vercel Serverless Function
// 成分表の画像をClaude APIで解析し、苦手成分を検出する

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  if (req.method !== "POST") return res.status(405).end();

  const { image, mediaType, allergens } = req.body;
  if (!image) return res.status(400).json({ error: "image required" });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: "API key not configured" });

  const prompt = allergens?.length
    ? `この画像に写っている成分表・原材料名・全成分を全て読み取ってください。
次に、以下の苦手成分・アレルゲンが含まれているか確認してください。
苦手成分リスト: ${allergens.join("、")}

以下のJSON形式のみで返してください（説明文・コードブロック不要）:
{"ingredients":["成分1","成分2"],"hits":["検出された苦手成分"],"safe":true}`
    : `この画像に写っている成分表・原材料名・全成分を全て読み取ってください。
以下のJSON形式のみで返してください（説明文・コードブロック不要）:
{"ingredients":["成分1","成分2"],"hits":[],"safe":true}`;

  try {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5-20251001",
        max_tokens: 1200,
        messages: [{
          role: "user",
          content: [
            {
              type: "image",
              source: { type: "base64", media_type: mediaType || "image/jpeg", data: image },
            },
            { type: "text", text: prompt },
          ],
        }],
      }),
    });

    const data = await response.json();
    const text = (data.content?.[0]?.text || "").replace(/```json|```/g, "").trim();

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
