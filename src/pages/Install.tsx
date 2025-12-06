import { useState, useEffect } from 'react';
import { Download, Smartphone, Monitor, Apple, Chrome, Share, Plus, MoreVertical, ArrowDown, Check, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { canInstall, promptInstall, isAppInstalled, getDisplayMode } from '@/lib/pwa';
import { cn } from '@/lib/utils';

const Install = () => {
  const [installable, setInstallable] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [platform, setPlatform] = useState<'ios' | 'android' | 'desktop'>('desktop');

  useEffect(() => {
    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setPlatform('ios');
    } else if (/android/.test(userAgent)) {
      setPlatform('android');
    } else {
      setPlatform('desktop');
    }

    // Check install state
    setInstalled(isAppInstalled());
    setInstallable(canInstall());

    const handleInstallPrompt = () => {
      setInstallable(canInstall());
    };

    window.addEventListener('beforeinstallprompt', handleInstallPrompt);
    window.addEventListener('appinstalled', () => setInstalled(true));

    return () => {
      window.removeEventListener('beforeinstallprompt', handleInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    const success = await promptInstall();
    if (success) {
      setInstalled(true);
      setInstallable(false);
    }
  };

  const features = [
    { icon: Sparkles, title: 'Instant Access', description: 'Launch from your home screen like a native app' },
    { icon: Download, title: 'Works Offline', description: 'Access your matches and messages without internet' },
    { icon: Smartphone, title: 'Push Notifications', description: 'Get notified about new matches and messages instantly' },
  ];

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-3xl mx-auto space-y-8">
        {/* Hero Section */}
        <div className="text-center space-y-4 py-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-2xl gradient-primary shadow-glow mb-4">
            <Download className="h-10 w-10 text-primary-foreground" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold">
            Install <span className="text-gradient">Bazinga</span>
          </h1>
          <p className="text-muted-foreground max-w-md mx-auto">
            Get the full app experience on your device. Fast, offline-capable, and always one tap away.
          </p>

          {installed ? (
            <Badge variant="secondary" className="gap-2 py-2 px-4 text-sm bg-success/20 text-success border-success/30">
              <Check className="h-4 w-4" />
              Already Installed
            </Badge>
          ) : installable ? (
            <Button 
              size="lg" 
              onClick={handleInstall}
              className="gap-2 gradient-primary text-primary-foreground shadow-glow hover:opacity-90 transition-opacity"
            >
              <Download className="h-5 w-5" />
              Install Now
            </Button>
          ) : (
            <p className="text-sm text-muted-foreground">
              Follow the instructions below for your device
            </p>
          )}
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {features.map((feature) => (
            <Card key={feature.title} className="glass border-border/50 card-hover">
              <CardContent className="pt-6 text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 text-primary mb-3">
                  <feature.icon className="h-6 w-6" />
                </div>
                <h3 className="font-semibold mb-1">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Platform-Specific Instructions */}
        <Card className="glass border-border/50">
          <CardHeader>
            <CardTitle>Installation Guide</CardTitle>
            <CardDescription>
              Select your device type for step-by-step instructions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue={platform} className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-6">
                <TabsTrigger value="ios" className="gap-2">
                  <Apple className="h-4 w-4" />
                  <span className="hidden sm:inline">iPhone/iPad</span>
                  <span className="sm:hidden">iOS</span>
                </TabsTrigger>
                <TabsTrigger value="android" className="gap-2">
                  <Smartphone className="h-4 w-4" />
                  Android
                </TabsTrigger>
                <TabsTrigger value="desktop" className="gap-2">
                  <Monitor className="h-4 w-4" />
                  Desktop
                </TabsTrigger>
              </TabsList>

              {/* iOS Instructions */}
              <TabsContent value="ios" className="space-y-4">
                <div className="space-y-4">
                  <InstallStep 
                    step={1} 
                    title="Open in Safari"
                    description="Make sure you're viewing Bazinga in Safari browser. Other browsers like Chrome won't show the install option on iOS."
                    icon={<Chrome className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={2} 
                    title="Tap the Share button"
                    description="Look for the Share icon at the bottom of Safari (square with arrow pointing up)."
                    icon={<Share className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={3} 
                    title='Select "Add to Home Screen"'
                    description="Scroll down in the share menu and tap 'Add to Home Screen'. You may need to scroll right to find it."
                    icon={<Plus className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={4} 
                    title='Tap "Add"'
                    description="Confirm by tapping Add in the top-right corner. Bazinga will now appear on your home screen!"
                    icon={<Check className="h-5 w-5" />}
                    isLast
                  />
                </div>
              </TabsContent>

              {/* Android Instructions */}
              <TabsContent value="android" className="space-y-4">
                <div className="space-y-4">
                  {installable ? (
                    <>
                      <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
                        <p className="text-success font-medium mb-3">Quick Install Available!</p>
                        <Button 
                          onClick={handleInstall}
                          className="gradient-primary text-primary-foreground"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Install Bazinga
                        </Button>
                      </div>
                      <p className="text-center text-sm text-muted-foreground">Or follow manual steps below:</p>
                    </>
                  ) : null}
                  <InstallStep 
                    step={1} 
                    title="Open in Chrome"
                    description="Make sure you're viewing Bazinga in Chrome browser for the best experience."
                    icon={<Chrome className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={2} 
                    title="Tap the menu (⋮)"
                    description="Look for the three dots menu icon in the top-right corner of Chrome."
                    icon={<MoreVertical className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={3} 
                    title='Select "Install app" or "Add to Home screen"'
                    description="The option name may vary. Look for Install app, Add to Home screen, or a similar option."
                    icon={<Download className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={4} 
                    title='Tap "Install"'
                    description="Confirm the installation. Bazinga will be added to your home screen and app drawer!"
                    icon={<Check className="h-5 w-5" />}
                    isLast
                  />
                </div>
              </TabsContent>

              {/* Desktop Instructions */}
              <TabsContent value="desktop" className="space-y-4">
                <div className="space-y-4">
                  {installable ? (
                    <>
                      <div className="bg-success/10 border border-success/30 rounded-xl p-4 text-center">
                        <p className="text-success font-medium mb-3">Quick Install Available!</p>
                        <Button 
                          onClick={handleInstall}
                          className="gradient-primary text-primary-foreground"
                        >
                          <Download className="h-4 w-4 mr-2" />
                          Install Bazinga
                        </Button>
                      </div>
                      <p className="text-center text-sm text-muted-foreground">Or follow manual steps below:</p>
                    </>
                  ) : null}
                  <InstallStep 
                    step={1} 
                    title="Use Chrome, Edge, or Brave"
                    description="PWA installation works best on Chromium-based browsers."
                    icon={<Chrome className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={2} 
                    title="Look for the install icon"
                    description="In the address bar, look for a computer with a down arrow icon, or a + icon."
                    icon={<ArrowDown className="h-5 w-5" />}
                  />
                  <InstallStep 
                    step={3} 
                    title='Click "Install"'
                    description="Click the install icon and confirm. Bazinga will open in its own window and be added to your apps."
                    icon={<Download className="h-5 w-5" />}
                    isLast
                  />
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Current Status */}
        <Card className="glass border-border/50">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">Current Status</h3>
                <p className="text-sm text-muted-foreground">
                  Display mode: <span className="font-mono">{getDisplayMode()}</span>
                </p>
              </div>
              <Badge variant={installed ? "default" : "secondary"} className={cn(
                installed && "bg-success text-success-foreground"
              )}>
                {installed ? 'Installed' : 'Not Installed'}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

interface InstallStepProps {
  step: number;
  title: string;
  description: string;
  icon: React.ReactNode;
  isLast?: boolean;
}

const InstallStep = ({ step, title, description, icon, isLast }: InstallStepProps) => (
  <div className="flex gap-4">
    <div className="flex flex-col items-center">
      <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary text-primary-foreground font-bold text-sm shrink-0">
        {step}
      </div>
      {!isLast && <div className="w-0.5 h-full bg-border mt-2" />}
    </div>
    <div className="pb-6">
      <div className="flex items-center gap-2 mb-1">
        <span className="text-primary">{icon}</span>
        <h4 className="font-semibold">{title}</h4>
      </div>
      <p className="text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);

export default Install;
