import { useState, useEffect, useMemo } from "react";

const SUPABASE_URL = "https://vyqzenbiopldebrmfmoh.supabase.co";
const SUPABASE_ANON_KEY = "REPLACE_WITH_YOUR_ANON_KEY";

const TRACKS = [
  { id: "all", label: "All", color: "#E8E4DE" },
  { id: "jaxscoops", label: "Jax Scoops", color: "#F4845F" },
  { id: "newsletter", label: "Newsletter", color: "#7EC4CF" },
  { id: "ai-tools", label: "AI Tools", color: "#B8A9C9" },
  { id: "automation", label: "Automation", color: "#98C379" },
];

const RELEVANCE_COLORS = {
  5: "#2D6A4F",
  4: "#40916C",
  3: "#74796D",
  2: "#997B66",
  1: "#BC4749",
};

function parseJSON(val) {
  if (!val) return [];
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const p = JSON.parse(val);
      return Array.isArray(p) ? p : [];
    } catch {
      return [];
    }
  }
  return [];
}

function timeAgo(dateStr) {
  const now = new Date();
  const d = new Date(dateStr);
  const hrs = Math.floor((now - d) / 3600000);
  if (hrs < 1) return "just now";
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  if (days === 1) return "yesterday";
  return `${days}d ago`;
}

