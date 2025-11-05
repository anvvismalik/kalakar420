// frontend/src/pages/Index.tsx
import { Link } from "react-router-dom";
import { Star, Sparkles, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const Index = () => {
  const { language, setLanguage, t } = useLanguage();

  return (
    // 🛠️ Applied custom background pattern class
    <div className="min-h-screen kalakaar-bg-pattern">
      
      {/* Navigation - Uses slightly darker card background/80 */}
      <nav className="sticky top-0 left-0 right-0 z-10 p-6 bg-card/80 backdrop-blur-sm border-b border-border/50"> 
        <div className="container mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            {/* Logo area - Uses new primary and accent */}
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Star className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="font-bold text-lg text-foreground">Kalakaar AI</span>
            <span className="text-xs text-muted-foreground ml-2 hidden sm:inline-block">AI Powered Content Creation for Artisans</span>
          </div>
          <div className="flex items-center gap-3">
            {/* Language Selector */}
            <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
              <SelectTrigger className="w-[120px]">
                <Globe className="w-4 h-4 mr-2" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
                <SelectItem value="hi">हिंदी</SelectItem>
              </SelectContent>
            </Select>
            <Link to="/signin">
              {/* 🛠️ Styled button - Primary color (Terracotta) */}
              <Button className="bg-primary hover:bg-primary/90 text-white font-medium">
                {t('nav.signIn')}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="min-h-screen flex items-center justify-center px-4 py-20 -mt-24">
        <div className="container mx-auto max-w-5xl text-center">
          
          {/* Tagline - Uses new primary color */}
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full mb-8 animate-fade-in border border-primary/20">
            <Star className="w-4 h-4 text-primary fill-primary" />
            <span className="text-sm font-medium text-primary">{t('landing.tagline')}</span>
          </div>

          {/* Title - Uses new color breaks (Secondary/Accent and Accent/Primary) */}
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 leading-tight max-w-4xl mx-auto"> 
            {t('landing.title1')}{" "}
            {/* Punjabi Descriptions (Secondary/Accent) */}
            <span className="bg-gradient-to-r from-secondary to-accent bg-clip-text text-transparent">
              {t('landing.title2')}
            </span>
            <br />
            {t('landing.title3')}{" "}
            {/* English Content (Accent/Primary) */}
            <span className="bg-gradient-to-r from-accent to-primary bg-clip-text text-transparent">
              {t('landing.title4')}
            </span>
          </h1>

          <p className="text-lg text-muted-foreground mb-12 max-w-3xl mx-auto leading-relaxed">
            {t('landing.description')}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-16">
            <Link to="/studio">
              {/* Primary CTA button with strong gradient (Primary/Accent) */}
              <Button
                size="lg"
                className="h-14 px-8 text-lg bg-gradient-to-r from-primary to-accent shadow-lg shadow-primary/30 hover:shadow-primary/50 transition-shadow"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                {t('landing.startCreating')}
              </Button>
            </Link>
            <Link to="/signin">
              {/* Secondary CTA button */}
              <Button
                size="lg"
                variant="outline"
                className="h-14 px-8 text-lg hover:bg-card/70"
              >
                {t('nav.signIn')}
              </Button>
            </Link>
          </div>

          {/* Feature Pills - Uses new colors: Primary (NEW), Secondary (FREE), Accent (AI) */}
          <div className="flex flex-wrap items-center justify-center gap-4 text-sm max-w-md mx-auto">
            
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-primary text-white font-medium">
              {t('badge.platform')}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-secondary text-white font-medium">
              {t('badge.free')}
            </div>
            <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-white font-medium">
              {t('badge.powered')}
            </div>
            
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;