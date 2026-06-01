// Vercel Serverless Function
// note の RSS フィードを取得して JSON で返す
// Threads は rss.app などで RSS URL を生成して THREADS_RSS_URL に設定
 
const NOTE_RSS_URL = "https://note.com/cs_guide/rss";
 
// Threads の RSS URL（rss.app で生成したURLをここに貼る）
// 未設定のときは Threads 投稿はスキップされる
const THREADS_RSS_URL = "";
 
function parseRSS(xml, type) {
  const posts = [];
  const items = xml.match(/<item>([\s\S]*?)<\/item>/g) || [];
 
  items.slice(0, 5).forEach((item) => {
    const title =
      item.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1] ||
      item.match(/<title>([\s\S]*?)<\/title>/)?.[1] ||
      "";
 
    const link =
      item.match(/<link>([\s\S]*?)<\/link>/)?.[1] ||
      item.match(/<link\s+href="(.*?)"/)?.[1] ||
      "";
 
    const pubDate =
      item.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] || "";
 
    const dateStr = pubDate
      ? new Date(pubDate).toISOString().slice(0, 10)
      : "";
 
    if (title.trim()) {
      posts.push({
        type,
        title: title.trim(),
        date: dateStr,
        url: link.trim(),
      });
    }
  });
 
  return posts;
}
 
export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Cache-Control", "s-maxage=600, stale-while-revalidate"); // 10分キャッシュ
 
  const posts = [];
 
  // note RSS を取得
  try {
    const noteRes = await fetch(NOTE_RSS_URL);
    if (noteRes.ok) {
      const xml = await noteRes.text();
      posts.push(...parseRSS(xml, "note"));
    }
  } catch (e) {
    console.error("note RSS エラー:", e.message);
  }
 
  // Threads RSS を取得（URL が設定されている場合のみ）
  if (THREADS_RSS_URL) {
    try {
      const threadsRes = await fetch(THREADS_RSS_URL);
      if (threadsRes.ok) {
        const xml = await threadsRes.text();
        posts.push(...parseRSS(xml, "threads"));
      }
    } catch (e) {
      console.error("Threads RSS エラー:", e.message);
    }
  }
 
  // 日付の新しい順にソート
  posts.sort((a, b) => b.date.localeCompare(a.date));
 
  res.status(200).json(posts);
}
