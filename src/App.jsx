import { useState, useEffect, useRef } from "react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Legend } from "recharts";
import {
  Home, BookOpen, BarChart2, Sparkles, MapPin, ScanLine, Settings,
  AlertTriangle, Check, Plus, X, ShoppingBag, Heart, Leaf, Info,
  ExternalLink, ChevronLeft, ChevronRight, Search, ArrowRight,
  FileText, MessageCircle
} from "lucide-react";

// ── Config ─────────────────────────────────────────────────
const ASSOCIATE_ID = "rnai-22";
const makeUrl = (asin) => `https://www.amazon.co.jp/dp/${asin}/?tag=${ASSOCIATE_ID}`;

// ★ GoogleフォームのURLをここに入れてください
const SHOP_FORM_URL = "https://forms.gle/a4Bsw23kmZkUBnuX6";

// ★ スプレッドシートのIDをここに入れてください
// 手順: スプレッドシートURL https://docs.google.com/spreadsheets/d/【ここ】/edit の【ここ】の部分
// シート名は「shops」、列順: 名前・エリア・カテゴリ・コメント
const SHEET_ID = "your-spreadsheet-id-here";
const SHEET_NAME = "shops";
const SHEET_URL = `https://docs.google.com/spreadsheets/d/${SHEET_ID}/gviz/tq?tqx=out:json&sheet=${SHEET_NAME}`;

// フォールバック用サンプルデータ（スプレッドシート未設定時に表示）
const SHOPS_FALLBACK = [];

// ── Colors ─────────────────────────────────────────────────
const C = {
  bg: "#f5f8f5",
  surface: "#ffffff",
  surfaceHigh: "#eef3ee",
  border: "rgba(0,0,0,0.08)",
  accent: "#2d7a56",
  accentDim: "rgba(45,122,86,0.10)",
  danger: "#c94f4f",
  dangerDim: "rgba(201,79,79,0.08)",
  warn: "#b06d10",
  warnDim: "rgba(176,109,16,0.08)",
  textPrimary: "#1c2e22",
  textSecondary: "#557060",
  textMuted: "#96b0a0",
};

// ── Data ───────────────────────────────────────────────────
const INITIAL_ALLERGENS = ["合成香料", "防腐剤（パラベン）", "エタノール", "塩素系漂白剤", "ホルムアルデヒド"];
const SYMPTOM_OPTIONS = ["頭痛", "めまい", "吐き気", "目の刺激", "のどの痛み", "皮膚のかゆみ", "息苦しさ", "倦怠感", "集中力低下", "動悸", "脳疲労"];
const EXPOSURE_OPTIONS = ["芳香剤", "香水・コロン", "洗剤", "柔軟剤", "防虫剤", "接着剤", "タバコ", "塗料・ニス", "印刷物", "農薬", "排気ガス", "カビ"];

const PRODUCTS = {
  "4901301330062": { name: "ボディソープ A", ingredients: ["ラウレス硫酸Na", "合成香料", "パラベン", "コカミドDEA"], safe: false },
  "4902430570916": { name: "無添加シャンプー B", ingredients: ["水", "ラウリル硫酸Na", "クエン酸", "グリセリン"], safe: true },
  "4987072068786": { name: "台所用洗剤 C", ingredients: ["界面活性剤", "合成香料", "エタノール", "安息香酸Na"], safe: false },
  "0000000000001": { name: "デモ商品（安全）", ingredients: ["水", "グリセリン", "クエン酸", "ビタミンE"], safe: true },
  "0000000000002": { name: "デモ商品（要注意）", ingredients: ["合成香料", "エタノール", "パラベン", "ホルムアルデヒド放出体"], safe: false },
};

const AFFILIATES = [
  { asin: "B0BQZYDQ1G", name: "商品名を入力してください", brand: "ブランド名", price: "¥—", tag: "洗浄料", note: "商品詳細をご確認ください" },
  { asin: "B07QXYZ001", name: "無添加ボディソープ（無香料）", brand: "シャボン玉石けん", price: "¥1,280", tag: "洗浄料", note: "合成界面活性剤・香料・着色料不使用" },
  { asin: "B07QXYZ002", name: "重曹クリーナー 500g", brand: "アーム&ハンマー", price: "¥680", tag: "洗剤", note: "天然由来の重曹100%。塩素・香料なし" },
  { asin: "B07QXYZ003", name: "無香料洗濯洗剤 詰替え", brand: "さらさ", price: "¥798", tag: "洗濯", note: "蛍光増白剤・香料不使用。植物由来成分" },
  { asin: "B07QXYZ004", name: "コットン100%マスク 30枚", brand: "白十字", price: "¥1,050", tag: "防護", note: "化学繊維・香料不使用。敏感肌向け" },
  { asin: "B07QXYZ005", name: "活性炭空気清浄機", brand: "ダイキン", price: "¥24,800", tag: "空気清浄", note: "VOC・化学物質の吸着に特化" },
].map(p => ({ ...p, url: makeUrl(p.asin) }));

const DIARY_INIT = [];

const sevColor = (s) => s <= 3 ? C.accent : s <= 6 ? C.warn : C.danger;
const TAG_COLORS = { 洗浄料: "#d4edda", 洗剤: "#d0e8ff", 洗濯: "#e8d5ff", 防護: "#ffe5cc", 空気清浄: "#d4edda", スキンケア: "#ffe0f0" };

const MCS_TIPS = [
  { title: "換気は最大の味方", body: "化学物質は空気中に漂います。外出から帰ったらすぐに換気を。窓を対角線上に開けると効率よく空気が入れ替わります。" },
  { title: "マスクの素材に注意", body: "不織布マスクに含まれる化学繊維が反応を引き起こすことがあります。コットン100%や無添加素材のマスクを試してみましょう。" },
  { title: "印刷物のにおいに要注意", body: "新聞・チラシ・本などの印刷インクに含まれる有機溶剤がトリガーになることがあります。受け取ったらすぐに換気を。" },
  { title: "柔軟剤は「無香料」でも要確認", body: "「無香料」表示でも微量の香料が含まれる場合があります。成分表示の「香料」の有無を必ず確認しましょう。" },
  { title: "体調の記録が医師への近道", body: "「いつ・どこで・何に曝露したか」を記録しておくと、医師への説明がスムーズになり、適切なサポートにつながります。" },
  { title: "新品の家具・服は注意が必要", body: "製造時に使われる防虫剤・防カビ剤・仕上げ剤が揮発することがあります。購入後は風通しの良い場所で十分に換気を。" },
  { title: "重曹とクエン酸で安心掃除", body: "市販の洗剤が使えない場合、重曹（アルカリ性）とクエン酸（酸性）の組み合わせで多くの汚れに対応できます。" },
  { title: "外出前に天気と花粉をチェック", body: "花粉や黄砂が飛ぶ日は化学物質への感受性が高まることがあります。外出のタイミングを天気情報で調整してみましょう。" },
  { title: "ストレスも症状を悪化させる", body: "精神的なストレスは免疫・神経系に影響し、化学物質への感受性を高めることがわかっています。休息を優先させましょう。" },
  { title: "安全な場所を記録しておこう", body: "「ここなら大丈夫」という場所をリストにしておくと、外出時の安心感につながります。マップ機能を活用してみましょう。" },
];

// note・Threads の最新投稿を /api/posts から自動取得
// フォールバック（API取得失敗時に表示するサンプル）
const POSTS_FALLBACK = [
  { type: "note", Icon: FileText, title: "化学物質過敏症と診断されたら最初にすること", date: "2026-05-22", url: "https://note.com/cs-guide" },
  { type: "note", Icon: FileText, title: "無添加洗剤おすすめ5選【2026年版】", date: "2026-05-18", url: "https://note.com/cs-guide" },
];

// ── Shared Components ──────────────────────────────────────
function Card({ children, style }) {
  return (
    <div style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: 20, marginBottom: 12, ...style }}>
      {children}
    </div>
  );
}

function SLabel({ children }) {
  return <div style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, fontWeight: 600, marginBottom: 10 }}>{children}</div>;
}

function Pill({ label, active, onClick, danger }) {
  const col = danger ? C.danger : C.accent;
  return (
    <button onClick={onClick} style={{ padding: "6px 14px", borderRadius: 20, fontSize: 12, border: `1px solid ${active ? col : C.border}`, cursor: "pointer", background: active ? `${col}18` : "transparent", color: active ? col : C.textSecondary, fontFamily: "inherit" }}>
      {label}
    </button>
  );
}

