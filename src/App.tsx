import { useState, useRef } from "react";

// ─── Types ───────────────────────────────────────────────────────────────────
type LinkType = "track" | "playlist" | "album" | "artist" | "unknown";
type ServiceKey = "spotifydown" | "lucida" | "spotifymate" | "yank";

interface ParsedLink {
  type: LinkType;
  id: string;
  raw: string;
}

interface DownloadService {
  key: ServiceKey;
  name: string;
  badge: string;
  badgeColor: string;
  description: string;
  supports: LinkType[];
  buildUrl: (parsed: ParsedLink) => string;
  icon: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────
function parseSpotifyLink(url: string): ParsedLink | null {
  try {
    const trimmed = url.trim();
    // Accept both https://open.spotify.com/... and spotify:... URIs
    const webMatch = trimmed.match(
      /open\.spotify\.com\/(track|playlist|album|artist)\/([A-Za-z0-9]+)/
    );
    if (webMatch) {
      return { type: webMatch[1] as LinkType, id: webMatch[2], raw: trimmed };
    }
    const uriMatch = trimmed.match(
      /spotify:(track|playlist|album|artist):([A-Za-z0-9]+)/
    );
    if (uriMatch) {
      return { type: uriMatch[1] as LinkType, id: uriMatch[2], raw: trimmed };
    }
    return null;
  } catch {
    return null;
  }
}

// ─── Download Services Config ─────────────────────────────────────────────────
const SERVICES: DownloadService[] = [
  {
    key: "spotifydown",
    name: "SpotifyDown",
    badge: "Most Popular",
    badgeColor: "from-green-400 to-emerald-500",
    description: "High-quality MP3 downloads. Best for tracks & playlists.",
    supports: ["track", "playlist", "album"],
    icon: "⬇️",
    buildUrl: (p) => `https://spotifydown.com/#${p.raw}`,
  },
  {
    key: "lucida",
    name: "Lucida",
    badge: "High Quality",
    badgeColor: "from-purple-400 to-violet-500",
    description: "Lossless & high-quality audio. Supports all link types.",
    supports: ["track", "playlist", "album"],
    icon: "🎵",
    buildUrl: (p) =>
      `https://lucida.to/?url=${encodeURIComponent(p.raw)}&country=auto`,
  },
  {
    key: "spotifymate",
    name: "SpotifyMate",
    badge: "Fast",
    badgeColor: "from-blue-400 to-cyan-500",
    description: "Quick single-track downloads. Simple & clean interface.",
    supports: ["track"],
    icon: "⚡",
    buildUrl: (p) =>
      `https://spotifymate.com/en?url=${encodeURIComponent(p.raw)}`,
  },
  {
    key: "yank",
    name: "Yank",
    badge: "Playlist Pro",
    badgeColor: "from-orange-400 to-pink-500",
    description: "Great for downloading entire playlists & albums.",
    supports: ["track", "playlist", "album"],
    icon: "📦",
    buildUrl: (p) =>
      `https://www.yank.fm/download/${encodeURIComponent(p.raw)}`,
  },
];

const LINK_TYPE_META: Record<
  LinkType,
  { label: string; emoji: string; color: string }
> = {
  track: { label: "Track", emoji: "🎵", color: "text-green-400" },
  playlist: { label: "Playlist", emoji: "📋", color: "text-blue-400" },
  album: { label: "Album", emoji: "💿", color: "text-purple-400" },
  artist: { label: "Artist", emoji: "🎤", color: "text-orange-400" },
  unknown: { label: "Unknown", emoji: "❓", color: "text-gray-400" },
};

const STEPS = [
  {
    icon: "🔗",
    title: "Copy Spotify Link",
    desc: "Open Spotify, right-click any song, playlist or album → Share → Copy Link",
  },
  {
    icon: "📋",
    title: "Paste the Link",
    desc: "Paste your Spotify link in the input box above and click Analyze",
  },
  {
    icon: "⬇️",
    title: "Choose & Download",
    desc: "Pick your preferred download service and save the music to your device",
  },
];

const EXAMPLE_LINKS = [
  { label: "Track Example", url: "https://open.spotify.com/track/4iV5W9uYEdYUVa79Axb7Rh" },
  { label: "Playlist Example", url: "https://open.spotify.com/playlist/37i9dQZF1DXcBWIGoYBM5M" },
  { label: "Album Example", url: "https://open.spotify.com/album/1ATL5GLyefJaxhQzSPVrLX" },
];

// ─── Sub-components ───────────────────────────────────────────────────────────

function WaveAnimation() {
  return (
    <div className="flex items-end gap-[3px] h-8">
      {[1, 2, 3, 4, 5, 6, 7].map((i) => (
        <div
          key={i}
          className="w-1 rounded-full bg-green-400 opacity-80"
          style={{
            height: `${Math.random() * 60 + 30}%`,
            animation: `wave ${0.8 + i * 0.1}s ease-in-out infinite alternate`,
            animationDelay: `${i * 0.1}s`,
          }}
        />
      ))}
    </div>
  );
}

function SpotifyIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
    </svg>
  );
}

