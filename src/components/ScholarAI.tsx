import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Key, Trash2, Paperclip, FileText, X, Settings2, ExternalLink, BookOpen, Brain, CheckCircle, Calendar, ChevronRight, ChevronLeft, RefreshCw, Trophy, AlertCircle } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
    role: 'user' | 'model';
    text: string;
}

interface Flashcard {
    question: string;
    answer: string;
}

interface QuizQuestion {
    question: string;
    possible_answers: string[];
    index: number;
    explanation: string;
    related_topic?: string;
}

interface ScheduleSession {
    day_offset: number;
    title: string;
    details: string;
    duration_minutes: number;
    type: 'learning' | 'revision' | 'quiz';
    difficulty: 'Easy' | 'Medium' | 'Hard';
    completed?: boolean;
}

interface StudyGuide {
    id: string;
    title: string;
    summary: string;
    overall_difficulty: 'Easy' | 'Medium' | 'Hard';
    recommended_daily_hours: number;
    workload_balance_tip: string;
    topics: { name: string; difficulty: string }[];
    study_tips: string[];
    flash_cards: [string, string][];
    quiz: QuizQuestion[];
    study_schedule: ScheduleSession[];
    created_at: number;
    filename: string;
}

const ScholarAI = () => {
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hello! I am your Scholar AI assistant. Upload a document to generate a full study guide or just chat to get started.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [activeTab, setActiveTab] = useState('chat');

    // File states
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');

    // Study Guide states
    const [studyGuide, setStudyGuide] = useState<StudyGuide | null>(null);
    const [currentCardIndex, setCurrentCardIndex] = useState(0);
    const [isCardFlipped, setIsCardFlipped] = useState(false);
    const [quizScores, setQuizScores] = useState<Record<number, number>>({});
    const [quizSubmitted, setQuizSubmitted] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
            setHasKey(true);
        }

        const storedGuide = localStorage.getItem('last_study_guide');
        if (storedGuide) {
            try {
                setStudyGuide(JSON.parse(storedGuide));
            } catch (e) {
                console.error("Failed to parse stored guide", e);
            }
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, hasKey]);

    const handleSaveKey = () => {
        if (apiKey.trim().length === 0) {
            toast({ title: "API Key Required", description: "Please enter a valid Google Gemini API Key.", variant: "destructive" });
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey);
        setHasKey(true);
        setShowSettings(false);
        toast({ title: "API Key Saved", description: "Your key is updated. Ready to research!" });
    };

    const handleClearKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setHasKey(false);
        setShowSettings(false);
        toast({ title: "API Key Removed", description: "Your API key has been removed." });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 10 * 1024 * 1024) { // 10MB limit
            toast({ title: "File too large", description: "Please upload files under 10MB.", variant: "destructive" });
            return;
        }

        setSelectedFile(file);
        setIsLoading(true);

        try {
            let content = '';
            if (file.type === 'application/pdf') {
                const arrayBuffer = await file.arrayBuffer();
                const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
                for (let i = 1; i <= pdf.numPages; i++) {
                    const page = await pdf.getPage(i);
                    const textContent = await page.getTextContent();
                    content += textContent.items.map((item: any) => item.str).join(' ') + '\n';
                }
            } else {
                content = await file.text();
            }
            setFileContent(content);
            toast({ title: "File Processed", description: `${file.name} is ready for analysis.` });
        } catch (error) {
            console.error("File reading error:", error);
            toast({ title: "Error reading file", description: "Could not extract text from this file.", variant: "destructive" });
            setSelectedFile(null);
            setFileContent(''); // Clear content on error
        } finally {
            setIsLoading(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const generateFullGuide = async () => {
        if (!fileContent || !hasKey) return;

        setIsLoading(true);
        setActiveTab('chat');
        setMessages(prev => [...prev, { role: 'user', text: `Generate a comprehensive study guide for ${selectedFile?.name}` }]);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            const prompt = `
            You are an expert study planner. Analyze the following material and generate a comprehensive study system.
            MATERIAL CONTENT:
            ${fileContent.substring(0, 20000)}

            Return a SINGLE VALID JSON object with this EXACT structure:
            {
                "title": "Descriptive Title",
                "summary": "Detailed 3-paragraph summary",
                "overall_difficulty": "Easy|Medium|Hard",
                "recommended_daily_hours": 1.5,
                "workload_balance_tip": "One concise tip on balancing this subject",
                "topics": [{"name": "Topic A", "difficulty": "Hard"}],
                "study_tips": ["Tip 1", "Tip 2"],
                "flash_cards": [["Question", "Answer"]], (min 10)
                "quiz": [{"question": "Q1", "possible_answers": ["A","B","C","D"], "index": 0, "explanation": "Why..."}], (min 10)
                "study_schedule": [{"day_offset": 1, "title": "Day 1", "details": "Study...", "duration_minutes": 45, "type": "learning", "difficulty": "Hard"}]
            }
            Return ONLY the JSON. No markdown wrappers.
          `;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            let text = response.text().trim();

            // Clean JSON if Gemini wrapped it in markdown
            if (text.startsWith('```json')) text = text.replace(/```json|```/g, '');
            else if (text.startsWith('```')) text = text.replace(/```/g, '');

            const guideData = JSON.parse(text);
            const fullGuide: StudyGuide = {
                ...guideData,
                id: Math.random().toString(36).substr(2, 9),
                created_at: Date.now(),
                filename: selectedFile?.name || 'document'
            };

            setStudyGuide(fullGuide);
            localStorage.setItem('last_study_guide', JSON.stringify(fullGuide));
            setMessages(prev => [...prev, { role: 'model', text: `Study guide for "${fullGuide.title}" generated successfully! Use the tabs to explore.` }]);
            setActiveTab('summary');
            toast({ title: "Study Guide Ready", description: "Click the tabs to view flashcards, quiz, and schedule." });
        } catch (error: any) {
            console.error("Generation error:", error);
            toast({ title: "Generation Failed", description: "AI could not generate the structured guide. Check console.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || !hasKey) return;
        const userMessage = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
        setIsLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });
            let prompt = userMessage;
            if (fileContent) {
                prompt = `Reference Material:\n${fileContent.substring(0, 10000)}\n\nQuery: ${userMessage}`;
            }
            const result = await model.generateContent(prompt);
            const response = await result.response;
            setMessages(prev => [...prev, { role: 'model', text: response.text() }]);
        } catch (error: any) {
            toast({ title: "AI Error", description: error.message || "Failed to respond.", variant: "destructive" });
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSession = (index: number) => {
        if (!studyGuide) return;
        const newGuide = { ...studyGuide };
        newGuide.study_schedule[index].completed = !newGuide.study_schedule[index].completed;
        setStudyGuide(newGuide);
        localStorage.setItem('last_study_guide', JSON.stringify(newGuide));
    };

    if (!hasKey) {
        return (
            <Card className="glass-card h-full flex flex-col justify-center items-center p-8 text-center animate-fade-in relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pop via-blue-500 to-pop" />
                <div className="bg-pop/10 p-4 rounded-full mb-4">
                    <Bot className="h-12 w-12 text-pop" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Setup Scholar AI</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">Provide your Google Gemini API Key to unlock research assistance and study guide generation.</p>
                <div className="w-full max-w-sm space-y-4">
                    <div className="relative text-left">
                        <label className="text-xs font-semibold text-muted-foreground ml-1 mb-1 block">Google Gemini API Key</label>
                        <div className="relative">
                            <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="password"
                                placeholder="Paste key here (e.g., AIza...)"
                                className="pl-10 bg-black/40 border-white/10"
                                value={apiKey}
                                onChange={(e) => setApiKey(e.target.value)}
                            />
                        </div>
                    </div>
                    <Button onClick={handleSaveKey} className="w-full bg-pop hover:bg-pop/90 text-white shadow-lg shadow-pop/20">
                        Start Researching
                    </Button>
                    <div className="pt-2">
                        <a
                            href="https://makersuite.google.com/app/apikey"
                            target="_blank"
                            rel="noreferrer"
                            className="text-xs text-pop hover:underline flex items-center justify-center gap-1"
                        >
                            Get a free key from Google AI Studio <ExternalLink className="h-3 w-3" />
                        </a>
                    </div>
                </div>
            </Card>
        );
    }

    return (
        <Card className="glass-card h-[650px] flex flex-col overflow-hidden animate-fade-in relative border-white/5">
            <CardHeader className="border-b border-white/10 pb-2 bg-black/40">
                <div className="flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="bg-pop/20 p-2 rounded-xl">
                            <Bot className="h-5 w-5 text-pop" />
                        </div>
                        <div>
                            <CardTitle className="text-base font-bold">Scholar AI</CardTitle>
                            <p className="text-[10px] text-muted-foreground">Gemini 2.5 Flash-Lite Active</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        <Button variant="ghost" size="icon" onClick={() => setShowSettings(!showSettings)} className={cn("h-8 w-8", showSettings && "bg-white/10 text-pop")}><Settings2 className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => { localStorage.removeItem('last_study_guide'); setStudyGuide(null); setMessages([{ role: 'model', text: 'Hello! I am your Scholar AI assistant. Upload a document to generate a full study guide or just chat to get started.' }]); setSelectedFile(null); setFileContent(''); }} className="h-8 w-8 hover:bg-destructive/10 group" title="Clear Study Guide"><RefreshCw className="h-4 w-4 text-muted-foreground group-hover:text-destructive" /></Button>
                    </div>
                </div>
            </CardHeader>

            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                <div className="px-4 border-b border-white/5 bg-black/20">
                    <TabsList className="bg-transparent h-10 w-full justify-start gap-4 p-0">
                        <TabsTrigger value="chat" className="data-[state=active]:bg-transparent data-[state=active]:text-pop data-[state=active]:border-b-2 data-[state=active]:border-pop rounded-none px-2 h-full text-xs transition-none">Chat</TabsTrigger>
                        {studyGuide && (
                            <>
                                <TabsTrigger value="summary" className="data-[state=active]:bg-transparent data-[state=active]:text-pop data-[state=active]:border-b-2 data-[state=active]:border-pop rounded-none px-2 h-full text-xs transition-none">Summary</TabsTrigger>
                                <TabsTrigger value="flashcards" className="data-[state=active]:bg-transparent data-[state=active]:text-pop data-[state=active]:border-b-2 data-[state=active]:border-pop rounded-none px-2 h-full text-xs transition-none">Cards</TabsTrigger>
                                <TabsTrigger value="quiz" className="data-[state=active]:bg-transparent data-[state=active]:text-pop data-[state=active]:border-b-2 data-[state=active]:border-pop rounded-none px-2 h-full text-xs transition-none">Quiz</TabsTrigger>
                                <TabsTrigger value="schedule" className="data-[state=active]:bg-transparent data-[state=active]:text-pop data-[state=active]:border-b-2 data-[state=active]:border-pop rounded-none px-2 h-full text-xs transition-none">Plan</TabsTrigger>
                            </>
                        )}
                    </TabsList>
                </div>

                {/* Chat Content */}
                <TabsContent value="chat" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
                    <ScrollArea className="flex-1 p-4">
                        <div className="space-y-4">
                            {messages.map((msg, idx) => (
                                <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                    {msg.role === 'model' && (
                                        <Avatar className="h-8 w-8 border border-pop/20">
                                            <AvatarImage src="/bot-avatar.png" />
                                            <AvatarFallback className="bg-pop/10 text-pop"><Bot className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                    <div className={cn("max-w-[85%] rounded-2xl px-4 py-2 text-sm", msg.role === 'user' ? "bg-pop text-white rounded-br-none" : "bg-white/5 border border-white/5 text-foreground rounded-bl-none shadow-sm")}>
                                        <div className="prose prose-invert prose-sm max-w-none">
                                            {msg.text.split('\n').map((line, i) => (
                                                <p key={i} className="mb-1 last:mb-0">{line}</p>
                                            ))}
                                        </div>
                                    </div>
                                    {msg.role === 'user' && (
                                        <Avatar className="h-8 w-8 border border-primary/20">
                                            <AvatarImage src="/user-avatar.png" />
                                            <AvatarFallback className="bg-primary/10 text-primary"><UserIcon className="h-4 w-4" /></AvatarFallback>
                                        </Avatar>
                                    )}
                                </div>
                            ))}
                            {isLoading && (
                                <div className="flex gap-3 justify-start">
                                    <Avatar className="h-8 w-8 border border-pop/20">
                                        <AvatarFallback className="bg-pop/10 text-pop"><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                    <div className="bg-white/5 rounded-2xl rounded-bl-none px-4 py-2 flex items-center">
                                        <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                            <div ref={messagesEndRef} />
                        </div>
                    </ScrollArea>
                </TabsContent>

                {/* Summary Content */}
                {studyGuide && (
                    <TabsContent value="summary" className="flex-1 overflow-hidden m-0 p-6 scroll-smooth">
                        <ScrollArea className="h-full pr-4">
                            <h2 className="text-xl font-bold text-pop mb-4">{studyGuide.title}</h2>
                            <div className="flex gap-4 mb-6">
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex-1">
                                    <p className="text-[10px] text-muted-foreground mb-1">DIFFICULTY</p>
                                    <span className={cn("text-xs font-bold px-2 py-0.5 rounded-full",
                                        studyGuide.overall_difficulty === 'Hard' ? "bg-red-500/20 text-red-400" :
                                            studyGuide.overall_difficulty === 'Medium' ? "bg-yellow-500/20 text-yellow-400" : "bg-green-500/20 text-green-400"
                                    )}>{studyGuide.overall_difficulty}</span>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3 border border-white/5 flex-1">
                                    <p className="text-[10px] text-muted-foreground mb-1">DAILY TIME</p>
                                    <span className="text-xs font-bold">{studyGuide.recommended_daily_hours} hrs</span>
                                </div>
                            </div>
                            <div className="prose prose-invert prose-sm max-w-none space-y-4">
                                <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                                    <h3 className="text-sm font-bold flex items-center gap-2 mb-2"><BookOpen className="h-4 w-4 text-pop" /> Overview</h3>
                                    <p className="text-muted-foreground leading-relaxed">{studyGuide.summary}</p>
                                </div>
                                <div className="grid grid-cols-2 gap-3">
                                    {studyGuide.topics.map((t, i) => (
                                        <div key={i} className="bg-black/40 rounded-xl p-3 border border-white/5">
                                            <p className="text-xs font-medium">{t.name}</p>
                                            <p className="text-[10px] text-muted-foreground">{t.difficulty}</p>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </ScrollArea>
                    </TabsContent>
                )}

                {/* Flashcards Content */}
                {studyGuide && (
                    <TabsContent value="flashcards" className="flex-1 overflow-hidden m-0 p-8 flex flex-col items-center justify-center gap-6">
                        <div className="w-full max-w-sm h-64 perspective-1000 group cursor-pointer" onClick={() => setIsCardFlipped(!isCardFlipped)}>
                            <div className={cn("relative w-full h-full transition-all duration-500 transform-style-3d shadow-2xl rounded-3xl", isCardFlipped ? "rotate-y-180" : "")}>
                                {/* Front */}
                                <div className="absolute inset-0 backface-hidden bg-gradient-to-br from-pop to-pink-600 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                                    <span className="text-[10px] font-bold text-white/50 mb-4 tracking-widest uppercase">QUESTION {currentCardIndex + 1}</span>
                                    <p className="text-xl font-bold text-white leading-tight">{studyGuide.flash_cards[currentCardIndex][0]}</p>
                                    <div className="mt-8 bg-white/20 px-4 py-1.5 rounded-full text-[10px] text-white backdrop-blur-sm">Click to flip</div>
                                </div>
                                {/* Back */}
                                <div className="absolute inset-0 backface-hidden rotate-y-180 bg-zinc-900 border-2 border-pop/50 rounded-3xl p-6 flex flex-col items-center justify-center text-center">
                                    <p className="text-lg text-white/90 leading-relaxed font-medium">{studyGuide.flash_cards[currentCardIndex][1]}</p>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-8">
                            <Button variant="outline" size="icon" className="rounded-full border-white/10" onClick={() => { setCurrentCardIndex(p => Math.max(0, p - 1)); setIsCardFlipped(false); }} disabled={currentCardIndex === 0}><ChevronLeft /></Button>
                            <span className="text-xs font-bold text-muted-foreground">{currentCardIndex + 1} / {studyGuide.flash_cards.length}</span>
                            <Button variant="outline" size="icon" className="rounded-full border-white/10" onClick={() => { setCurrentCardIndex(p => Math.min(studyGuide.flash_cards.length - 1, p + 1)); setIsCardFlipped(false); }} disabled={currentCardIndex === studyGuide.flash_cards.length - 1}><ChevronRight /></Button>
                        </div>
                    </TabsContent>
                )}

                {/* Quiz Content */}
                {studyGuide && (
                    <TabsContent value="quiz" className="flex-1 overflow-hidden m-0 p-0 flex flex-col">
                        <ScrollArea className="flex-1 p-6">
                            <div className="space-y-8 pb-8">
                                {studyGuide.quiz.map((q, i) => (
                                    <div key={i} className="space-y-4">
                                        <div className="flex gap-4">
                                            <div className="bg-pop/20 text-pop h-6 w-6 rounded-full flex items-center justify-center text-xs font-bold shrink-0">{i + 1}</div>
                                            <p className="text-sm font-semibold">{q.question}</p>
                                        </div>
                                        <div className="grid grid-cols-1 gap-2 pl-10">
                                            {q.possible_answers.map((ans, ansIdx) => (
                                                <button
                                                    key={ansIdx}
                                                    disabled={quizSubmitted}
                                                    onClick={() => setQuizScores(p => ({ ...p, [i]: ansIdx }))}
                                                    className={cn("text-left text-xs p-3 rounded-xl border transition-all",
                                                        quizScores[i] === ansIdx ? "bg-pop/10 border-pop text-pop" : "bg-white/5 border-white/5 hover:bg-white/10",
                                                        quizSubmitted && ansIdx === q.index && "bg-green-500/20 border-green-500/50 text-green-400",
                                                        quizSubmitted && quizScores[i] === ansIdx && ansIdx !== q.index && "bg-red-500/20 border-red-500/50 text-red-400"
                                                    )}
                                                >
                                                    {ans}
                                                </button>
                                            ))}
                                        </div>
                                        {quizSubmitted && (
                                            <div className="pl-10 animate-in fade-in slide-in-from-top-2">
                                                <p className="text-[10px] text-muted-foreground bg-white/5 p-3 rounded-lg border border-white/5">{q.explanation}</p>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t border-white/10 bg-black/40 flex justify-between items-center">
                            {!quizSubmitted ? (
                                <>
                                    <p className="text-[10px] text-muted-foreground">{Object.keys(quizScores).length} of {studyGuide.quiz.length} answered</p>
                                    <Button onClick={() => setQuizSubmitted(true)} size="sm" className="bg-pop" disabled={Object.keys(quizScores).length < 5}>Submit Quiz</Button>
                                </>
                            ) : (
                                <>
                                    <div className="flex items-center gap-2">
                                        <Trophy className="h-4 w-4 text-fresh" />
                                        <span className="text-sm font-bold text-fresh">Score: {Object.entries(quizScores).filter(([idx, val]) => studyGuide.quiz[Number(idx)].index === val).length} / {studyGuide.quiz.length}</span>
                                    </div>
                                    <Button variant="ghost" size="sm" onClick={() => { setQuizSubmitted(false); setQuizScores({}); }} className="text-xs">Retry</Button>
                                </>
                            )}
                        </div>
                    </TabsContent>
                )}

                {/* Schedule Content */}
                {studyGuide && (
                    <TabsContent value="schedule" className="flex-1 overflow-hidden m-0 flex flex-col">
                        <div className="p-4 border-b border-white/5 flex items-center justify-between">
                            <div>
                                <h4 className="text-xs font-bold">Study Sessions</h4>
                                <p className="text-[10px] text-muted-foreground">Complete tasks to stay on track</p>
                            </div>
                            <Progress value={(studyGuide.study_schedule.filter(s => s.completed).length / studyGuide.study_schedule.length) * 100} className="w-24 h-1.5" />
                        </div>
                        <ScrollArea className="flex-1">
                            <div className="p-4 space-y-3">
                                {studyGuide.study_schedule.map((session, i) => (
                                    <div key={i} className={cn("group relative flex items-start gap-4 p-4 rounded-2xl border transition-all",
                                        session.completed ? "bg-green-500/5 border-green-500/20" : "bg-white/5 border-white/5 hover:border-white/20"
                                    )}>
                                        <button onClick={() => toggleSession(i)} className={cn("mt-1 h-5 w-5 rounded-full border-2 flex items-center justify-center transition-all",
                                            session.completed ? "bg-green-500 border-green-500 text-white" : "border-white/20 text-transparent"
                                        )}>
                                            <CheckCircle className="h-3 w-3" />
                                        </button>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-start mb-1">
                                                <h5 className={cn("text-xs font-bold truncate", session.completed && "text-muted-foreground line-through")}>{session.title}</h5>
                                                <span className="text-[9px] uppercase tracking-tighter bg-white/10 px-1.5 py-0.5 rounded text-muted-foreground shrink-0">{session.duration_minutes}m</span>
                                            </div>
                                            <p className="text-[10px] text-muted-foreground leading-relaxed">{session.details}</p>
                                            <div className="flex gap-2 mt-2">
                                                <span className="text-[8px] px-1.5 py-0.5 rounded-md bg-white/5 border border-white/5 text-muted-foreground flex items-center gap-1 uppercase"><Calendar className="h-2 w-2" /> Day {session.day_offset}</span>
                                                <span className={cn("text-[8px] px-1.5 py-0.5 rounded-md border flex items-center gap-1 uppercase",
                                                    session.type === 'revision' ? "bg-blue-500/10 border-blue-500/20 text-blue-400" :
                                                        session.type === 'quiz' ? "bg-purple-500/10 border-purple-500/20 text-purple-400" : "bg-pink-500/10 border-pink-500/20 text-pop"
                                                )}>{session.type}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                )}

            </Tabs>

            {/* Settings Overlay */}
            {showSettings && (
                <div className="absolute inset-0 z-20 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                    <div className="w-full max-w-xs space-y-4 bg-zinc-900 p-6 rounded-2xl border border-white/10 shadow-2xl">
                        <div className="flex items-center justify-between"><h4 className="font-bold text-sm">Update API Key</h4><button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button></div>
                        <Input type="password" placeholder="New Gemini Key..." className="bg-black/40 text-xs border-white/10" value={apiKey} onChange={(e) => setApiKey(e.target.value)} />
                        <Button onClick={handleSaveKey} className="w-full bg-pop size-sm">Save Changes</Button>
                        <Button variant="ghost" onClick={handleClearKey} className="w-full text-destructive text-xs hover:bg-destructive/10">Delete Saved Key</Button>
                    </div>
                </div>
            )}

            {/* Footer Controls */}
            <CardFooter className="p-4 bg-black/50 border-t border-white/10 flex-col gap-3">
                {selectedFile && !studyGuide && (
                    <div className="flex items-center justify-between bg-white/5 px-4 py-2 rounded-xl w-full border border-white/10 animate-pulse">
                        <div className="flex items-center gap-3 overflow-hidden">
                            <FileText className="h-4 w-4 text-pop shrink-0" />
                            <span className="text-xs truncate font-medium text-muted-foreground">{selectedFile.name} (Ready)</span>
                        </div>
                        <Button size="sm" onClick={generateFullGuide} disabled={isLoading} className="bg-fresh text-black hover:bg-fresh/80 h-7 text-[10px] font-bold">GENERATE GUIDE</Button>
                    </div>
                )}
                <div className="flex w-full gap-2">
                    <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept=".pdf,.txt,.md" />
                    <Button variant="ghost" size="icon" className="group h-10 w-10 shrink-0" onClick={() => fileInputRef.current?.click()} disabled={isLoading}><Paperclip className="h-5 w-5 text-muted-foreground group-hover:text-pop" /></Button>
                    <Input placeholder={selectedFile ? "Ask about this doc..." : "Ask your assistant..."} className="bg-black/30 border-white/10 focus-visible:ring-pop h-10" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()} disabled={isLoading} />
                    <Button onClick={handleSendMessage} disabled={isLoading || !input.trim()} className="bg-pop hover:bg-pop/90 text-white w-10 h-10 p-0 rounded-xl shrink-0 shadow-lg shadow-pop/20"><Send className="h-5 w-5" /></Button>
                </div>
            </CardFooter>

            {/* Persistence Info (Mobile) */}
            {!studyGuide && !isLoading && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
                    <Bot className="h-32 w-32 text-pop rotate-12" />
                </div>
            )}
        </Card>
    );
};

export default ScholarAI;