function Disclaimer() {
  return (
    <div style={{ background: C.warnDim, border: `1px solid ${C.warn}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 14 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
        <Info size={14} color={C.warn} />
        <p style={{ fontSize: 11, color: C.warn, lineHeight: 1.6, margin: 0 }}>
          掲載商品は無添加・無香料を基準に選定していますが、<strong>症状・反応には個人差があります。</strong>すべての方に合うものではありません。購入前に成分をご確認のうえ、不安な場合はかかりつけ医にご相談ください。
        </p>
      </div>
    </div>
  );
}

function AffCard({ p }) {
  return (
    <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 12, padding: "14px 16px", marginBottom: 8, textDecoration: "none" }}>
      <div style={{ flex: 1 }}>
        <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: 6, background: TAG_COLORS[p.tag] || C.surfaceHigh, color: C.textPrimary }}>{p.tag}</span>
        <div style={{ fontSize: 13, fontWeight: 600, color: C.textPrimary, marginTop: 6 }}>{p.name}</div>
        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{p.brand} — {p.note}</div>
      </div>
      <div style={{ textAlign: "right", flexShrink: 0, marginLeft: 14 }}>
        <div style={{ fontSize: 15, fontWeight: 700, color: C.accent }}>{p.price}</div>
        <div style={{ display: "flex", alignItems: "center", gap: 3, justifyContent: "flex-end", marginTop: 4 }}>
          <ExternalLink size={10} color={C.textMuted} />
          <span style={{ fontSize: 10, color: C.textMuted }}>Amazon</span>
        </div>
      </div>
    </a>
  );
}

const ttStyle = { background: C.surface, border: `1px solid ${C.border}`, borderRadius: 8, fontSize: 11, color: C.textPrimary };

// ── 広告セクション（各ページ下部）──────────────────────────
// 楽天ウィジェットをiframeで実装（SPA内でのスクリプト動的注入の問題を回避）
function RakutenAd() {
  const ts = useRef(Date.now()).current;
  const html = `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body style="margin:0;overflow:hidden;background:transparent"><script type="text/javascript">rakuten_design="slide";rakuten_affiliateId="0f720b8c.0ab39c44.0f720b8d.56ca2f62";rakuten_items="ctsmatch";rakuten_genreId="0";rakuten_size="336x280";rakuten_target="_blank";rakuten_theme="gray";rakuten_border="off";rakuten_auto_mode="on";rakuten_genre_title="off";rakuten_recommend="on";rakuten_ts="${ts}";<\/script><script type="text/javascript" src="https://xml.affiliate.rakuten.co.jp/widget/js/rakuten_widget.js?20230106"><\/script></body></html>`;
  return (
    <iframe
      srcDoc={html}
      style={{ width: "100%", maxWidth: 430, height: 295, border: "none", display: "block" }}
      title="楽天広告"
      sandbox="allow-scripts allow-popups allow-same-origin"
    />
  );
}

function AdSection({ isHome }) {
  // タブ番号に応じて広告を1つだけ表示（isHomeは数値で渡す）
  const adIndex = typeof isHome === "number" ? isHome % 4 : 0;

  return (
    <div style={{ marginTop: 24, paddingTop: 16, borderTop: "1px solid rgba(0,0,0,0.06)", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
      <div style={{ fontSize: 9, color: "#bbb", letterSpacing: "0.08em" }}>広告・PR</div>

      {adIndex === 0 && (
        <div style={{ textAlign: "center" }}>
          <a href="https://px.a8.net/svt/ejp?a8mat=3TCY7U+OEVO2+32L4+5ZEMP" rel="nofollow" target="_blank">
            <img border="0" width="300" height="250" alt="" src="https://www20.a8.net/svt/bgt?aid=230711610041&wid=005&eno=01&mid=s00000014332001005000&mc=1" />
          </a>
          <img border="0" width="1" height="1" src="https://www19.a8.net/0.gif?a8mat=3TCY7U+OEVO2+32L4+5ZEMP" alt="" />
        </div>
      )}
      {adIndex === 1 && (
        <div style={{ textAlign: "center" }}>
          <a href="https://px.a8.net/svt/ejp?a8mat=3TCY7U+DP2S2+12N4+68MF5" rel="nofollow" target="_blank">
            <img border="0" width="350" height="240" alt="" src="https://www23.a8.net/svt/bgt?aid=230711610023&wid=005&eno=01&mid=s00000005008001048000&mc=1" />
          </a>
          <img border="0" width="1" height="1" src="https://www16.a8.net/0.gif?a8mat=3TCY7U+DP2S2+12N4+68MF5" alt="" />
        </div>
      )}
      {adIndex === 2 && (
        <div style={{ textAlign: "center" }}>
          <a href="https://px.a8.net/svt/ejp?a8mat=3TCRX0+BOXKK2+3TOE+5Z6WX" rel="nofollow" target="_blank">
            <img border="0" width="300" height="250" alt="" src="https://www21.a8.net/svt/bgt?aid=230703444707&wid=005&eno=01&mid=s00000017843001004000&mc=1" />
          </a>
          <img border="0" width="1" height="1" src="https://www18.a8.net/0.gif?a8mat=3TCRX0+BOXKK2+3TOE+5Z6WX" alt="" />
        </div>
      )}
      {adIndex === 3 && (
        <div style={{ display: "flex", justifyContent: "center", width: "100%" }}>
          <RakutenAd />
        </div>
      )}
    </div>
  );
}

// ── (CameraScanner removed — replaced by ingredient photo analysis) ──
function CameraScanner_UNUSED({ onScan, C, btnSt }) {
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const [active, setActive] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hint, setHint] = useState("");
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const detectorRef = useRef(null);
  const zxingRef = useRef(null);

  const stop = () => {
    clearInterval(timerRef.current);
    timerRef.current = null;
    if (streamRef.current) { streamRef.current.getTracks().forEach(t => t.stop()); streamRef.current = null; }
    setActive(false);
    setHint("");
  };

  const loadZXing = () => new Promise((resolve, reject) => {
    if (window.ZXing) { resolve(window.ZXing); return; }
    const s = document.createElement("script");
    s.src = "https://cdn.jsdelivr.net/npm/@zxing/library@0.21.3/umd/index.min.js";
    s.onload = () => resolve(window.ZXing);
    s.onerror = reject;
    document.head.appendChild(s);
  });

  const buildZXingReader = (ZXing) => {
    const hints = new Map();
    hints.set(ZXing.DecodeHintType.POSSIBLE_FORMATS, [
      ZXing.BarcodeFormat.EAN_13,
      ZXing.BarcodeFormat.EAN_8,
      ZXing.BarcodeFormat.CODE_128,
      ZXing.BarcodeFormat.UPC_A,
      ZXing.BarcodeFormat.UPC_E,
    ]);
    hints.set(ZXing.DecodeHintType.TRY_HARDER, true);
    const reader = new ZXing.MultiFormatReader();
    reader.setHints(hints);
    return reader;
  };

  const start = async () => {
    setError(null);
    setLoading(true);
    if (!navigator.mediaDevices?.getUserMedia) {
      setError("カメラが使えません。番号を直接入力してください");
      setLoading(false);
      return;
    }
    try {
      // 高解像度でカメラ起動（バーコード読み取り精度向上）
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: "environment",
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          focusMode: "continuous",
        }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      // BarcodeDetector が使えるか確認（Chrome / Android）
      const useBarcodeDetector = "BarcodeDetector" in window;
      if (useBarcodeDetector) {
        detectorRef.current = new window.BarcodeDetector({
          formats: ["ean_13", "ean_8", "code_128", "upc_a", "upc_e", "qr_code"],
        });
        setHint("Chrome対応モードで読み取り中");
      } else {
        // ZXing（Safari対応）
        const ZXing = await loadZXing();
        zxingRef.current = buildZXingReader(ZXing);
        setHint("Safariモードで読み取り中");
      }

      setActive(true);
      setLoading(false);

      timerRef.current = setInterval(async () => {
        if (!videoRef.current || !streamRef.current) return;
        const v = videoRef.current;
        if (!v.videoWidth) return;

        try {
          if (detectorRef.current) {
            // BarcodeDetector（高精度）
            const results = await detectorRef.current.detect(v);
            if (results.length > 0) {
              stop();
              onScan(results[0].rawValue);
            }
          } else if (zxingRef.current && canvasRef.current) {
            // ZXing（Safari fallback）
            const c = canvasRef.current;
            c.width = v.videoWidth;
            c.height = v.videoHeight;
            c.getContext("2d").drawImage(v, 0, 0);
            const ZXing = window.ZXing;
            const lum = new ZXing.HTMLCanvasElementLuminanceSource(c);
            const bmp = new ZXing.BinaryBitmap(new ZXing.HybridBinarizer(lum));
            const result = zxingRef.current.decode(bmp);
            if (result) { stop(); onScan(result.getText()); }
          }
        } catch (_) {}
      }, 150);

    } catch (e) {
      setError("カメラへのアクセスが許可されていません");
      setLoading(false);
      stop();
    }
  };

  useEffect(() => () => stop(), []);

  return (
    <div>
      <div style={{ background: "#000", borderRadius: 12, overflow: "hidden", position: "relative", aspectRatio: "4/3", marginBottom: 12 }}>
        <video ref={videoRef} style={{ width: "100%", height: "100%", objectFit: "cover", display: active ? "block" : "none" }} playsInline muted />
        <canvas ref={canvasRef} style={{ display: "none" }} />
        {!active && (
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 10 }}>
            <ScanLine size={36} color="rgba(255,255,255,0.4)" />
            <span style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>{loading ? "カメラ起動中..." : "カメラを起動してスキャン"}</span>
          </div>
        )}
        {active && (
          <>
            {/* スキャン枠：横長バーコード向けに横長に */}
            <div style={{ position: "absolute", top: "30%", left: "5%", right: "5%", bottom: "30%", border: "2px solid #41c9b4", borderRadius: 6 }}>
              {/* 四隅の強調 */}
              {[["0%","0%"],["0%","auto"],["auto","0%"],["auto","auto"]].map(([t,b],i) => (
                <div key={i} style={{ position: "absolute", top: t!=="auto"?-2:undefined, bottom: b!=="auto"?-2:undefined, left: i%2===0?-2:undefined, right: i%2===1?-2:undefined, width: 16, height: 16, borderColor: "#41c9b4", borderStyle: "solid", borderWidth: 0, [i<2?"borderTop":"borderBottom"]: "3px solid #41c9b4", [i%2===0?"borderLeft":"borderRight"]: "3px solid #41c9b4" }} />
              ))}
            </div>
            <div style={{ position: "absolute", bottom: 12, left: 0, right: 0, textAlign: "center" }}>
              <span style={{ fontSize: 11, color: "#fff", background: "rgba(0,0,0,0.55)", padding: "4px 14px", borderRadius: 20 }}>バーコードを枠内に合わせてください</span>
            </div>
            {hint && (
              <div style={{ position: "absolute", top: 10, right: 10 }}>
                <span style={{ fontSize: 9, color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.4)", padding: "2px 8px", borderRadius: 10 }}>{hint}</span>
              </div>
            )}
          </>
        )}
      </div>
      {error && <p style={{ fontSize: 12, color: "#c94f4f", textAlign: "center", margin: "0 0 12px", lineHeight: 1.6 }}>{error}</p>}
      <button onClick={active ? stop : start} disabled={loading} style={{ ...btnSt, background: active ? "#c94f4f" : btnSt.background, opacity: loading ? 0.6 : 1 }}>
        {loading ? "カメラ起動中..." : active ? "スキャン停止" : "カメラを起動してスキャン"}
      </button>
    </div>
  );
}


// ── App ────────────────────────────────────────────────────
export default function App() {
  const [tab, setTab] = useState(0);
  const saved = localStorage.getItem("safelife_name") || "";
  const [userName, setUserName] = useState(saved && saved !== "skip" ? saved : "");
  const [nameInput, setNameInput] = useState("");
  const [onboarding, setOnboarding] = useState(!saved);
  const [storageReady] = useState(true);

  const saveName = (name) => {
    setUserName(name);
    setOnboarding(false);
    localStorage.setItem("safelife_name", name || "skip");
  };
  const [allergens, setAllergens] = useState(INITIAL_ALLERGENS);
  const [newAllergen, setNewAllergen] = useState("");
  const [diary, setDiary] = useState(() => {
    try { const s = localStorage.getItem("safelife_diary"); return s ? JSON.parse(s) : []; } catch { return []; }
  });
  const [form, setForm] = useState({ symptoms: [], exposures: [], severity: 5, note: "", date: new Date().toISOString().slice(0, 16), exposureTime: new Date().toISOString().slice(0, 16), customExposure: "" });
  const [scanResult, setScanResult] = useState(null);
  const [scanLoading, setScanLoading] = useState(false);
  const [scanPreview, setScanPreview] = useState(null);
  const [scanImageData, setScanImageData] = useState(null);
  const [shopFilter, setShopFilter] = useState("全て");
  const [selectedShop, setSelectedShop] = useState(null);
  const [showShopForm, setShowShopForm] = useState(false);
  const [shops, setShops] = useState(SHOPS_FALLBACK);
  const [shopsLoading, setShopsLoading] = useState(false);
  const [shopsFromSheet, setShopsFromSheet] = useState(false);
  const [posts, setPosts] = useState(POSTS_FALLBACK);
  const [showAllPosts, setShowAllPosts] = useState(false);

  // note・Threads の最新投稿を API Route から自動取得
  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      const parsed = data.map(p => ({
        ...p,
        Icon: p.type === "note" ? FileText : MessageCircle,
      }));
      if (parsed.length > 0) setPosts(parsed);
    } catch (e) {
      console.error("投稿取得エラー:", e);
      // エラー時はフォールバックのまま表示
    }
  };

  // スプレッドシートからお店データを取得
  const fetchShops = async () => {
    if (SHEET_ID === "your-spreadsheet-id-here") return;
    setShopsLoading(true);
    try {
      const res = await fetch(SHEET_URL);
      const text = await res.text();
      const json = JSON.parse(text.replace("/*O_o*/\ngoogle.visualization.Query.setResponse(", "").replace(");", ""));
      const rows = json.table.rows;
      const parsed = rows.map((row, i) => ({
        id: i + 1,
        name: row.c[0]?.v || "",
        area: row.c[1]?.v || "",
        category: row.c[2]?.v || "",
        notes: row.c[3]?.v || "",
      })).filter(r => r.name);
      if (parsed.length > 0) { setShops(parsed); setShopsFromSheet(true); }
    } catch (e) { console.error("シート読み込みエラー:", e); }
    setShopsLoading(false);
  };

  useEffect(() => { try { localStorage.setItem("safelife_diary", JSON.stringify(diary)); } catch {} }, [diary]);
  useState(() => { fetchShops(); fetchPosts(); }, []);
  const [toast, setToast] = useState(null);
  const [aiResult, setAiResult] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [graphMode, setGraphMode] = useState("severity");
  const [affTag, setAffTag] = useState("全て");
  const [diarySearch, setDiarySearch] = useState("");
  const [calYear, setCalYear] = useState(new Date().getFullYear());
  const [calMonth, setCalMonth] = useState(new Date().getMonth());
  const [calMode, setCalMode] = useState(false);
  const [diaryMode, setDiaryMode] = useState("simple");
  const [editingId, setEditingId] = useState(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);

  const showToast = (msg, ok = true) => { setToast({ msg, ok }); setTimeout(() => setToast(null), 2500); };

  const exportJSON = () => {
    const blob = new Blob([JSON.stringify(diary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safelife-diary-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const exportCSV = () => {
    const headers = ["日時", "曝露時間", "症状", "曝露したもの", "強度", "メモ"];
    const rows = diary.map(d => [
      d.date, d.exposureTime || "", d.symptoms.join("・"), d.exposures.join("・"), d.severity, d.note || ""
    ]);
    const csv = [headers, ...rows]
      .map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(","))
      .join("\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `safelife-diary-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const importJSON = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (!Array.isArray(data)) throw new Error();
        setDiary(prev => {
          const existingIds = new Set(prev.map(d => d.id));
          const newEntries = data.filter(d => !existingIds.has(d.id));
          return [...prev, ...newEntries].sort((a, b) => b.date.localeCompare(a.date));
        });
        showToast(`${data.length}件をインポートしました`);
      } catch {
        showToast("インポートに失敗しました", false);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };
  const toggleItem = (key, val) => setForm(p => ({ ...p, [key]: p[key].includes(val) ? p[key].filter(x => x !== val) : [...p[key], val] }));

  const saveSimple = (score) => {
    const now = new Date().toISOString().slice(0, 16);
    setDiary(prev => [{ id: Date.now(), date: now, exposureTime: now, symptoms: [], exposures: [], severity: score, note: "", customExposure: "", simple: true }, ...prev]);
    showToast("記録しました");
  };

  const startEdit = (d) => {
    setEditingId(d.id);
    setForm({ symptoms: d.symptoms, exposures: d.exposures, severity: d.severity, note: d.note, date: d.date, exposureTime: d.exposureTime || d.date, customExposure: "" });
    setDiaryMode("detail");
    setCalMode(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const saveEdit = () => {
    const allExposures = form.customExposure.trim() ? [...form.exposures, form.customExposure.trim()] : form.exposures;
    setDiary(prev => prev.map(d => d.id === editingId ? { ...d, ...form, exposures: allExposures } : d));
    setEditingId(null);
    setForm({ symptoms: [], exposures: [], severity: 5, note: "", date: new Date().toISOString().slice(0, 16), exposureTime: new Date().toISOString().slice(0, 16), customExposure: "" });
    showToast("更新しました");
  };

  const deleteDiary = (id) => {
    setDiary(prev => prev.filter(d => d.id !== id));
    showToast("削除しました");
  };

  const saveDiary = () => {
    if (!form.symptoms.length && !form.exposures.length && !form.customExposure.trim()) { showToast("症状か曝露を選んでください", false); return; }
    const allExposures = form.customExposure.trim() ? [...form.exposures, form.customExposure.trim()] : form.exposures;
    setDiary(prev => [{ ...form, exposures: allExposures, id: Date.now() }, ...prev]);
    setForm({ symptoms: [], exposures: [], severity: 5, note: "", date: new Date().toISOString().slice(0, 16), exposureTime: new Date().toISOString().slice(0, 16), customExposure: "" });
    showToast("記録しました");
  };

  // 画像をリサイズしてbase64に変換
  const resizeImage = (file) => new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const MAX = 1200;
      let w = img.width, h = img.height;
      if (w > MAX) { h = Math.round(h * MAX / w); w = MAX; }
      if (h > MAX) { w = Math.round(w * MAX / h); h = MAX; }
      const canvas = document.createElement("canvas");
      canvas.width = w; canvas.height = h;
      canvas.getContext("2d").drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve({ base64: canvas.toDataURL("image/jpeg", 0.85).split(",")[1], mediaType: "image/jpeg" });
    };
    img.src = url;
  });

  const handleImageCapture = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setScanResult(null);
    setScanPreview(URL.createObjectURL(file));
    const { base64, mediaType } = await resizeImage(file);
    setScanImageData({ base64, mediaType });
  };

  const analyzeImage = async () => {
    if (!scanImageData) return;
    setScanLoading(true);
    setScanResult(null);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          image: scanImageData.base64,
          mediaType: scanImageData.mediaType,
          allergens,
        }),
      });
      const data = await res.json();
      if (data.error === "rate_limit") {
        setScanResult({ error: true, message: data.message });
      } else if (data.error) {
        setScanResult({ error: true });
      } else {
        setScanResult(data);
      }
    } catch {
      setScanResult({ error: true });
    }
    setScanLoading(false);
  };

  const graphData = [...diary].sort((a, b) => a.date.localeCompare(b.date)).map(d => ({ date: d.date.slice(5, 10), severity: d.severity, exposures: d.exposures.length, symptoms: d.symptoms.length }));
  const expCount = {}; diary.forEach(d => d.exposures.forEach(e => { expCount[e] = (expCount[e] || 0) + 1; }));
  const expRank = Object.entries(expCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  const symCount = {}; diary.forEach(d => d.symptoms.forEach(s => { symCount[s] = (symCount[s] || 0) + 1; }));
  const symRank = Object.entries(symCount).sort((a, b) => b[1] - a[1]).slice(0, 6).map(([name, count]) => ({ name, count }));
  const WEEKDAY_NAMES = ["日", "月", "火", "水", "木", "金", "土"];
  const weekdayData = WEEKDAY_NAMES.map((name, wi) => {
    const entries = diary.filter(d => new Date(d.date).getDay() === wi);
    const avg = entries.length > 0 ? entries.reduce((s, d) => s + d.severity, 0) / entries.length : 0;
    return { name, avg: parseFloat(avg.toFixed(1)), count: entries.length };
  });

  const runAI = async () => {
    setAiLoading(true); setAiResult(null);
    const summary = diary.slice(0, 15).map(d => `${d.date}: 症状[${d.symptoms.join(",")}] 曝露[${d.exposures.join(",")}] 強度${d.severity}`).join("\n");
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-haiku-4-5-20251001", max_tokens: 1000,
          system: `化学物質過敏症サポートAI。以下JSONのみ返す（他テキスト不要）:{"patterns":["","",""],"topTriggers":["","",""],"advice":["","",""],"riskDays":"","summary":"50字以内"}`,
          messages: [{ role: "user", content: `分析:\n${summary}` }],
        }),
      });
      const data = await res.json();
      const text = data.content.map(i => i.text || "").join("").replace(/```json|```/g, "").trim();
      setAiResult(JSON.parse(text));
    } catch(e) { setAiResult({ error: true }); }
    setAiLoading(false);
  };

  const SHOP_CATEGORIES = ["病院", "自然食品店", "飲食店", "美容院", "ホテル・宿泊施設", "その他"];
