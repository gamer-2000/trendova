import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

serve(async (req) => {

  try {

    const { topic, type } = await req.json();

    // simple AI-like mock content
    // (we can connect real AI later)

    let result;

    if (type === "youtube") {

      result = {
        titles: [
          `10 Things You Must Know About ${topic}`,
          `${topic} Secrets Nobody Talks About`,
          `How ${topic} Can Change Your Life`
        ],

        script: {
          hook: `What if ${topic} could completely change your results?`,
          intro: `In this video we explore ${topic} and why it matters.`,
          mainContent: `${topic} is becoming extremely popular. Many creators are using ${topic} to grow faster online.`,
          outro: `If you found this helpful, subscribe for more content about ${topic}.`
        },

        seoDescription: `Learn everything about ${topic}. Tips, ideas and strategies to grow faster.`
      };

    }


    if (type === "instagram") {

      result = {
        caption: `${topic} is trending right now 🚀\n\nCreators are using this strategy to grow faster.\n\nTry this today.`,

        hashtags: [
          topic.replaceAll(" ", ""),
          "viral",
          "contentcreator",
          "growth",
          "trending"
        ]
      };

    }


    if (type === "shorts") {

      result = {
        shortFormIdeas: [
          {
            title: `${topic} in 30 seconds`,
            concept: `Quick explanation of ${topic}`,
            hook: `You NEED to know this about ${topic}`
          },

          {
            title: `${topic} mistake`,
            concept: `Common mistake people make in ${topic}`,
            hook: `Stop doing this in ${topic}`
          }
        ]
      };

    }

    return new Response(
      JSON.stringify(result),
      { headers: { "Content-Type": "application/json" } }
    );

  } catch (error) {

    return new Response(
      JSON.stringify({ error: "failed" }),
      { status: 500 }
    );

  }

});
