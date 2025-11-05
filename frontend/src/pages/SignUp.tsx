// frontend/src/pages/SignUp.tsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";

const SignUp = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    location: "",
    craftType: "",
    password: "",
    confirmPassword: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const craftTypes = [
    { value: "pottery", label: language === 'pa' ? 'ਮਿੱਟੀ ਦੇ ਬਰਤਨ' : language === 'hi' ? 'मिट्टी के बर्तन' : 'Pottery' },
    { value: "weaving", label: language === 'pa' ? 'ਬੁਣਾਈ' : language === 'hi' ? 'बुनाई' : 'Weaving' },
    { value: "jewelry", label: language === 'pa' ? 'ਗਹਿਣੇ' : language === 'hi' ? 'आभूषण' : 'Jewelry' },
    { value: "woodwork", label: language === 'pa' ? 'ਲੱਕੜ ਦਾ ਕੰਮ' : language === 'hi' ? 'लकड़ी का काम' : 'Woodwork' },
    { value: "textile", label: language === 'pa' ? 'ਟੈਕਸਟਾਈਲ' : language === 'hi' ? 'वस्त्र' : 'Textile' },
    { value: "painting", label: language === 'pa' ? 'ਪੇਂਟਿੰਗ' : language === 'hi' ? 'पेंटिंग' : 'Painting' },
    { value: "other", label: language === 'pa' ? 'ਹੋਰ' : language === 'hi' ? 'अन्य' : 'Other' },
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!formData.firstName || !formData.lastName || !formData.email || 
        !formData.phone || !formData.location || !formData.craftType || 
        !formData.password || !formData.confirmPassword) {
      toast.error(language === 'pa' 
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਸਾਰੇ ਖੇਤਰ ਭਰੋ' 
        : language === 'hi'
        ? 'कृपया सभी फ़ੀल्ड भरें'
        : 'Please fill in all fields');
      return;
    }

    if (!formData.email.includes('@')) {
      toast.error(language === 'pa' 
        ? 'ਕਿਰਪਾ ਕਰਕੇ ਇੱਕ ਵੈਧ ਈਮੇਲ ਦਰਜ ਕਰੋ' 
        : language === 'hi'
        ? 'कृपया एक वैध ईमेल दर्ज करें'
        : 'Please enter a valid email');
      return;
    }

    if (formData.password.length < 6) {
      toast.error(language === 'pa' 
        ? 'ਪਾਸਵਰਡ ਘੱਟੋ-ਘੱਟ 6 ਅੱਖਰਾਂ ਦਾ ਹੋਣਾ ਚਾਹੀਦਾ ਹੈ' 
        : language === 'hi'
        ? 'पासवर्ड कम से कम 6 अक्षरों का होना चाहिए'
        : 'Password must be at least 6 characters');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      toast.error(language === 'pa' 
        ? 'ਪਾਸਵਰਡ ਮੇਲ ਨਹੀਂ ਖਾਂਦੇ' 
        : language === 'hi'
        ? 'पासवर्ड मेल नहीं खाते'
        : 'Passwords do not match');
      return;
    }

    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast.success(language === 'pa' 
        ? 'ਖਾਤਾ ਸਫਲਤਾਪੂਰਵਕ ਬਣਾਇਆ ਗਿਆ!' 
        : language === 'hi'
        ? 'खाता सफलतापूर्वक बनाया गया!'
        : 'Account created successfully!');
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
            {language === 'pa' ? 'ਹੋਮ ਤੇ ਵਾਪਸ' : language === 'hi' ? 'होम पर वापस' : 'Back to Home'}
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
              <p className="text-sm text-muted-foreground">{t('signup.joinCommunity')}</p>
            </div>

            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold mb-2">{t('signup.title')}</h1>
                <p className="text-muted-foreground">
                  {t('signup.description')}
                </p>
              </div>

              <form onSubmit={handleSignUp} className="space-y-4">
                {/* First Name and Last Name */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="firstName" className="flex items-center gap-2">
                      <span className="text-primary">👤</span>
                      {t('signup.firstName')}
                    </Label>
                    <Input
                      id="firstName"
                      name="firstName"
                      type="text"
                      placeholder={t('signup.enterFirstName')}
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className="h-12"
                      disabled={isLoading}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="lastName" className="flex items-center gap-2">
                      <span className="text-primary">👤</span>
                      {t('signup.lastName')}
                    </Label>
                    <Input
                      id="lastName"
                      name="lastName"
                      type="text"
                      placeholder={t('signup.enterLastName')}
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className="h-12"
                      disabled={isLoading}
                    />
                  </div>
                </div>

                {/* Email */}
                <div className="space-y-2">
                  <Label htmlFor="email" className="flex items-center gap-2">
                    <span className="text-primary">📧</span>
                    {t('signup.email')}
                  </Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder={t('signup.enterEmail')}
                    value={formData.email}
                    onChange={handleInputChange}
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>

                {/* Phone */}
                <div className="space-y-2">
                  <Label htmlFor="phone" className="flex items-center gap-2">
                    <span className="text-primary">📱</span>
                    {t('signup.phone')}
                  </Label>
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder={t('signup.enterPhone')}
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <Label htmlFor="location" className="flex items-center gap-2">
                    <span className="text-primary">📍</span>
                    {t('signup.location')}
                  </Label>
                  <Input
                    id="location"
                    name="location"
                    type="text"
                    placeholder={t('signup.enterLocation')}
                    value={formData.location}
                    onChange={handleInputChange}
                    className="h-12"
                    disabled={isLoading}
                  />
                </div>

                {/* Craft Type */}
                <div className="space-y-2">
                  <Label htmlFor="craftType" className="flex items-center gap-2">
                    <span className="text-primary">⚒</span>
                    {t('signup.craftType')}
                  </Label>
                  <Select 
                    value={formData.craftType} 
                    onValueChange={(value) => setFormData({...formData, craftType: value})}
                    disabled={isLoading}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder={t('signup.selectCraft')} />
                    </SelectTrigger>
                    <SelectContent>
                      {craftTypes.map((craft) => (
                        <SelectItem key={craft.value} value={craft.value}>
                          {craft.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <Label htmlFor="password" className="flex items-center gap-2">
                    <span className="text-primary">🔒</span>
                    {t('signup.password')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder={t('signup.createPassword')}
                      value={formData.password}
                      onChange={handleInputChange}
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

                {/* Confirm Password */}
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="flex items-center gap-2">
                    <span className="text-primary">🔒</span>
                    {t('signup.confirmPassword')}
                  </Label>
                  <div className="relative">
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder={t('signup.confirmPasswordPlaceholder')}
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className="h-12 pr-10"
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                      disabled={isLoading}
                    >
                      {showConfirmPassword ? '👁' : '👁‍🗨'}
                    </button>
                  </div>
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
                      {language === 'pa' ? 'ਬਣਾਇਆ ਜਾ ਰਿਹਾ ਹੈ...' : language === 'hi' ? 'बनाया जा रहा है...' : 'Creating...'}
                    </>
                  ) : (
                    t('signup.createAccount')
                  )}
                </Button>

                <p className="text-center text-sm text-muted-foreground">
                  {t('signup.alreadyHaveAccount')}{" "}
                  <Link to="/signin" className="text-primary hover:underline font-medium">
                    {t('signup.signInHere')}
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
              {t('signup.startJourney')}
            </h3>
            <p className="text-white/90 text-center mb-8 text-lg">
              {t('signup.journeyDescription')}
            </p>

            <div className="space-y-4">
              {[
                {
                  key: 'freeContent',
                  icon: '✨'
                },
                {
                  key: 'multiLanguage',
                  icon: '🌍'
                },
                {
                  key: 'socialOptimization',
                  icon: '📱'
                },
                {
                  key: 'communitySupport',
                  icon: '👥'
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
                    {t(`signup.${feature.key}`)}
                  </span>
                </div>
              ))}
            </div>

            {/* Stats Section */}
            <div className="mt-8 pt-8 border-t border-white/20">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <div className="text-3xl font-bold mb-1">5000+</div>
                  <div className="text-xs text-white/70">
                    {language === 'pa' ? 'ਕਾਰੀਗਰ' : language === 'hi' ? 'कारीगर' : 'Artisans'}
                  </div>
                </div>
                <div>
                  <div className="text-3xl font-bold mb-1">50K+</div>
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

export default SignUp;