function ServiceCard({
  service,
  parsed,
  disabled,
}: {
  service: DownloadService;
  parsed: ParsedLink;
  disabled: boolean;
}) {
  const isSupported = service.supports.includes(parsed.type);
  const href = isSupported ? service.buildUrl(parsed) : "#";

  return (
    <a
      href={disabled || !isSupported ? undefined : href}
      target={disabled || !isSupported ? undefined : "_blank"}
      rel="noopener noreferrer"
      className={`
        group relative flex flex-col gap-3 rounded-2xl border p-5 transition-all duration-300
        ${
          isSupported && !disabled
            ? "border-white/10 bg-white/5 hover:bg-white/10 hover:border-green-500/40 hover:shadow-lg hover:shadow-green-500/10 cursor-pointer"
            : "border-white/5 bg-white/[0.02] opacity-40 cursor-not-allowed"
        }
      `}
      onClick={(e) => {
        if (disabled || !isSupported) e.preventDefault();
      }}
    >
      {/* Badge */}
      <div className="flex items-start justify-between">
        <div
          className={`inline-flex items-center gap-1 rounded-full bg-gradient-to-r ${service.badgeColor} px-2.5 py-0.5 text-xs font-semibold text-white`}
        >
          {service.badge}
        </div>
        {!isSupported && (
          <span className="text-xs text-gray-500">
            Not supported for {parsed.type}s
          </span>
        )}
      </div>

      {/* Name & Icon */}
      <div className="flex items-center gap-3">
        <span className="text-3xl">{service.icon}</span>
        <div>
          <h3 className="text-base font-bold text-white">{service.name}</h3>
          <p className="text-xs text-gray-400 mt-0.5">{service.description}</p>
        </div>
      </div>

      {/* CTA */}
      {isSupported && !disabled && (
        <div className="flex items-center gap-2 mt-1">
          <div className="flex-1 h-px bg-white/10" />
          <span className="text-xs font-semibold text-green-400 group-hover:text-green-300 transition-colors">
            Download Now →
          </span>
        </div>
      )}
    </a>
  );
}

