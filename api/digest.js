import {
  getSupabase,
  getTodaysDigestItems,
  formatMemNote,
  pushToMem,
  formatDigestEmail,
} from "../lib/helpers.js";

export default async function handler(req, res) {
  // Verify cron secret (prevents unauthorized triggers)
  const authHeader = req.headers["authorization"];
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    const supabase = getSupabase();

    // 1. Fetch today's clean digest items from Supabase
    const items = await getTodaysDigestItems(supabase);

    if (items.length === 0) {
      console.log("No new digest items found for today.");
      return res.status(200).json({
        status: "ok",
        message: "No new items to process",
        itemsProcessed: 0,
      });
    }

    console.log(`Found ${items.length} digest items to process.`);

    // 2. Push each item to Mem as a formatted note
    const memResults = [];
    const memErrors = [];

    for (const item of items) {
      try {
        const { title, content } = formatMemNote(item);
        await pushToMem(title, content);
        memResults.push({ id: item.id, headline: item.headline, status: "ok" });

        // Small delay to avoid rate limiting
        await new Promise((r) => setTimeout(r, 500));
      } catch (err) {
        console.error(`Mem push failed for item ${item.id}:`, err.message);
        memErrors.push({ id: item.id, headline: item.headline, error: err.message });
      }
    }

    // 3. Mark items as synced in Supabase
    const syncedIds = memResults.map((r) => r.id);
    if (syncedIds.length > 0) {
      await supabase
        .from("digest_items")
        .update({ synced_to_mem: true, synced_at: new Date().toISOString() })
        .in("id", syncedIds);
    }

    // 4. Generate digest summary
    const digest = formatDigestEmail(items);

    // 5. Return results
    return res.status(200).json({
      status: "ok",
      itemsFound: items.length,
      memSynced: memResults.length,
      memErrors: memErrors.length,
      errors: memErrors,
      digestSubject: digest.subject,
      digestHtml: digest.html,
    });
  } catch (err) {
    console.error("Digest function failed:", err);
    return res.status(500).json({
      status: "error",
      message: err.message,
    });
  }
}
