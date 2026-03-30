import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Clock, User, Eye, Heart, MessageCircle, Bookmark } from "lucide-react";
import { apiClient, Blog } from "@/lib/api";

const BlogGrid = () => {
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const data = await apiClient.getBlogs();
      setBlogs(data || []);
    } catch (error) {
      console.error('Error fetching blogs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 1) return "Just now";
    if (diffInHours < 24) return `${diffInHours} hours ago`;
    if (diffInHours < 48) return "1 day ago";
    if (diffInHours < 168) return `${Math.floor(diffInHours / 24)} days ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="text-center space-y-4">
          <h2 className="text-3xl font-bold">Discover Amazing Blogs</h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Explore thoughtful articles from our community of writers and thinkers
          </p>
        </div>
        <div className="text-center py-8">
          <p>Loading blogs...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold">Discover Amazing Blogs</h2>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Explore thoughtful articles from our community of writers and thinkers
        </p>
      </div>

      {blogs.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-xl font-semibold mb-2">No blogs yet</h3>
          <p className="text-muted-foreground">Be the first to write a blog post!</p>
        </div>
      ) : (
        <>
          {/* Featured Blogs Section */}
          {blogs.filter(blog => blog.is_featured).length > 0 && (
            <div className="space-y-6">
              <h3 className="text-xl font-semibold">Featured Articles</h3>
              <div className="grid lg:grid-cols-2 gap-6">
                {blogs.filter(blog => blog.is_featured).slice(0, 2).map((blog) => (
                  <Link key={blog.id} to={`/blog/${blog.slug}`}>
                    <Card className="group hover:shadow-elegant transition-all duration-300 cursor-pointer bg-gradient-card border-0">
                      <CardHeader className="space-y-4">
                        <div className="flex items-start justify-between">
                          <Badge variant="secondary" className="bg-gradient-primary text-white">Featured</Badge>
                          <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <Bookmark className="h-4 w-4" />
                          </Button>
                        </div>
                        <CardTitle className="text-xl group-hover:text-primary transition-colors line-clamp-2">
                          {blog.title}
                        </CardTitle>
                        <CardDescription className="text-base leading-relaxed line-clamp-3">
                          {blog.excerpt}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src="" alt="Author" />
                            <AvatarFallback><User className="h-4 w-4" /></AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-sm">Author</p>
                            <p className="text-xs text-muted-foreground">@author</p>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(blog.published_at || blog.created_at)} • {blog.reading_time} min read
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex space-x-2">
                            {blog.tags.slice(0, 3).map((tag) => (
                              <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                            ))}
                          </div>
                          <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                            <div className="flex items-center space-x-1">
                              <Eye className="h-3 w-3" />
                              <span>{blog.view_count}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Heart className="h-3 w-3" />
                              <span>{blog.like_count}</span>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* All Blogs Grid */}
          <div className="space-y-6">
            <h3 className="text-xl font-semibold">Latest Articles</h3>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {blogs.map((blog) => (
                <Link key={blog.id} to={`/blog/${blog.slug}`}>
                  <Card className="group hover:shadow-card-custom transition-all duration-300 cursor-pointer">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex space-x-2">
                          {blog.tags.slice(0, 2).map((tag) => (
                            <Badge key={tag} variant="secondary" className="text-xs">{tag}</Badge>
                          ))}
                        </div>
                        <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <Bookmark className="h-4 w-4" />
                        </Button>
                      </div>
                      <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                        {blog.title}
                      </CardTitle>
                      <CardDescription className="text-sm leading-relaxed line-clamp-3">
                        {blog.excerpt}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-6 w-6">
                          <AvatarImage src="" alt="Author" />
                          <AvatarFallback className="text-xs"><User className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-xs">Author</p>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {blog.reading_time} min read
                        </div>
                      </div>
                      
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>{formatDate(blog.published_at || blog.created_at)}</span>
                        <div className="flex items-center space-x-3">
                          <div className="flex items-center space-x-1">
                            <Heart className="h-3 w-3" />
                            <span>{blog.like_count}</span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <MessageCircle className="h-3 w-3" />
                            <span>{blog.comment_count}</span>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default BlogGrid;