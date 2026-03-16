import { createClient } from "@supabase/supabase-js";

// --- Supabase ---
export function getSupabase() {
  return createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY
  );
}

// --- Fetch today's digest items from Supabase ---
export async function getTodaysDigestItems(supabase) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayISO = today.toISOString();

  const { data, error } = await supabase
    .from("digest_items")
    .select("*")
    .gte("created_at", todayISO)
    .neq("title", "test title")
    .neq("summary", "test summary")
    .not("title", "is", null)
    .order("relevance_score", { ascending: false });

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  return data || [];
}

// --- Format a single digest item as Mem markdown ---
export function formatMemNote(item) {
  const headline = item.title || item.headline || "Untitled";
  const source = item.source_name || "Unknown";
  const track = item.track || "general";
  const category = item.category || "uncategorized";
  const sourceType = item.source_type || "unknown";
  const relevance = item.relevance_score || "?";
  const readTime = item.read_time_minutes || "?";
  const summary = item.summary || "No summary available.";

  // Parse JSON fields if they're strings
  const keyInsights = parseArrayField(item.key_insights);
  const actionItems = parseArrayField(item.action_items);
  const tags = parseArrayField(item.tags);

  let note = `# ${headline}\n\n`;
  note += `**Source:** ${source} | **Track:** ${track} | **Category:** ${category}\n`;
  note += `**Type:** ${sourceType} | **Relevance:** ${relevance}/5 | **Read time:** ${readTime} min\n\n`;
  note += `---\n\n`;
  note += `## Summary\n\n${summary}\n\n`;

  if (keyInsights.length > 0) {
    note += `## Key Insights\n\n`;
    keyInsights.forEach((insight) => {
      note += `- ${insight}\n`;
    });
    note += `\n`;
  }

  if (actionItems.length > 0) {
    note += `## Action Items\n\n`;
    actionItems.forEach((item) => {
      note += `- ${item}\n`;
    });
    note += `\n`;
  }

  note += `---\n\n`;
  note += `#second-brain #track-${track} #${category}`;

  if (tags.length > 0) {
    tags.forEach((tag) => {
      note += ` #${tag}`;
    });
  }

  return { title: headline, content: note };
}

// --- Push a note to Mem ---
export async function pushToMem(title, content) {
  const res = await fetch("https://api.mem.ai/v2/notes", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.MEM_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ content }),
  });

  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Mem API error (${res.status}): ${body}`);
  }

  return res.json();
}

// --- Format a daily digest email body ---
export function formatDigestEmail(items) {
  if (items.length === 0) {
    return {
      subject: "Second Brain Digest — No new items today",
      html: "<p>No new digest items were processed today. Check your Make pipeline.</p>",
    };
  }

  const date = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  let html = `<div style="font-family: -apple-system, system-ui, sans-serif; max-width: 640px; margin: 0 auto; padding: 20px;">`;
  html += `<h1 style="font-size: 24px; margin-bottom: 4px;">Second Brain Digest</h1>`;
  html += `<p style="color: #666; margin-top: 0;">${date} — ${items.length} items processed</p>`;
  html += `<hr style="border: none; border-top: 2px solid #111; margin: 20px 0;">`;

  // Group by track
  const byTrack = {};
  items.forEach((item) => {
    const track = item.track || "general";
    if (!byTrack[track]) byTrack[track] = [];
    byTrack[track].push(item);
  });

  for (const [track, trackItems] of Object.entries(byTrack)) {
    html += `<h2 style="font-size: 16px; text-transform: uppercase; letter-spacing: 1px; color: #888; margin-top: 28px;">${track}</h2>`;

    trackItems.forEach((item) => {
      const headline = item.title || item.headline || "Untitled";
      const summary = item.summary || "";
      const relevance = item.relevance_score || "?";
      const source = item.source_name || "";

      html += `<div style="margin-bottom: 20px; padding: 16px; background: #f9f9f9; border-radius: 8px;">`;
      html += `<h3 style="margin: 0 0 6px 0; font-size: 17px;">${headline}</h3>`;
      html += `<p style="margin: 0 0 8px 0; font-size: 13px; color: #888;">${source} · Relevance: ${relevance}/5</p>`;
      html += `<p style="margin: 0; font-size: 15px; line-height: 1.5; color: #333;">${summary}</p>`;
      html += `</div>`;
    });
  }

  html += `</div>`;

  return {
    subject: `Second Brain Digest — ${date} (${items.length} items)`,
    html,
  };
}

// --- Helpers ---
function parseArrayField(field) {
  if (!field) return [];
  if (Array.isArray(field)) return field;
  if (typeof field === "string") {
    try {
      const parsed = JSON.parse(field);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }
  return [];
}
