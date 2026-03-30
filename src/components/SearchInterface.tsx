import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Search, FileText, Newspaper, Image, Video, Music, Sparkles, Clock, User, ExternalLink, Play, Headphones, BookOpen, Globe } from "lucide-react";

export interface SearchResult {
  id: string;
  type: 'ai' | 'wikipedia' | 'google' | 'dictionary' | 'news' | 'images' | 'videos' | 'music';
  title: string;
  description: string;
  source: string;
  url: string;
  publishedAt?: string;
  duration?: string;
  views?: number;
  thumbnail?: string;
  aspectRatio?: string;
}

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// ── Simple Markdown Renderer ──────────────────────────────────────────────────
const MarkdownRenderer = ({ content, className = "" }: { content: string; className?: string }) => {
  const renderInline = (text: string): React.ReactNode[] => {
    const parts: React.ReactNode[] = [];
    // Match **bold**, *italic*, and plain text
    const regex = /(\*\*(.+?)\*\*|\*(.+?)\*)/g;
    let lastIndex = 0;
    let match;
    let key = 0;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.slice(lastIndex, match.index));
      }
      if (match[2] !== undefined) {
        parts.push(<strong key={key++} className="font-semibold">{match[2]}</strong>);
      } else if (match[3] !== undefined) {
        parts.push(<em key={key++}>{match[3]}</em>);
      }
      lastIndex = regex.lastIndex;
    }
    if (lastIndex < text.length) {
      parts.push(text.slice(lastIndex));
    }
    return parts;
  };

  const renderBlocks = (raw: string): React.ReactNode[] => {
    const lines = raw.split("\n");
    const nodes: React.ReactNode[] = [];
    let listBuffer: string[] = [];
    let keyCounter = 0;

    const flushList = () => {
      if (listBuffer.length === 0) return;
      nodes.push(
        <ul key={`ul-${keyCounter++}`} className="list-disc list-inside space-y-1 my-2 pl-1">
          {listBuffer.map((item, i) => (
            <li key={i} className="leading-relaxed">{renderInline(item)}</li>
          ))}
        </ul>
      );
      listBuffer = [];
    };

    for (const line of lines) {
      const trimmed = line.trim();

      if (!trimmed) {
        flushList();
        continue;
      }

      // ### Heading
      if (trimmed.startsWith("### ")) {
        flushList();
        nodes.push(
          <h3 key={keyCounter++} className="text-base font-bold mt-4 mb-1 uppercase tracking-wide opacity-90">
            {trimmed.slice(4)}
          </h3>
        );
        continue;
      }

      // ## Heading
      if (trimmed.startsWith("## ")) {
        flushList();
        nodes.push(
          <h2 key={keyCounter++} className="text-lg font-bold mt-4 mb-2 opacity-90">
            {trimmed.slice(3)}
          </h2>
        );
        continue;
      }

      // # Heading
      if (trimmed.startsWith("# ")) {
        flushList();
        nodes.push(
          <h1 key={keyCounter++} className="text-xl font-bold mt-4 mb-2 opacity-90">
            {trimmed.slice(2)}
          </h1>
        );
        continue;
      }

      // Bullet: "* item" or "- item"
      if (/^[\*\-] /.test(trimmed)) {
        listBuffer.push(trimmed.slice(2));
        continue;
      }

      // Plain paragraph
      flushList();
      nodes.push(
        <p key={keyCounter++} className="leading-relaxed my-1">
          {renderInline(trimmed)}
        </p>
      );
    }

    flushList();
    return nodes;
  };

  return <div className={className}>{renderBlocks(content)}</div>;
};
// ─────────────────────────────────────────────────────────────────────────────

