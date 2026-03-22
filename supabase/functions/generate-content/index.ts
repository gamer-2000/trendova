import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { topic, type } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    const systemPrompt = `You are a viral content strategist for YouTube and Instagram creators. You generate highly engaging, trend-aware content ideas. Always respond with valid JSON only, no markdown wrapping.`;

    let userPrompt = "";

    if (type === "youtube") {
      userPrompt = `Topic: "${topic}"

Generate content for YouTube creators. Return JSON with this exact structure:
{
  "videoIdeas": [{"title": "...", "description": "...", "viralScore": 85}] (5 ideas, viralScore 60-98),
  "script": {"hook": "...", "intro": "...", "mainContent": "...", "outro": "..."},
  "titles": ["title1", "title2", "title3", "title4", "title5"],
  "thumbnailIdeas": ["idea1", "idea2", "idea3"],
  "seoDescription": "..."
}`;
    } else if (type === "instagram") {
      userPrompt = `Topic: "${topic}"

Generate Instagram content. Return JSON with this exact structure:
{
  "caption": "...",
  "hashtags": ["tag1", "tag2", ...] (15 trending hashtags without #)
}`;
    } else {
      userPrompt = `Topic: "${topic}"

Generate short-form video ideas for Reels/Shorts. Return JSON with this exact structure:
{
  "shortFormIdeas": [{"title": "...", "concept": "...", "hook": "...", "viralScore": 85}] (3 ideas, viralScore 60-98)
}`;
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limited. Please try again in a moment." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted." }), {
          status: 402,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      throw new Error("AI gateway error");
    }

    const data = await response.json();
    const raw = data.choices?.[0]?.message?.content || "";
    
    // Parse JSON from the response, handling potential markdown code blocks
    let parsed;
    try {
      const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
      parsed = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", raw);
      throw new Error("Failed to parse AI response");
    }

    return new Response(JSON.stringify(parsed), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
