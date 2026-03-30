import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

export interface SearchResult {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail?: string;
  source: string;
  type: 'blog' | 'news' | 'image' | 'video' | 'music';
  publishedAt?: string;
  author?: string;
  duration?: string;
  views?: number;
}

// Direct API search functions as fallback (NO secrets here — only public APIs)
const searchDirectAPIs = async (query: string, type: string): Promise<SearchResult[]> => {
  const results: SearchResult[] = [];

  try {
    switch (type) {
      case 'news': {
        const newsResponse = await fetch(
          `https://nexus-search.onrender.com/api/searchNews?query=${encodeURIComponent(query)}&limit=10`
        );
        if (newsResponse.ok) {
          const newsData = await newsResponse.json();
          const newsResults = (newsData.results || newsData || []).map((item: any) => ({
            id: `news-${item.id || Math.random()}`,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnail: item.thumbnail,
            source: item.source || 'News API',
            type: 'news' as const,
            publishedAt: item.publishedAt,
          }));
          results.push(...newsResults);
        }
        break;
      }

      case 'images': {
        const imagesResponse = await fetch(
          `https://nexus-search.onrender.com/api/searchImages?query=${encodeURIComponent(query)}&limit=10`
        );
        if (imagesResponse.ok) {
          const imagesData = await imagesResponse.json();
          const imageResults = (imagesData.results || imagesData || []).map((item: any) => ({
            id: `image-${item.id || Math.random()}`,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnail: item.thumbnail,
            source: item.source || 'Images API',
            type: 'image' as const,
          }));
          results.push(...imageResults);
        }
        break;
      }

      case 'videos': {
        const videosResponse = await fetch(
          `https://nexus-search.onrender.com/api/youtube/search?query=${encodeURIComponent(query)}&limit=10`
        );
        if (videosResponse.ok) {
          const videosData = await videosResponse.json();
          const videoResults = (videosData.results || videosData || []).map((item: any) => ({
            id: `video-${item.id || Math.random()}`,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnail: item.thumbnail,
            source: item.source || 'YouTube API',
            type: 'video' as const,
            duration: item.duration,
            views: item.views,
            publishedAt: item.publishedAt,
          }));
          results.push(...videoResults);
        }
        break;
      }

      // ✅ Music case removed from here entirely.
      // Music requires the Gemini API key which must NEVER be in frontend code.
      // It is handled securely by the 'search-external' Supabase Edge Function.

      case 'all': {
        const [newsRes, imagesRes, videosRes] = await Promise.all([
          fetch(`https://nexus-search.onrender.com/api/searchNews?query=${encodeURIComponent(query)}&limit=3`),
          fetch(`https://nexus-search.onrender.com/api/searchImages?query=${encodeURIComponent(query)}&limit=3`),
          fetch(`https://nexus-search.onrender.com/api/youtube/search?query=${encodeURIComponent(query)}&limit=3`),
        ]);

        if (newsRes.ok) {
          const newsData = await newsRes.json();
          const newsResults = (newsData.results || newsData || []).map((item: any) => ({
            id: `news-${item.id || Math.random()}`,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnail: item.thumbnail,
            source: item.source || 'News API',
            type: 'news' as const,
            publishedAt: item.publishedAt,
          }));
          results.push(...newsResults);
        }

        if (imagesRes.ok) {
          const imagesData = await imagesRes.json();
          const imageResults = (imagesData.results || imagesData || []).map((item: any) => ({
            id: `image-${item.id || Math.random()}`,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnail: item.thumbnail,
            source: item.source || 'Images API',
            type: 'image' as const,
          }));
          results.push(...imageResults);
        }

        if (videosRes.ok) {
          const videosData = await videosRes.json();
          const videoResults = (videosData.results || videosData || []).map((item: any) => ({
            id: `video-${item.id || Math.random()}`,
            title: item.title,
            description: item.description,
            url: item.url,
            thumbnail: item.thumbnail,
            source: item.source || 'YouTube API',
            type: 'video' as const,
            duration: item.duration,
            views: item.views,
            publishedAt: item.publishedAt,
          }));
          results.push(...videoResults);
        }
        break;
      }
    }
  } catch (error) {
    console.error('Direct API search error:', error);
  }

  return results;
};

export const useSearch = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  const search = async (
    query: string,
    type: 'all' | 'blogs' | 'news' | 'images' | 'videos' | 'music' = 'all'
  ): Promise<SearchResult[]> => {
    if (!query.trim()) return [];

    setIsLoading(true);
    setError(null);

    try {
      let results: SearchResult[] = [];

      // Search internal blogs
      if (type === 'all' || type === 'blogs') {
        try {
          const blogs = await apiClient.getBlogs(false, query);
          const limit = type === 'blogs' ? 20 : 5;
          const blogResults: SearchResult[] = blogs.slice(0, limit).map(blog => ({
            id: blog.id,
            title: blog.title,
            description: blog.excerpt || '',
            url: `/blog/${blog.slug}`,
            source: 'Think Search Blogs',
            type: 'blog' as const,
            publishedAt: blog.published_at || undefined,
            author: 'Blog Author',
          }));
          results = [...results, ...blogResults];
        } catch (blogError) {
          console.error('Blog search error:', blogError);
        }
      }

      // Search external content via Edge Function (handles all types including music securely)
      if (type !== 'blogs') {
        const searchType = type === 'all' ? 'all' : type;
        console.log('Searching external content:', { query, type: searchType });

        try {
          const { data: externalData, error: externalError } = await supabase.functions.invoke(
            'search-external',
            { body: { query, type: searchType } }
          );

          console.log('External search response:', { externalData, externalError });

          if (externalError) {
            console.error('External search error:', externalError);

            // ✅ Fallback to direct APIs for non-music types only
            // Music fallback is intentionally skipped — no safe way to call
            // Gemini from the frontend without exposing the API key
            if (searchType !== 'music') {
              const directResults = await searchDirectAPIs(query, searchType);
              results = [...results, ...directResults];
            } else {
              console.warn('Music search unavailable: Edge Function is required for secure Gemini API access.');
            }
          } else if (externalData?.results) {
            const externalResults: SearchResult[] = externalData.results.map((item: any) => ({
              id: item.id,
              title: item.title,
              description: item.description,
              url: item.url,
              thumbnail: item.thumbnail,
              source: item.source,
              type: item.type || type,
              publishedAt: item.publishedAt,
              duration: item.duration,
              views: item.views,
            }));
            results = [...results, ...externalResults];
          }
        } catch (functionError) {
          console.error('Supabase function error:', functionError);

          // ✅ Same rule — skip music in fallback
          if (searchType !== 'music') {
            const directResults = await searchDirectAPIs(query, searchType);
            results = [...results, ...directResults];
          } else {
            console.warn('Music search unavailable: Edge Function is required for secure Gemini API access.');
          }
        }
      }

      // Save search history
      if (user) {
        await supabase.from('search_history').insert({
          user_id: user.id,
          query,
          search_type: type,
          results_count: results.length,
        });
      }

      return results;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Search failed';
      setError(errorMessage);
      console.error('Search error:', err);
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  const getSearchHistory = async () => {
    if (!user) return [];

    const { data, error } = await supabase
      .from('search_history')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching search history:', error);
      return [];
    }

    return data || [];
  };

  return {
    search,
    getSearchHistory,
    isLoading,
    error,
  };
};