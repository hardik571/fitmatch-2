import React, { useState, useMemo } from 'react';
import { 
  User, Shirt, Calendar, Sparkles, Droplets, LogOut, 
  Camera, CheckCircle2, XCircle, ChevronRight, Share2, Save, ShoppingBag, Globe
} from 'lucide-react';
import CameraCapture from './components/CameraCapture';
import ChatAssistant from './components/ChatAssistant';
import ProductCard from './components/ProductCard';
import { analyzeUserImage, matchOutfit, getEventOutfit, getSkincareAdvice } from './services/geminiService';
import { AnalysisResult, OutfitMatchResult, Screen, UserProfile, SkincareRoutine, Language, Product } from './types';
import { MOCK_PRODUCTS } from './data/products';

function App() {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.AUTH);
  const [language, setLanguage] = useState<Language>('en');
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false);
  
  // State for features
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [outfitResult, setOutfitResult] = useState<OutfitMatchResult | null>(null);
  const [eventResult, setEventResult] = useState<string | null>(null);
  const [skincareResult, setSkincareResult] = useState<SkincareRoutine | null>(null);
  
  // Inputs
  const [topImage, setTopImage] = useState<string | null>(null);
  const [bottomImage, setBottomImage] = useState<string | null>(null);
  const [eventType, setEventType] = useState<string>('Wedding');
  const [skinTypeInput, setSkinTypeInput] = useState<string>('Combination');

  // Global active image for Chat Context
  const [activeImage, setActiveImage] = useState<string | null>(null);

  // --- Translations ---
  const t = {
    en: {
      title: 'FitMatch AI',
      subtitle: 'Your personal AI stylist, outfit matcher, and grooming assistant.',
      login: 'Get Started with Google',
      nav_profile: 'Profile',
      nav_analyze: 'Analyze',
      nav_match: 'Match',
      nav_events: 'Events',
      nav_care: 'Care',
      nav_shop: 'Shop',
      hello: 'Hello',
      analyze_title: 'AI Body & Face Analysis',
      match_title: 'Outfit Compatibility',
      event_title: 'Event Stylist',
      care_title: 'Grooming & Skincare',
      shop_title: 'Shop The Look',
      profile_stats: 'Your Style Profile',
      analyzed: 'Analyzed',
      take_photo: 'Take a Selfie',
      upload_photo: 'Upload a photo to see your AI analysis here.',
      analyzing: 'AI is analyzing your features...',
      match_btn: 'Check Outfit Match',
      event_btn: 'Get Outfit for',
      care_btn: 'Generate Routine',
      shop_desc: 'Smart recommendations based on your AI profile.',
      buy_btn: 'Buy Now',
      top_picks: 'Top Picks for You',
      trending: 'Trending Now',
      why_match: 'Why this matches you',
      color_match: 'Matches your best colors',
      combos_title: 'Best Outfit Combinations for You',
      style: 'Style',
      top: 'Top',
      bottom: 'Bottom',
      shoes: 'Footwear',
      rec_palette: 'Recommended Palette',
      physical_profile: 'Physical Profile',
      styling_profile: 'Styling Profile'
    },
    hi: {
      title: 'फिटमैच AI',
      subtitle: 'आपका व्यक्तिगत AI स्टाइलिस्ट और ग्रूमिंग असिस्टेंट।',
      login: 'Google से शुरू करें',
      nav_profile: 'प्रोफाइल',
      nav_analyze: 'जांचें',
      nav_match: 'मैच',
      nav_events: 'इवेंट्स',
      nav_care: 'देखभाल',
      nav_shop: 'शॉपिंग',
      hello: 'नमस्ते',
      analyze_title: 'AI चेहरा और शरीर विश्लेषण',
      match_title: 'आउटफिट मिलान',
      event_title: 'इवेंट स्टाइलिस्ट',
      care_title: 'ग्रूमिंग और स्किनकेयर',
      shop_title: 'शॉपिंग और सिफारिशें',
      profile_stats: 'आपका स्टाइल प्रोफाइल',
      analyzed: 'विश्लेषण किया गया',
      take_photo: 'सेल्फी लें',
      upload_photo: 'अपना AI विश्लेषण देखने के लिए फोटो अपलोड करें।',
      analyzing: 'AI आपके फीचर्स का विश्लेषण कर रहा है...',
      match_btn: 'मैच चेक करें',
      event_btn: 'इसके लिए आउटफिट',
      care_btn: 'रूटीन बनाएं',
      shop_desc: 'आपके AI प्रोफाइल पर आधारित स्मार्ट सिफारिशें।',
      buy_btn: 'अभी खरीदें',
      top_picks: 'आपके लिए खास',
      trending: 'ट्रेंडिंग फैशन',
      why_match: 'यह आपको क्यों जचता है',
      color_match: 'आपके रंगों से मेल खाता है',
      combos_title: 'आपके लिए बेहतरीन आउटफिट सुझाव',
      style: 'शैली',
      top: 'ऊपरी कपड़ा',
      bottom: 'निचला कपड़ा',
      shoes: 'जूते',
      rec_palette: 'सुझाए गए रंग',
      physical_profile: 'शारीरिक रूपरेखा',
      styling_profile: 'स्टाइलिंग प्रोफाइल'
    }
  };

  const txt = t[language];

  // --- Feature Handlers ---

  const handleLogin = () => {
    setUser({ uid: '123', name: 'Style Icon', photoURL: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80' });
    setCurrentScreen(Screen.HOME);
  };

  const handleAnalyzeProfile = async (base64: string) => {
    setActiveImage(base64);
    setLoading(true);
    try {
      const result = await analyzeUserImage(base64, language);
      setAnalysisResult(result);
      if (user) setUser({...user, analyzedData: result});
    } catch (e) {
      alert("Analysis failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOutfitMatch = async () => {
    if (!topImage || !bottomImage) return;
    setLoading(true);
    try {
      const result = await matchOutfit(topImage, bottomImage, language);
      setOutfitResult(result);
    } catch (e) {
      alert("Matching failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleEventSuggestion = async () => {
    setLoading(true);
    try {
      const result = await getEventOutfit(eventType, user?.analyzedData, language);
      setEventResult(result);
    } catch (e) {
      alert("Suggestion failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSkincare = async () => {
    setLoading(true);
    try {
      const result = await getSkincareAdvice(skinTypeInput, language);
      setSkincareResult(result);
    } catch (e) {
      alert("Failed to get skincare advice.");
    } finally {
      setLoading(false);
    }
  };

  // --- Smart Product Recommendation Logic ---
  const recommendedProducts = useMemo(() => {
    let products = [...MOCK_PRODUCTS];

    if (!user?.analyzedData) {
      // If no analysis, just return products with random scores
      return products.map(p => ({ ...p, matchScore: Math.floor(Math.random() * 20) + 70 }));
    }

    const { bestColors, bodyType, skinTone } = user.analyzedData;

    // Scoring Algorithm
    return products.map(product => {
      let score = 70; // Base score

      // 1. Color Match
      const colorMatch = product.colors.some(pc => 
        bestColors.some(bc => bc.toLowerCase().includes(pc.toLowerCase()) || pc.toLowerCase().includes(bc.toLowerCase()))
      );
      if (colorMatch) score += 15;

      // 2. Body Type adjustments (Simple heuristic)
      if (bodyType.toLowerCase().includes('slim') && product.tags.includes('Slim')) score += 10;
      if (bodyType.toLowerCase().includes('average') && product.tags.includes('Casual')) score += 5;
      if (bodyType.toLowerCase().includes('broad') && product.tags.includes('Structured')) score += 10;

      // 3. Skin Tone heuristics
      if (skinTone.toLowerCase().includes('fair') && product.colors.includes('Dark')) score += 5;
      if (skinTone.toLowerCase().includes('deep') && product.colors.includes('Pastel')) score += 5;
      if (skinTone.toLowerCase().includes('medium') && product.colors.includes('Beige')) score += 5;

      return { ...product, matchScore: Math.min(score, 99) };
    }).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [user?.analyzedData]);


  const handleCaptureTop = (base64: string) => { setTopImage(base64); setActiveImage(base64); };
  const handleCaptureBottom = (base64: string) => { setBottomImage(base64); setActiveImage(base64); };

  const toggleLanguage = () => setLanguage(prev => prev === 'en' ? 'hi' : 'en');

  // --- Navigation ---
  const NavItem = ({ screen, icon: Icon, label }: { screen: Screen, icon: any, label: string }) => (
    <button 
      onClick={() => setCurrentScreen(screen)}
      className={`flex flex-col items-center p-2 text-xs md:text-sm font-medium transition ${currentScreen === screen ? 'text-indigo-600' : 'text-gray-400 hover:text-gray-600'}`}
    >
      <Icon size={24} className={`mb-1 ${currentScreen === screen ? 'stroke-2' : 'stroke-1'}`} />
      {label}
    </button>
  );

  // --- Screens ---

  if (currentScreen === Screen.AUTH) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-4 relative">
        <button 
          onClick={toggleLanguage}
          className="absolute top-6 right-6 bg-white/20 backdrop-blur text-white px-4 py-2 rounded-full flex items-center gap-2 font-medium hover:bg-white/30 transition"
        >
          <Globe size={18} />
          {language === 'en' ? 'Hindi' : 'English'}
        </button>

        <div className="bg-white rounded-3xl shadow-2xl p-8 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Sparkles size={40} className="text-indigo-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">{txt.title}</h1>
          <p className="text-gray-500 mb-8">{txt.subtitle}</p>
          <button 
            onClick={handleLogin}
            className="w-full bg-indigo-600 text-white py-3 rounded-xl font-semibold shadow-lg hover:bg-indigo-700 transition flex items-center justify-center gap-2"
          >
            <span>{txt.login}</span>
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20 md:pb-0 md:pl-20 font-sans">
      {/* Sidebar/Nav */}
      <nav className="fixed md:left-0 md:top-0 md:bottom-0 bottom-0 left-0 right-0 bg-white md:w-20 w-full border-t md:border-t-0 md:border-r border-gray-200 z-40 flex md:flex-col flex-row justify-around md:justify-start items-center py-2 md:py-8 md:gap-6 overflow-x-auto md:overflow-x-visible no-scrollbar">
        <div className="hidden md:block mb-2">
          <Sparkles size={32} className="text-indigo-600" />
        </div>
        <NavItem screen={Screen.HOME} icon={User} label={txt.nav_profile} />
        <NavItem screen={Screen.ANALYZE_ME} icon={Camera} label={txt.nav_analyze} />
        <NavItem screen={Screen.OUTFIT_MATCH} icon={Shirt} label={txt.nav_match} />
        <NavItem screen={Screen.SHOP} icon={ShoppingBag} label={txt.nav_shop} />
        <NavItem screen={Screen.EVENT_STYLIST} icon={Calendar} label={txt.nav_events} />
        <NavItem screen={Screen.SKINCARE} icon={Droplets} label={txt.nav_care} />
        
        <div className="md:mt-auto flex flex-col gap-4 items-center">
          <button onClick={toggleLanguage} className="p-2 bg-indigo-50 text-indigo-600 rounded-lg text-xs font-bold">
            {language.toUpperCase()}
          </button>
          <button onClick={() => setCurrentScreen(Screen.AUTH)} className="p-2 text-gray-400 hover:text-red-500 hidden md:block">
            <LogOut size={24} />
          </button>
        </div>
      </nav>

      {/* Content Area */}
      <main className="max-w-5xl mx-auto p-6 md:p-10">
        
        {/* --- HOME / PROFILE SCREEN --- */}
        {currentScreen === Screen.HOME && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-4 mb-8">
              <img src={user?.photoURL} alt="User" className="w-16 h-16 rounded-full border-2 border-indigo-600" />
              <div>
                <h2 className="text-2xl font-bold text-gray-800">{txt.hello}, {user?.name}</h2>
                <p className="text-gray-500">{txt.subtitle}</p>
              </div>
            </div>

            {user?.analyzedData ? (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <Sparkles size={20} className="text-yellow-500" />
                  {txt.profile_stats}
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                  <div className="p-4 bg-indigo-50 rounded-xl">
                    <p className="text-xs text-indigo-600 uppercase font-bold">Face Shape</p>
                    <p className="font-medium text-gray-800">{user.analyzedData.faceShape}</p>
                  </div>
                  <div className="p-4 bg-pink-50 rounded-xl">
                    <p className="text-xs text-pink-600 uppercase font-bold">Skin Tone</p>
                    <p className="font-medium text-gray-800">{user.analyzedData.skinTone}</p>
                  </div>
                  <div className="p-4 bg-blue-50 rounded-xl">
                    <p className="text-xs text-blue-600 uppercase font-bold">Body Type</p>
                    <p className="font-medium text-gray-800">{user.analyzedData.bodyType}</p>
                  </div>
                  <div className="p-4 bg-purple-50 rounded-xl">
                    <p className="text-xs text-purple-600 uppercase font-bold">Lookalike</p>
                    <p className="font-medium text-gray-800">{user.analyzedData.lookalike}</p>
                  </div>
                </div>

                {/* Best Outfit Combinations - NEW */}
                {user.analyzedData.outfitCombinations && (
                  <div className="mb-6">
                    <h4 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                      <Shirt size={20} className="text-indigo-600" />
                      {txt.combos_title}
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {user.analyzedData.outfitCombinations.map((combo, idx) => (
                        <div key={idx} className="bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl p-4 border border-gray-200 shadow-sm hover:shadow-md transition">
                          <div className="flex items-center justify-between mb-3">
                            <span className="px-2 py-1 bg-white text-indigo-700 text-xs font-bold uppercase rounded border border-indigo-100">{combo.style}</span>
                            <span className="text-gray-400 text-xs">#{idx + 1}</span>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div className="flex gap-2 items-start">
                              <span className="text-gray-500 font-medium min-w-[60px] text-xs uppercase mt-0.5">{txt.top}</span>
                              <span className="text-gray-800 font-medium">{combo.top}</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="text-gray-500 font-medium min-w-[60px] text-xs uppercase mt-0.5">{txt.bottom}</span>
                              <span className="text-gray-800 font-medium">{combo.bottom}</span>
                            </div>
                            <div className="flex gap-2 items-start">
                              <span className="text-gray-500 font-medium min-w-[60px] text-xs uppercase mt-0.5">{txt.shoes}</span>
                              <span className="text-gray-800 font-medium">{combo.footwear}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                
                <div>
                  <h4 className="text-sm font-semibold text-gray-700 mb-3">{txt.rec_palette}</h4>
                  <div className="flex flex-wrap gap-2">
                    {user.analyzedData.bestColors.map((color, i) => (
                      <span key={i} className="px-3 py-1 bg-gray-100 rounded-full text-sm text-gray-700 border border-gray-200">{color}</span>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-center py-12 bg-white rounded-2xl border-2 border-dashed border-gray-300">
                <Camera size={48} className="mx-auto text-gray-300 mb-4" />
                <p className="text-gray-500 mb-4">{txt.upload_photo}</p>
                <button 
                  onClick={() => setCurrentScreen(Screen.ANALYZE_ME)}
                  className="bg-indigo-600 text-white px-6 py-2 rounded-full hover:bg-indigo-700 transition"
                >
                  {txt.nav_analyze}
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- ANALYZE SCREEN --- */}
        {currentScreen === Screen.ANALYZE_ME && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{txt.analyze_title}</h2>
            
            {!analysisResult && !loading && (
              <CameraCapture onCapture={handleAnalyzeProfile} label={txt.take_photo} aspectRatio="square" />
            )}

            {loading && (
              <div className="text-center py-20">
                <div className="w-12 h-12 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-indigo-600 font-medium">{txt.analyzing}</p>
              </div>
            )}

            {analysisResult && (
              <div className="bg-white rounded-2xl shadow-lg p-6 animate-fade-in">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-bold text-gray-800">{txt.analyzed}</h3>
                  <button onClick={() => setAnalysisResult(null)} className="text-sm text-indigo-600 hover:underline">Analyze Again</button>
                </div>

                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">{txt.physical_profile}</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex justify-between border-b border-gray-100 pb-1"><span>Face Shape:</span> <span className="font-medium text-gray-900">{analysisResult.faceShape}</span></li>
                        <li className="flex justify-between border-b border-gray-100 pb-1"><span>Skin Tone:</span> <span className="font-medium text-gray-900">{analysisResult.skinTone}</span></li>
                        <li className="flex justify-between border-b border-gray-100 pb-1"><span>Body Type:</span> <span className="font-medium text-gray-900">{analysisResult.bodyType}</span></li>
                      </ul>
                    </div>
                    <div>
                      <h4 className="font-semibold text-gray-700 mb-2">{txt.styling_profile}</h4>
                      <ul className="space-y-2 text-sm text-gray-600">
                        <li className="flex justify-between border-b border-gray-100 pb-1"><span>Celebrity Twin:</span> <span className="font-medium text-gray-900">{analysisResult.lookalike}</span></li>
                        <li className="flex justify-between border-b border-gray-100 pb-1"><span>Hairstyle:</span> <span className="font-medium text-gray-900 truncate max-w-[150px]">{analysisResult.hairstyle}</span></li>
                        <li className="flex justify-between border-b border-gray-100 pb-1"><span>Sunglasses:</span> <span className="font-medium text-gray-900">{analysisResult.sunglasses}</span></li>
                      </ul>
                    </div>
                  </div>

                  {/* Outfit Combinations List */}
                  {analysisResult.outfitCombinations && (
                     <div className="bg-indigo-50 rounded-xl p-4 border border-indigo-100">
                        <h4 className="font-semibold text-indigo-800 mb-3">{txt.combos_title}</h4>
                        <div className="space-y-3">
                          {analysisResult.outfitCombinations.map((combo, i) => (
                            <div key={i} className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm bg-white p-3 rounded-lg shadow-sm">
                               <span className="font-bold text-gray-700 min-w-[80px]">{combo.style}:</span>
                               <span className="text-gray-600">{combo.top} + {combo.bottom} + {combo.footwear}</span>
                            </div>
                          ))}
                        </div>
                     </div>
                  )}
                </div>
                
                <button 
                  onClick={() => setCurrentScreen(Screen.SHOP)}
                  className="w-full mt-8 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition flex items-center justify-center gap-2"
                >
                  <ShoppingBag size={18} />
                  See Recommended Clothes
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- OUTFIT MATCH SCREEN --- */}
        {currentScreen === Screen.OUTFIT_MATCH && (
          <div className="max-w-4xl mx-auto">
             <h2 className="text-2xl font-bold mb-6">{txt.match_title}</h2>
             
             <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
               <CameraCapture onCapture={handleCaptureTop} label="Upper Wear (Shirt/Top)" />
               <CameraCapture onCapture={handleCaptureBottom} label="Lower Wear (Pant/Skirt)" />
             </div>

             <div className="flex justify-center mb-8">
               <button 
                 onClick={handleOutfitMatch}
                 disabled={!topImage || !bottomImage || loading}
                 className="bg-indigo-600 text-white px-8 py-3 rounded-full text-lg font-semibold shadow-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center gap-2"
               >
                 {loading ? 'Analyzing...' : txt.match_btn}
                 {!loading && <Sparkles size={20} />}
               </button>
             </div>

             {outfitResult && (
               <div className="bg-white rounded-2xl shadow-xl overflow-hidden animate-slide-up">
                 <div className={`p-6 text-white text-center ${outfitResult.score > 70 ? 'bg-green-500' : outfitResult.score > 40 ? 'bg-yellow-500' : 'bg-red-500'}`}>
                   <h3 className="text-4xl font-bold mb-2">{outfitResult.score}%</h3>
                   <p className="text-xl font-medium opacity-90">{outfitResult.verdict}</p>
                 </div>
                 
                 <div className="p-8">
                   <h4 className="font-bold text-gray-800 mb-2">Why?</h4>
                   <p className="text-gray-600 mb-6 leading-relaxed">{outfitResult.reasoning}</p>
                   
                   <h4 className="font-bold text-gray-800 mb-3">Stylist Tips</h4>
                   <div className="space-y-3">
                     {outfitResult.styleTips.map((tip, i) => (
                       <div key={i} className="flex gap-3 items-start p-3 bg-indigo-50 rounded-lg">
                         <CheckCircle2 size={20} className="text-indigo-600 flex-shrink-0 mt-0.5" />
                         <p className="text-sm text-gray-700">{tip}</p>
                       </div>
                     ))}
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}

        {/* --- SHOPPING SCREEN (NEW) --- */}
        {currentScreen === Screen.SHOP && (
           <div>
             <div className="flex items-center justify-between mb-6">
               <div>
                 <h2 className="text-2xl font-bold text-gray-900">{txt.shop_title}</h2>
                 <p className="text-gray-500 text-sm">{txt.shop_desc}</p>
               </div>
               {!user?.analyzedData && (
                 <button 
                   onClick={() => setCurrentScreen(Screen.ANALYZE_ME)}
                   className="text-indigo-600 text-sm font-medium hover:underline flex items-center gap-1"
                 >
                   Analyze Profile for Better Matches <ChevronRight size={14} />
                 </button>
               )}
             </div>

             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
               {recommendedProducts.map(product => (
                 <ProductCard key={product.id} product={product} language={language} />
               ))}
             </div>
           </div>
        )}

        {/* --- EVENT STYLIST SCREEN --- */}
        {currentScreen === Screen.EVENT_STYLIST && (
          <div className="max-w-2xl mx-auto">
            <h2 className="text-2xl font-bold mb-6">{txt.event_title}</h2>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">What's the occasion?</label>
              <select 
                value={eventType}
                onChange={(e) => setEventType(e.target.value)}
                className="w-full p-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
              >
                <option>Wedding (Guest)</option>
                <option>Diwali Party</option>
                <option>Job Interview</option>
                <option>First Date</option>
                <option>College Fest</option>
                <option>Clubbing</option>
                <option>Travel / Vacation</option>
              </select>
              
              <button 
                onClick={handleEventSuggestion}
                disabled={loading}
                className="w-full mt-6 bg-black text-white py-3 rounded-xl hover:bg-gray-800 transition"
              >
                {loading ? 'Generating Look...' : `${txt.event_btn} ${eventType}`}
              </button>
            </div>

            {eventResult && (
              <div className="bg-white p-8 rounded-2xl shadow-lg animate-fade-in prose prose-indigo max-w-none">
                <div className="flex justify-between items-center mb-4 not-prose">
                  <h3 className="text-xl font-bold text-indigo-900">Stylist's Recommendation</h3>
                  <button className="text-gray-400 hover:text-indigo-600"><Share2 size={20} /></button>
                </div>
                {/* Basic markdown rendering */}
                <div className="whitespace-pre-wrap text-gray-700 leading-relaxed">
                  {eventResult}
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- SKINCARE SCREEN --- */}
        {currentScreen === Screen.SKINCARE && (
          <div className="max-w-2xl mx-auto">
             <h2 className="text-2xl font-bold mb-6">{txt.care_title}</h2>
             
             <div className="flex flex-wrap gap-3 mb-8">
               {['Oily', 'Dry', 'Combination', 'Sensitive', 'Normal'].map(type => (
                 <button
                   key={type}
                   onClick={() => setSkinTypeInput(type)}
                   className={`px-4 py-2 rounded-full text-sm font-medium transition ${skinTypeInput === type ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:border-indigo-300'}`}
                 >
                   {type}
                 </button>
               ))}
             </div>

             <button 
                onClick={handleSkincare}
                disabled={loading}
                className="w-full bg-teal-600 text-white py-3 rounded-xl hover:bg-teal-700 transition mb-8 flex items-center justify-center gap-2"
              >
                <Droplets size={18} />
                {loading ? 'Consulting Dermatologist AI...' : txt.care_btn}
             </button>

             {skincareResult && (
               <div className="space-y-6 animate-slide-up">
                 <div className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                   <h3 className="font-bold text-orange-800 mb-4 flex items-center gap-2">
                     ☀️ Morning Routine
                   </h3>
                   <ul className="space-y-3">
                     {skincareResult.morning.map((step, i) => (
                       <li key={i} className="flex gap-3 text-sm text-orange-900">
                         <span className="font-bold opacity-50">{i+1}.</span>
                         {step}
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="bg-indigo-50 p-6 rounded-2xl border border-indigo-100">
                   <h3 className="font-bold text-indigo-800 mb-4 flex items-center gap-2">
                     🌙 Evening Routine
                   </h3>
                   <ul className="space-y-3">
                     {skincareResult.evening.map((step, i) => (
                       <li key={i} className="flex gap-3 text-sm text-indigo-900">
                         <span className="font-bold opacity-50">{i+1}.</span>
                         {step}
                       </li>
                     ))}
                   </ul>
                 </div>

                 <div className="bg-white p-6 rounded-2xl border border-gray-200">
                   <h3 className="font-bold text-gray-800 mb-4">Recommended Products</h3>
                   <div className="flex flex-wrap gap-2">
                     {skincareResult.products.map((prod, i) => (
                       <span key={i} className="px-3 py-1 bg-gray-100 text-gray-600 text-xs rounded-md font-medium">{prod}</span>
                     ))}
                   </div>
                 </div>
               </div>
             )}
          </div>
        )}
      </main>

      {/* Global Chatbot */}
      {currentScreen !== Screen.AUTH && <ChatAssistant activeImage={activeImage} />}
    </div>
  );
}

export default App;