const shopCategories = ["全て", ...new Set([...SHOP_CATEGORIES, ...shops.map(s => s.category).filter(Boolean)])];
  const filteredShops = shopFilter === "全て" ? shops : shops.filter(s => s.category === shopFilter);
  const allTags = ["全て", ...new Set(AFFILIATES.map(p => p.tag))];
  const filteredAff = affTag === "全て" ? AFFILIATES : AFFILIATES.filter(p => p.tag === affTag);

  const inputSt = { width: "100%", background: C.surfaceHigh, border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px 14px", fontSize: 13, color: C.textPrimary, fontFamily: "inherit", boxSizing: "border-box", outline: "none" };
  const btnSt = { width: "100%", background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" };

  const TABS = ["ホーム", "記録", "グラフ", "分析", "安全マップ", "スキャン", "設定"];
  const NAV = ["home", "diary", "chart", "ai", "map", "scan", "settings"];
  const NAVLBL = ["ホーム", "記録", "グラフ", "分析", "安全マップ", "スキャン", "設定"];
  const VISIBLE_NAV = [0, 1, 2, 4, 5, 6]; // 3（分析）を非表示

  return (
    <div style={{ fontFamily: "Noto Sans JP, sans-serif", color: C.textPrimary }}><style>{`* { box-sizing: border-box; } body { margin: 0; background: #eef3ee; } .app-inner { max-width: 430px; margin: 0 auto; min-height: 100vh; padding-bottom: 220px; background: #f5f8f5; } @media (min-width: 768px) { .app-inner { box-shadow: 0 0 60px rgba(0,0,0,0.10); } }`}</style>
      <link href="https://fonts.googleapis.com/css2?family=Noto+Sans+JP:wght@400;500;700&display=swap" rel="stylesheet" />
      <div className="app-inner">

      {/* オンボーディング */}
      {storageReady && onboarding && (
        <div style={{ position: "fixed", inset: 0, background: C.bg, zIndex: 100, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 32, maxWidth: 430, left: "50%", transform: "translateX(-50%)" }}>
          <div style={{ width: 64, height: 64, borderRadius: 20, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 24 }}>
            <Leaf size={32} color={C.accent} strokeWidth={1.5} />
          </div>
          <h1 style={{ fontSize: 26, fontWeight: 700, color: C.textPrimary, margin: "0 0 8px", textAlign: "center", letterSpacing: "-0.02em" }}>Safe Life へようこそ</h1>
          <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, textAlign: "center", margin: "0 0 40px" }}>化学物質過敏症の方のための<br />記録・情報アプリです</p>
          <div style={{ width: "100%", marginBottom: 12 }}>
            <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 8 }}>あなたのお名前を教えてください</div>
            <input
              value={nameInput}
              onChange={e => setNameInput(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter" && nameInput.trim()) saveName(nameInput.trim()); }}
              placeholder="例：さくら"
              style={{ ...inputSt, fontSize: 16, padding: "14px 16px" }}
              autoFocus
            />
            <p style={{ fontSize: 11, color: C.textMuted, margin: "6px 0 0" }}>端末内にのみ保存されます</p>
          </div>
          <button
            onClick={() => { if (nameInput.trim()) saveName(nameInput.trim()); }}
            disabled={!nameInput.trim()}
            style={{ ...btnSt, opacity: nameInput.trim() ? 1 : 0.4 }}
          >
            はじめる
          </button>
          <button onClick={() => saveName("")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: 12, color: C.textMuted, marginTop: 16, fontFamily: "inherit" }}>
            名前なしで続ける
          </button>
        </div>
      )}

      {/* Header */}
      <div style={{ background: C.surface, borderBottom: `1px solid ${C.border}`, padding: "48px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
          <Leaf size={13} color={C.accent} />
          <span style={{ fontSize: 10, letterSpacing: "0.15em", color: C.textMuted, textTransform: "uppercase" }}>Safe Life</span>
        </div>
        <div style={{ fontSize: 24, fontWeight: 700, color: C.textPrimary, letterSpacing: "-0.01em" }}>
          {tab === 0 && userName ? (
            <div>
              <div style={{ fontSize: 18, fontWeight: 700, color: C.textPrimary }}>
                {userName}さん、{(() => { const h = new Date().getHours(); return h < 11 ? "おはようございます" : h < 17 ? "こんにちは" : "こんばんは"; })()}
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, fontWeight: 400, marginTop: 4 }}>
                {(() => {
                  const msgs = ["今日の体調はいかがですか？", "無理せず、今日も一歩ずつ。", "ゆっくり過ごせていますか？", "体調の変化、記録しておきましょう。", "今日も自分のペースで大丈夫です。"];
                  return msgs[new Date().getDate() % msgs.length];
                })()}
              </div>
            </div>
          ) : TABS[tab]}
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div style={{ position: "fixed", top: 20, left: "50%", transform: "translateX(-50%)", background: toast.ok ? C.accent : C.danger, color: "#fff", padding: "10px 22px", borderRadius: 20, fontSize: 12, fontWeight: 600, zIndex: 999, boxShadow: "0 4px 20px rgba(0,0,0,0.15)" }}>
          {toast.msg}
        </div>
      )}

      <div style={{ padding: "16px 14px 0" }}>

        {/* HOME */}
        {tab === 0 && (() => {
          const todayIdx = new Date().getDate() % MCS_TIPS.length;
          const tip = MCS_TIPS[todayIdx];
          // ランダムに1製品選択（日付+時間帯でシード）
          const seed = new Date().getDate() + new Date().getHours();
          const todayProduct = AFFILIATES[seed % AFFILIATES.length];
          return (
            <div>
              {/* 今日の豆知識 */}
              <div style={{ background: `linear-gradient(135deg, ${C.accentDim}, #f0faf4)`, border: `1px solid ${C.accent}25`, borderRadius: 16, padding: 20, marginBottom: 12 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <Leaf size={14} color={C.accent} strokeWidth={1.5} />
                  <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.accent, fontWeight: 600 }}>今日の豆知識</span>
                </div>
                <p style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.7, margin: "0 0 6px", fontWeight: 600 }}>{tip.title}</p>
                <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>{tip.body}</p>
              </div>

              {/* note・Threads 新着 */}
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
                  <BookOpen size={14} color={C.textSecondary} strokeWidth={1.5} />
                  <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, fontWeight: 600 }}>最新の投稿</span>
                </div>
                {(showAllPosts ? posts : posts.slice(0, 5)).map((post, i, arr) => (
                  <a key={i} href={post.url} target="_blank" rel="noopener noreferrer" style={{ display: "flex", gap: 12, alignItems: "center", textDecoration: "none", paddingBottom: i < arr.length - 1 ? 12 : 0, marginBottom: i < arr.length - 1 ? 12 : 0, borderBottom: i < arr.length - 1 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: post.type === "note" ? "#e6faf7" : "#f0f0f0", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                      <post.Icon size={16} color={post.type === "note" ? "#41c9b4" : "#555"} strokeWidth={1.5} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 3 }}>
                        <span style={{ fontSize: 9, background: post.type === "note" ? "#41c9b4" : "#1a1a1a", color: "#fff", borderRadius: 4, padding: "2px 6px", letterSpacing: "0.05em", fontWeight: 600 }}>{post.type}</span>
                        <span style={{ fontSize: 10, color: C.textMuted }}>{post.date}</span>
                      </div>
                      <div style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500, lineHeight: 1.4, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{post.title}</div>
                    </div>
                    <ExternalLink size={13} color={C.textMuted} strokeWidth={1.5} style={{ flexShrink: 0 }} />
                  </a>
                ))}
                {posts.length > 5 && (
                  <button onClick={() => setShowAllPosts(v => !v)} style={{ width: "100%", marginTop: 12, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", fontSize: 12, color: C.textSecondary, cursor: "pointer", fontFamily: "inherit", display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                    {showAllPosts ? "閉じる" : "すべて見る"}
                    <ArrowRight size={12} color={C.textSecondary} strokeWidth={1.5} style={{ transform: showAllPosts ? "rotate(90deg)" : "none" }} />
                  </button>
                )}
              </Card>

              {/* 今日のおすすめ製品 */}
              <Card>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                  <Heart size={14} color={C.accent} strokeWidth={1.5} />
                  <span style={{ fontSize: 10, letterSpacing: "0.1em", textTransform: "uppercase", color: C.textMuted, fontWeight: 600 }}>今日のおすすめ製品</span>
                  <span style={{ fontSize: 9, color: C.textMuted, marginLeft: "auto" }}>PR・広告</span>
                </div>
                <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 12px", lineHeight: 1.6 }}>※症状・反応には個人差があります。成分をご確認のうえご購入ください。</p>
                <AffCard p={todayProduct} />
                <button onClick={() => setTab(5)} style={{ width: "100%", background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "10px", fontSize: 12, color: C.textSecondary, cursor: "pointer", fontFamily: "inherit", marginTop: 6, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
                  おすすめ製品をもっと見る <ArrowRight size={12} color={C.textSecondary} strokeWidth={1.5} />
                </button>
              </Card>

              {/* 最近の記録 */}
              <Card>
                <SLabel>最近の記録</SLabel>
                {diary.slice(0, 3).map((d, i) => (
                  <div key={d.id} style={{ display: "flex", gap: 12, paddingBottom: i < 2 ? 14 : 0, marginBottom: i < 2 ? 14 : 0, borderBottom: i < 2 ? `1px solid ${C.border}` : "none" }}>
                    <div style={{ width: 3, borderRadius: 2, background: sevColor(d.severity), flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 11, color: C.textMuted, marginBottom: 2 }}>{d.date.replace("T", "  ")}</div>
                      <div style={{ fontSize: 13, color: C.textPrimary }}>{d.symptoms.join(" · ") || "症状なし"}</div>
                      {d.exposures.length > 0 && <div style={{ fontSize: 11, color: C.textSecondary, marginTop: 2 }}>{d.exposures.join(" · ")}</div>}
                    </div>
                    <span style={{ fontSize: 11, color: sevColor(d.severity), background: `${sevColor(d.severity)}15`, borderRadius: 8, padding: "2px 8px", flexShrink: 0, alignSelf: "flex-start" }}>{d.severity}</span>
                  </div>
                ))}
              </Card>

              {/* QEESIチェック */}
              <a href="https://note.com/cs_guide/n/n6165abcfbdf2" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 12, textDecoration: "none" }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Info size={20} color={C.accent} strokeWidth={1.5} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 3 }}>QEESI 簡易チェック</div>
                  <div style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.5 }}>化学物質過敏症のセルフチェックができます。受診の参考に。</div>
                </div>
                <ExternalLink size={14} color={C.textMuted} strokeWidth={1.5} style={{ flexShrink: 0 }} />
              </a>

              {/* クイックアクセス */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                {[{ Icon: BookOpen, label: "記録する", t: 1 }, { Icon: BarChart2, label: "グラフ", t: 2 }, { Icon: MapPin, label: "安全マップ", t: 4 }, { Icon: ScanLine, label: "成分チェック", t: 5 }].map(b => (
                  <button key={b.t} onClick={() => setTab(b.t)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "18px 16px", cursor: "pointer", display: "flex", flexDirection: "column", gap: 10, textAlign: "left", fontFamily: "inherit" }}>
                    <b.Icon size={20} color={C.accent} />
                    <span style={{ fontSize: 13, color: C.textPrimary, fontWeight: 500 }}>{b.label}</span>
                  </button>
                ))}
              </div>
              <AdSection isHome={3} />
            </div>
          );
        })()}

        {/* DIARY */}
        {tab === 1 && (() => {
          const daysInMonth = new Date(calYear, calMonth + 1, 0).getDate();
          const firstDay = new Date(calYear, calMonth, 1).getDay();
          const monthStr = `${calYear}-${String(calMonth + 1).padStart(2, "0")}`;
          const diaryByDate = {};
          diary.forEach(d => { const k = d.date.slice(0, 10); if (!diaryByDate[k]) diaryByDate[k] = []; diaryByDate[k].push(d); });
          const filteredDiary = diary.filter(d => {
            if (!diarySearch.trim()) return true;
            const q = diarySearch.toLowerCase();
            return d.symptoms.some(s => s.includes(q)) || d.exposures.some(e => e.includes(q)) || d.note.includes(q);
          });
          const WEEKDAYS = ["日","月","火","水","木","金","土"];
          return (
            <div>
              {/* かんたん／くわしく タブ */}
              <div style={{ display: "flex", background: C.surfaceHigh, borderRadius: 12, padding: 4, marginBottom: 14, gap: 4 }}>
                {[["simple","かんたん"],["detail","くわしく"]].map(([m, lbl]) => (
                  <button key={m} onClick={() => setDiaryMode(m)} style={{ flex: 1, padding: "9px", borderRadius: 9, border: "none", cursor: "pointer", fontFamily: "inherit", fontSize: 13, fontWeight: 600, background: diaryMode === m ? C.surface : "transparent", color: diaryMode === m ? C.textPrimary : C.textMuted, boxShadow: diaryMode === m ? "0 1px 4px rgba(0,0,0,0.08)" : "none", transition: "all 0.15s" }}>
                    {lbl}
                  </button>
                ))}
              </div>

              {/* ── かんたん記録 ── */}
              {diaryMode === "simple" && (
                <Card>
                  <div style={{ textAlign: "center", paddingBottom: 8 }}>
                    <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 20 }}>今の体調はどうですか？</div>
                    <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: 24 }}>
                      {[
                        { score: 1, color: "#2d8a5e", label: "良い", mouth: "M8 14 Q12 18 16 14" },
                        { score: 3, color: "#7aad5e", label: "まあまあ", mouth: "M8 14 Q12 16 16 14" },
                        { score: 5, color: "#b0a030", label: "普通", mouth: "M8 14 h8" },
                        { score: 7, color: "#d07030", label: "悪い", mouth: "M8 15 Q12 12 16 15" },
                        { score: 9, color: "#c94f4f", label: "辛い", mouth: "M8 16 Q12 12 16 16" },
                      ].map(({ score, color, label, mouth }) => (
                        <button key={score} onClick={() => saveSimple(score)} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 6, background: "none", border: `1px solid ${C.border}`, borderRadius: 14, padding: "12px 6px", cursor: "pointer", flex: 1, fontFamily: "inherit" }}>
                          <svg viewBox="0 0 24 24" width="36" height="36">
                            <circle cx="12" cy="12" r="10" fill={`${color}18`} stroke={color} strokeWidth="1.5"/>
                            <circle cx="9" cy="10" r="1.2" fill={color}/>
                            <circle cx="15" cy="10" r="1.2" fill={color}/>
                            <path d={mouth} stroke={color} strokeWidth="1.5" strokeLinecap="round" fill="none"/>
                          </svg>
                          <span style={{ fontSize: 10, color: C.textSecondary, whiteSpace: "nowrap" }}>{label}</span>
                        </button>
                      ))}
                    </div>
                    <p style={{ fontSize: 11, color: C.textMuted, margin: 0 }}>タップするだけで記録できます</p>
                  </div>
                </Card>
              )}

              {/* ── くわしく記録 ── */}
              {diaryMode === "detail" && (
              <Card>
                {editingId && (
                  <div style={{ display: "flex", alignItems: "center", gap: 8, background: C.warnDim, border: `1px solid ${C.warn}30`, borderRadius: 10, padding: "10px 14px", marginBottom: 20 }}>
                    <Info size={14} color={C.warn} strokeWidth={1.5} />
                    <span style={{ fontSize: 12, color: C.warn, fontWeight: 600 }}>記録を編集中です</span>
                  </div>
                )}
                <SLabel>曝露した時間</SLabel>
                <input type="datetime-local" value={form.exposureTime} onChange={e => setForm(p => ({ ...p, exposureTime: e.target.value }))} style={{ ...inputSt, marginBottom: 8 }} />
                <p style={{ fontSize: 11, color: C.textMuted, margin: "0 0 20px" }}>「いつ・どこで」曝露したか</p>

                <SLabel>症状が出た時間</SLabel>
                <input type="datetime-local" value={form.date} onChange={e => setForm(p => ({ ...p, date: e.target.value }))} style={{ ...inputSt, marginBottom: 8 }} />
                {(() => {
                  const diff = (new Date(form.date) - new Date(form.exposureTime)) / 60000;
                  if (diff > 0) return (
                    <div style={{ display: "inline-flex", alignItems: "center", gap: 6, background: C.accentDim, borderRadius: 8, padding: "5px 12px", marginBottom: 20 }}>
                      <Info size={12} color={C.accent} strokeWidth={1.5} />
                      <span style={{ fontSize: 12, color: C.accent, fontWeight: 600 }}>
                        タイムラグ: {diff >= 60 ? `${Math.floor(diff/60)}時間${diff%60 > 0 ? `${diff%60}分` : ""}` : `${diff}分`}後に症状
                      </span>
                    </div>
                  );
                  return <div style={{ marginBottom: 20 }} />;
                })()}

                <SLabel>症状</SLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 20 }}>
                  {SYMPTOM_OPTIONS.map(s => <Pill key={s} label={s} active={form.symptoms.includes(s)} onClick={() => toggleItem("symptoms", s)} />)}
                </div>

                <SLabel>曝露したもの</SLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 10 }}>
                  {EXPOSURE_OPTIONS.map(e => <Pill key={e} label={e} active={form.exposures.includes(e)} onClick={() => toggleItem("exposures", e)} danger />)}
                </div>
                <input value={form.customExposure} onChange={e => setForm(p => ({ ...p, customExposure: e.target.value }))} placeholder="その他（自由入力）" style={{ ...inputSt, marginBottom: 20 }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 8 }}>
                  <SLabel>症状の強さ</SLabel>
                  <span style={{ fontSize: 20, fontWeight: 700, color: sevColor(form.severity) }}>{form.severity}</span>
                </div>
                <input type="range" min={1} max={10} value={form.severity} onChange={e => setForm(p => ({ ...p, severity: Number(e.target.value) }))} style={{ width: "100%", marginBottom: 20, accentColor: C.accent }} />
                <SLabel>メモ</SLabel>
                <textarea placeholder="自由記述（任意）" value={form.note} onChange={e => setForm(p => ({ ...p, note: e.target.value }))} style={{ ...inputSt, height: 80, resize: "none", marginBottom: 20 }} />
                {editingId ? (
                  <div style={{ display: "flex", gap: 8 }}>
                    <button onClick={() => { setEditingId(null); setForm({ symptoms: [], exposures: [], severity: 5, note: "", date: new Date().toISOString().slice(0, 16), exposureTime: new Date().toISOString().slice(0, 16), customExposure: "" }); }} style={{ flex: 1, background: "transparent", border: `1px solid ${C.border}`, borderRadius: 10, padding: "13px", fontSize: 14, color: C.textSecondary, cursor: "pointer", fontFamily: "inherit" }}>キャンセル</button>
                    <button onClick={saveEdit} style={{ ...btnSt, flex: 2 }}>更新する</button>
                  </div>
                ) : (
                  <button onClick={saveDiary} style={btnSt}>記録する</button>
                )}
              </Card>
              )}

              {/* 表示切替 */}
              <div style={{ display: "flex", gap: 6, marginBottom: 12 }}>
                <Pill label="リスト" active={!calMode} onClick={() => setCalMode(false)} />
                <Pill label="カレンダー" active={calMode} onClick={() => setCalMode(true)} />
              </div>

              {/* カレンダー表示 */}
              {calMode && (
                <Card>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
                    <button onClick={() => { if (calMonth === 0) { setCalMonth(11); setCalYear(y => y-1); } else setCalMonth(m => m-1); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronLeft size={14} color={C.textSecondary} />
                    </button>
                    <span style={{ fontSize: 14, fontWeight: 700, color: C.textPrimary }}>{calYear}年 {calMonth + 1}月</span>
                    <button onClick={() => { if (calMonth === 11) { setCalMonth(0); setCalYear(y => y+1); } else setCalMonth(m => m+1); }} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 8, width: 32, height: 32, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <ChevronRight size={14} color={C.textSecondary} />
                    </button>
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2, marginBottom: 8 }}>
                    {WEEKDAYS.map(d => <div key={d} style={{ textAlign: "center", fontSize: 10, color: C.textMuted, padding: "4px 0" }}>{d}</div>)}
                  </div>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 2 }}>
                    {Array.from({ length: firstDay }).map((_, i) => <div key={"e"+i} />)}
                    {Array.from({ length: daysInMonth }).map((_, i) => {
                      const day = i + 1;
                      const key = `${monthStr}-${String(day).padStart(2, "0")}`;
                      const entries = diaryByDate[key] || [];
                      const maxSev = entries.length > 0 ? Math.max(...entries.map(e => e.severity)) : 0;
                      const isToday = key === new Date().toISOString().slice(0, 10);
                      return (
                        <div key={day} style={{ textAlign: "center", padding: "6px 2px", borderRadius: 8, background: isToday ? C.accentDim : "transparent", border: isToday ? `1px solid ${C.accent}40` : "1px solid transparent" }}>
                          <div style={{ fontSize: 12, color: isToday ? C.accent : C.textPrimary, fontWeight: isToday ? 700 : 400 }}>{day}</div>
                          {entries.length > 0 && (
                            <div style={{ width: 6, height: 6, borderRadius: "50%", background: sevColor(maxSev), margin: "3px auto 0" }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                  <div style={{ marginTop: 12, display: "flex", gap: 12, justifyContent: "center" }}>
                    {[["良好 (1-3)", C.accent], ["注意 (4-6)", C.warn], ["重症 (7-10)", C.danger]].map(([l, c]) => (
                      <div key={l} style={{ display: "flex", alignItems: "center", gap: 4 }}>
                        <div style={{ width: 7, height: 7, borderRadius: "50%", background: c }} />
                        <span style={{ fontSize: 10, color: C.textMuted }}>{l}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* リスト + 検索 */}
              {!calMode && diary.length > 0 && (
                <Card>
                  <div style={{ position: "relative", marginBottom: 16 }}>
                    <Search size={14} color={C.textMuted} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
                    <input value={diarySearch} onChange={e => setDiarySearch(e.target.value)} placeholder="症状・曝露・メモで検索" style={{ ...inputSt, paddingLeft: 34 }} />
                  </div>
                  {filteredDiary.length === 0 && (
                    <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, margin: 0 }}>「{diarySearch}」に一致する記録はありません</p>
                  )}
                  {filteredDiary.map((d, i) => {
                    const lagMin = d.exposureTime ? Math.round((new Date(d.date) - new Date(d.exposureTime)) / 60000) : 0;
                    const simpleLabel = d.simple ? [null,"良い","良い","まあまあ","まあまあ","普通","普通","悪い","悪い","辛い","辛い"][d.severity] : null;
                    const isEditing = editingId === d.id;
                    return (
                    <div key={d.id} style={{ paddingBottom: i < filteredDiary.length - 1 ? 14 : 0, marginBottom: i < filteredDiary.length - 1 ? 14 : 0, borderBottom: i < filteredDiary.length - 1 ? `1px solid ${C.border}` : "none", background: isEditing ? C.accentDim : "transparent", borderRadius: isEditing ? 10 : 0, padding: isEditing ? "10px" : 0 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 4 }}>
                        <span style={{ fontSize: 11, color: C.textMuted }}>{d.date.replace("T", "  ")}</span>
                        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                          {simpleLabel && <span style={{ fontSize: 11, color: sevColor(d.severity), background: `${sevColor(d.severity)}15`, borderRadius: 6, padding: "2px 8px" }}>{simpleLabel}</span>}
                          <span style={{ fontSize: 11, color: sevColor(d.severity), background: `${sevColor(d.severity)}15`, borderRadius: 6, padding: "2px 8px" }}>強度 {d.severity}</span>
                          <button onClick={() => startEdit(d)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                            <svg viewBox="0 0 24 24" width="11" height="11"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={C.textMuted} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                          </button>
                          {deleteConfirmId === d.id ? (
                            <>
                              <button onClick={() => { deleteDiary(d.id); setDeleteConfirmId(null); }} style={{ background: C.danger, border: "none", borderRadius: 6, padding: "2px 10px", cursor: "pointer", fontSize: 10, color: "#fff", fontFamily: "inherit", fontWeight: 600 }}>削除</button>
                              <button onClick={() => setDeleteConfirmId(null)} style={{ background: "none", border: `1px solid ${C.border}`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", fontSize: 10, color: C.textSecondary, fontFamily: "inherit" }}>戻る</button>
                            </>
                          ) : (
                            <button onClick={() => setDeleteConfirmId(d.id)} style={{ background: "none", border: `1px solid ${C.danger}30`, borderRadius: 6, padding: "2px 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                              <X size={11} color={C.danger} strokeWidth={1.5} />
                            </button>
                          )}
                        </div>
                      </div>
                      {lagMin > 0 && (
                        <div style={{ display: "inline-flex", alignItems: "center", gap: 4, background: C.accentDim, borderRadius: 6, padding: "2px 8px", marginBottom: 4 }}>
                          <Info size={10} color={C.accent} strokeWidth={1.5} />
                          <span style={{ fontSize: 10, color: C.accent }}>曝露から {lagMin >= 60 ? `${Math.floor(lagMin/60)}時間${lagMin%60>0?`${lagMin%60}分`:""}` : `${lagMin}分`}後に症状</span>
                        </div>
                      )}
                      {d.exposures.length > 0 && <div style={{ fontSize: 11, color: C.textSecondary, marginBottom: 2 }}>{d.exposures.join(" · ")}</div>}
                      {d.symptoms.length > 0 && <div style={{ fontSize: 13, color: C.textPrimary }}>{d.symptoms.join(" · ")}</div>}
                      {d.note && <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{d.note}</div>}
                    </div>
                    );
                  })}
                </Card>
              )}
              <AdSection isHome={1} />
            </div>
          );
        })()}

        {/* GRAPH */}
        {tab === 2 && (
          <div>
            <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
              {[["severity","体調推移"],["exposures","曝露/症状"],["ranking","ランキング"],["weekday","曜日別"]].map(([m, lbl]) => (
                <Pill key={m} label={lbl} active={graphMode === m} onClick={() => setGraphMode(m)} />
              ))}
            </div>
            {graphMode === "severity" && (
              <Card>
                <SLabel>体調強度の推移</SLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={ttStyle} />
                    <Line type="monotone" dataKey="severity" stroke={C.accent} strokeWidth={2} dot={{ fill: C.accent, r: 4, strokeWidth: 0 }} />
                  </LineChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 16, display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
                  {[["平均", (diary.reduce((s,d)=>s+d.severity,0)/diary.length).toFixed(1)], ["最高", Math.max(...diary.map(d=>d.severity))], ["最低", Math.min(...diary.map(d=>d.severity))]].map(([l,v]) => (
                    <div key={l} style={{ background: C.surfaceHigh, borderRadius: 10, padding: "12px 8px", textAlign: "center" }}>
                      <div style={{ fontSize: 22, fontWeight: 700, color: C.accent }}>{v}</div>
                      <div style={{ fontSize: 10, color: C.textMuted, marginTop: 2 }}>{l}</div>
                    </div>
                  ))}
                </div>
              </Card>
            )}
            {graphMode === "exposures" && (
              <Card>
                <SLabel>曝露・症状の推移</SLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={graphData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={ttStyle} />
                    <Bar dataKey="exposures" fill={C.accent} name="曝露数" radius={[4,4,0,0]} />
                    <Bar dataKey="symptoms" fill={C.danger} name="症状数" radius={[4,4,0,0]} />
                    <Legend wrapperStyle={{ fontSize: 11, color: C.textSecondary }} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            )}
            {graphMode === "ranking" && (
              <div>
                <Card>
                  <SLabel>曝露が多いもの</SLabel>
                  {expRank.map((e, i) => (
                    <div key={e.name} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary, marginBottom: 5 }}>
                        <span>{i + 1}. {e.name}</span><span>{e.count}回</span>
                      </div>
                      <div style={{ background: C.surfaceHigh, borderRadius: 3, height: 5 }}>
                        <div style={{ background: C.danger, borderRadius: 3, height: 5, width: `${(e.count/expRank[0].count)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SLabel>症状が多いもの</SLabel>
                  {symRank.map((s, i) => (
                    <div key={s.name} style={{ marginBottom: 12 }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: C.textSecondary, marginBottom: 5 }}>
                        <span>{i + 1}. {s.name}</span><span>{s.count}回</span>
                      </div>
                      <div style={{ background: C.surfaceHigh, borderRadius: 3, height: 5 }}>
                        <div style={{ background: C.accent, borderRadius: 3, height: 5, width: `${(s.count/symRank[0].count)*100}%` }} />
                      </div>
                    </div>
                  ))}
                </Card>
              </div>
            )}
            {graphMode === "weekday" && (
              <Card>
                <SLabel>症状が悪化しやすい曜日</SLabel>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={weekdayData}>
                    <CartesianGrid strokeDasharray="3 3" stroke={C.border} />
                    <XAxis dataKey="name" tick={{ fontSize: 11, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <YAxis domain={[0, 10]} tick={{ fontSize: 10, fill: C.textMuted }} axisLine={false} tickLine={false} />
                    <Tooltip contentStyle={ttStyle} formatter={(v, n) => [v, "平均強度"]} />
                    <Bar dataKey="avg" radius={[6,6,0,0]} label={false}>
                      {weekdayData.map((entry, i) => (
                        <rect key={i} fill={entry.avg >= 7 ? C.danger : entry.avg >= 4 ? C.warn : C.accent} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                  {[...weekdayData].sort((a,b) => b.avg - a.avg).map(d => (
                    <div key={d.name} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <span style={{ fontSize: 12, color: C.textSecondary, width: 20, flexShrink: 0 }}>{d.name}</span>
                      <div style={{ flex: 1, background: C.surfaceHigh, borderRadius: 4, height: 8 }}>
                        <div style={{ background: d.avg >= 7 ? C.danger : d.avg >= 4 ? C.warn : C.accent, borderRadius: 4, height: 8, width: `${d.avg * 10}%`, transition: "width 0.4s" }} />
                      </div>
                      <span style={{ fontSize: 12, color: d.avg >= 7 ? C.danger : d.avg >= 4 ? C.warn : C.accent, fontWeight: 600, width: 28, textAlign: "right", flexShrink: 0 }}>{d.avg || "—"}</span>
                      {d.count > 0 && <span style={{ fontSize: 10, color: C.textMuted, flexShrink: 0 }}>({d.count}件)</span>}
                    </div>
                  ))}
                </div>
              </Card>
            )}
          <AdSection isHome={2} />
          </div>
        )}

        {/* AI */}
        {tab === 3 && (
          <div>
            <Card>
              <SLabel>AI曝露パターン分析</SLabel>
              <p style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.7, marginBottom: 20, marginTop: 0 }}>記録された {diary.length} 件のデータをもとに、症状のパターン・主な原因・改善アドバイスを提案します。</p>
              <button onClick={runAI} disabled={aiLoading} style={{ ...btnSt, opacity: aiLoading ? 0.5 : 1 }}>{aiLoading ? "分析中..." : "分析する"}</button>
            </Card>
            {aiResult && !aiResult.error && (
              <div>
                <div style={{ background: C.accentDim, border: `1px solid ${C.accent}25`, borderRadius: 16, padding: 20, marginBottom: 12 }}>
                  <SLabel>サマリー</SLabel>
                  <p style={{ fontSize: 14, color: C.textPrimary, lineHeight: 1.7, margin: 0, fontWeight: 500 }}>{aiResult.summary}</p>
                </div>
                <Card>
                  <SLabel>発見されたパターン</SLabel>
                  {aiResult.patterns && aiResult.patterns.map((p, i) => (
                    <div key={i} style={{ display: "flex", gap: 12, marginBottom: 12 }}>
                      <span style={{ fontSize: 11, color: C.accent, background: C.accentDim, borderRadius: "50%", width: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 700, flexShrink: 0 }}>{i+1}</span>
                      <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{p}</span>
                    </div>
                  ))}
                </Card>
                <Card>
                  <SLabel>主なトリガー</SLabel>
                  {aiResult.topTriggers && aiResult.topTriggers.map((t, i) => (
                    <div key={i} style={{ background: C.dangerDim, border: `1px solid ${C.danger}20`, borderRadius: 8, padding: "10px 14px", marginBottom: 8, fontSize: 13, color: C.danger }}>{t}</div>
                  ))}
                </Card>
                <Card>
                  <SLabel>改善アドバイス</SLabel>
                  {aiResult.advice && aiResult.advice.map((a, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, marginBottom: 12 }}>
                      <Check size={16} color={C.accent} />
                      <span style={{ fontSize: 13, color: C.textSecondary, lineHeight: 1.6 }}>{a}</span>
                    </div>
                  ))}
                </Card>
                {aiResult.riskDays && (
                  <div style={{ background: C.warnDim, border: `1px solid ${C.warn}25`, borderRadius: 16, padding: 20, marginBottom: 12 }}>
                    <SLabel>リスクが高い時間帯・状況</SLabel>
                    <p style={{ fontSize: 13, color: C.warn, lineHeight: 1.7, margin: 0 }}>{aiResult.riskDays}</p>
                  </div>
                )}
              </div>
            )}
            {aiResult && aiResult.error && <Card><p style={{ textAlign: "center", color: C.danger, fontSize: 13, margin: 0 }}>エラーが発生しました。再度お試しください。</p></Card>}
            <AdSection isHome={0} />
          </div>
        )}

        {/* MAP */}
        {tab === 4 && (
          <div>
            {/* カテゴリフィルター＋登録ボタン */}
            <div style={{ display: "flex", gap: 6, marginBottom: 14, alignItems: "center", flexWrap: "wrap" }}>
              {shopCategories.map(f => <Pill key={f} label={f} active={shopFilter===f} onClick={() => { setShopFilter(f); setShowShopForm(false); }} />)}
              <button onClick={fetchShops} style={{ display: "flex", alignItems: "center", gap: 4, background: "none", border: `1px solid ${C.border}`, borderRadius: 20, padding: "6px 10px", cursor: "pointer", fontSize: 11, color: C.textMuted, fontFamily: "inherit" }}>
                <svg viewBox="0 0 24 24" width="11" height="11"><path d="M23 4v6h-6M1 20v-6h6" stroke={C.textMuted} strokeWidth="1.5" fill="none" strokeLinecap="round"/><path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={C.textMuted} strokeWidth="1.5" fill="none" strokeLinecap="round"/></svg>
                {shopsLoading ? "読込中..." : "更新"}
              </button>
              <button onClick={() => setShowShopForm(v => !v)} style={{ marginLeft: "auto", display: "flex", alignItems: "center", gap: 5, background: showShopForm ? C.surfaceHigh : C.accent, color: showShopForm ? C.textSecondary : "#fff", border: `1px solid ${showShopForm ? C.border : C.accent}`, borderRadius: 20, padding: "6px 14px", cursor: "pointer", fontSize: 12, fontWeight: 600, fontFamily: "inherit" }}>
                <Plus size={13} color={showShopForm ? C.textSecondary : "#fff"} strokeWidth={2} />
                お店を登録
              </button>
            </div>
            {shopsFromSheet && (
              <div style={{ fontSize: 10, color: C.textMuted, marginBottom: 10, display: "flex", alignItems: "center", gap: 4 }}>
                <Check size={10} color={C.accent} />スプレッドシートから{shops.length}件読み込み済み
              </div>
            )}

            {/* 登録フォーム */}
            {showShopForm && (
              <Card>
                <SLabel>お店を登録する</SLabel>
                <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.7, margin: "0 0 16px" }}>
                  MCSの方が安心して行けるお店の情報をみんなで共有しましょう。以下の情報をGoogleフォームにご記入ください。
                </p>

                {/* 必要情報リスト */}
                <div style={{ background: C.surfaceHigh, borderRadius: 12, padding: "14px 16px", marginBottom: 16 }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: C.textSecondary, marginBottom: 10, letterSpacing: "0.05em" }}>ご記入いただく内容</div>
                  {[
                    { label: "お店の名前", required: true, example: "例：ナチュラルカフェ 緑の庭" },
                    { label: "エリア（都道府県・市区町村）", required: true, example: "例：東京都渋谷区" },
                    { label: "カテゴリ", required: true, example: "病院・自然食品店・飲食店・美容院・ホテル・宿泊施設・その他" },
                    { label: "安全と判断した理由", required: true, example: "例：芳香剤なし、無添加メニューあり、スタッフが配慮してくれる" },
                    { label: "訪問日（おおよそ）", required: false, example: "例：2026年5月" },
                    { label: "住所", required: false, example: "例：渋谷区神南1-2-3（地図ピン用）" },
                  ].map((item, i) => (
                    <div key={i} style={{ display: "flex", gap: 10, paddingBottom: i < 5 ? 10 : 0, marginBottom: i < 5 ? 10 : 0, borderBottom: i < 5 ? `1px solid ${C.border}` : "none", alignItems: "flex-start" }}>
                      <div style={{ flexShrink: 0, marginTop: 1 }}>
                        {item.required
                          ? <span style={{ fontSize: 9, background: C.accent, color: "#fff", borderRadius: 4, padding: "2px 5px", fontWeight: 700 }}>必須</span>
                          : <span style={{ fontSize: 9, background: C.surfaceHigh, color: C.textMuted, border: `1px solid ${C.border}`, borderRadius: 4, padding: "2px 5px" }}>任意</span>
                        }
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 12, fontWeight: 600, color: C.textPrimary, marginBottom: 2 }}>{item.label}</div>
                        <div style={{ fontSize: 11, color: C.textMuted }}>{item.example}</div>
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ background: C.warnDim, border: `1px solid ${C.warn}25`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                  <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                    <Info size={13} color={C.warn} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                    <p style={{ fontSize: 11, color: C.warn, margin: 0, lineHeight: 1.6 }}>
                      ご登録いただいた情報は管理者が確認後、掲載されます。個人情報は入力しないでください。
                    </p>
                  </div>
                </div>

                <a href={SHOP_FORM_URL} target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, background: C.accent, color: "#fff", borderRadius: 10, padding: "13px", fontSize: 14, fontWeight: 700, textDecoration: "none" }}>
                  <ExternalLink size={15} color="#fff" strokeWidth={2} />
                  Googleフォームで登録する
                </a>
                <p style={{ fontSize: 10, color: C.textMuted, textAlign: "center", marginTop: 8, marginBottom: 0 }}>
                  ※ URLは設定画面から変更できます
                </p>
              </Card>
            )}

            {/* 地図エリア */}
            {!showShopForm && (
              <>
                <div style={{ background: C.surfaceHigh, borderRadius: 16, height: 180, position: "relative", marginBottom: 12, overflow: "hidden", border: `1px solid ${C.border}` }}>
                  <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", textAlign: "center" }}>
                    <MapPin size={24} color={C.textMuted} />
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 6 }}>実装時は Google Maps 連携</div>
                  </div>
                  {filteredShops.map((shop, i) => (
                    <button key={shop.id} onClick={() => setSelectedShop(shop)} style={{ position: "absolute", background: C.accent, border: "none", borderRadius: "50%", width: 26, height: 26, cursor: "pointer", boxShadow: "0 2px 8px rgba(0,0,0,0.15)", left: `${15+(i*17)%70}%`, top: `${20+(i*23)%60}%`, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      <Check size={12} color="#fff" />
                    </button>
                  ))}
                </div>

                {selectedShop && (
                  <div style={{ background: C.accentDim, border: `1px solid ${C.accent}25`, borderRadius: 14, padding: 16, marginBottom: 12 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                      <div>
                        <div style={{ fontWeight: 600, fontSize: 14, color: C.textPrimary }}>{selectedShop.name}</div>
                        <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{selectedShop.area} · {selectedShop.category}</div>
                      </div>
                      <button onClick={() => setSelectedShop(null)} style={{ background: "none", border: "none", cursor: "pointer" }}><X size={16} color={C.textMuted} /></button>
                    </div>
                    <div style={{ marginTop: 10, fontSize: 12, color: C.accent, display: "flex", alignItems: "center", gap: 6 }}>
                      <Check size={13} color={C.accent} />
                      {selectedShop.notes}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {filteredShops.map(shop => (
                    <button key={shop.id} onClick={() => setSelectedShop(shop)} style={{ background: C.surface, border: `1px solid ${C.border}`, borderRadius: 14, padding: "14px 16px", cursor: "pointer", textAlign: "left", fontFamily: "inherit" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ fontWeight: 500, fontSize: 13, color: C.textPrimary }}>{shop.name}</div>
                        <span style={{ fontSize: 10, background: C.accentDim, color: C.accent, padding: "3px 10px", borderRadius: 10 }}>{shop.category}</span>
                      </div>
                      <div style={{ fontSize: 11, color: C.textMuted, marginTop: 4 }}>{shop.area}</div>
                    </button>
                  ))}
                </div>
              </>
            )}
            <AdSection isHome={1} />
          </div>
        )}

        {/* SCAN */}
        {tab === 5 && (
          <div>
            {/* 成分表撮影 */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                <ScanLine size={14} color={C.accent} strokeWidth={1.5} />
                <span style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>成分表を撮影して確認</span>
              </div>
              <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.7, margin: "0 0 16px" }}>
                商品の成分一覧を写真に撮ると、登録した苦手成分が含まれているか自動でチェックします
              </p>

              {/* 撮影エリア */}
              <label style={{ display: "block", cursor: "pointer" }}>
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  onChange={handleImageCapture}
                  style={{ display: "none" }}
                />
                <div style={{ background: C.surfaceHigh, border: `2px dashed ${scanPreview ? C.accent : C.border}`, borderRadius: 14, overflow: "hidden", position: "relative", minHeight: 180, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 14 }}>
                  {scanPreview ? (
                    <img src={scanPreview} alt="撮影した成分表" style={{ width: "100%", objectFit: "contain", maxHeight: 300, display: "block" }} />
                  ) : (
                    <div style={{ textAlign: "center", padding: 24 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 16, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
                        <ScanLine size={26} color={C.accent} strokeWidth={1.5} />
                      </div>
                      <div style={{ fontSize: 14, fontWeight: 600, color: C.textPrimary, marginBottom: 4 }}>タップして撮影</div>
                      <div style={{ fontSize: 11, color: C.textMuted }}>成分表・原材料名の部分を撮ってください</div>
                    </div>
                  )}
                </div>
              </label>

              {/* 撮り直しリンク */}
              {scanPreview && (
                <label style={{ display: "block", cursor: "pointer", textAlign: "center", marginBottom: 14 }}>
                  <input type="file" accept="image/*" capture="environment" onChange={handleImageCapture} style={{ display: "none" }} />
                  <span style={{ fontSize: 12, color: C.textSecondary, textDecoration: "underline" }}>撮り直す</span>
                </label>
              )}

              <button
                onClick={analyzeImage}
                disabled={!scanPreview || scanLoading}
                style={{ ...btnSt, opacity: !scanPreview || scanLoading ? 0.5 : 1 }}
              >
                {scanLoading ? "AIが解析中..." : "成分をチェックする"}
              </button>
            </Card>

            {/* 解析中 */}
            {scanLoading && (
              <Card>
                <div style={{ textAlign: "center", padding: 8 }}>
                  <div style={{ fontSize: 13, color: C.textSecondary, marginBottom: 4 }}>成分表を読み取っています...</div>
                  <div style={{ fontSize: 11, color: C.textMuted }}>苦手成分との照合中</div>
                </div>
              </Card>
            )}

            {/* 解析結果 */}
            {scanResult && !scanResult.error && (
              <Card>
                <div style={{ display: "inline-flex", alignItems: "center", gap: 8, background: (scanResult.hits?.length ?? 0) === 0 ? C.accentDim : C.dangerDim, borderRadius: 10, padding: "10px 18px", fontSize: 14, fontWeight: 700, color: (scanResult.hits?.length ?? 0) === 0 ? C.accent : C.danger, marginBottom: 18, width: "100%", boxSizing: "border-box" }}>
                  {(scanResult.hits?.length ?? 0) === 0
                    ? <><Check size={16} color={C.accent} /> 苦手成分は見つかりませんでした</>
                    : <><AlertTriangle size={16} color={C.danger} /> {scanResult.hits.length}つの苦手成分を検出</>}
                </div>

                {/* 検出された苦手成分 */}
                {scanResult.hits?.length > 0 && (
                  <>
                    <SLabel>検出された苦手成分</SLabel>
                    <div style={{ background: C.dangerDim, border: `1px solid ${C.danger}25`, borderRadius: 12, padding: "12px 16px", marginBottom: 18 }}>
                      {scanResult.hits.map(h => (
                        <div key={h} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                          <AlertTriangle size={12} color={C.danger} />
                          <span style={{ fontSize: 13, color: C.danger, fontWeight: 600 }}>{h}</span>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {/* 全成分 */}
                <SLabel>読み取った全成分</SLabel>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
                  {scanResult.ingredients?.map(ing => {
                    const hit = scanResult.hits?.includes(ing);
                    return (
                      <span key={ing} style={{ fontSize: 11, padding: "4px 10px", borderRadius: 8, background: hit ? C.dangerDim : C.surfaceHigh, color: hit ? C.danger : C.textSecondary, border: `1px solid ${hit ? C.danger+"30" : C.border}`, fontWeight: hit ? 700 : 400 }}>
                        {ing}
                      </span>
                    );
                  })}
                </div>
                <p style={{ fontSize: 10, color: C.textMuted, margin: 0 }}>※ AIによる読み取りのため、誤認識が生じる場合があります。成分表の原文もあわせてご確認ください。</p>

                {/* 苦手成分あり → 代替製品 */}
                {scanResult.hits?.length > 0 && (
                  <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 16, marginTop: 16 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
                      <ShoppingBag size={14} color={C.accent} />
                      <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>代替製品のおすすめ</span>
                      <span style={{ fontSize: 9, color: C.textMuted, marginLeft: "auto" }}>PR・広告</span>
                    </div>
                    <Disclaimer />
                    {AFFILIATES.slice(0, 2).map(p => <AffCard key={p.asin} p={p} />)}
                  </div>
                )}
              </Card>
            )}

            {scanResult && scanResult.error && (
              <Card>
                <p style={{ textAlign: "center", color: C.textMuted, fontSize: 13, margin: "0 0 8px" }}>
                  {scanResult.message || "解析できませんでした"}
                </p>
                <p style={{ textAlign: "center", fontSize: 11, color: C.textMuted, margin: 0 }}>
                  {scanResult.message ? "" : "成分表がはっきり写るよう撮り直してみてください"}
                </p>
              </Card>
            )}

            {/* おすすめ製品 */}
            <Card>
              <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
                <Heart size={14} color={C.accent} strokeWidth={1.5} />
                <SLabel>MCS対応おすすめ製品</SLabel>
                <span style={{ fontSize: 9, color: C.textMuted, marginLeft: "auto" }}>PR・広告</span>
              </div>
              <Disclaimer />
              <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 }}>
                {allTags.map(t => <Pill key={t} label={t} active={affTag === t} onClick={() => setAffTag(t)} />)}
              </div>
              {filteredAff.map(p => <AffCard key={p.asin} p={p} />)}
            </Card>
            <AdSection isHome={2} />
          </div>
        )}

        {/* SETTINGS */}
        {tab === 6 && (
          <div>
            <Card>
              <SLabel>プロフィール</SLabel>
              <div style={{ display: "flex", gap: 8 }}>
                <input value={userName} onChange={e => setUserName(e.target.value)} placeholder="お名前" style={{ ...inputSt, flex: 1 }} />
                <button onClick={() => { localStorage.setItem("safelife_name", userName || "skip"); showToast("更新しました"); }} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "0 16px", cursor: "pointer", fontSize: 12, fontWeight: 700, fontFamily: "inherit", flexShrink: 0 }}>更新</button>
              </div>
            </Card>
            <Card>
              <SLabel>苦手物質の管理</SLabel>
              <div style={{ display: "flex", gap: 8, marginBottom: 14 }}>
                <input value={newAllergen} onChange={e => setNewAllergen(e.target.value)} placeholder="物質名を入力" style={{ ...inputSt, flex: 1 }} onKeyDown={e => { if (e.key === "Enter" && newAllergen.trim()) { setAllergens(p => [...p, newAllergen.trim()]); setNewAllergen(""); showToast("追加しました"); }}} />
                <button onClick={() => { if (newAllergen.trim()) { setAllergens(p => [...p, newAllergen.trim()]); setNewAllergen(""); showToast("追加しました"); }}} style={{ background: C.accent, color: "#fff", border: "none", borderRadius: 10, width: 42, height: 42, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Plus size={18} color="#fff" />
                </button>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                {allergens.map(a => (
                  <div key={a} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: C.dangerDim, border: `1px solid ${C.danger}20`, borderRadius: 10, padding: "10px 14px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <AlertTriangle size={13} color={C.danger} />
                      <span style={{ fontSize: 13, color: C.textPrimary }}>{a}</span>
                    </div>
                    <button onClick={() => { setAllergens(p => p.filter(x => x !== a)); showToast("削除しました"); }} style={{ background: "none", border: "none", cursor: "pointer" }}>
                      <X size={15} color={C.textMuted} />
                    </button>
                  </div>
                ))}
              </div>
            </Card>
            <Card>
              <SLabel>アフィリエイト・広告について</SLabel>
              <div style={{ background: C.accentDim, border: `1px solid ${C.accent}20`, borderRadius: 10, padding: "12px 14px", marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <Info size={13} color={C.accent} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.accent }}>Amazonアソシエイト参加中</span>
                </div>
                <p style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>このアプリはAmazon.co.jpアソシエイトプログラムに参加しています。「PR・広告」と表示されたリンクから購入された場合、運営者に一定の報酬が支払われることがあります。ユーザーの購入価格には影響しません。</p>
              </div>
              <div style={{ background: C.warnDim, border: `1px solid ${C.warn}20`, borderRadius: 10, padding: "12px 14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 6 }}>
                  <AlertTriangle size={13} color={C.warn} />
                  <span style={{ fontSize: 12, fontWeight: 600, color: C.warn }}>製品に関する免責事項</span>
                </div>
                <p style={{ fontSize: 11, color: C.textSecondary, lineHeight: 1.7, margin: 0 }}>掲載製品は無添加・無香料を基準に選定していますが、化学物質過敏症の症状や反応には<strong style={{ color: C.textPrimary }}>個人差があります</strong>。すべての方に適合するとは限りません。購入前に成分をご確認のうえ、かかりつけ医にご相談ください。</p>
              </div>
            </Card>

            {/* メンバーシップ案内 */}
            <a href="https://note.com" target="_blank" rel="noopener noreferrer" style={{ display: "block", textDecoration: "none", marginBottom: 12 }}>
              <div style={{ background: "linear-gradient(135deg, #f0faf5, #e6f7ee)", border: `1px solid ${C.accent}30`, borderRadius: 16, padding: 20 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 10 }}>
                  <div style={{ width: 32, height: 32, borderRadius: 10, background: C.accent, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                    <FileText size={16} color="#fff" strokeWidth={1.5} />
                  </div>
                  <div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary }}>noteメンバーシップ会員限定</div>
                    <div style={{ fontSize: 10, color: C.textMuted, marginTop: 1 }}>月額 500円</div>
                  </div>
                  <ExternalLink size={14} color={C.textMuted} strokeWidth={1.5} style={{ marginLeft: "auto", flexShrink: 0 }} />
                </div>
                <p style={{ fontSize: 12, color: C.textSecondary, lineHeight: 1.7, margin: "0 0 12px" }}>
                  このアプリはnoteメンバーシップ会員への限定特典です。MCSに関する最新情報・体験談・おすすめ情報もnoteで発信しています。
                </p>
                <div style={{ background: C.accent, color: "#fff", borderRadius: 8, padding: "8px 14px", fontSize: 12, fontWeight: 700, textAlign: "center" }}>
                  noteでメンバーシップに登録する
                </div>
              </div>
            </a>

            {/* お問い合わせ */}
            <a href="https://forms.gle/E8RDjcDJVDiuzW4b9" target="_blank" rel="noopener noreferrer" style={{ display: "flex", alignItems: "center", gap: 14, background: C.surface, border: `1px solid ${C.border}`, borderRadius: 16, padding: "16px 18px", marginBottom: 12, textDecoration: "none" }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, background: C.accentDim, display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                <MessageCircle size={18} color={C.accent} strokeWidth={1.5} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: C.textPrimary, marginBottom: 2 }}>ご質問・ご意見はこちら</div>
                <div style={{ fontSize: 11, color: C.textSecondary }}>フォームからお気軽にどうぞ</div>
              </div>
              <ExternalLink size={14} color={C.textMuted} strokeWidth={1.5} style={{ flexShrink: 0 }} />
            </a>

            {/* データ管理 */}
            <Card>
              <SLabel>データのバックアップ</SLabel>
              <div style={{ background: C.warnDim, border: `1px solid ${C.warn}25`, borderRadius: 10, padding: "10px 14px", marginBottom: 16 }}>
                <div style={{ display: "flex", gap: 8, alignItems: "flex-start" }}>
                  <Info size={13} color={C.warn} strokeWidth={1.5} style={{ flexShrink: 0, marginTop: 1 }} />
                  <p style={{ fontSize: 11, color: C.warn, margin: 0, lineHeight: 1.7 }}>
                    SafariはiPhoneで7日間アプリを開かないとデータが消える場合があります。定期的にエクスポートしておくことをおすすめします。
                  </p>
                </div>
              </div>
              <div style={{ fontSize: 12, color: C.textSecondary, marginBottom: 14 }}>記録件数: <strong style={{ color: C.textPrimary }}>{diary.length}件</strong></div>
              <div style={{ display: "flex", gap: 8, marginBottom: 10 }}>
                <button onClick={exportJSON} style={{ flex: 1, background: C.accent, color: "#fff", border: "none", borderRadius: 10, padding: "11px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  JSONで保存
                </button>
                <button onClick={exportCSV} style={{ flex: 1, background: "transparent", color: C.accent, border: `1px solid ${C.accent}`, borderRadius: 10, padding: "11px", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                  CSVで保存
                </button>
              </div>
              <label style={{ display: "block", cursor: "pointer" }}>
                <input type="file" accept=".json" onChange={importJSON} style={{ display: "none" }} />
                <div style={{ textAlign: "center", padding: "11px", border: `1px dashed ${C.border}`, borderRadius: 10, fontSize: 12, color: C.textMuted }}>
                  JSONファイルからインポート
                </div>
              </label>
            </Card>

            <Card style={{ marginBottom: 0 }}>
              <SLabel>アプリについて</SLabel>
              <div style={{ fontSize: 12, color: C.textSecondary, lineHeight: 2 }}>
                <div>バージョン: 1.0.0</div>
                <div>データ: 端末内のみに保存</div>
              </div>
            </Card>
            <AdSection isHome={0} />
          </div>
        )}
      </div>

      {/* Bottom Nav */}
      {(() => {
        const NAV_ICONS = [Home, BookOpen, BarChart2, Sparkles, MapPin, ScanLine, Settings];
        return (
          <div style={{ position: "fixed", bottom: 0, left: "50%", transform: "translateX(-50%)", width: "100%", maxWidth: 430, background: "rgba(255,255,255,0.92)", backdropFilter: "blur(12px)", borderTop: `1px solid ${C.border}`, display: "flex", padding: "10px 0 16px" }}>
            {VISIBLE_NAV.map(i => (
              <button key={i} onClick={() => setTab(i)} style={{ flex: 1, background: "none", border: "none", cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center", gap: 4, fontFamily: "inherit" }}>
                {(() => { const NavIcon = NAV_ICONS[i]; return <NavIcon size={19} color={tab === i ? C.accent : C.textMuted} strokeWidth={tab === i ? 2.5 : 1.5} />; })()}
                <span style={{ fontSize: 9, color: tab === i ? C.accent : C.textMuted, fontWeight: tab === i ? 700 : 400 }}>{NAVLBL[i]}</span>
              </button>
            ))}
          </div>
        );
      })()}
      </div>
    </div>
  );
}
