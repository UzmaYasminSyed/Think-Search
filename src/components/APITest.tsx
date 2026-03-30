import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";

// ⚠️  DEVELOPMENT ONLY COMPONENT
// This component is for testing APIs during development.
// Make sure it is NOT accessible to regular users in production.
// Protect it behind an admin role check or remove it entirely before shipping.

const APITest = () => {
  const [testResults, setTestResults] = useState<any>({});
  const [testing, setTesting] = useState(false);

  const testAPIs = async () => {
    setTesting(true);
    const results: any = {};

    try {
      // Test News API
      console.log('Testing News API...');
      const newsResponse = await fetch(
        'https://nexus-search.onrender.com/api/searchNews?query=technology&limit=3'
      );
      results.news = {
        status: newsResponse.status,
        ok: newsResponse.ok,
        data: newsResponse.ok ? await newsResponse.json() : await newsResponse.text(),
      };

      // Test Images API
      console.log('Testing Images API...');
      const imagesResponse = await fetch(
        'https://nexus-search.onrender.com/api/searchImages?query=technology&limit=3'
      );
      results.images = {
        status: imagesResponse.status,
        ok: imagesResponse.ok,
        data: imagesResponse.ok ? await imagesResponse.json() : await imagesResponse.text(),
      };

      // Test Videos API
      console.log('Testing Videos API...');
      const videosResponse = await fetch(
        'https://nexus-search.onrender.com/api/youtube/search?query=technology&limit=3'
      );
      results.videos = {
        status: videosResponse.status,
        ok: videosResponse.ok,
        data: videosResponse.ok ? await videosResponse.json() : await videosResponse.text(),
      };

      // ✅ Test Music API via Edge Function — Gemini key stays server-side
      // Never call Gemini directly from the frontend (key would be visible in browser DevTools)
      console.log('Testing Music API via Edge Function...');
      const { data: musicData, error: musicError } = await supabase.functions.invoke(
        'search-external',
        { body: { query: 'technology', type: 'music', limit: 3 } }
      );
      results.music = {
        status: musicError ? 'Error' : 200,
        ok: !musicError,
        data: musicError ? musicError : musicData,
      };

    } catch (error) {
      console.error('API Test Error:', error);
      results.error = { ok: false, status: 'Exception', data: String(error) };
    }

    setTestResults(results);
    setTesting(false);
  };

  return (
    <div className="space-y-6">
      <Card className="border-yellow-400 bg-yellow-50">
        <CardHeader>
          <CardTitle className="text-yellow-800">⚠️ Developer Tool</CardTitle>
          <CardDescription className="text-yellow-700">
            This component is for development testing only. Remove or restrict access before deploying to production.
          </CardDescription>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>API Test</CardTitle>
          <CardDescription>Test all external APIs to verify they're working</CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={testAPIs} disabled={testing}>
            {testing ? 'Testing APIs...' : 'Test All APIs'}
          </Button>
        </CardContent>
      </Card>

      {Object.keys(testResults).length > 0 && (
        <div className="space-y-4">
          {Object.entries(testResults).map(([api, result]: [string, any]) => (
            <Card key={api}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="capitalize">{api} API</CardTitle>
                  <Badge variant={result.ok ? "default" : "destructive"}>
                    {result.ok ? 'Success' : 'Failed'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <p><strong>Status:</strong> {result.status}</p>
                  <p><strong>Response:</strong></p>
                  <pre className="bg-muted p-4 rounded text-xs overflow-auto max-h-40">
                    {JSON.stringify(result.data, null, 2)}
                  </pre>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default APITest;