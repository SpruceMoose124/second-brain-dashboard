import {
  getSupabase,
  getTodaysDigestItems,
  formatMemNote,
  formatDigestEmail,
} from "../lib/helpers.js";

// Test endpoint — shows what WOULD be processed without pushing to Mem
// Hit /api/test-digest in browser to preview
export default async function handler(req, res) {
  try {
    const supabase = getSupabase();
    const items = await getTodaysDigestItems(supabase);

    const formattedNotes = items.map((item) => {
      const { title, content } = formatMemNote(item);
      return { id: item.id, title, content };
    });

    const digest = formatDigestEmail(items);

    // Return HTML preview if accessed from browser
    if (req.headers.accept?.includes("text/html")) {
      return res
        .status(200)
        .setHeader("Content-Type", "text/html")
        .send(`
          <html>
          <head><title>Digest Preview</title></head>
          <body style="font-family: sans-serif; max-width: 800px; margin: 40px auto; padding: 20px;">
            <h1>Digest Preview — ${items.length} items</h1>
            <p>This is a dry run. Nothing was pushed to Mem.</p>
            <hr>
            <h2>Email Preview</h2>
            ${digest.html}
            <hr>
            <h2>Mem Notes Preview</h2>
            ${formattedNotes
              .map(
                (n) =>
                  `<div style="background: #f5f5f5; padding: 16px; margin: 12px 0; border-radius: 8px; white-space: pre-wrap; font-family: monospace; font-size: 13px;">${n.content}</div>`
              )
              .join("")}
          </body>
          </html>
        `);
    }

    return res.status(200).json({
      status: "preview",
      itemsFound: items.length,
      notes: formattedNotes,
      digest,
    });
  } catch (err) {
    console.error("Test digest failed:", err);
    return res.status(500).json({ error: err.message });
  }
}
