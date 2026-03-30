import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
}

interface SearchRequest {
  query: string
  type: "all" | "news" | "images" | "videos" | "music"
  limit?: number
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { query, type, limit = 10 }: SearchRequest =
      await req.json()

    if (!query) {
      return new Response(
        JSON.stringify({ error: "Query is required" }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      )
    }

    let results: any[] = []

    switch (type) {
      case "news":
        results = await searchNews(query, limit)
        break

      case "images":
        results = await searchImages(query, limit)
        break

      case "videos":
        results = await searchVideos(query, limit)
        break

      case "music":
        results = await searchMusic(query, limit)
        break

      default:
        const [news, images, videos] = await Promise.all([
          searchNews(query, 3),
          searchImages(query, 3),
          searchVideos(query, 3),
        ])

        results = [
          ...news.map((x) => ({ ...x, type: "news" })),
          ...images.map((x) => ({ ...x, type: "image" })),
          ...videos.map((x) => ({ ...x, type: "video" })),
        ]
    }

    return new Response(
      JSON.stringify({
        results,
        total: results.length,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  } catch (error) {
    console.error(error)

    return new Response(
      JSON.stringify({
        error: "Internal server error",
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    )
  }
})

/* ---------------- NEWS ---------------- */

async function searchNews(query: string, limit: number) {
  try {
    const res = await fetch(
      `https://nexus-search.onrender.com/api/searchNews?query=${encodeURIComponent(
        query
      )}&limit=${limit}`
    )

    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

/* ---------------- IMAGES ---------------- */

async function searchImages(query: string, limit: number) {
  try {
    const res = await fetch(
      `https://nexus-search.onrender.com/api/searchImages?query=${encodeURIComponent(
        query
      )}&limit=${limit}`
    )

    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

/* ---------------- VIDEOS ---------------- */

async function searchVideos(query: string, limit: number) {
  try {
    const res = await fetch(
      `https://nexus-search.onrender.com/api/youtube/search?query=${encodeURIComponent(
        query
      )}&limit=${limit}`
    )

    const data = await res.json()
    return data.results || []
  } catch {
    return []
  }
}

/* ---------------- MUSIC (Gemini) ---------------- */

async function searchMusic(query: string, limit: number) {
  const GEMINI_API_KEY = Deno.env.get("GEMINI_API_KEY")

  if (!GEMINI_API_KEY) {
    throw new Error("Missing GEMINI_API_KEY")
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: `Search for ${limit} songs related to "${query}".
Return JSON array:
[
 { "id":"1","title":"song","artist":"artist","album":"album",
   "url":"link","thumbnail":"img",
   "source":"Spotify",
   "duration":"3:20",
   "releaseDate":"2024-01-01"
 }
]`,
                },
              ],
            },
          ],
        }),
      }
    )

    if (!res.ok) {
      throw new Error("Gemini failed")
    }

    const data = await res.json()

    const text =
      data.candidates?.[0]?.content?.parts?.[0]?.text

    if (!text) return []

    const match = text.match(/\[.*\]/s)

    if (!match) return []

    return JSON.parse(match[0])
  } catch (err) {
    console.error("music error", err)
    return []
  }
}