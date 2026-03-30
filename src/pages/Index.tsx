import Navigation from "@/components/Navigation";
import Hero from "@/components/Hero";
import SearchInterface from "@/components/SearchInterface";
import BlogGrid from "@/components/BlogGrid";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <Hero />
      
      {/* Search Preview Section */}
      <section className="py-20 bg-gradient-secondary">
        <div className="container mx-auto px-4">
          <SearchInterface />
        </div>
      </section>

      {/* Featured Blogs Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <BlogGrid />
        </div>
      </section>
    </div>
  );
};

export default Index;
