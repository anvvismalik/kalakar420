import { useState } from "react";
import { Link } from "react-router-dom";
import { Star, Sparkles, Users, Zap, Globe, TrendingUp, Shield, Heart, Mic, Volume2, Layout, Feather } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator"; 

const Dashboard = () => {
  return (
    // 🛠️ Applied custom background pattern class
    <div className="min-h-screen kalakaar-bg-pattern">
      
      {/* Header - Uses slightly darker card background/70 */}
      <header className="border-b bg-card/70 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
                {/* Logo uses new primary/secondary gradient */}
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                    <Star className="w-5 h-5 text-white fill-white" />
                </div>
                <h1 className="text-xl font-bold text-foreground">
                    Kalakaar AI
                </h1>
            </Link>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/studio">
              {/* Updated border color to primary (Terracotta) */}
              <Button variant="outline" className="border-primary text-primary hover:bg-primary/10">
                Try Studio
              </Button>
            </Link>
            <Link to="/signin">
              <Button variant="outline">Sign In</Button>
            </Link>
            {/* "Get Content" button uses new accent/secondary gradient */}
            <Link to="/signup">
              <Button className="bg-gradient-to-r from-accent to-secondary text-white hover:opacity-90">
                Get Content
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-16 md:py-24">
        {/* Hero Section */}
        <div className="text-center mb-16 max-w-4xl mx-auto">
          {/* Tagline uses primary/10 */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-6">
            <Sparkles className="w-4 h-4 text-primary" />
            <span className="text-sm font-medium text-primary">Transform Your Artisan Business</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-extrabold mb-4">
            Welcome to{" "}
            {/* Title uses primary/secondary/accent gradient */}
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Kalakaar AI
            </span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto mb-10 leading-relaxed">
            Empowering local artisans to create compelling social media content by translating Punjabi product 
            descriptions into professional English with engaging captions and optimized posts.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4">
            {/* CTA Button uses primary/secondary gradient */}
            <Link to="/studio">
              <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-primary to-secondary text-white text-lg shadow-md shadow-primary/30">
                <Sparkles className="w-5 h-5 mr-2" />
                Start Creating Free
              </Button>
            </Link>
            <Link to="/signin">
              <Button size="lg" variant="outline" className="h-12 px-8 text-lg">
                Sign In
              </Button>
            </Link>
          </div>
        </div>

        {/* Feature Cards - Updated for earthy tones */}
        <div className="grid md:grid-cols-3 gap-8 mb-16 max-w-5xl mx-auto">
          
          {/* Card 1: Voice Conversation - Primary/Secondary Colors */}
          <Card className="border-2 hover:border-primary/50 transition-all shadow-xl">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center mb-4">
                <Mic className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Voice Conversation</CardTitle>
              <CardDescription>
                AI asks questions in Punjabi, you respond naturally - simple and intuitive product creation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link to="/studio">
                {/* 🛠️ Button uses primary/secondary gradient */}
                <Button className="w-full bg-gradient-to-r from-primary to-secondary text-white hover:opacity-90">
                  Try Voice Studio
                </Button>
              </Link>
            </CardContent>
          </Card>

          {/* Card 2: Multi-Language Support - Secondary/Accent Colors */}
          <Card className="border-2 hover:border-secondary/50 transition-all shadow-xl">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-secondary to-accent flex items-center justify-center mb-4">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Multi-Language Support</CardTitle>
              <CardDescription>
                Seamlessly work with Punjabi and English, bridging the language gap for your business
              </CardDescription>
            </CardHeader>
          </Card>

          {/* Card 3: Social Media Optimization - Accent/Primary Colors */}
          <Card className="border-2 hover:border-accent/50 transition-all shadow-xl">
            <CardHeader>
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent to-primary flex items-center justify-center mb-4">
                <TrendingUp className="w-6 h-6 text-white" />
              </div>
              <CardTitle>Social Media Optimization</CardTitle>
              <CardDescription>
                Generate engaging captions and posts optimized for maximum reach and engagement
              </CardDescription>
            </CardHeader>
          </Card>
        </div>

        {/* How It Works */}
        <div className="mt-16 pt-16 border-t border-border/50">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-center text-muted-foreground mb-12 max-w-2xl mx-auto">
            Three simple steps to transform your product descriptions into professional content
          </p>

          <div className="flex items-start justify-between max-w-4xl mx-auto space-x-8">
            {/* Step 1 - Accent Color */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-accent text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md">
                1
              </div>
              <h3 className="text-lg font-semibold mb-1">Voice Conversation</h3>
              <p className="text-sm text-muted-foreground">
                Describe your product in Punjabi
              </p>
            </div>
            
            <Separator orientation="vertical" className="h-10 w-px bg-border/50 mt-4 hidden md:block" />

            {/* Step 2 - Secondary Color */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-secondary text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md">
                2
              </div>
              <h3 className="text-lg font-semibold mb-1">Add Photo Star</h3>
              <p className="text-sm text-muted-foreground">
                Upload a product photo (optional)
              </p>
            </div>
            
            <Separator orientation="vertical" className="h-10 w-px bg-border/50 mt-4 hidden md:block" />

            {/* Step 3 - Primary Color */}
            <div className="flex flex-col items-center flex-1 text-center">
              <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center mx-auto mb-4 font-bold text-lg shadow-md">
                3
              </div>
              <h3 className="text-lg font-semibold mb-1">Generate Content</h3>
              <p className="text-sm text-muted-foreground">
                Get professional social media posts
              </p>
            </div>
          </div>

          <div className="text-center mt-12">
            <Link to="/studio">
              {/* Button uses primary/secondary gradient */}
              <Button size="lg" className="h-12 px-8 bg-gradient-to-r from-primary to-secondary text-white">
                <Mic className="w-5 h-5 mr-2" />
                Try It Now
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Section - Uses new primary/secondary/accent/10 colors */}
        <div className="bg-gradient-to-br from-primary/10 via-secondary/10 to-accent/10 rounded-2xl p-12 mb-16">
          <div className="grid md:grid-cols-3 gap-8 text-center">
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Users className="w-8 h-8 text-primary" />
                <h3 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                  1000+
                </h3>
              </div>
              <p className="text-muted-foreground">Active Artisans</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Sparkles className="w-8 h-8 text-secondary" />
                <h3 className="text-4xl font-bold bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
                  10K+
                </h3>
              </div>
              <p className="text-muted-foreground">Content Generated</p>
            </div>
            <div>
              <div className="flex items-center justify-center gap-2 mb-2">
                <Shield className="w-8 h-8 text-accent" />
                <h3 className="text-4xl font-bold bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
                  100%
                </h3>
              </div>
              <p className="text-muted-foreground">Free to Start</p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="text-center bg-card border-2 rounded-2xl p-12">
          {/* Heart icon uses primary/secondary gradient */}
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center mx-auto mb-6">
            <Heart className="w-8 h-8 text-white fill-white" />
          </div>
          <h2 className="text-3xl font-bold mb-4">Ready to Transform Your Business?</h2>
          <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            Join thousands of artisans who are already using AI to create compelling content and grow their businesses.
          </p>
          <Link to="/studio">
            {/* CTA Button uses primary/secondary gradient */}
            <Button size="lg" className="h-14 px-8 bg-gradient-to-r from-primary to-secondary text-white text-lg">
              <Sparkles className="w-5 h-5 mr-2" />
              Get Started for Free
            </Button>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t mt-16 py-8">
        <div className="container mx-auto px-4 text-center text-muted-foreground">
          <p>© 2025 Kalakaar AI. Empowering artisans with AI-powered content creation.</p>
        </div>
      </footer>
    </div>
  );
};

export default Dashboard;