import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Sparkles, ArrowRight, User, BookOpen, GraduationCap, Building2 } from 'lucide-react';
import { getRandomQuote } from '@/utils/quotes';

// A curated list of popular Indian & international colleges.
// Extend this list or replace with a dynamic API as needed.
const COLLEGES = [
  // IITs
  'IIT Bombay',
  'IIT Delhi',
  'IIT Madras',
  'IIT Kharagpur',
  'IIT Kanpur',
  'IIT Roorkee',
  'IIT Guwahati',
  'IIT Hyderabad',
  // NITs
  'NIT Trichy',
  'NIT Surathkal',
  'NIT Warangal',
  'NIT Calicut',
  'NIT Rourkela',
  // Other Top Indian
  'BITS Pilani',
  'BITS Goa',
  'BITS Hyderabad',
  'VIT Vellore',
  'Manipal Institute of Technology',
  'SRM Institute of Science and Technology',
  'Delhi Technological University (DTU)',
  'Netaji Subhas University of Technology (NSUT)',
  'Jamia Millia Islamia',
  'University of Delhi',
  'Jadavpur University',
  'Anna University',
  'Amity University',
  'Symbiosis Institute of Technology',
  // International
  'MIT',
  'Stanford University',
  'Harvard University',
  'UC Berkeley',
  'University of Oxford',
  'University of Cambridge',
  'Other',
];

