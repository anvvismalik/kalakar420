// frontend/src/pages/SignIn.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Check, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const SignIn = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (!email || !password) {
      toast.error(language === 'pa' 
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਖੇਤਰ ਭਰੋ' 
        : language === 'hi'
        ? 'कृपया सभी फ़ील्ड भरें'
        : 'Please fill in all fields');
      return;
    }

    if (!email.includes('@')) {
      toast.error(language === 'pa' 
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵੈਧ ਈਮੇਲ ਦਰਜ ਕਰੋ' 
        : language === 'hi'
        ? 'कृपया एक वैध ईमेल दर्ज करें'
        : 'Please enter a valid email');
      return;
    }

    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success(language === 'pa' 
        ? 'ਸਫਲਤਾਪੂਰਵਕ ਸਾਈਨ ਇਨ ਹੋਇਆ!' 
        : language === 'hi'
        ? 'ਸਫਲਤਾਪੂਰਵਕ ਸਾਈਨ ਇਨ ਹੋਇਆ!'
        : 'Successfully signed in!');
      navigate("/studio");
    }, 1500);
  };

  return (
    // 🛠️ Applied custom background pattern class
    <div className="min-h-screen kalakaar-bg-pattern flex items-center justify-center p-4">
      <div className="w-full max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <Link 
            to="/" 
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            {language === 'pa' ? 'ਹੋਮ ਤੇ ਵਾਪਸ' : 'Back to Home'}
          </Link>
          
          {/* Language Selector */}
          <Select value={language} onValueChange={(value: any) => setLanguage(value)}>
            <SelectTrigger className="w-[140px]">
              <Globe className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en">English</SelectItem>
              <SelectItem value="pa">ਪੰਜਾਬੀ</SelectItem>
              <SelectItem value="hi">हिंदी</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="bg-card rounded-2xl shadow-xl overflow-hidden grid md:grid-cols-2">
          {/* Left Side - Form */}
          <div className="p-8 md:p-12 bg-background/50"> 
            <div className="flex flex-col items-center mb-8">
              {/* Logo gradient uses new primary/accent */}
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-3 shadow-lg">
                <Star className="w-6 h-6 text-white fill-white" />
              </div>
              <h2 className="text-2xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                Kalakaar AI
              </h2>
              <p className="text-sm text-muted-foreground">{t('signin.welcomeBack')}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t('signin.title')}</h1>
                <p className="text-muted-foreground">
                  {t('signin.description')}
                </p>
              </div>

              <form onSubmit={handleSignIn} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <span className="text-primary">📧</span>
                    {t('signin.email')}
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder={language === 'pa' ? 'ਆਪਣਾ ਈਮੇਲ ਦਰਜ ਕਰੋ' : 'Enter your email'}
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <span className="text-primary">🔒</span>
                    {t('signin.password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={language === 'pa' ? 'ਆਪਣਾ ਪਾਸਵਰਡ ਦਰਜ ਕਰੋ' : 'Enter your password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="h-12 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Checkbox 
                      id="remember" 
                      checked={rememberMe}
                      onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                      disabled={isLoading}
                    />
                    <label 
                      htmlFor="remember" 
                      className="text-sm text-muted-foreground cursor-pointer select-none"
                    >
                      {t('signin.rememberMe')}
                    </label>
                  </div>
                  <Link 
                    to="#" 
                    className="text-sm text-primary hover:underline transition-all"
                    onClick={(e) => {
                      e.preventDefault();
                      toast.info(language === 'pa' 
                        ? 'ਪਾਸਵਰਡ ਰੀਸੈੱਟ ਵਿਸ਼ੇਸ਼ਤਾ ਜਲਦੀ ਆ ਰਹੀ ਹੈ' 
                        : 'Password reset feature coming soon');
                    }}
                  >
                    {t('signin.forgotPassword')}
                  </Link>
                </div>

                <Button
                  type="submit"
                  disabled={isLoading}
                  // 🛠️ Final button gradient: Primary/Accent for earthy look
                  className="w-full h-12 bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity text-white font-medium"
                >
                  {isLoading ? (
                    <>
                      <span className="animate-spin mr-2">⏳</span>
                      {language === 'pa' ? 'ਸਾਈਨ ਇਨ ਹੋ ਰਿਹਾ ਹੈ...' : 'Signing in...'}
                    </>
                  ) : (
                    t('signin.title')
                  )}
                </Button>

                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">
                      {language === 'pa' ? 'ਜਾਂ' : 'OR'}
                    </span>
                  </div>
                </div>

                {/* Social Sign In Options */}
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => toast.info(language === 'pa' 
                      ? 'Google ਸਾਈਨ ਇਨ ਜਲਦੀ ਆ ਰਿਹਾ ਹੈ' 
                      : 'Google sign in coming soon')}
                    className="h-12"
                  >
                    <span className="mr-2">🔍</span>
                    Google
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    disabled={isLoading}
                    onClick={() => toast.info(language === 'pa' 
                      ? 'Facebook ਸਾਈਨ ਇਨ ਜਲਦੀ ਆ ਰਿਹਾ ਹੈ' 
                      : 'Facebook sign in coming soon')}
                    className="h-12"
                  >
                    <span className="mr-2">📘</span>
                    Facebook
                  </Button>
                </div>

                <p className="text-center text-sm text-muted-foreground">
                  {t('signin.noAccount')}{" "}
                  <Link to="/signup" className="text-primary hover:underline font-medium">
                    {t('signin.signUpHere')}
                  </Link>
                </p>
              </form>
            </div>
          </div>

          {/* Right Side - Gradient Card */}
          {/* 🛠️ Final Gradient: Primary (Terracotta) and Accent (Mustard) for a smooth, earthy blend */}
          <div className="bg-gradient-to-br from-primary/90 to-accent/90 p-12 text-white flex flex-col justify-center">
            <div className="w-20 h-20 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mb-8 mx-auto shadow-2xl">
              <Star className="w-10 h-10 fill-white animate-pulse" />
            </div>

            <h3 className="text-3xl font-bold mb-4 text-center">
              {language === 'pa' ? 'ਕਾਰੀਗਰ ਭਾਈਚਾਰੇ ਵਿੱਚ ਸ਼ਾਮਲ ਹੋਵੋ' : language === 'hi' ? 'ਕਾਰੀगर समुदाय में शामिल हों' : 'Join the Artisan Community'}
            </h3>
            <p className="text-white/90 text-center mb-8 text-lg">
              {language === 'pa' 
                ? 'ਸਾਥੀ ਕਾਰੀਗਰਾਂ ਨਾਲ ਜੁੜੋ, ਆਪਣਾ ਕੰਮ ਦਿਖਾਓ, ਅਤੇ AI-ਸੰਚਾਲਿਤ ਸਮੱਗਰੀ ਰਚਨਾ ਨਾਲ ਆਪਣੇ ਕਾਰੋਬਾਰ ਨੂੰ ਵਧਾਓ।'
                : language === 'hi'
                ? 'साथी कारीगरों से जुड़ें, अपना काम दिखाएं, और AI-संचालित सामग्री निर्माण के साथ अपने व्यवसाय को बढ़ाएं।'
                : 'Connect with fellow artisans, showcase your work, and grow your business with AI-powered content creation.'
              }
            </p>

            <div className="space-y-4">
              {[
                {
                  en: 'AI-powered content generation',
                  pa: 'AI-ਸੰਚਾਲਿਤ ਸਮੱਗਰੀ ਬਣਾਉਣਾ',
                  hi: 'AI-संचालित सामग्री निर्माण',
                  icon: '🤖'
                },
                {
                  en: 'Multi-language support',
                  pa: 'ਬਹੁ-ਭਾਸ਼ਾ ਸਹਾਇਤਾ',
                  hi: 'बहु-भाषा समर्थन',
                  icon: '🌍'
                },
                {
                  en: 'Social media optimization',
                  pa: 'ਸੋਸ਼ਲ ਮੀਡੀਆ ਅਨੁਕੂਲਨ',
                  hi: 'सोशल मीडिया अनुकूलन',
                  icon: '📱'
                },
                {
                  en: 'Free to get started',
                  pa: 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਮੁਫਤ',
                  hi: 'शुरू करने के लिए मुफ्त',
                  icon: '✨'
                }
              ].map((feature, index) => (
                <div 
                  key={index} 
                  className="flex items-center gap-3 animate-fade-in"
                 style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center flex-shrink-0 shadow-lg">
                    <span className="text-lg">{feature.icon}</span>
                  </div>
                  <span className="text-white/90">
                    {language === 'pa' ? feature.pa : language === 'hi' ? feature.hi : feature.en}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold mb-1">1000+</div>
                  <div className="text-xs text-white/70">
                    {language === 'pa' ? 'ਕਾਰੀਗਰ' : language === 'hi' ? 'ਕਾਰੀगर' : 'Artisans'}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">10K+</div>
                  <div className="text-xs text-white/70">
                    {language === 'pa' ? 'ਸਮੱਗਰੀ' : language === 'hi' ? 'सामग्री' : 'Content'}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">100%</div>
                  <div className="text-xs text-white/70">
                    {language === 'pa' ? 'ਮੁਫਤ' : language === 'hi' ? 'मुफ्त' : 'Free'}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SignIn;