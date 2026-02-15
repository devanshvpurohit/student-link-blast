import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User as UserIcon, Loader2, Key, Trash2, Paperclip, FileText, X, Settings2, ExternalLink } from 'lucide-react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import * as pdfjsLib from 'pdfjs-dist';

// Initialize PDF.js worker
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

interface Message {
    role: 'user' | 'model';
    text: string;
}

const ScholarAI = () => {
    const [apiKey, setApiKey] = useState('');
    const [hasKey, setHasKey] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [input, setInput] = useState('');
    const [messages, setMessages] = useState<Message[]>([
        { role: 'model', text: 'Hello! I am your Scholar AI assistant. Upload a document or ask me anything to get started.' }
    ]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [fileContent, setFileContent] = useState<string>('');

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        const storedKey = localStorage.getItem('gemini_api_key');
        if (storedKey) {
            setApiKey(storedKey);
            setHasKey(true);
        }
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, hasKey]);

    const handleSaveKey = () => {
        if (apiKey.trim().length === 0) {
            toast({
                title: "API Key Required",
                description: "Please enter a valid Google Gemini API Key.",
                variant: "destructive"
            });
            return;
        }
        localStorage.setItem('gemini_api_key', apiKey);
        setHasKey(true);
        setShowSettings(false);
        toast({
            title: "API Key Saved",
            description: "Your key is updated. Ready to research!",
        });
    };

    const handleClearKey = () => {
        localStorage.removeItem('gemini_api_key');
        setApiKey('');
        setHasKey(false);
        setShowSettings(false);
        toast({
            title: "API Key Removed",
            description: "Your API key has been removed from local storage.",
        });
    };

    const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) { // 5MB limit
            toast({ title: "File too large", description: "Please upload files under 5MB.", variant: "destructive" });
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
                // Text, Markdown, etc.
                content = await file.text();
            }

            setFileContent(content);
            toast({ title: "File Processed", description: `${file.name} is ready for analysis.` });
        } catch (error) {
            console.error("File reading error:", error);
            toast({ title: "Error reading file", description: "Could not extract text from this file.", variant: "destructive" });
            setSelectedFile(null);
            setFileContent('');
        } finally {
            setIsLoading(false);
            // Reset input value to allow re-selecting same file if needed
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    const clearFile = () => {
        setSelectedFile(null);
        setFileContent('');
    };

    const handleSendMessage = async () => {
        if ((!input.trim() && !selectedFile) || !hasKey) return;

        const userMessage = input.trim();
        const currentFile = selectedFile;
        const contentToAnalyze = fileContent;

        setInput('');

        setMessages(prev => [...prev, { role: 'user', text: userMessage || `Analyze ${currentFile?.name}` }]);
        setIsLoading(true);

        try {
            const genAI = new GoogleGenerativeAI(apiKey);
            const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash-lite" });

            let prompt = userMessage;
            if (currentFile && contentToAnalyze) {
                prompt = `Reference Document Content (${currentFile.name}):\n\n${contentToAnalyze}\n\nUser Query: ${userMessage}`;
            }

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const text = response.text();

            setMessages(prev => [...prev, { role: 'model', text: text }]);
        } catch (error: any) {
            console.error("Gemini Error:", error);
            toast({
                title: "AI Error",
                description: error.message || "Failed to generate response. Check your API key.",
                variant: "destructive"
            });
            setMessages(prev => [...prev, { role: 'model', text: "I encountered an error. Please check your API key and try again." }]);
        } finally {
            setIsLoading(false);
        }
    };

    if (!hasKey) {
        return (
            <Card className="glass-card h-full flex flex-col justify-center items-center p-8 text-center animate-fade-in relative">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-pop via-blue-500 to-pop" />
                <div className="bg-pop/10 p-4 rounded-full mb-4">
                    <Bot className="h-12 w-12 text-pop" />
                </div>
                <h3 className="text-2xl font-bold mb-2">Setup Scholar AI</h3>
                <p className="text-muted-foreground mb-6 max-w-sm">
                    To use the AI research assistant, please provide your Google Gemini API Key. It is stored locally on your device.
                </p>
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
        <Card className="glass-card h-[600px] flex flex-col overflow-hidden animate-fade-in relative">
            <CardHeader className="border-b border-white/10 pb-4 bg-black/40">
                <div className="flex justify-between items-center">
                    <CardTitle className="flex items-center gap-2 text-lg">
                        <Bot className="h-5 w-5 text-pop" />
                        Scholar AI
                    </CardTitle>
                    <div className="flex items-center gap-1">
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setShowSettings(!showSettings)}
                            className={cn("h-8 w-8 hover:bg-white/10", showSettings && "bg-white/10 text-pop")}
                            title="API Settings"
                        >
                            <Settings2 className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleClearKey} className="h-8 w-8 hover:bg-white/10 group" title="Clear Key">
                            <Trash2 className="h-4 w-4 text-muted-foreground group-hover:text-destructive transition-colors" />
                        </Button>
                    </div>
                </div>
            </CardHeader>

            <CardContent className="flex-1 p-0 overflow-hidden relative">
                {showSettings && (
                    <div className="absolute inset-0 z-10 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
                        <div className="w-full max-w-xs space-y-4 bg-zinc-900/90 p-6 rounded-2xl border border-white/10 shadow-2xl">
                            <div className="flex items-center justify-between mb-2">
                                <h4 className="font-bold text-sm">Update API Key</h4>
                                <button onClick={() => setShowSettings(false)} className="text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
                            </div>
                            <div className="relative">
                                <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    type="password"
                                    placeholder="New Gemini Key..."
                                    className="pl-10 bg-black/40 text-xs border-white/10"
                                    value={apiKey}
                                    onChange={(e) => setApiKey(e.target.value)}
                                />
                            </div>
                            <Button onClick={handleSaveKey} className="w-full bg-pop size-sm">Save Changes</Button>
                            <p className="text-[10px] text-muted-foreground text-center">
                                Your key is saved locally and never leaves your browser.
                            </p>
                        </div>
                    </div>
                )}

                <ScrollArea className="h-full p-4">
                    <div className="space-y-4">
                        {messages.map((msg, idx) => (
                            <div key={idx} className={cn("flex gap-3", msg.role === 'user' ? "justify-end" : "justify-start")}>
                                {msg.role === 'model' && (
                                    <Avatar className="h-8 w-8 border border-pop/20">
                                        <AvatarImage src="/bot-avatar.png" />
                                        <AvatarFallback className="bg-pop/10 text-pop"><Bot className="h-4 w-4" /></AvatarFallback>
                                    </Avatar>
                                )}
                                <div className={cn(
                                    "max-w-[80%] rounded-2xl px-4 py-2 text-sm",
                                    msg.role === 'user'
                                        ? "bg-primary text-primary-foreground rounded-br-none"
                                        : "bg-white/10 text-foreground rounded-bl-none shadow-sm"
                                )}>
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
            </CardContent>

            <CardFooter className="p-4 bg-black/40 border-t border-white/10 flex-col gap-2">
                {selectedFile && (
                    <div className="flex items-center gap-2 bg-white/10 px-3 py-1.5 rounded-lg w-full animate-in slide-in-from-bottom-2">
                        <FileText className="h-4 w-4 text-pop" />
                        <span className="text-xs truncate flex-1 font-medium">{selectedFile.name}</span>
                        <button onClick={clearFile} className="bg-white/10 hover:bg-white/20 rounded-full p-0.5 transition-colors">
                            <X className="h-3 w-3" />
                        </button>
                    </div>
                )}
                <div className="flex w-full gap-2">
                    <input
                        type="file"
                        ref={fileInputRef}
                        className="hidden"
                        onChange={handleFileSelect}
                        accept=".pdf,.txt,.md"
                    />
                    <Button
                        variant="ghost"
                        size="icon"
                        className="text-muted-foreground hover:text-white hover:bg-white/10"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isLoading}
                        title="Upload Document (PDF/Text)"
                    >
                        <Paperclip className="h-4 w-4" />
                    </Button>
                    <Input
                        placeholder={selectedFile ? "Ask about this document..." : "Ask anything..."}
                        className="bg-black/20 border-white/10 focus-visible:ring-pop focus-visible:border-pop/30 h-10"
                        value={input}
                        onChange={(e) => setInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && !isLoading && handleSendMessage()}
                        disabled={isLoading}
                    />
                    <Button
                        onClick={handleSendMessage}
                        disabled={isLoading || (!input.trim() && !selectedFile)}
                        className="bg-pop hover:bg-pop/90 text-white shadow-lg shadow-pop/30 w-10 h-10 p-0 rounded-xl"
                    >
                        {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-5 w-5" />}
                    </Button>
                </div>
            </CardFooter>
        </Card>
    );
};

export default ScholarAI;