const Onboarding = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const { toast } = useToast();
    const [loading, setLoading] = useState(false);
    const [step, setStep] = useState(1);
    const [quote] = useState(() => getRandomQuote('punchy'));
    const [collegeSearch, setCollegeSearch] = useState('');

    const [formData, setFormData] = useState({
        full_name: '',
        college: '',
        department: '',
        year_of_study: '',
        bio: '',
    });

    useEffect(() => {
        if (user) {
            setFormData(prev => ({
                ...prev,
                full_name: user.user_metadata?.full_name || ''
            }));
        }
    }, [user]);

    const filteredColleges = COLLEGES.filter(c =>
        c.toLowerCase().includes(collegeSearch.toLowerCase())
    );

    const handleSubmit = async () => {
        if (!formData.full_name || !formData.college || !formData.department || !formData.year_of_study) {
            toast({
                title: "Missing Info",
                description: "Please fill in all required fields to continue.",
                variant: "destructive"
            });
            return;
        }

        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .upsert({
                    id: user?.id,
                    full_name: formData.full_name,
                    college: formData.college,
                    department: formData.department,
                    year_of_study: parseInt(formData.year_of_study),
                    bio: formData.bio,
                    email: user?.email,
                    updated_at: new Date().toISOString(),
                });

            if (error) throw error;

            toast({
                title: "Welcome to Bazinga! 🎉",
                description: "Your profile has been set up successfully.",
            });

            navigate('/');
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive"
            });
        } finally {
            setLoading(false);
        }
    };

    const canProceedStep1 = formData.full_name.trim() !== '' && formData.college !== '';

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background relative overflow-hidden">
            {/* Background Decor */}
            <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] rounded-full bg-primary/10 blur-[150px] animate-float" />
                <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full bg-secondary/10 blur-[150px] animate-float" style={{ animationDelay: '-4s' }} />
            </div>

            <Card className="w-full max-w-lg glass-card border-white/10 shadow-2xl z-10 animate-scale-in">
                <CardHeader className="text-center pb-2">
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-white shadow-lg mb-4 overflow-hidden mx-auto">
                        <img src="/favicon.ico" alt="Bazinga Logo" className="h-12 w-12 object-contain" />
                    </div>
                    <CardTitle className="text-3xl font-bold tracking-tight">Complete Your Profile</CardTitle>
                    <CardDescription className="text-lg">Let's get you set up with your campus community.</CardDescription>

                    {/* Step indicator */}
                    <div className="flex items-center justify-center gap-2 mt-3">
                        <div className={`h-2 w-8 rounded-full transition-all ${step >= 1 ? 'bg-primary' : 'bg-white/20'}`} />
                        <div className={`h-2 w-8 rounded-full transition-all ${step >= 2 ? 'bg-primary' : 'bg-white/20'}`} />
                    </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-6">
                    {step === 1 ? (
                        <div className="space-y-4 animate-fade-in">
                            {/* Full Name */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <User className="h-4 w-4 text-primary" /> Full Name <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    placeholder="Your full name"
                                    value={formData.full_name}
                                    onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                                    className="bg-black/20 border-white/10 h-11"
                                />
                            </div>

                            {/* College — the key isolation field */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Building2 className="h-4 w-4 text-primary" /> College / University <span className="text-destructive">*</span>
                                </Label>

                                {/* Search filter for long list */}
                                <Input
                                    placeholder="Type to search your college..."
                                    value={collegeSearch}
                                    onChange={(e) => setCollegeSearch(e.target.value)}
                                    className="bg-black/20 border-white/10 h-10 mb-1"
                                />

                                <Select
                                    value={formData.college}
                                    onValueChange={(val) => setFormData({ ...formData, college: val })}
                                >
                                    <SelectTrigger className="bg-black/20 border-white/10 h-11">
                                        <SelectValue placeholder="Select your college" />
                                    </SelectTrigger>
                                    <SelectContent className="max-h-60">
                                        {filteredColleges.map((college) => (
                                            <SelectItem key={college} value={college}>
                                                {college}
                                            </SelectItem>
                                        ))}
                                        {filteredColleges.length === 0 && (
                                            <div className="px-3 py-2 text-sm text-muted-foreground">
                                                No results. Select "Other".
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>

                                {formData.college && (
                                    <p className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Building2 className="h-3 w-3 text-primary" />
                                        You'll only see content from <span className="text-primary font-semibold">{formData.college}</span> students.
                                    </p>
                                )}
                            </div>

                            <Button
                                className="w-full h-12 text-lg shadow-lg hover:shadow-primary/20 transition-all font-bold"
                                onClick={() => setStep(2)}
                                disabled={!canProceedStep1}
                            >
                                Next Step <ArrowRight className="ml-2 h-5 w-5" />
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-4 animate-fade-in">
                            {/* Department */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <BookOpen className="h-4 w-4 text-primary" /> Department <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.department}
                                    onValueChange={(val) => setFormData({ ...formData, department: val })}
                                >
                                    <SelectTrigger className="bg-black/20 border-white/10 h-11">
                                        <SelectValue placeholder="Select your department" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="computer-science">Computer Science</SelectItem>
                                        <SelectItem value="engineering">Engineering</SelectItem>
                                        <SelectItem value="business">Business</SelectItem>
                                        <SelectItem value="arts">Arts</SelectItem>
                                        <SelectItem value="sciences">Sciences</SelectItem>
                                        <SelectItem value="law">Law</SelectItem>
                                        <SelectItem value="medicine">Medicine</SelectItem>
                                        <SelectItem value="architecture">Architecture</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Year of Study */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <GraduationCap className="h-4 w-4 text-primary" /> Year of Study <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={formData.year_of_study}
                                    onValueChange={(val) => setFormData({ ...formData, year_of_study: val })}
                                >
                                    <SelectTrigger className="bg-black/20 border-white/10 h-11">
                                        <SelectValue placeholder="Which year are you in?" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="1">1st Year</SelectItem>
                                        <SelectItem value="2">2nd Year</SelectItem>
                                        <SelectItem value="3">3rd Year</SelectItem>
                                        <SelectItem value="4">4th Year</SelectItem>
                                        <SelectItem value="5">5th Year+</SelectItem>
                                        <SelectItem value="0">Alumni</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Bio */}
                            <div className="space-y-2">
                                <Label className="flex items-center gap-2">
                                    <Sparkles className="h-4 w-4 text-primary" /> Bio (Short & Sweet)
                                </Label>
                                <Textarea
                                    placeholder="Tell us a bit about yourself..."
                                    value={formData.bio}
                                    onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                                    className="bg-black/20 border-white/10 min-h-[100px] resize-none"
                                />
                            </div>

                            <div className="flex gap-3">
                                <Button
                                    variant="outline"
                                    className="flex-1 h-12 border-white/10"
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                >
                                    Back
                                </Button>
                                <Button
                                    className="flex-[2] h-12 text-lg shadow-lg hover:shadow-primary/20 transition-all font-bold bg-gradient-to-r from-primary to-purple-600"
                                    onClick={handleSubmit}
                                    disabled={loading || !formData.department || !formData.year_of_study}
                                >
                                    {loading ? "Saving..." : "Start Exploring! 🚀"}
                                </Button>
                            </div>
                            {loading && (
                                <p className="text-[10px] text-center text-muted-foreground italic animate-pulse">
                                    "{quote}"
                                </p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
};

export default Onboarding;