const SearchInterface = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const [activeTab, setActiveTab] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [thinkSearchAI, setThinkSearchAI] = useState("");
  const [inputMeanAI, setInputMeanAI] = useState("");
  
  const callGeminiProxy = async (
    prompt: string,
    options?: { temperature?: number; maxOutputTokens?: number }
  ) => {
    const response = await fetch(`${API_BASE_URL}/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        prompt,
        temperature: options?.temperature,
        maxOutputTokens: options?.maxOutputTokens,
      }),
    });

    if (!response.ok) {
      const errorBody = await response.json().catch(() => ({}));
      throw new Error(errorBody?.error || `Gemini proxy error: ${response.status}`);
    }

    const data = await response.json();
    return data.text as string;
  };

  const generateThinkSearchAI = async (query: string, allResults: SearchResult[]) => {
    try {
      const contentToAnalyze = allResults
        .filter(result => result.type !== 'ai')
        .map(result => `${result.title}: ${result.description}`)
        .join('\n\n');

      if (!contentToAnalyze) {
        return `No supporting sources yet for "${query}".`;
      }

      const prompt = `Search Query: "${query}"

Review the full information below and provide a professional, structured summary organized by distinct themes. Each section should capture key points clearly, avoid repetition, and group related facts under concise headings. Do not include any introductory or closing text. Just return the summary.

SOURCE DATA:
${contentToAnalyze}`;

      return await callGeminiProxy(prompt, { temperature: 0.35, maxOutputTokens: 1024 });
    } catch (error) {
      console.error("Error generating ThinkSearch AI:", error);
      return `Analyzing ${allResults.length} sources for "${query}" to provide summary...`;
    }
  };

  const generateInputMeanAI = async (query: string) => {
    try {
      const prompt = `Provide a concise 2-3 sentence general explanation or definition about "${query}". This should be a basic AI-generated answer explaining what the search term means, without referencing specific search results. Focus on general knowledge and fundamental concepts.`;

      return await callGeminiProxy(prompt, { temperature: 0.2, maxOutputTokens: 256 });
    } catch (error) {
      console.error("Error generating Input Mean AI:", error);
      return `AI-powered explanation about "${query}" based on general knowledge.`;
    }
  };

  const performSearch = async (query: string) => {
    setIsLoading(true);
    setResults([]);
    setThinkSearchAI("");
    setInputMeanAI("");

    try {
      let allResults: SearchResult[] = [];
      
      const inputMeanAnswer = await generateInputMeanAI(query);
      setInputMeanAI(inputMeanAnswer);

      allResults.push({
        id: 'input-mean',
        type: 'ai',
        title: `Input Mean: ${query}`,
        description: inputMeanAnswer,
        source: 'AI Knowledge',
        url: '#'
      });

      try {
        const wikiResponse = await fetch(
          `https://nexus-search.onrender.com/api/searchWikipedia?query=${encodeURIComponent(query)}`
        );
        if (wikiResponse.ok) {
          const wikiData = await wikiResponse.json();
          if (wikiData && typeof wikiData === "object") {
            allResults.push({
              id: `wiki-${wikiData.pageid || "unknown"}`,
              type: 'wikipedia',
              title: wikiData.title || "No title",
              description: wikiData.extract || "No description available",
              source: "Wikipedia",
              url: wikiData.page_url || "#",
              thumbnail: wikiData.thumbnail || null,
            });
          }
        }
      } catch (error) { console.error("Error fetching Wikipedia:", error); }

      try {
        const googleResponse = await fetch(
          `https://nexus-search.onrender.com/api/fetchgoogleSearchResults?query=${encodeURIComponent(query)}`
        );
        if (googleResponse.ok) {
          const googleData = await googleResponse.json();
          if (Array.isArray(googleData)) {
            const googleResults: SearchResult[] = googleData.slice(0, 5).map((item: any, index: number) => ({
              id: `google-${index}`,
              type: 'google',
              title: item.title || 'No title',
              description: item.snippet || 'No description available',
              source: item.link ? new URL(item.link).hostname : 'Unknown source',
              url: item.link || '#',
            }));
            allResults = [...allResults, ...googleResults];
          }
        }
      } catch (error) { console.error("Error fetching Google:", error); }

      try {
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(query)}`);
        if (response.ok) {
          const dictionaryData = await response.json();
          if (Array.isArray(dictionaryData)) {
            const dictionaryResults: SearchResult[] = dictionaryData.map((entry: any, index: number) => {
              const firstMeaning = entry.meanings?.[0];
              const firstDefinition = firstMeaning?.definitions?.[0];
              return {
                id: `dictionary-${index}`,
                type: 'dictionary',
                title: entry.word || 'No word',
                description: firstDefinition?.definition || 'No definition available',
                source: 'Dictionary API',
                url: `https://en.wiktionary.org/wiki/${encodeURIComponent(entry.word)}`,
              };
            });
            allResults = [...allResults, ...dictionaryResults];
          }
        }
      } catch (error) { console.error("Error fetching dictionary:", error); }

      try {
        const newsResponse = await fetch(`https://nexus-search.onrender.com/api/searchNews?query=${encodeURIComponent(query)}`);
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          if (Array.isArray(newsData)) {
            const newsResults: SearchResult[] = newsData.slice(0, 8).map((article: any, index: number) => ({
              id: `news-${index}`,
              type: 'news',
              title: article.title || 'No title',
              description: article.description || 'No description available',
              source: article.source?.name || 'Unknown source',
              url: article.url || '#',
              publishedAt: article.publishedAt,
              thumbnail: article.urlToImage
            }));
            allResults = [...allResults, ...newsResults];
          }
        }
      } catch (error) { console.error("Error fetching news:", error); }

      try {
        const imagesResponse = await fetch(`https://nexus-search.onrender.com/api/searchImages?query=${encodeURIComponent(query)}`);
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          if (Array.isArray(imagesData)) {
            const imageResults: SearchResult[] = imagesData.slice(0, 12).map((image: any, index: number) => ({
              id: `image-${index}`,
              type: 'images',
              title: `Image ${index + 1}`,
              description: image.tags || '',
              source: 'Pixabay',
              url: image.link || '#',
              thumbnail: image.thumbnail || image.link,
              aspectRatio: image.imageWidth && image.imageHeight ? 
                (image.imageWidth / image.imageHeight).toFixed(2) : '1.33'
            }));
            allResults = [...allResults, ...imageResults];
          }
        }
      } catch (error) { console.error("Error fetching images:", error); }

      try {
        const videosResponse = await fetch(`https://nexus-search.onrender.com/api/youtube/search?query=${encodeURIComponent(query)}`);
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          if (Array.isArray(videosData)) {
            const videoResults: SearchResult[] = videosData.slice(0, 6).map((item: any, index: number) => ({
              id: `video-${index}`,
              type: 'videos',
              title: item.title || 'No title',
              description: item.description || 'No description available',
              source: 'YouTube',
              url: item.link || '#',
              thumbnail: item.thumbnail,
              duration: item.duration,
              views: item.views
            }));
            allResults = [...allResults, ...videoResults];
          }
        }
      } catch (error) { console.error("Error fetching videos:", error); }

      try {
        const musicResponse = await fetch(`https://nexus-search.onrender.com/api/searchSong?query=${encodeURIComponent(query)}`);
        if (musicResponse.ok) {
          const musicData = await musicResponse.json();
          if (Array.isArray(musicData.tracks)) {
            const musicResults: SearchResult[] = musicData.tracks.slice(0, 8).map((track: any, index: number) => {
              const durationMs = track.duration || 0;
              const minutes = Math.floor(durationMs / 60000);
              const seconds = Math.floor((durationMs % 60000) / 1000);
              const formattedDuration = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              return {
                id: `music-${index}`,
                type: 'music',
                title: track.title || 'Unknown Title',
                description: `${track.artists || 'Unknown Artist'} • ${track.album || 'Unknown Album'}`,
                source: 'Spotify',
                url: track.external_urls || '#',
                duration: formattedDuration,
                thumbnail: track.images?.[0]?.url || undefined
              };
            });
            allResults = [...allResults, ...musicResults];
          }
        }
      } catch (error) { console.error("Error fetching music:", error); }

      setResults(allResults);

      if (allResults.length > 1) {
        const thinkSearchAnswer = await generateThinkSearchAI(query, allResults);
        setThinkSearchAI(thinkSearchAnswer);
      }

    } catch (error) {
      console.error("Search error:", error);
      setThinkSearchAI("An error occurred during search analysis. Please try again.");
      setInputMeanAI("Unable to generate AI explanation at this time.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    await performSearch(searchQuery);
  };

  const filteredResults = results.filter(result => {
    if (activeTab === 'all') return true;
    return result.type === activeTab;
  });

  const renderResultsByCategory = () => {
    const categoryResults = activeTab === 'all' ? 
      filteredResults.filter(r => r.type !== 'ai') : 
      filteredResults;
    
    switch (activeTab) {
      case 'all':
        return (
          <div className="space-y-6">
            {/* ThinkSearch AI Section — now renders markdown properly */}
            {thinkSearchAI && (
              <Card className="bg-gradient-to-r from-blue-500 to-purple-600 text-white border-0 shadow-xl">
                <CardHeader>
                  <div className="flex items-center space-x-3">
                    <div className="animate-pulse">
                      <Sparkles className="h-6 w-6" />
                    </div>
                    <div>
                      <CardTitle className="flex items-center space-x-2">
                        <span>ThinkSearch AI</span>
                        <Badge variant="secondary" className="bg-white/20 text-white">
                          Intelligent Summary
                        </Badge>
                      </CardTitle>
                      <CardDescription className="text-blue-100">
                        Fragmenting and synthesizing information from all sources...
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <MarkdownRenderer
                    content={thinkSearchAI}
                    className="text-white text-base [&_h1]:text-white [&_h2]:text-white [&_h3]:text-blue-100 [&_strong]:text-white [&_li]:text-white/90"
                  />
                </CardContent>
              </Card>
            )}

            {/* Input Mean Section */}
            {inputMeanAI && (
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
                <CardHeader>
                  <div className="flex items-center space-x-2 mb-2">
                    <Sparkles className="h-5 w-5 text-green-600" />
                    <CardTitle className="text-lg">Input Mean:</CardTitle>
                  </div>
                  <CardDescription className="text-base leading-relaxed text-gray-700">
                    <MarkdownRenderer content={inputMeanAI} />
                  </CardDescription>
                </CardHeader>
              </Card>
            )}
            
            {categoryResults.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        );

      case 'images':
        return (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryResults.map((result) => (
              <div key={result.id} className="group cursor-pointer">
                <div className="aspect-square overflow-hidden rounded-lg bg-muted">
                  <img 
                    src={result.thumbnail} 
                    alt={result.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                  />
                </div>
                <p className="mt-2 text-sm text-muted-foreground truncate">{result.title}</p>
              </div>
            ))}
          </div>
        );

      case 'videos':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {categoryResults.map((result) => (
              <div key={result.id} className="group cursor-pointer">
                <div className="relative aspect-video overflow-hidden rounded-lg bg-muted">
                  <img src={result.thumbnail} alt={result.title} className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center">
                    <Play className="h-12 w-12 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-200" fill="white" />
                  </div>
                  {result.duration && (
                    <Badge className="absolute bottom-2 right-2 bg-black bg-opacity-75 text-white">
                      {result.duration}
                    </Badge>
                  )}
                </div>
                <div className="mt-3 space-y-1">
                  <h3 className="font-semibold line-clamp-2 group-hover:text-primary transition-colors">{result.title}</h3>
                  <p className="text-sm text-muted-foreground">{result.source}</p>
                  {result.views && <p className="text-xs text-muted-foreground">{result.views.toLocaleString()} views</p>}
                </div>
              </div>
            ))}
          </div>
        );

      case 'music':
        return (
          <div className="space-y-3">
            {categoryResults.map((result) => (
              <div key={result.id} className="flex items-center space-x-4 p-4 rounded-lg border hover:bg-muted/50 transition-colors group cursor-pointer">
                <div className="relative">
                  <img src={result.thumbnail} alt={result.title} className="w-16 h-16 rounded object-cover" />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-20 transition-all duration-200 flex items-center justify-center rounded">
                    <Play className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transform scale-50 group-hover:scale-100 transition-all duration-200" fill="white" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate group-hover:text-primary transition-colors">{result.title}</h3>
                  <p className="text-sm text-muted-foreground truncate">{result.description}</p>
                </div>
                {result.duration && <Badge variant="secondary" className="flex-shrink-0">{result.duration}</Badge>}
              </div>
            ))}
          </div>
        );

      case 'news':
        return (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {categoryResults.map((result) => (
              <Card key={result.id} className="hover:shadow-lg transition-shadow cursor-pointer">
                <CardHeader className="p-4">
                  <div className="flex space-x-4">
                    {result.thumbnail && (
                      <img src={result.thumbnail} alt={result.title} className="w-20 h-20 object-cover rounded flex-shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-base line-clamp-2 mb-2">{result.title}</CardTitle>
                      <CardDescription className="text-sm line-clamp-2">{result.description}</CardDescription>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-muted-foreground">{result.source}</span>
                        {result.publishedAt && (
                          <span className="text-xs text-muted-foreground">
                            {new Date(result.publishedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        );

      default:
        return (
          <div className="space-y-6">
            {categoryResults.map((result) => (
              <SearchResultCard key={result.id} result={result} />
            ))}
          </div>
        );
    }
  };

  const SearchResultCard = ({ result }: { result: SearchResult }) => (
    <Card className="hover:shadow-lg transition-all duration-200 cursor-pointer">
      <CardHeader>
        <div className="flex justify-between items-start space-x-4">
          <div className="space-y-2 flex-1 min-w-0">
            <a href={result.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
              <CardTitle className="text-lg hover:text-primary transition-colors flex items-center gap-2">
                {result.title} <ExternalLink className="h-4 w-4" />
              </CardTitle>
            </a>
            <CardDescription className="text-base leading-relaxed line-clamp-2">
              {result.description}
            </CardDescription>
          </div>
          {result.thumbnail && (
            <div className="ml-4 flex-shrink-0">
              <img src={result.thumbnail} alt={result.title} className="w-24 h-24 object-cover rounded-lg" />
            </div>
          )}
        </div>
        <div className="flex items-center justify-between pt-4">
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <span className="font-medium">{result.source}</span>
            {result.publishedAt && (
              <div className="flex items-center space-x-1">
                <Clock className="h-4 w-4" />
                <span>{new Date(result.publishedAt).toLocaleDateString()}</span>
              </div>
            )}
            {result.duration && <span>{result.duration}</span>}
            {result.views && <span>{result.views.toLocaleString()} views</span>}
          </div>
          <Badge variant="secondary" className="capitalize">
            {result.type === 'ai' ? 'AI Answer' : result.type}
          </Badge>
        </div>
      </CardHeader>
    </Card>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 space-y-8 p-4">
      <div className="text-center space-y-4 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
          ThinkSearch
        </h1>
        <p className="text-muted-foreground text-lg">
          Intelligent multi-source search with dual AI-powered insights
        </p>
      </div>

      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search for anything... (e.g., 'artificial intelligence', 'quantum computing')"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-20 h-14 text-lg rounded-2xl border-2 focus:border-primary shadow-lg"
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
          />
          <Button
            onClick={handleSearch}
            disabled={!searchQuery.trim() || isLoading}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 rounded-xl px-6"
            size="lg"
          >
            {isLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
            ) : (
              <Search className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>

      {searchQuery && (
        <div className="max-w-7xl mx-auto">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 lg:grid-cols-8 mb-8 bg-muted/50 p-1 rounded-lg">
              <TabsTrigger value="all" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" /><span>All</span>
              </TabsTrigger>
              <TabsTrigger value="images" className="flex items-center space-x-2">
                <Image className="h-4 w-4" /><span>Images</span>
              </TabsTrigger>
              <TabsTrigger value="videos" className="flex items-center space-x-2">
                <Video className="h-4 w-4" /><span>Videos</span>
              </TabsTrigger>
              <TabsTrigger value="news" className="flex items-center space-x-2">
                <Newspaper className="h-4 w-4" /><span>News</span>
              </TabsTrigger>
              <TabsTrigger value="music" className="flex items-center space-x-2">
                <Headphones className="h-4 w-4" /><span>Music</span>
              </TabsTrigger>
              <TabsTrigger value="wikipedia" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" /><span>Wikipedia</span>
              </TabsTrigger>
              <TabsTrigger value="google" className="flex items-center space-x-2">
                <Globe className="h-4 w-4" /><span>Web</span>
              </TabsTrigger>
              <TabsTrigger value="dictionary" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" /><span>Dictionary</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-6">
              {isLoading ? (
                <div className="text-center py-16">
                  <div className="animate-spin h-12 w-12 border-4 border-primary border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-muted-foreground text-lg">
                    {activeTab === 'all' ? 'Searching across all sources...' : `Searching for ${activeTab}...`}
                  </p>
                </div>
              ) : filteredResults.length > 0 || thinkSearchAI || inputMeanAI ? (
                renderResultsByCategory()
              ) : (
                <div className="text-center py-16">
                  <div className="space-y-4">
                    <Search className="h-20 w-20 mx-auto text-muted-foreground opacity-50" />
                    <h3 className="text-2xl font-semibold text-muted-foreground">
                      No {activeTab === 'all' ? 'results' : activeTab} found
                    </h3>
                    <p className="text-muted-foreground max-w-md mx-auto">
                      No results found for "{searchQuery}". Try different keywords or check your spelling.
                    </p>
                  </div>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
    </div>
  );
};

export default SearchInterface;