function DigestCard({ item, onExpand, expanded }) {
  const insights = parseJSON(item.key_insights);
  const actions = parseJSON(item.action_items);
  const tags = parseJSON(item.tags);
  const trackObj = TRACKS.find((t) => t.id === item.track) || TRACKS[0];

  return (
    <div
      onClick={() => onExpand(item.id)}
      style={{
        background: "#FAFAF7",
        borderRadius: 10,
        padding: "20px 22px",
        cursor: "pointer",
        border: expanded ? `2px solid ${trackObj.color}` : "2px solid transparent",
        transition: "all 0.2s ease",
        boxShadow: expanded
          ? "0 8px 30px rgba(0,0,0,0.08)"
          : "0 1px 4px rgba(0,0,0,0.04)",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 12, marginBottom: 10 }}>
        <h3 style={{ fontSize: 16, fontWeight: 600, lineHeight: 1.35, margin: 0, color: "#1A1A18", fontFamily: "'Newsreader', Georgia, serif", flex: 1 }}>
          {item.headline || item.title || "Untitled"}
        </h3>
        <div
          style={{
            background: RELEVANCE_COLORS[item.relevance_score] || "#74796D",
            color: "#fff",
            fontSize: 11,
            fontWeight: 700,
            borderRadius: 6,
            padding: "3px 8px",
            minWidth: 24,
            textAlign: "center",
            fontFamily: "'DM Mono', monospace",
            flexShrink: 0,
          }}
        >
          {item.relevance_score}
        </div>
      </div>

      {/* Meta row */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap", marginBottom: 12 }}>
        <span
          style={{
            background: trackObj.color + "22",
            color: trackObj.color,
            fontSize: 11,
            fontWeight: 600,
            padding: "2px 8px",
            borderRadius: 4,
            textTransform: "uppercase",
            letterSpacing: "0.05em",
            border: `1px solid ${trackObj.color}44`,
          }}
        >
          {trackObj.label}
        </span>
        {item.category && (
          <span style={{ fontSize: 12, color: "#8A8A80" }}>{item.category}</span>
        )}
        <span style={{ fontSize: 11, color: "#B0B0A8", marginLeft: "auto" }}>
          {item.source_name} · {timeAgo(item.created_at)}
          {item.read_time_minutes && ` · ${item.read_time_minutes}m read`}
        </span>
      </div>

      {/* Summary */}
      <p style={{
        fontSize: 14,
        lineHeight: 1.6,
        color: "#4A4A45",
        margin: 0,
        fontFamily: "'DM Sans', -apple-system, sans-serif",
        display: expanded ? "block" : "-webkit-box",
        WebkitLineClamp: expanded ? "unset" : 3,
        WebkitBoxOrient: "vertical",
        overflow: expanded ? "visible" : "hidden",
      }}>
        {item.summary}
      </p>

      {/* Expanded content */}
      {expanded && (
        <div style={{ marginTop: 16 }}>
          {insights.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A8A80", marginBottom: 6 }}>
                Key Insights
              </div>
              {insights.map((insight, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, lineHeight: 1.5, color: "#4A4A45" }}>
                  <span style={{ color: trackObj.color, flexShrink: 0, fontWeight: 700 }}>→</span>
                  <span>{insight}</span>
                </div>
              ))}
            </div>
          )}

          {actions.length > 0 && (
            <div style={{ marginBottom: 14 }}>
              <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8A8A80", marginBottom: 6 }}>
                Action Items
              </div>
              {actions.map((action, i) => (
                <div key={i} style={{ display: "flex", gap: 8, marginBottom: 6, fontSize: 13, lineHeight: 1.5, color: "#4A4A45" }}>
                  <span style={{ flexShrink: 0 }}>☐</span>
                  <span>{action}</span>
                </div>
              ))}
            </div>
          )}

          {tags.length > 0 && (
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginTop: 10 }}>
              {tags.map((tag, i) => (
                <span key={i} style={{ fontSize: 11, color: "#8A8A80", background: "#EEEEE8", borderRadius: 4, padding: "2px 7px" }}>
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {item.source_url && item.source_url !== "test" && (
            <a
              href={item.source_url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              style={{
                display: "inline-block",
                marginTop: 12,
                fontSize: 12,
                fontWeight: 600,
                color: trackObj.color,
                textDecoration: "none",
                borderBottom: `1px solid ${trackObj.color}44`,
              }}
            >
              View source ↗
            </a>
          )}
        </div>
      )}
    </div>
  );
}

export default function SecondBrainDashboard() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTrack, setActiveTrack] = useState("all");
  const [sortBy, setSortBy] = useState("date");
  const [expandedId, setExpandedId] = useState(null);

  useEffect(() => {
    fetchItems();
  }, []);

  async function fetchItems() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${SUPABASE_URL}/rest/v1/digest_items?select=*&order=created_at.desc&limit=200`,
        {
          headers: {
            apikey: SUPABASE_ANON_KEY,
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error(`API error: ${res.status}`);
      const data = await res.json();
      // Filter out junk rows
      const clean = data.filter(
        (d) =>
          d.headline &&
          d.headline !== "test title" &&
          d.summary &&
          d.summary !== "test summary"
      );
      setItems(clean);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  const filtered = useMemo(() => {
    let list = activeTrack === "all" ? items : items.filter((i) => i.track === activeTrack);
    if (sortBy === "relevance") {
      list = [...list].sort((a, b) => (b.relevance_score || 0) - (a.relevance_score || 0));
    }
    return list;
  }, [items, activeTrack, sortBy]);

  const trackCounts = useMemo(() => {
    const counts = { all: items.length };
    TRACKS.forEach((t) => {
      if (t.id !== "all") counts[t.id] = items.filter((i) => i.track === t.id).length;
    });
    return counts;
  }, [items]);

  // Stats
  const avgRelevance = items.length > 0
    ? (items.reduce((s, i) => s + (i.relevance_score || 0), 0) / items.length).toFixed(1)
    : "—";
  const todayCount = items.filter((i) => {
    const d = new Date(i.created_at);
    const now = new Date();
    return d.toDateString() === now.toDateString();
  }).length;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#F0EDE6",
      fontFamily: "'DM Sans', -apple-system, sans-serif",
    }}>
      <link href="https://fonts.googleapis.com/css2?family=Newsreader:opsz,wght@6..72,400;6..72,600;6..72,700&family=DM+Sans:wght@400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet" />

      {/* Header */}
      <div style={{
        background: "#1A1A18",
        padding: "28px 32px 24px",
        borderBottom: "3px solid #98C379",
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: "0.12em", textTransform: "uppercase", color: "#98C379", marginBottom: 4, fontFamily: "'DM Mono', monospace" }}>
                Second Brain
              </div>
              <h1 style={{ fontSize: 28, fontWeight: 700, color: "#FAFAF7", margin: 0, fontFamily: "'Newsreader', Georgia, serif" }}>
                Daily Digest
              </h1>
            </div>
            <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FAFAF7", fontFamily: "'DM Mono', monospace" }}>{todayCount}</div>
                <div style={{ fontSize: 10, color: "#8A8A80", textTransform: "uppercase", letterSpacing: "0.08em" }}>Today</div>
              </div>
              <div style={{ width: 1, height: 32, background: "#333" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FAFAF7", fontFamily: "'DM Mono', monospace" }}>{items.length}</div>
                <div style={{ fontSize: 10, color: "#8A8A80", textTransform: "uppercase", letterSpacing: "0.08em" }}>Total</div>
              </div>
              <div style={{ width: 1, height: 32, background: "#333" }} />
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: 22, fontWeight: 700, color: "#FAFAF7", fontFamily: "'DM Mono', monospace" }}>{avgRelevance}</div>
                <div style={{ fontSize: 10, color: "#8A8A80", textTransform: "uppercase", letterSpacing: "0.08em" }}>Avg Score</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div style={{
        background: "#FAFAF7",
        borderBottom: "1px solid #E8E4DE",
        padding: "14px 32px",
        position: "sticky",
        top: 0,
        zIndex: 10,
      }}>
        <div style={{ maxWidth: 960, margin: "0 auto", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", gap: 6 }}>
            {TRACKS.map((track) => (
              <button
                key={track.id}
                onClick={() => setActiveTrack(track.id)}
                style={{
                  padding: "6px 14px",
                  borderRadius: 6,
                  border: activeTrack === track.id ? `2px solid ${track.id === "all" ? "#1A1A18" : track.color}` : "2px solid transparent",
                  background: activeTrack === track.id ? (track.id === "all" ? "#1A1A18" : track.color + "18") : "transparent",
                  color: activeTrack === track.id ? (track.id === "all" ? "#FAFAF7" : track.color) : "#8A8A80",
                  fontSize: 12,
                  fontWeight: 600,
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {track.label}
                <span style={{ marginLeft: 5, opacity: 0.6, fontSize: 11, fontFamily: "'DM Mono', monospace" }}>
                  {trackCounts[track.id] || 0}
                </span>
              </button>
            ))}
          </div>

          <div style={{ display: "flex", gap: 4, alignItems: "center" }}>
            <span style={{ fontSize: 11, color: "#B0B0A8", marginRight: 4 }}>Sort:</span>
            {[
              { id: "date", label: "Latest" },
              { id: "relevance", label: "Relevance" },
            ].map((s) => (
              <button
                key={s.id}
                onClick={() => setSortBy(s.id)}
                style={{
                  padding: "4px 10px",
                  borderRadius: 4,
                  border: "none",
                  background: sortBy === s.id ? "#1A1A18" : "transparent",
                  color: sortBy === s.id ? "#FAFAF7" : "#8A8A80",
                  fontSize: 11,
                  fontWeight: 600,
                  cursor: "pointer",
                  fontFamily: "'DM Sans', sans-serif",
                }}
              >
                {s.label}
              </button>
            ))}
            <button
              onClick={fetchItems}
              style={{
                marginLeft: 8,
                padding: "4px 10px",
                borderRadius: 4,
                border: "1px solid #E8E4DE",
                background: "transparent",
                color: "#8A8A80",
                fontSize: 11,
                fontWeight: 600,
                cursor: "pointer",
                fontFamily: "'DM Sans', sans-serif",
              }}
            >
              ↻ Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ maxWidth: 960, margin: "0 auto", padding: "24px 32px 60px" }}>
        {loading && (
          <div style={{ textAlign: "center", padding: 60, color: "#8A8A80" }}>
            Loading digest...
          </div>
        )}

        {error && (
          <div style={{
            background: "#FFF5F5",
            border: "1px solid #FFCCCC",
            borderRadius: 8,
            padding: 16,
            color: "#BC4749",
            fontSize: 14,
            marginBottom: 20,
          }}>
            Failed to load: {error}. Check your Supabase anon key.
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: "center", padding: 60, color: "#8A8A80" }}>
            No items found for this track.
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {filtered.map((item) => (
            <DigestCard
              key={item.id}
              item={item}
              expanded={expandedId === item.id}
              onExpand={(id) => setExpandedId(expandedId === id ? null : id)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
