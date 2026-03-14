import { useState, useEffect, useRef } from 'react';
import { Activity, Scale, Ruler, User, RefreshCw, ChevronRight, Info, Sparkles, Bot, Send, MessageCircle } from 'lucide-react';

const BmiCalculator = () => {
    // --- Form & Calculation State ---
    const [unit, setUnit] = useState('metric'); // 'metric' or 'imperial'
    const [heightCm, setHeightCm] = useState('');
    const [heightFt, setHeightFt] = useState('');
    const [heightIn, setHeightIn] = useState('');
    const [weight, setWeight] = useState('');
    const [age, setAge] = useState('');
    const [gender, setGender] = useState('');

    const [bmi, setBmi] = useState(null);
    const [isCalculating, setIsCalculating] = useState(false);
    const [displayBmi, setDisplayBmi] = useState(0);
    const [hasCalculatedOnce, setHasCalculatedOnce] = useState(false);

    // --- AI Chat State ---
    const [chatHistory, setChatHistory] = useState([]);
    const [chatInput, setChatInput] = useState('');
    const [isAiTyping, setIsAiTyping] = useState(false);
    const chatEndRef = useRef(null);

    // --- Constants ---
    const categories = [
        {
            id: 'underweight', label: 'Underweight', max: 18.5, color: 'text-blue-500', bg: 'bg-blue-500', lightBg: 'bg-blue-50', border: 'border-blue-200',
            message: 'Your BMI is lower than the recommended range. Focus on nutrient-dense foods.',
            suggestions: ["What are healthy high-calorie foods?", "How can I build muscle mass?", "Suggest a healthy weight-gain diet plan."]
        },
        {
            id: 'normal', label: 'Normal Weight', max: 24.9, color: 'text-green-500', bg: 'bg-green-500', lightBg: 'bg-green-50', border: 'border-green-200',
            message: 'Great! Your BMI falls within the healthy range. Keep up the good work.',
            suggestions: ["How can I maintain my current weight?", "What are good exercises for cardiovascular health?", "Suggest a balanced weekly meal plan."]
        },
        {
            id: 'overweight', label: 'Overweight', max: 29.9, color: 'text-orange-500', bg: 'bg-orange-500', lightBg: 'bg-orange-50', border: 'border-orange-200',
            message: 'Your BMI suggests you may be overweight. Consider adding more physical activity.',
            suggestions: ["How can I safely create a calorie deficit?", "What are the best low-impact exercises?", "How to reduce sugar cravings?"]
        },
        {
            id: 'obese', label: 'Obese', max: Infinity, color: 'text-red-500', bg: 'bg-red-500', lightBg: 'bg-red-50', border: 'border-red-200',
            message: 'Your BMI indicates obesity. Gradual lifestyle changes can make a big impact.',
            suggestions: ["What are safe exercises for beginners?", "How do I start eating healthier?", "What is a realistic weight loss goal?"]
        }
    ];

    const getCategory = (value: number) => {
        if (!value) return categories[1];
        return categories.find(cat => value <= cat.max) || categories[3];
    };

    const currentCategory = getCategory(displayBmi);

    // --- Auto-Scroll Chat ---
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [chatHistory, isAiTyping]);

    // --- Calculation Logic ---
    const calculateBmiValue = (): number | null => {
        let finalBmi = 0;

        if (unit === "metric") {
            const h = parseFloat(heightCm) / 100;
            const w = parseFloat(weight);

            if (h > 0 && w > 0) {
                finalBmi = w / (h * h);
            }
        } else {
            const hInches =
                parseFloat(heightFt || "0") * 12 +
                parseFloat(heightIn || "0");

            const w = parseFloat(weight);

            if (hInches > 0 && w > 0) {
                finalBmi = 703 * (w / (hInches * hInches));
            }
        }

        return finalBmi > 0 && finalBmi < 100 ? finalBmi : null;
    };

    const handleCalculate = (e) => {
        if (e) e.preventDefault();
        const val = calculateBmiValue();

        if (val) {
            setIsCalculating(true);

            setTimeout(() => {
                setBmi(val);
                setIsCalculating(false);
                setHasCalculatedOnce(true);

                // Initialize chat with a personalized greeting if empty or if metrics changed drastically
                const newCat = getCategory(val);
                setChatHistory([{
                    role: 'ai',
                    text: `Hi there! I've analyzed your profile. Your BMI is **${val.toFixed(1)}**, which falls into the **${newCat.label}** category. How can I assist you with your health, diet, or fitness goals today?`
                }]);
            }, 600);
        }
    };

    // Count-up Animation Effect
    useEffect(() => {
        if (bmi !== null && !isCalculating) {
            let animationFrameId;
            let current = displayBmi;
            const target = bmi;

            const animate = () => {
                const diff = target - current;
                if (Math.abs(diff) < 0.1) {
                    setDisplayBmi(target);
                } else {
                    current += diff * 0.15;
                    setDisplayBmi(current);
                    animationFrameId = requestAnimationFrame(animate);
                }
            };

            animationFrameId = requestAnimationFrame(animate);
            return () => cancelAnimationFrame(animationFrameId);
        }
    }, [bmi, isCalculating]);

    // --- AI Chat Logic ---
    const handleSendMessage = async (customText = null) => {
        const messageText = customText || chatInput;
        if (!messageText.trim()) return;

        // Add user message to UI immediately
        const newHistory = [...chatHistory, { role: 'user', text: messageText }];
        setChatHistory(newHistory);
        setChatInput('');
        setIsAiTyping(true);

        const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
        // API Key provided by execution environment

        // Construct context based on user profile
        const heightStr = unit === 'metric' ? `${heightCm} cm` : `${heightFt} ft ${heightIn} in`;
        const weightStr = `${weight} ${unit === 'metric' ? 'kg' : 'lbs'}`;
        const demographicInfo = `${age ? age + ' years old' : 'Unknown age'}, ${gender ? gender : 'Unknown gender'}`;

        // Format previous conversation for context (limit to last 4 messages to save tokens)
        const recentHistory = newHistory.slice(-5).map(msg => `${msg.role === 'user' ? 'User' : 'AI'}: ${msg.text}`).join('\n');

        const systemPrompt = `
      You are an expert, empathetic, and professional AI Health & Fitness Coach.
      User Profile: ${demographicInfo}, Height: ${heightStr}, Weight: ${weightStr}, BMI: ${displayBmi.toFixed(1)} (${currentCategory.label}).
      
      Instructions:
      1. Provide highly accurate, personalized, and actionable advice based ONLY on the user's provided profile.
      2. Keep answers concise, friendly, and easy to read (use short paragraphs or bullet points).
      3. Do NOT give direct medical diagnoses or prescribe medication. Advise consulting a doctor for serious issues.
      4. Always format your responses using clean Markdown (bolding for emphasis, bullet points for lists).
    `;

        const promptText = `
      Conversation History:
      ${recentHistory}
      
      Respond to the latest User message accurately and supportively.
    `;

        let retries = 5;
        let delay = 1000;
        let success = false;
        let aiResponseText = "";

        while (retries > 0 && !success) {
            try {
                const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${apiKey}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        contents: [{ parts: [{ text: promptText }] }],
                        systemInstruction: { parts: [{ text: systemPrompt }] }
                    })
                });

                if (!response.ok) throw new Error('Network response was not ok');

                const data = await response.json();
                aiResponseText = data.candidates?.[0]?.content?.parts?.[0]?.text;

                if (aiResponseText) {
                    success = true;
                } else {
                    throw new Error('No text returned');
                }
            } catch (error) {
                retries--;
                if (retries === 0) {
                    aiResponseText = "I'm having trouble connecting right now. Please check your connection and try asking again.";
                } else {
                    await new Promise(res => setTimeout(res, delay));
                    delay *= 2;
                }
            }
        }

        setChatHistory(prev => [...prev, { role: 'ai', text: aiResponseText.trim() }]);
        setIsAiTyping(false);
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSendMessage();
        }
    };

    // --- Reset ---
    const handleReset = () => {
        setHeightCm('');
        setHeightFt('');
        setHeightIn('');
        setWeight('');
        setAge('');
        setGender('');
        setBmi(null);
        setDisplayBmi(0);
        setHasCalculatedOnce(false);
        setChatHistory([]);
    };

    // Calculate Marker Position for the Scale (10 to 40)
    const markerPercent = Math.min(Math.max(((displayBmi - 10) / 30) * 100, 0), 100);

    // Helper to safely render simple markdown (bold and line breaks)
    const renderFormattedText = (text) => {
        return text.split('\n').map((line, i) => {
            // Very basic bold parsing (**text**)
            const parts = line.split(/(\*\*.*?\*\*)/g);
            return (
                <span key={i}>
                    {parts.map((part, j) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <strong key={j} className="font-bold">{part.slice(2, -2)}</strong>;
                        }
                        // Parse list items
                        if (part.trim().startsWith('* ')) {
                            return <span key={j} className="flex ml-4 mt-1"><span className="mr-2">•</span><span>{part.replace('* ', '')}</span></span>;
                        }
                        return <span key={j}>{part}</span>;
                    })}
                    {i !== text.split('\n').length - 1 && <br />}
                </span>
            );
        });
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center font-sans text-slate-800">
            <div className="max-w-6xl w-full">

                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center p-3 bg-blue-600 rounded-2xl shadow-lg shadow-blue-500/30 mb-4">
                        <Activity className="w-8 h-8 text-white" />
                    </div>
                    <h1 className="text-4xl font-extrabold text-slate-900 tracking-tight mb-2">Smart BMI Calculator</h1>
                    <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                        Measure your BMI and chat instantly with your personalized AI Health Coach.
                    </p>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

                    {/* LEFT COLUMN: INPUT FORM */}
                    <div className="lg:col-span-4 bg-white/80 backdrop-blur-xl border border-white rounded-3xl p-6 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-fit">

                        {/* Unit Toggle */}
                        <div className="flex p-1 bg-slate-100 rounded-xl mb-6">
                            <button
                                onClick={() => setUnit('metric')}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${unit === 'metric' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Metric
                            </button>
                            <button
                                onClick={() => setUnit('imperial')}
                                className={`flex-1 py-2.5 text-sm font-semibold rounded-lg transition-all duration-300 ${unit === 'imperial' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                            >
                                Imperial
                            </button>
                        </div>

                        <form onSubmit={handleCalculate} className="space-y-5">

                            {/* Gender & Age */}
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                        <User className="w-4 h-4 text-slate-400" /> Gender <span className="text-slate-400 font-normal text-xs">(Opt)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button type="button" onClick={() => setGender('male')} className={`flex-1 py-2 rounded-xl border text-sm transition-all duration-200 ${gender === 'male' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>M</button>
                                        <button type="button" onClick={() => setGender('female')} className={`flex-1 py-2 rounded-xl border text-sm transition-all duration-200 ${gender === 'female' ? 'border-pink-500 bg-pink-50 text-pink-700' : 'border-slate-200 text-slate-600 hover:border-slate-300'}`}>F</button>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold text-slate-700 mb-2">
                                        Age <span className="text-slate-400 font-normal text-xs">(Opt)</span>
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max="120"
                                        value={age}
                                        onChange={(e) => setAge(e.target.value)}
                                        className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none"
                                        placeholder="e.g. 28"
                                    />
                                </div>
                            </div>

                            {/* Height Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                    <Ruler className="w-4 h-4 text-slate-400" /> Height
                                </label>
                                {unit === 'metric' ? (
                                    <div className="relative">
                                        <input
                                            type="number"
                                            value={heightCm}
                                            onChange={(e) => setHeightCm(e.target.value)}
                                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-lg pr-16"
                                            placeholder="170"
                                            required
                                        />
                                        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">cm</span>
                                    </div>
                                ) : (
                                    <div className="flex gap-3">
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={heightFt}
                                                onChange={(e) => setHeightFt(e.target.value)}
                                                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-lg pr-10"
                                                placeholder="5"
                                                required
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">ft</span>
                                        </div>
                                        <div className="relative flex-1">
                                            <input
                                                type="number"
                                                value={heightIn}
                                                onChange={(e) => setHeightIn(e.target.value)}
                                                className="w-full px-3 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-lg pr-10"
                                                placeholder="11"
                                            />
                                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">in</span>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Weight Input */}
                            <div>
                                <label className="block text-sm font-semibold text-slate-700 mb-2 flex items-center gap-1.5">
                                    <Scale className="w-4 h-4 text-slate-400" /> Weight
                                </label>
                                <div className="relative">
                                    <input
                                        type="number"
                                        value={weight}
                                        onChange={(e) => setWeight(e.target.value)}
                                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 outline-none text-lg pr-16"
                                        placeholder={unit === 'metric' ? "70" : "150"}
                                        required
                                    />
                                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">
                                        {unit === 'metric' ? 'kg' : 'lbs'}
                                    </span>
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="pt-2 flex gap-3">
                                <button
                                    type="button"
                                    onClick={handleReset}
                                    className="p-3 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors duration-200 border border-transparent hover:border-slate-200"
                                    aria-label="Reset Calculator"
                                >
                                    <RefreshCw className="w-5 h-5" />
                                </button>
                                <button
                                    type="submit"
                                    disabled={isCalculating}
                                    className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold py-3 px-4 rounded-xl shadow-lg shadow-blue-500/30 transform transition-all duration-200 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCalculating ? (
                                        <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>Calculate BMI <ChevronRight className="w-4 h-4" /></>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>

                    {/* RIGHT COLUMN: RESULTS & AI CHAT */}
                    <div className="lg:col-span-8 flex flex-col gap-6 relative h-full min-h-[500px]">

                        {/* Empty State Overlay */}
                        {!hasCalculatedOnce && !isCalculating && (
                            <div className="absolute inset-0 z-10 bg-white/40 backdrop-blur-[2px] rounded-3xl flex flex-col items-center justify-center text-center p-8 border border-white/60 shadow-[0_8px_30px_rgb(0,0,0,0.04)] h-full">
                                <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mb-6 animate-bounce">
                                    <Scale className="w-10 h-10" />
                                </div>
                                <h3 className="text-2xl font-bold text-slate-800 mb-2">Awaiting Your Details</h3>
                                <p className="text-slate-500 max-w-sm">
                                    Enter your metrics on the left to reveal your BMI score and unlock your personalized AI Health Coach.
                                </p>
                            </div>
                        )}

                        {/* Top Result Card */}
                        <div className={`bg-white border rounded-3xl p-6 sm:p-8 shadow-[0_8px_30px_rgb(0,0,0,0.06)] transition-all duration-700 overflow-hidden relative
              ${hasCalculatedOnce ? currentCategory.lightBg : 'bg-white'} 
              ${hasCalculatedOnce ? currentCategory.border : 'border-slate-100'}`}
                        >
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">

                                {/* Result Value */}
                                <div className="text-center md:text-left">
                                    <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-1">Your Result</h2>
                                    <div className="flex items-baseline justify-center md:justify-start gap-3">
                                        <span className={`text-[4rem] font-black leading-none tracking-tighter transition-colors duration-500 ${hasCalculatedOnce ? currentCategory.color : 'text-slate-200'}`}>
                                            {displayBmi.toFixed(1)}
                                        </span>
                                        {hasCalculatedOnce && (
                                            <span className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide uppercase transition-colors duration-500 ${currentCategory.bg} text-white shadow-sm mb-2`}>
                                                {currentCategory.label}
                                            </span>
                                        )}
                                    </div>
                                </div>

                                {/* Health Meter Bar Mini */}
                                <div className="w-full md:w-1/2 mt-2 md:mt-0">
                                    <div className="flex justify-between text-[10px] font-semibold text-slate-400 mb-1 px-1">
                                        <span>10</span><span>18.5</span><span>25</span><span>30</span><span>40</span>
                                    </div>
                                    <div className="relative h-3 w-full bg-slate-100 rounded-full overflow-hidden flex">
                                        <div className="h-full bg-blue-400 w-[28.33%]" />
                                        <div className="h-full bg-green-500 w-[21.66%]" />
                                        <div className="h-full bg-orange-400 w-[16.66%]" />
                                        <div className="h-full bg-red-500 w-[33.33%]" />
                                        <div
                                            className="absolute top-[-2px] bottom-[-2px] w-1.5 bg-slate-900 rounded-full shadow-md transition-all duration-700 ease-out z-10"
                                            style={{ left: `calc(${markerPercent}% - 3px)`, opacity: displayBmi > 0 ? 1 : 0 }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-600 mt-3 flex items-center gap-2">
                                        <Info className="w-3.5 h-3.5" />
                                        {hasCalculatedOnce ? currentCategory.message : 'Complete form for insights.'}
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bottom AI Chat Card */}
                        {hasCalculatedOnce && (
                            <div className="flex-1 bg-white border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] flex flex-col overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-700">

                                {/* Chat Header */}
                                <div className="bg-gradient-to-r from-indigo-50 to-purple-50 px-6 py-4 border-b border-indigo-100 flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 rounded-full bg-indigo-600 text-white shadow-md shadow-indigo-500/20">
                                            <Sparkles className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-indigo-900">AI Health Coach</h3>
                                            <p className="text-xs text-indigo-600 font-medium">Personalized to your profile</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Chat Messages Area */}
                                <div className="flex-1 p-6 overflow-y-auto space-y-4 min-h-[300px] max-h-[400px] bg-slate-50/50">
                                    {chatHistory.map((msg, index) => (
                                        <div key={index} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                                            <div className={`max-w-[85%] rounded-2xl p-4 text-sm shadow-sm ${msg.role === 'user'
                                                    ? 'bg-blue-600 text-white rounded-br-none'
                                                    : 'bg-white border border-slate-100 text-slate-700 rounded-bl-none'
                                                }`}>
                                                {msg.role === 'ai' ? (
                                                    <div className="flex gap-3">
                                                        <Bot className="w-5 h-5 text-indigo-500 shrink-0 mt-0.5" />
                                                        <div className="leading-relaxed space-y-2">
                                                            {renderFormattedText(msg.text)}
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <p>{msg.text}</p>
                                                )}
                                            </div>
                                        </div>
                                    ))}

                                    {isAiTyping && (
                                        <div className="flex justify-start">
                                            <div className="bg-white border border-slate-100 text-slate-700 rounded-2xl rounded-bl-none p-4 shadow-sm flex items-center gap-2">
                                                <Bot className="w-5 h-5 text-indigo-400" />
                                                <div className="flex gap-1.5">
                                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce"></span>
                                                </div>
                                            </div>
                                        </div>
                                    )}
                                    <div ref={chatEndRef} />
                                </div>

                                {/* Suggested Questions & Input */}
                                <div className="p-4 bg-white border-t border-slate-100 space-y-3">
                                    {/* Suggestions Chips */}
                                    {chatHistory.length <= 3 && !isAiTyping && (
                                        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide px-1">
                                            {currentCategory.suggestions.map((suggestion, idx) => (
                                                <button
                                                    key={idx}
                                                    onClick={() => handleSendMessage(suggestion)}
                                                    className="whitespace-nowrap px-4 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-semibold rounded-full transition-colors border border-indigo-100 flex items-center gap-1.5 shrink-0"
                                                >
                                                    <MessageCircle className="w-3.5 h-3.5" />
                                                    {suggestion}
                                                </button>
                                            ))}
                                        </div>
                                    )}

                                    {/* Input Box */}
                                    <div className="flex items-center gap-2 relative">
                                        <input
                                            type="text"
                                            value={chatInput}
                                            onChange={(e) => setChatInput(e.target.value)}
                                            onKeyDown={handleKeyDown}
                                            placeholder="Ask your AI coach anything..."
                                            disabled={isAiTyping}
                                            className="flex-1 bg-slate-50 border border-slate-200 rounded-full px-5 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all disabled:opacity-50 disabled:bg-slate-100"
                                        />
                                        <button
                                            onClick={() => handleSendMessage()}
                                            disabled={!chatInput.trim() || isAiTyping}
                                            className="absolute right-2 p-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-slate-300 text-white rounded-full transition-colors duration-200 flex items-center justify-center"
                                        >
                                            <Send className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>

                            </div>
                        )}

                    </div>

                </div>
            </div>
        </div>
    );
};

export default BmiCalculator;