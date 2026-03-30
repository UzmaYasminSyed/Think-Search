import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Search, Edit3 } from "lucide-react";

const Hero = () => {
  return (
    <section className="relative py-20 lg:py-32 overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-hero opacity-5" />
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-primary/10 via-transparent to-transparent" />
      
      <div className="container mx-auto px-4">
        <div className="text-center max-w-4xl mx-auto">
          {/* Badge */}
          <div className="inline-flex items-center space-x-2 px-4 py-2 rounded-full bg-gradient-secondary border mb-8">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">AI-Enhanced Content Platform</span>
          </div>

          {/* Main heading */}
          <h1 className="text-4xl lg:text-6xl font-bold mb-6 leading-tight">
            Write, Search & 
            <span className="bg-gradient-primary bg-clip-text text-transparent"> Understand</span>
            <br />
            Everything in One Place
          </h1>

          {/* Subtitle */}
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
            Think Search combines powerful blogging with intelligent multi-domain search and AI summaries. 
            Create content, discover knowledge, and comprehend faster than ever before.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Button size="lg" variant="hero" className="text-lg px-8 py-6">
              Start Writing
              <Edit3 className="ml-2 h-5 w-5" />
            </Button>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Explore Search
              <Search className="ml-2 h-5 w-5" />
            </Button>
          </div>

          {/* Feature highlights */}
          <div className="grid md:grid-cols-3 gap-8 max-w-3xl mx-auto">
            <div className="text-center">
              <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Edit3 className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Rich Blogging</h3>
              <p className="text-sm text-muted-foreground">Medium-style editor with advanced formatting</p>
            </div>
            
            <div className="text-center">
              <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Search className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">Smart Search</h3>
              <p className="text-sm text-muted-foreground">Multi-domain search across blogs, news, and media</p>
            </div>
            
            <div className="text-center">
              <div className="h-12 w-12 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold mb-2">AI Summaries</h3>
              <p className="text-sm text-muted-foreground">Instant comprehension with intelligent summaries</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;