import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/hooks/useAuth";
import { apiClient } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { Save, Eye, Send, ArrowLeft, Image as ImageIcon, Tag, Clock } from "lucide-react";

const WriteBlog = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [coverImageUrl, setCoverImageUrl] = useState("");
  const [isPublishing, setIsPublishing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isPreview, setIsPreview] = useState(false);
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  const generateSlug = (title: string) => {
    return title
      .toLowerCase()
      .replace(/[^a-z0-9 -]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim('-');
  };

  const calculateReadingTime = (content: string) => {
    const wordsPerMinute = 200;
    const wordCount = content.split(/\s+/).length;
    return Math.ceil(wordCount / wordsPerMinute);
  };

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()]);
      setNewTag("");
    }
  };

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && newTag.trim()) {
      e.preventDefault();
      addTag();
    }
  };

  const saveDraft = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsSaving(true);
    setError("");

    try {
      const slug = generateSlug(title);
      const readingTime = calculateReadingTime(content);

      await apiClient.createBlog({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || content.trim().substring(0, 160) + "...",
        slug,
        tags,
        cover_image_url: coverImageUrl || undefined,
        reading_time: readingTime,
        is_published: false,
      });

      toast({
        title: "Draft saved!",
        description: "Your blog post has been saved as a draft.",
      });
    } catch (err: any) {
      setError(err.message || "Failed to save draft");
    } finally {
      setIsSaving(false);
    }
  };

  const publishBlog = async () => {
    if (!title.trim() || !content.trim()) {
      setError("Title and content are required");
      return;
    }

    setIsPublishing(true);
    setError("");

    try {
      const slug = generateSlug(title);
      const readingTime = calculateReadingTime(content);

      await apiClient.createBlog({
        title: title.trim(),
        content: content.trim(),
        excerpt: excerpt.trim() || content.trim().substring(0, 160) + "...",
        slug,
        tags,
        cover_image_url: coverImageUrl || undefined,
        reading_time: readingTime,
        is_published: true,
      });

      toast({
        title: "Blog published!",
        description: "Your blog post has been published successfully.",
      });

      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Failed to publish blog");
    } finally {
      setIsPublishing(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/dashboard")}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <div>
              <h1 className="text-3xl font-bold">Write New Blog</h1>
              <p className="text-muted-foreground">Share your thoughts with the world</p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => setIsPreview(!isPreview)}
            >
              <Eye className="w-4 h-4 mr-2" />
              {isPreview ? "Edit" : "Preview"}
            </Button>
            <Button
              variant="outline"
              onClick={saveDraft}
              disabled={isSaving}
            >
              <Save className="w-4 h-4 mr-2" />
              {isSaving ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              onClick={publishBlog}
              disabled={isPublishing}
            >
              <Send className="w-4 h-4 mr-2" />
              {isPublishing ? "Publishing..." : "Publish"}
            </Button>
          </div>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Blog Content</CardTitle>
                <CardDescription>
                  Write your blog post content here
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    placeholder="Enter your blog title..."
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="excerpt">Excerpt (Optional)</Label>
                  <Textarea
                    id="excerpt"
                    placeholder="Write a brief description of your blog post..."
                    value={excerpt}
                    onChange={(e) => setExcerpt(e.target.value)}
                    rows={3}
                  />
                  <p className="text-sm text-muted-foreground">
                    {excerpt.length}/160 characters
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="content">Content *</Label>
                  {isPreview ? (
                    <div className="min-h-[400px] p-4 border rounded-md bg-muted/50">
                      <div className="prose max-w-none">
                        <h1 className="text-2xl font-bold mb-4">{title || "Untitled"}</h1>
                        <div className="whitespace-pre-wrap">{content || "No content yet..."}</div>
                      </div>
                    </div>
                  ) : (
                    <Textarea
                      id="content"
                      placeholder="Write your blog content here... (Markdown supported)"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      rows={20}
                      className="font-mono"
                    />
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Cover Image */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <ImageIcon className="w-5 h-5" />
                  Cover Image
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="coverImage">Image URL</Label>
                  <Input
                    id="coverImage"
                    placeholder="https://example.com/image.jpg"
                    value={coverImageUrl}
                    onChange={(e) => setCoverImageUrl(e.target.value)}
                  />
                </div>
                {coverImageUrl && (
                  <div className="aspect-video rounded-md overflow-hidden">
                    <img
                      src={coverImageUrl}
                      alt="Cover preview"
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.style.display = 'none';
                      }}
                    />
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tags */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Tag className="w-5 h-5" />
                  Tags
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex gap-2">
                  <Input
                    placeholder="Add a tag..."
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    onKeyPress={handleKeyPress}
                  />
                  <Button onClick={addTag} size="sm">
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="cursor-pointer"
                      onClick={() => removeTag(tag)}
                    >
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blog Stats */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="w-5 h-5" />
                  Blog Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Words:</span>
                  <span className="text-sm font-medium">
                    {content.split(/\s+/).filter(word => word.length > 0).length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Reading Time:</span>
                  <span className="text-sm font-medium">
                    {calculateReadingTime(content)} min
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Characters:</span>
                  <span className="text-sm font-medium">{content.length}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WriteBlog;