// ─── Main App ─────────────────────────────────────────────────────────────────
export default function App() {
  const [inputValue, setInputValue] = useState("");
  const [parsed, setParsed] = useState<ParsedLink | null>(null);
  const [error, setError] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  const handleAnalyze = () => {
    const val = inputValue.trim();
    if (!val) {
      setError("Please paste a Spotify link first.");
      return;
    }
    setIsAnalyzing(true);
    setError("");
    setParsed(null);

    setTimeout(() => {
      const result = parseSpotifyLink(val);
      if (!result) {
        setError(
          "Invalid Spotify link. Make sure you copy it from Spotify (Share → Copy Link)."
        );
        setParsed(null);
      } else if (result.type === "artist") {
        setError(
          "Artist pages are not directly downloadable. Try copying a specific track, album, or playlist link instead."
        );
        setParsed(null);
      } else {
        setParsed(result);
        setTimeout(() => {
          resultsRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 100);
      }
      setIsAnalyzing(false);
    }, 600);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") handleAnalyze();
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      setInputValue(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      inputRef.current?.focus();
    }
  };

  const handleClear = () => {
    setInputValue("");
    setParsed(null);
    setError("");
    inputRef.current?.focus();
  };

  const handleExampleClick = (url: string) => {
    setInputValue(url);
    setParsed(null);
    setError("");
  };

  const linkMeta = parsed ? LINK_TYPE_META[parsed.type] : null;

  return (
    <div
      className="min-h-screen text-white relative overflow-hidden"
      style={{ fontFamily: "'Inter', sans-serif", background: "#0a0a0f" }}
    >
      {/* Background */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: "url('/images/hero-bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0.15,
        }}
      />
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% -10%, rgba(29,185,84,0.18) 0%, transparent 70%)",
        }}
      />
      <div
        className="absolute top-1/3 -left-48 w-96 h-96 rounded-full z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(29,185,84,0.12) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />
      <div
        className="absolute top-1/2 -right-48 w-96 h-96 rounded-full z-0 pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(29,185,84,0.08) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* CSS Animations */}
      <style>{`
        @keyframes wave {
          0% { transform: scaleY(0.4); }
          100% { transform: scaleY(1); }
        }
        @keyframes pulse-border {
          0%, 100% { box-shadow: 0 0 0 0 rgba(29,185,84,0.4); }
          50% { box-shadow: 0 0 0 8px rgba(29,185,84,0); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .fade-up { animation: fadeUp 0.5s ease forwards; }
        .fade-up-1 { animation: fadeUp 0.5s ease 0.1s both; }
        .fade-up-2 { animation: fadeUp 0.5s ease 0.2s both; }
        .fade-up-3 { animation: fadeUp 0.5s ease 0.3s both; }
        .fade-up-4 { animation: fadeUp 0.5s ease 0.4s both; }
      `}</style>

      <div className="relative z-10 max-w-3xl mx-auto px-4 py-12">
        {/* ── Header ── */}
        <header className="text-center mb-12 fade-up">
          <div className="inline-flex items-center gap-2 mb-6">
            <div
              className="flex items-center justify-center w-12 h-12 rounded-2xl"
              style={{ background: "rgba(29,185,84,0.15)", border: "1px solid rgba(29,185,84,0.3)" }}
            >
              <SpotifyIcon className="w-7 h-7 text-green-400" />
            </div>
            <WaveAnimation />
          </div>
          <h1 className="text-5xl font-black tracking-tight mb-3">
            <span className="text-white">Spoti</span>
            <span style={{ color: "#1DB954" }}>Down</span>
          </h1>
          <p className="text-gray-400 text-lg max-w-md mx-auto leading-relaxed">
            Download any Spotify <span className="text-white font-medium">song</span>,{" "}
            <span className="text-white font-medium">playlist</span> or{" "}
            <span className="text-white font-medium">album</span> — fast, free, no account needed.
          </p>

          {/* Platform badges */}
          <div className="flex flex-wrap items-center justify-center gap-2 mt-5">
            {["Windows", "macOS", "Android", "iOS", "Linux"].map((p) => (
              <span
                key={p}
                className="text-xs px-3 py-1 rounded-full font-medium"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#a0a0b0",
                }}
              >
                {p}
              </span>
            ))}
          </div>
        </header>

        {/* ── Input Card ── */}
        <div
          className="rounded-3xl p-6 mb-6 fade-up-1"
          style={{
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            backdropFilter: "blur(20px)",
          }}
        >
          <label className="block text-sm font-semibold text-gray-300 mb-3">
            Paste your Spotify link
          </label>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => {
                  setInputValue(e.target.value);
                  setError("");
                  if (parsed) setParsed(null);
                }}
                onKeyDown={handleKeyDown}
                placeholder="https://open.spotify.com/track/..."
                className="w-full rounded-xl px-4 py-3.5 text-sm outline-none transition-all"
                style={{
                  background: "rgba(255,255,255,0.07)",
                  border: "1px solid rgba(255,255,255,0.12)",
                  color: "#fff",
                  caretColor: "#1DB954",
                }}
                spellCheck={false}
              />
              {inputValue && (
                <button
                  onClick={handleClear}
                  className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors"
                  style={{ background: "rgba(255,255,255,0.1)" }}
                >
                  ✕
                </button>
              )}
            </div>
            <button
              onClick={handlePaste}
              title="Paste from clipboard"
              className="px-4 py-3.5 rounded-xl text-sm font-medium text-gray-300 hover:text-white transition-all"
              style={{
                background: "rgba(255,255,255,0.07)",
                border: "1px solid rgba(255,255,255,0.12)",
                minWidth: "60px",
              }}
            >
              {copied ? "✓" : "📋 Paste"}
            </button>
          </div>

          {/* Example links */}
          <div className="flex flex-wrap gap-2 mt-3">
            <span className="text-xs text-gray-600 self-center">Examples:</span>
            {EXAMPLE_LINKS.map((ex) => (
              <button
                key={ex.label}
                onClick={() => handleExampleClick(ex.url)}
                className="text-xs px-2.5 py-1 rounded-lg text-gray-400 hover:text-green-400 transition-colors"
                style={{ background: "rgba(255,255,255,0.05)" }}
              >
                {ex.label}
              </button>
            ))}
          </div>

          {/* Error */}
          {error && (
            <div
              className="mt-3 flex items-start gap-2 rounded-xl px-4 py-3 text-sm"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)" }}
            >
              <span className="shrink-0 mt-0.5">⚠️</span>
              <span className="text-red-300">{error}</span>
            </div>
          )}

          {/* Analyze Button */}
          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !inputValue.trim()}
            className="w-full mt-4 py-4 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 flex items-center justify-center gap-2"
            style={{
              background:
                isAnalyzing || !inputValue.trim()
                  ? "rgba(29,185,84,0.3)"
                  : "linear-gradient(135deg, #1DB954, #17a348)",
              color: isAnalyzing || !inputValue.trim() ? "rgba(255,255,255,0.4)" : "#fff",
              cursor: isAnalyzing || !inputValue.trim() ? "not-allowed" : "pointer",
              boxShadow:
                !isAnalyzing && inputValue.trim()
                  ? "0 0 24px rgba(29,185,84,0.35)"
                  : "none",
            }}
          >
            {isAnalyzing ? (
              <>
                <svg
                  className="animate-spin w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  />
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                  />
                </svg>
                Analyzing Link…
              </>
            ) : (
              <>
                <SpotifyIcon className="w-4 h-4" />
                Analyze & Find Download Options
              </>
            )}
          </button>
        </div>

        {/* ── Results ── */}
        {parsed && linkMeta && (
          <div ref={resultsRef} className="mb-8 fade-up">
            {/* Detected banner */}
            <div
              className="flex items-center gap-3 rounded-2xl px-5 py-4 mb-4"
              style={{
                background: "rgba(29,185,84,0.08)",
                border: "1px solid rgba(29,185,84,0.2)",
              }}
            >
              <span className="text-2xl">{linkMeta.emoji}</span>
              <div className="flex-1">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                  Detected
                </p>
                <p className={`font-bold text-base ${linkMeta.color}`}>
                  Spotify {linkMeta.label}
                </p>
              </div>
              <div
                className="text-xs px-2.5 py-1 rounded-full font-mono"
                style={{ background: "rgba(255,255,255,0.07)", color: "#888" }}
              >
                ID: {parsed.id.slice(0, 12)}…
              </div>
            </div>

            {/* Services */}
            <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-3 px-1">
              Choose a Download Service
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SERVICES.map((svc) => (
                <ServiceCard
                  key={svc.key}
                  service={svc}
                  parsed={parsed}
                  disabled={false}
                />
              ))}
            </div>

            {/* Notice */}
            <div
              className="mt-4 rounded-2xl px-5 py-4 text-sm text-gray-400 leading-relaxed"
              style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}
            >
              <p className="font-semibold text-gray-300 mb-1">💡 How it works</p>
              <p>
                Clicking a service will open a trusted third-party downloader with your
                Spotify link pre-filled. These services find the best matching audio on
                YouTube Music and deliver it as an MP3 to your device.
              </p>
            </div>
          </div>
        )}

        {/* ── How to Use ── */}
        <div
          className="rounded-3xl p-6 mb-6 fade-up-2"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h2 className="text-lg font-bold text-white mb-5 flex items-center gap-2">
            <span>🚀</span> How to Download in 3 Steps
          </h2>
          <div className="grid gap-4 sm:grid-cols-3">
            {STEPS.map((step, i) => (
              <div key={i} className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-base shrink-0"
                    style={{ background: "rgba(29,185,84,0.12)", border: "1px solid rgba(29,185,84,0.2)" }}
                  >
                    {step.icon}
                  </div>
                  <span
                    className="text-xs font-bold uppercase tracking-wider"
                    style={{ color: "#1DB954" }}
                  >
                    Step {i + 1}
                  </span>
                </div>
                <h3 className="font-semibold text-white text-sm">{step.title}</h3>
                <p className="text-gray-500 text-xs leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Features ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6 fade-up-3">
          {[
            { icon: "🆓", label: "100% Free", desc: "No account needed" },
            { icon: "🎧", label: "MP3 Quality", desc: "Up to 320kbps" },
            { icon: "📱", label: "All Devices", desc: "Works everywhere" },
            { icon: "🔒", label: "Safe & Fast", desc: "No malware, ever" },
          ].map((f) => (
            <div
              key={f.label}
              className="rounded-2xl p-4 flex flex-col gap-1 text-center"
              style={{
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <span className="text-2xl">{f.icon}</span>
              <p className="text-xs font-bold text-white">{f.label}</p>
              <p className="text-xs text-gray-500">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Supported Types ── */}
        <div
          className="rounded-3xl p-6 mb-8 fade-up-4"
          style={{
            background: "rgba(255,255,255,0.03)",
            border: "1px solid rgba(255,255,255,0.07)",
          }}
        >
          <h2 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">
            Supported Link Types
          </h2>
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              {
                type: "Track",
                emoji: "🎵",
                example: "open.spotify.com/track/…",
                desc: "Download any individual song",
                color: "rgba(29,185,84,0.1)",
                border: "rgba(29,185,84,0.2)",
                textColor: "#1DB954",
              },
              {
                type: "Playlist",
                emoji: "📋",
                example: "open.spotify.com/playlist/…",
                desc: "Download full playlists",
                color: "rgba(59,130,246,0.1)",
                border: "rgba(59,130,246,0.2)",
                textColor: "#3b82f6",
              },
              {
                type: "Album",
                emoji: "💿",
                example: "open.spotify.com/album/…",
                desc: "Download complete albums",
                color: "rgba(167,139,250,0.1)",
                border: "rgba(167,139,250,0.2)",
                textColor: "#a78bfa",
              },
            ].map((t) => (
              <div
                key={t.type}
                className="rounded-2xl p-4"
                style={{ background: t.color, border: `1px solid ${t.border}` }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{t.emoji}</span>
                  <span
                    className="text-sm font-bold"
                    style={{ color: t.textColor }}
                  >
                    {t.type}
                  </span>
                </div>
                <p className="text-xs text-gray-400 mb-1">{t.desc}</p>
                <p
                  className="text-xs font-mono"
                  style={{ color: "rgba(255,255,255,0.25)" }}
                >
                  {t.example}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="text-center text-xs text-gray-600 leading-loose">
          <p>
            SpotiDown is a download tool that connects to third-party services.
          </p>
          <p>
            We do not host any music files.{" "}
            <span className="text-gray-500">
              For personal use only. Respect copyright laws.
            </span>
          </p>
          <p className="mt-2">
            Made with <span style={{ color: "#1DB954" }}>♥</span> for music lovers worldwide
          </p>
        </footer>
      </div>
    </div>
  );
}
