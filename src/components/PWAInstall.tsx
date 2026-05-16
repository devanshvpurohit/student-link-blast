import { useState, useEffect } from 'react';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogTrigger,
    DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Share, PlusSquare, Download, Smartphone, Laptop, CheckCircle2 } from 'lucide-react';

const PWAInstall = () => {
    const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop' | 'unknown'>('unknown');
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        const userAgent = window.navigator.userAgent.toLowerCase();
        if (/iphone|ipad|ipod/.test(userAgent)) {
            setPlatform('ios');
        } else if (/android/.test(userAgent)) {
            setPlatform('android');
        } else {
            setPlatform('desktop');
        }
    }, []);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" className="w-full justify-start h-12 text-muted-foreground hover:text-primary hover:bg-primary/10 transition-all group">
                    <Download className="h-5 w-5 min-w-[20px] group-hover:scale-110 transition-transform" />
                    <span className="ml-4 opacity-0 group-hover:opacity-100 lg:group-hover:opacity-100 transition-opacity duration-300 whitespace-nowrap font-medium">
                        Download App
                    </span>
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md glass-card border-white/10">
                <DialogHeader>
                    <DialogTitle className="text-2xl font-bold flex items-center gap-2">
                        <Smartphone className="h-6 w-6 text-primary" /> Install Bazinga
                    </DialogTitle>
                    <DialogDescription className="text-lg">
                        Get the full app experience on your home screen!
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {platform === 'ios' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <Share className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold">Step 1</p>
                                    <p className="text-sm text-muted-foreground">Tap the 'Share' button in Safari</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-4 p-3 rounded-xl bg-white/5 border border-white/10">
                                <div className="bg-primary/20 p-2 rounded-lg">
                                    <PlusSquare className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <p className="font-bold">Step 2</p>
                                    <p className="text-sm text-muted-foreground">Scroll down and tap 'Add to Home Screen'</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {platform === 'android' && (
                        <div className="space-y-4 animate-fade-in">
                            <div className="p-4 rounded-xl bg-primary/10 border border-primary/20 text-center">
                                <p className="font-bold text-lg mb-2">Easy Install</p>
                                <p className="text-sm text-muted-foreground mb-4">
                                    Tap the three dots (menu) in your browser and select <strong>'Install App'</strong> or <strong>'Add to Home Screen'</strong>.
                                </p>
                                <Smartphone className="h-12 w-12 mx-auto text-primary animate-bounce" />
                            </div>
                        </div>
                    )}

                    {platform === 'desktop' && (
                        <div className="space-y-4 animate-fade-in text-center">
                            <div className="p-6 rounded-xl bg-white/5 border border-white/10">
                                <Laptop className="h-16 w-16 mx-auto mb-4 text-primary" />
                                <p className="text-muted-foreground">
                                    Look for the <strong>Install</strong> icon in your browser's address bar (next to the star icon) to install Bazinga as a desktop app.
                                </p>
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-2 text-xs text-muted-foreground bg-white/5 p-2 rounded-lg">
                        <CheckCircle2 className="h-4 w-4 text-green-500" />
                        Works offline after installation!
                    </div>
                </div>

                <DialogFooter>
                    <Button className="w-full h-11" onClick={() => setIsOpen(false)}>
                        Got it!
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};

export default PWAInstall;
