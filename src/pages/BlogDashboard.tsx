import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useAuth } from "@/hooks/useAuth";
import { apiClient, Blog } from "@/lib/api";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  Search, 
  Calendar, 
  Clock, 
  TrendingUp,
  FileText,
  Filter
} from "lucide-react";


const BlogDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [blogs, setBlogs] = useState<Blog[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "published" | "drafts">("all");
  const [error, setError] = useState("");

  // Redirect if not authenticated
  useEffect(() => {
    if (!user) {
      navigate("/auth");
    }
  }, [user, navigate]);

  useEffect(() => {
    if (user) {
      fetchBlogs();
    }
  }, [user, filterStatus]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const status = filterStatus === "all" ? undefined : filterStatus;
      const data = await apiClient.getMyBlogs(status);
      setBlogs(data || []);
    } catch (err: any) {
      setError(err.message || "Failed to fetch blogs");
    } finally {
      setLoading(false);
    }
  };

  const deleteBlog = async (blogId: string) => {
    if (!confirm("Are you sure you want to delete this blog post?")) {
      return;
    }

    try {
      await apiClient.deleteBlog(blogId);
      setBlogs(blogs.filter(blog => blog.id !== blogId));
      toast({
        title: "Blog deleted",
        description: "The blog post has been deleted successfully.",
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to delete the blog post.",
        variant: "destructive",
      });
    }
  };

  const togglePublishStatus = async (blog: Blog) => {
    try {
      const updatedBlog = await apiClient.updateBlog(blog.id, {
        is_published: !blog.is_published,
      });

      setBlogs(blogs.map(b => 
        b.id === blog.id ? updatedBlog : b
      ));

      toast({
        title: blog.is_published ? "Blog unpublished" : "Blog published",
        description: `The blog post has been ${blog.is_published ? "unpublished" : "published"} successfully.`,
      });
    } catch (err: any) {
      toast({
        title: "Error",
        description: err.message || "Failed to update the blog status.",
        variant: "destructive",
      });
    }
  };

  const filteredBlogs = blogs.filter(blog => 
    blog.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
    blog.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">My Blogs</h1>
            <p className="text-muted-foreground">Manage your blog posts</p>
          </div>
          <Button onClick={() => navigate("/write-blog")}>
            <Plus className="w-4 h-4 mr-2" />
            Write New Blog
          </Button>
        </div>

        {error && (
          <Alert className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <FileText className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Blogs</p>
                  <p className="text-2xl font-bold">{blogs.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Eye className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Published</p>
                  <p className="text-2xl font-bold">{blogs.filter(b => b.is_published).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Edit className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Drafts</p>
                  <p className="text-2xl font-bold">{blogs.filter(b => !b.is_published).length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-muted-foreground" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-muted-foreground">Total Views</p>
                  <p className="text-2xl font-bold">{blogs.reduce((sum, blog) => sum + blog.view_count, 0)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search blogs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <div className="flex gap-2">
            <Button
              variant={filterStatus === "all" ? "default" : "outline"}
              onClick={() => setFilterStatus("all")}
            >
              All
            </Button>
            <Button
              variant={filterStatus === "published" ? "default" : "outline"}
              onClick={() => setFilterStatus("published")}
            >
              Published
            </Button>
            <Button
              variant={filterStatus === "drafts" ? "default" : "outline"}
              onClick={() => setFilterStatus("drafts")}
            >
              Drafts
            </Button>
          </div>
        </div>

        {/* Blogs List */}
        {loading ? (
          <div className="text-center py-8">
            <p>Loading blogs...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FileText className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No blogs found</h3>
              <p className="text-muted-foreground mb-4">
                {searchQuery ? "No blogs match your search criteria." : "You haven't written any blogs yet."}
              </p>
              {!searchQuery && (
                <Button onClick={() => navigate("/write-blog")}>
                  <Plus className="w-4 h-4 mr-2" />
                  Write Your First Blog
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredBlogs.map((blog) => (
              <Card key={blog.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-xl font-semibold">{blog.title}</h3>
                        <Badge variant={blog.is_published ? "default" : "secondary"}>
                          {blog.is_published ? "Published" : "Draft"}
                        </Badge>
                        {blog.is_featured && (
                          <Badge variant="outline">Featured</Badge>
                        )}
                      </div>
                      
                      <p className="text-muted-foreground mb-3">{blog.excerpt}</p>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          {blog.is_published && blog.published_at
                            ? new Date(blog.published_at).toLocaleDateString()
                            : new Date(blog.created_at).toLocaleDateString()
                          }
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {blog.reading_time} min read
                        </div>
                        <div className="flex items-center gap-1">
                          <Eye className="w-4 h-4" />
                          {blog.view_count} views
                        </div>
                      </div>
                      
                      <div className="flex flex-wrap gap-2">
                        {blog.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/blog/${blog.slug}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/edit-blog/${blog.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => togglePublishStatus(blog)}
                      >
                        {blog.is_published ? "Unpublish" : "Publish"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => deleteBlog(blog.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default BlogDashboard;

