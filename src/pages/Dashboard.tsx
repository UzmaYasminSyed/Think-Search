import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { PenTool, Search, Bookmark, TrendingUp, Eye, Clock, Plus, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";

const Dashboard = () => {
  const { user } = useAuth();
  
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-16">
        <div className="space-y-8">
          {/* Header */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
            <div>
              <h1 className="text-3xl font-bold">Welcome back, {user?.user_metadata?.display_name || 'User'}!</h1>
              <p className="text-muted-foreground">Here's what's happening with your content and searches</p>
            </div>
            <Link to="/write-blog">
              <Button variant="hero" size="lg">
                <Plus className="h-5 w-5 mr-2" />
                Write New Blog
              </Button>
            </Link>
          </div>

          {/* Stats Cards */}
          <div className="grid md:grid-cols-4 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Published Blogs</CardTitle>
                <PenTool className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">12</div>
                <p className="text-xs text-muted-foreground">+2 from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                <Eye className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">24,567</div>
                <p className="text-xs text-muted-foreground">+15% from last month</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Searches Made</CardTitle>
                <Search className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">156</div>
                <p className="text-xs text-muted-foreground">+8 this week</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Bookmarks</CardTitle>
                <Bookmark className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">43</div>
                <p className="text-xs text-muted-foreground">+5 this week</p>
              </CardContent>
            </Card>
          </div>

          {/* Recent Activity */}
          <div className="grid lg:grid-cols-2 gap-8">
            {/* Recent Blogs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <PenTool className="h-5 w-5" />
                  <span>Your Recent Blogs</span>
                </CardTitle>
                <CardDescription>Your latest published articles</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    title: "The Evolution of Search Technology",
                    status: "Published",
                    views: 1240,
                    date: "2 hours ago"
                  },
                  {
                    title: "Building Better User Experiences",
                    status: "Draft", 
                    views: 0,
                    date: "1 day ago"
                  },
                  {
                    title: "AI in Content Creation",
                    status: "Published",
                    views: 892,
                    date: "3 days ago"
                  }
                ].map((blog, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">{blog.title}</p>
                      <div className="flex items-center space-x-2">
                        <Badge variant={blog.status === "Published" ? "default" : "secondary"} className="text-xs">
                          {blog.status}
                        </Badge>
                        <span className="text-xs text-muted-foreground">{blog.date}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{blog.views}</p>
                      <p className="text-xs text-muted-foreground">views</p>
                    </div>
                  </div>
                ))}
                <Link to="/my-blogs">
                  <Button variant="outline" className="w-full">
                    <FileText className="h-4 w-4 mr-2" />
                    View All Blogs
                  </Button>
                </Link>
              </CardContent>
            </Card>

            {/* Recent Searches */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Recent Searches</span>
                </CardTitle>
                <CardDescription>Your latest search queries</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {[
                  {
                    query: "AI technology trends",
                    results: 23,
                    time: "2 hours ago"
                  },
                  {
                    query: "sustainable content strategies",
                    results: 18,
                    time: "1 day ago"
                  },
                  {
                    query: "information architecture best practices",
                    results: 31,
                    time: "2 days ago"
                  },
                  {
                    query: "machine learning algorithms",
                    results: 42,
                    time: "3 days ago"
                  }
                ].map((search, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border bg-card/50">
                    <div className="space-y-1">
                      <p className="font-medium text-sm">"{search.query}"</p>
                      <p className="text-xs text-muted-foreground">{search.time}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium">{search.results}</p>
                      <p className="text-xs text-muted-foreground">results</p>
                    </div>
                  </div>
                ))}
                <Button variant="outline" className="w-full">View Search History</Button>
              </CardContent>
            </Card>
          </div>

          {/* Performance Insights */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <TrendingUp className="h-5 w-5" />
                <span>Performance Insights</span>
              </CardTitle>
              <CardDescription>Analytics for your published content</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-3 gap-6">
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">89%</div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">6.2m</div>
                  <p className="text-sm text-muted-foreground">Avg. Read Time</p>
                </div>
                <div className="text-center space-y-2">
                  <div className="text-2xl font-bold text-primary">342</div>
                  <p className="text-sm text-muted-foreground">Shares This Month</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;