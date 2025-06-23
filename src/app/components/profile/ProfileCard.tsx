// src/app/components/profile/ProfileCard.tsx
"use client";

import React, { useState, useMemo, useCallback, useEffect } from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable";

// UI Components
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
} from "@/components/ui/dialog";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Skeleton } from "@/components/ui/skeleton";
import { Columns } from 'lucide-react'; // החלף את האייקונים הישנים באלה אם תבחר באפשרות הראשונה
// Icons
import {
  User, Heart, FileText, Image as ImageIcon, Info as InfoIcon, Eye, Phone, ChevronLeft, ChevronRight, Briefcase,
  GraduationCap, Users, BookOpen, School, Lock, Languages, Calendar, Star, MapPin, CheckCircle, Clock, Cake, Gem,
  Sparkles, Users2, Award, Palette, Smile, X, BookMarked, Maximize, Minimize, GripVertical, Search, Target, UserCheck,
  Link as LinkIcon, Handshake, Edit3, ExternalLink, Bot, ShieldQuestion, MessageSquareQuote, Rows3, AppWindow
} from "lucide-react";

// Types
import type {
  UserProfile, UserImage as UserImageType, QuestionnaireResponse, FormattedAnswer,
  ServiceType, HeadCoveringType, KippahType
} from "@/types/next-auth";
import { languageOptions } from "@/lib/languageOptions";
import type { Candidate } from "@/app/components/matchmaker/new/types/candidates";

import NewSuggestionForm from "@/app/components/matchmaker/suggestions/NewSuggestionForm";

interface CreateSuggestionData {
  priority: "LOW" | "MEDIUM" | "HIGH" | "URGENT";
  firstPartyId: string;
  secondPartyId: string;
  status:
    | "DRAFT"
    | "PENDING_FIRST_PARTY"
    | "FIRST_PARTY_APPROVED"
    | "FIRST_PARTY_DECLINED"
    | string;
  firstPartyNotes?: string;
  secondPartyNotes?: string;
}

// --- Data & Translation Maps ---
const maritalStatusMap: { [key: string]: string } = { single: "רווק/ה", divorced: "גרוש/ה", widowed: "אלמן/ה", annulled: "נישואין שבוטלו", any: "כל האפשרויות פתוחות" };
const religiousLevelMap: { [key: string]: string } = { charedi: "חרדי/ת", charedi_modern: "חרדי/ת מודרני/ת", dati_leumi_torani: "דתי/ה לאומי/ת תורני/ת", dati_leumi_liberal: "דתי/ה לאומי/ת ליברלי/ת", dati_leumi_standard: "דתי/ה לאומי/ת (סטנדרטי)", masorti_strong: "מסורתי/ת (קרוב/ה לדת)", masorti_light: "מסורתי/ת (קשר קל למסורת)", secular_traditional_connection: "חילוני/ת עם זיקה למסורת", secular: "חילוני/ת", spiritual_not_religious: "רוחני/ת (לאו דווקא דתי/ה)", other: "אחר", "לא משנה": "ללא העדפה / גמיש" };
const educationLevelMap: { [key: string]: string } = { high_school: "תיכונית", vocational: "מקצועית / תעודה", academic_student: "סטודנט/ית לתואר", academic_ba: "תואר ראשון (BA/BSc)", academic_ma: "תואר שני (MA/MSc)", academic_phd: "דוקטורט (PhD)", yeshiva_seminary: "לימודים תורניים (ישיבה/מדרשה/כולל)", other: "אחר", "ללא העדפה": "ללא העדפה" };
const serviceTypeMap: { [key: string]: string } = { MILITARY_COMBATANT: "צבאי - לוחם/ת", MILITARY_SUPPORT: "צבאי - תומכ/ת לחימה", MILITARY_OFFICER: "צבאי - קצונה", MILITARY_INTELLIGENCE_CYBER_TECH: "צבאי - מודיעין/סייבר/טכנולוגי", NATIONAL_SERVICE_ONE_YEAR: "שירות לאומי - שנה", NATIONAL_SERVICE_TWO_YEARS: "שירות לאומי - שנתיים", HESDER_YESHIVA: "ישיבת הסדר", YESHIVA_ONLY_POST_HS: "ישיבה גבוהה / מדרשה (ללא שירות)", PRE_MILITARY_ACADEMY_AND_SERVICE: "מכינה קדם-צבאית ושירות", EXEMPTED: "פטור משירות", CIVILIAN_SERVICE: "שירות אזרחי", OTHER: "אחר / לא רלוונטי" };
const headCoveringMap: { [key: string]: string } = { FULL_COVERAGE: "כיסוי ראש מלא", PARTIAL_COVERAGE: "כיסוי ראש חלקי", HAT_BERET: "כובע / ברט", SCARF_ONLY_SOMETIMES: "מטפחת (רק באירועים/בית כנסת)", NONE: "ללא כיסוי ראש", any: "כל האפשרויות פתוחות" };
const kippahTypeMap: { [key: string]: string } = { BLACK_VELVET: "קטיפה שחורה", KNITTED_SMALL: "סרוגה קטנה", KNITTED_LARGE: "סרוגה גדולה", CLOTH: "בד", BRESLEV: "ברסלב (לבנה גדולה)", NONE_AT_WORK_OR_CASUAL: "לא בעבודה / ביומיום", NONE_USUALLY: "לרוב לא חובש", OTHER: "אחר", any: "כל האפשרויות פתוחות" };
const languageMap = languageOptions.reduce((acc, lang) => { acc[lang.value] = lang.label; return acc; }, {} as { [key: string]: string });
const contactPreferenceMap: { [key: string]: string } = { direct: "ישירות", matchmaker: "דרך השדכן/ית", both: "שתי האפשרויות" };
const aliyaStatusMap: { [key: string]: string } = { oleh: "עולה חדש/ה", tzabar: "צבר/ית", no_preference: "ללא העדפה" };
const characterTraitMap: { [key: string]: string } = { empathetic: "אמפתי/ת", driven: "שאפתן/ית", optimistic: "אופטימי/ת", family_oriented: "משפחתי/ת", intellectual: "אינטלקטואל/ית", organized: "מאורגנ/ת", calm: "רגוע/ה", humorous: "בעל/ת חוש הומור", sociable: "חברותי/ת", sensitive: "רגיש/ה", independent: "עצמאי/ת", creative: "יצירתי/ת", honest: "כן/ה וישר/ה", responsible: "אחראי/ת", easy_going: "זורם/ת וקליל/ה", no_strong_preference: "ללא העדפה חזקה" };
const hobbiesMap: { [key: string]: string } = { travel: "טיולים", sports: "ספורט", reading: "קריאה", cooking_baking: "בישול/אפיה", music_playing_instrument: "מוזיקה/נגינה", art_crafts: "אומנות/יצירה", volunteering: "התנדבות", learning_courses: "למידה/קורסים", board_games_puzzles: "משחקי קופסא/פאזלים", movies_theater: "סרטים/תיאטרון", dancing: "ריקוד", writing: "כתיבה", nature_hiking: "טבע/טיולים רגליים", photography: "צילום", no_strong_preference: "ללא העדפה חזקה" };
const WORLDS: { [key: string]: { label: string; icon: React.ElementType; color: string } } = { values: { label: "ערכים ועקרונות", icon: BookOpen, color: "blue" }, personality: { label: "אישיות ותכונות", icon: Smile, color: "green" }, relationship: { label: "זוגיות ומשפחה", icon: Heart, color: "rose" }, partner: { label: "ציפיות מבן/בת הזוג", icon: Users, color: "indigo" }, religion: { label: "דת ואמונה", icon: BookMarked, color: "amber" }, general: { label: "שאלות כלליות", icon: FileText, color: "slate" } };

// --- Helper Functions ---
const formatEnumValue = (value: string | null | undefined, map: { [key: string]: string }, placeholder: string = "לא צוין"): string => { if (!value || !map[value]) return placeholder; return map[value]; };
const getInitials = (firstName?: string, lastName?: string): string => { let initials = ""; if (firstName && firstName.length > 0) initials += firstName[0]; if (lastName && lastName.length > 0) initials += lastName[0]; if (initials.length === 0 && firstName && firstName.length > 0) { initials = firstName.length > 1 ? firstName.substring(0, 2) : firstName[0]; } return initials.toUpperCase() || "?"; };
const calculateAge = (birthDate: Date | string | null | undefined): number => { if (!birthDate) return 0; try { const today = new Date(); const birth = new Date(birthDate); if (isNaN(birth.getTime())) return 0; let age = today.getFullYear() - birth.getFullYear(); const monthDiff = today.getMonth() - birth.getMonth(); if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) { age--; } return age > 0 ? age : 0; } catch (e) { if (process.env.NODE_ENV === "development") console.error("Error calculating age:", e); return 0; } };
const formatAvailabilityStatus = (status: UserProfile["availabilityStatus"] | undefined) => { switch (status) { case "AVAILABLE": return { text: "פנוי/ה להצעות", color: "bg-emerald-500", icon: CheckCircle }; case "UNAVAILABLE": return { text: "לא פנוי/ה כרגע", color: "bg-red-500", icon: X }; case "DATING": return { text: "בתהליך הכרות", color: "bg-amber-500", icon: Clock }; case "PAUSED": return { text: "בהפסקה מהצעות", color: "bg-sky-500", icon: Clock }; case "ENGAGED": return { text: "מאורס/ת", color: "bg-fuchsia-500", icon: Heart }; case "MARRIED": return { text: "נשוי/אה", color: "bg-rose-500", icon: Heart }; default: return { text: "סטטוס לא ידוע", color: "bg-slate-500", icon: InfoIcon }; } };
const formatBooleanPreference = (value: boolean | null | undefined, yesLabel: string = "כן", noLabel: string = "לא", notSpecifiedLabel: string = "לא צוין"): string => { if (value === true) return yesLabel; if (value === false) return noLabel; return notSpecifiedLabel; };
const formatStringBooleanPreference = (value: string | null | undefined, options: { [key: string]: string } = { yes: "כן", no: "לא", flexible: "גמיש/ה" }, notSpecifiedLabel: string = "לא צוין"): string => { if (value && options[value.toLowerCase()]) { return options[value.toLowerCase()]; } return notSpecifiedLabel; };

// --- Helper Components ---
const DetailItem: React.FC<{ icon: React.ElementType; label: string; value: React.ReactNode; className?: string; iconColorClass?: string; valueClassName?: string; tooltip?: string; }> = ({ icon: Icon, label, value, className, iconColorClass = "text-gray-500", valueClassName, tooltip }) => { const content = ( <div className={cn("flex items-start gap-2", className)}> <Icon className={cn("w-4 h-4 mt-1 flex-shrink-0", iconColorClass)} /> <div> <p className="text-xs font-medium text-gray-500">{label}</p> <p className={cn("text-sm font-semibold text-gray-800 break-words", valueClassName)}>{value || "לא צוין"}</p> </div> </div> ); if (tooltip) { return ( <Tooltip><TooltipTrigger asChild>{content}</TooltipTrigger><TooltipContent side="top" className="max-w-xs text-center"><p>{tooltip}</p></TooltipContent></Tooltip> ); } return content; };
const EmptyState: React.FC<{ icon: React.ElementType; message: string; description?: string; className?: string; action?: React.ReactNode; }> = ({ icon: Icon, message, description, className, action }) => ( <div className={cn("flex flex-col items-center justify-center py-10 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200", className)}> <Icon className="w-12 h-12 mb-3 text-slate-400/70" /> <p className="text-base font-semibold text-slate-700">{message}</p> {description && <p className="text-sm text-slate-500 mt-1.5 max-w-xs">{description}</p>} {action && <div className="mt-6">{action}</div>} </div> );
const SectionCard: React.FC<{ title: string; icon?: React.ElementType; children: React.ReactNode; className?: string; contentClassName?: string; titleClassName?: string; action?: React.ReactNode; description?: string; }> = ({ title, icon: Icon, children, className, contentClassName, titleClassName, action, description, }) => ( <div className={cn("bg-white rounded-xl shadow-lg border border-slate-200/60 overflow-hidden flex flex-col", className)}> <div className={cn("flex items-center justify-between gap-3 p-4 border-b border-slate-200/70 bg-slate-50/80", titleClassName)}> <div className="flex items-center gap-2.5 min-w-0"> {Icon && <Icon className="w-5 h-5 text-cyan-600 flex-shrink-0" />} <div className="min-w-0"> <h3 className="text-base font-semibold text-slate-800 truncate">{title}</h3> {description && <p className="text-xs text-slate-500 mt-0.5 truncate">{description}</p>} </div> </div> {action && <div className="ml-auto flex-shrink-0">{action}</div>} </div> <div className={cn("p-3 sm:p-4", contentClassName)}>{children}</div> </div> );

const ProfileHeader: React.FC<{ 
  profile: UserProfile; 
  age: number; 
  mainImageToDisplay: UserImageType | null; 
  availability: ReturnType<typeof formatAvailabilityStatus>;
  viewMode: "matchmaker" | "candidate";
  onSuggestClick: () => void;
  isMobile?: boolean;
}> = ({ profile, age, mainImageToDisplay, availability, viewMode, onSuggestClick, isMobile = false }) => {
    const keyDetails = useMemo(() => [
        { label: "גיל", value: age > 0 ? age : null, icon: Cake, color: "text-pink-600" },
        { label: "עיר", value: profile.city, icon: MapPin, color: "text-teal-600" },
        { label: "מצב משפחתי", value: formatEnumValue(profile.maritalStatus, maritalStatusMap), icon: Heart, color: "text-rose-600" },
        { label: "עיסוק", value: profile.occupation, icon: Briefcase, color: "text-emerald-600" },
        { label: "רמה דתית", value: formatEnumValue(profile.religiousLevel, religiousLevelMap), icon: BookMarked, color: "text-indigo-600" },
        { label: "גובה", value: profile.height ? `${profile.height} ס״מ` : null, icon: User, color: "text-slate-600" },
    ].filter(item => item.value), [profile, age]);

    return (
        <div className="p-4 bg-gradient-to-br from-slate-100 via-white to-sky-100/30 border-b border-slate-200/80">
            <div className={cn("flex items-center gap-4", isMobile ? "flex-col text-center" : "sm:flex-row sm:items-start sm:text-right")}>
                <div className="relative h-24 w-24 rounded-full overflow-hidden border-4 border-white shadow-2xl ring-2 ring-cyan-500/50 flex-shrink-0">
                    {mainImageToDisplay?.url ? (
                        <Image src={mainImageToDisplay.url} alt={`תמונת פרופיל של ${profile.user?.firstName || 'מועמד'}`} fill className="object-cover" sizes="96px" priority />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-slate-200 to-slate-300">
                            <span className="text-4xl font-medium text-slate-500">{getInitials(profile.user?.firstName, profile.user?.lastName)}</span>
                        </div>
                    )}
                </div>
                <div className="flex-grow w-full">
                    <div className={cn("flex justify-between items-center gap-2", isMobile ? "flex-col" : "sm:flex-row")}>
                        <div className={cn(isMobile && "flex flex-col items-center")}>
                            <h1 className={cn("font-extrabold text-slate-800 tracking-tight", isMobile ? "text-2xl" : "text-2xl sm:text-3xl")}>
                                {profile.user?.firstName || "שם פרטי"} {profile.user?.lastName || "שם משפחה"}
                            </h1>
                            <div className={cn("flex items-center gap-3 mt-1.5", isMobile ? "justify-center" : "sm:justify-start")}>
                                <Badge className={cn("text-xs px-2 py-1", availability.color, "text-white")}>
                                    <availability.icon className="w-3 h-3 ml-1" />
                                    {availability.text}
                                </Badge>
                                {profile.lastActive && (
                                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                                        <Clock className="w-3 h-3" />
                                        <span>נצפה: {new Date(profile.lastActive).toLocaleDateString("he-IL", { day: '2-digit', month: '2-digit' })}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        {viewMode === 'matchmaker' && (
                          <Button 
                            size={isMobile ? "sm" : "sm"}
                            className="bg-cyan-500 hover:bg-cyan-600 text-white font-semibold rounded-full px-4 shadow-lg hover:shadow-cyan-500/30 transition-all mt-3 sm:mt-0"
                            onClick={onSuggestClick}
                          >
                            <LinkIcon className="w-4 h-4 ml-2" />
                            הצע התאמה
                          </Button>
                        )}
                    </div>
                    {!isMobile && (
                        <div className="mt-4 pt-4 border-t border-slate-200/90 grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
                            {keyDetails.map(({ label, value, icon: Icon, color }) => (
                                <div key={label} className="flex items-center gap-2">
                                    <Icon className={cn("w-4 h-4 flex-shrink-0", color)} />
                                    <div className="min-w-0">
                                        <p className="text-xs text-slate-500 font-medium">{label}</p>
                                        <p className="text-sm text-slate-800 font-semibold truncate" title={String(value)}>{String(value)}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
            {isMobile && (
                 <div className="mt-4 pt-3 border-t border-slate-200/90">
                    <div className="flex flex-wrap justify-center gap-x-4 gap-y-2">
                        {keyDetails.map(({ label, value, icon: Icon, color }) => (
                             <div key={label} className="flex items-center gap-1.5 text-xs">
                                <Icon className={cn("w-3.5 h-3.5", color)} />
                                <span className="font-medium text-slate-700">{String(value)}</span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

const QuestionnaireItem: React.FC<{ answer: FormattedAnswer; worldColor?: string; }> = ({ answer, worldColor = "slate" }) => {
    return (
        <div className={cn("p-3 rounded-lg border hover:shadow-sm transition-shadow w-full", `bg-white border-${worldColor}-200/60`)}>
            <p className="text-sm font-semibold mb-1.5 text-slate-800">{answer.question}</p>
            <p className="text-sm text-slate-700 whitespace-pre-wrap break-words leading-relaxed">{`“${answer.displayText || answer.answer}”`}</p>
        </div>
    );
};

interface ProfileCardProps {
    profile: UserProfile;
    images?: UserImageType[];
    questionnaire?: QuestionnaireResponse | null;
    viewMode?: "matchmaker" | "candidate";
    className?: string;
    candidate?: Candidate;
    allCandidates?: Candidate[];
    onCreateSuggestion?: (data: CreateSuggestionData) => Promise<void>;
}

const ProfileCard: React.FC<ProfileCardProps> = ({ 
    profile, 
    candidate,
    images = [], 
    questionnaire, 
    viewMode = "candidate", 
    className,
    allCandidates = [],
    onCreateSuggestion
}) => {
    const [isClient, setIsClient] = useState(false);
    const [isDesktop, setIsDesktop] = useState(true);
    const [selectedImageForDialog, setSelectedImageForDialog] = useState<UserImageType | null>(null);
    const [activeTab, setActiveTab] = useState("about_me");
    const [isSuggestDialogOpen, setIsSuggestDialogOpen] = useState(false);
    const [mobileViewLayout, setMobileViewLayout] = useState<'classic' | 'focus'>('classic');
    
    useEffect(() => {
        setIsClient(true);
        const checkScreenSize = () => setIsDesktop(window.innerWidth >= 1024);
        checkScreenSize();
        window.addEventListener("resize", checkScreenSize);
        return () => window.removeEventListener("resize", checkScreenSize);
    }, []);

    const orderedImages = useMemo(() => {
        const validImages = (images || []).filter(img => img.url);
        const mainImg = validImages.find(img => img.isMain);
        const otherImages = validImages.filter(img => !img.isMain);
        return mainImg ? [mainImg, ...otherImages] : validImages;
    }, [images]);

    const mainImageToDisplay = useMemo(() => orderedImages.length > 0 ? orderedImages[0] : null, [orderedImages]);

    const age = useMemo(() => calculateAge(profile.birthDate), [profile.birthDate]);
    const availability = useMemo(() => formatAvailabilityStatus(profile.availabilityStatus), [profile.availabilityStatus]);

    const hasDisplayableQuestionnaireAnswers = useMemo(() =>
        questionnaire &&
        questionnaire.formattedAnswers &&
        Object.values(questionnaire.formattedAnswers)
            .flat()
            .some((a) => a.isVisible !== false && (a.answer || a.displayText)),
        [questionnaire]
    );

    const currentDialogImageIndex = useMemo(() => selectedImageForDialog ? orderedImages.findIndex(img => img.id === selectedImageForDialog.id) : -1, [selectedImageForDialog, orderedImages]);

    const handleOpenImageDialog = (image: UserImageType) => image.url && setSelectedImageForDialog(image);
    const handleCloseImageDialog = () => setSelectedImageForDialog(null);

    const handleDialogNav = (direction: "next" | "prev") => {
        if (currentDialogImageIndex === -1 || orderedImages.length <= 1) return;
        const newIndex = (currentDialogImageIndex + (direction === 'next' ? 1 : -1) + orderedImages.length) % orderedImages.length;
        setSelectedImageForDialog(orderedImages[newIndex]);
    };

    const handleCreateSuggestion = async (data: CreateSuggestionData) => {
        if (onCreateSuggestion) {
            await onCreateSuggestion(data);
        }
        setIsSuggestDialogOpen(false);
    };

    const tabItems = useMemo(() => [
        { value: "about_me", label: "קצת עליי", icon: User, activeColor: "cyan" },
        { value: "background_worldview", label: "רקע והשקפה", icon: BookOpen, activeColor: "indigo" },
        { value: "looking_for", label: "מה הם מחפשים?", icon: Target, activeColor: "green" },
        ...(hasDisplayableQuestionnaireAnswers ? [{ value: "questionnaire", label: "מהשאלון", icon: FileText, activeColor: "rose" }] : []),
        ...(viewMode === "matchmaker" ? [{ value: "matchmaker_info", label: "מידע לשדכן", icon: Lock, activeColor: "amber" }] : []),
    ], [hasDisplayableQuestionnaireAnswers, viewMode]);

    const renderPreferenceBadges = (label: string, icon: React.ElementType, iconColorClass: string, values: string[] | undefined, badgeColorClass: string, translationMap: { [key: string]: string }) => {
        if (!values || values.length === 0) return null;
        const IconComponent = icon;
        return (
            <div>
                <p className={cn("text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2", iconColorClass)}>
                    <IconComponent className="w-4 h-4" /> {label}
                </p>
                <div className="flex flex-wrap gap-2">
                    {values.map((val) => (
                        <Badge key={val} variant="outline" className={cn("text-xs px-2.5 py-1", badgeColorClass)}>
                            {translationMap[val] || val}
                        </Badge>
                    ))}
                </div>
            </div>
        );
    };

    const MainContentTabs = () => (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full flex flex-col flex-grow min-h-0">
            <div className="bg-white/80 backdrop-blur-sm p-1.5 rounded-lg mb-4 shadow-md border border-gray-200/80 sticky top-0 z-20">
                <ScrollArea dir="rtl" className="w-full">
                    <TabsList className="h-auto inline-flex bg-transparent p-1">
                        {tabItems.map((tab) => (
                            <TabsTrigger key={tab.value} value={tab.value} className={cn( "flex items-center gap-1.5 px-3 py-1.5 text-xs sm:text-sm rounded-md", "whitespace-nowrap transition-all duration-200", "text-slate-600 hover:text-slate-800 hover:bg-slate-100", activeTab === tab.value && `font-bold border-${tab.activeColor}-500 text-${tab.activeColor}-600 bg-white shadow-sm ring-1 ring-inset ring-slate-200` )}>
                                <tab.icon className="w-4 h-4" />
                                <span>{tab.label}</span>
                            </TabsTrigger>
                        ))}
                    </TabsList>
                    <ScrollBar orientation="horizontal" />
                </ScrollArea>
            </div>
            <div className="space-y-4 focus:outline-none flex-grow min-h-0">
                <TabsContent value="about_me" className="mt-0 space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <SectionCard title="תכונות אופי (שלי)" icon={Smile}>
                            <div className="flex flex-wrap gap-2">
                                {profile.profileCharacterTraits?.length > 0 ? profile.profileCharacterTraits.map(trait => <Badge key={trait} variant="secondary" className="px-2 py-1 bg-purple-100 text-purple-800">{formatEnumValue(trait, characterTraitMap, trait)}</Badge>) : <EmptyState icon={Smile} message="לא צוינו תכונות" className="py-6" />}
                            </div>
                        </SectionCard>
                        <SectionCard title="תחביבים (שלי)" icon={Palette}>
                            <div className="flex flex-wrap gap-2">
                                {profile.profileHobbies?.length > 0 ? profile.profileHobbies.map(hobby => <Badge key={hobby} variant="secondary" className="px-2 py-1 bg-teal-100 text-teal-800">{formatEnumValue(hobby, hobbiesMap, hobby)}</Badge>) : <EmptyState icon={Palette} message="לא צוינו תחביבים" className="py-6" />}
                            </div>
                        </SectionCard>
                    </div>
                    <SectionCard title="רקע משפחתי ואישי" icon={Users2} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={Users2} label="מצב הורים" value={profile.parentStatus} iconColorClass="text-purple-600" />
                        <DetailItem icon={Users} label="מספר אחים/אחיות" value={profile.siblings?.toString()} iconColorClass="text-purple-600" />
                        <DetailItem icon={User} label="מיקום במשפחה" value={profile.position?.toString()} iconColorClass="text-purple-600" />
                        {profile.aliyaCountry && <DetailItem icon={MapPin} label="ארץ עלייה" value={profile.aliyaCountry} iconColorClass="text-cyan-600" />}
                        {profile.aliyaYear && <DetailItem icon={Calendar} label="שנת עלייה" value={profile.aliyaYear.toString()} iconColorClass="text-cyan-600" />}
                        {profile.additionalLanguages && profile.additionalLanguages.length > 0 && <div className="sm:col-span-2 pt-3 border-t border-slate-200/60 mt-2">
                            <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2"><Languages className="w-4 h-4 text-emerald-600" /> שפות נוספות</p>
                            <div className="flex flex-wrap gap-2">{profile.additionalLanguages.map(lang => <Badge key={lang} variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">{formatEnumValue(lang, languageMap)}</Badge>)}</div>
                        </div>}
                    </SectionCard>
                </TabsContent>
                <TabsContent value="background_worldview" className="mt-0 space-y-4">
                    <SectionCard title="דת ואמונה" icon={BookMarked} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={BookMarked} label="רמה דתית" value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} iconColorClass="text-indigo-600" />
                        <DetailItem icon={Sparkles} label="שמירת נגיעה" value={formatBooleanPreference(profile.shomerNegiah)} iconColorClass="text-pink-600" />
                        {profile.gender === "FEMALE" && <DetailItem icon={UserCheck} label="כיסוי ראש" value={formatEnumValue(profile.headCovering, headCoveringMap)} iconColorClass="text-slate-600" />}
                        {profile.gender === "MALE" && <DetailItem icon={UserCheck} label="סוג כיפה" value={formatEnumValue(profile.kippahType, kippahTypeMap)} iconColorClass="text-slate-600" />}
                    </SectionCard>
                    <SectionCard title="השכלה ותעסוקה" icon={GraduationCap} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <DetailItem icon={GraduationCap} label="רמת השכלה" value={formatEnumValue(profile.educationLevel, educationLevelMap)} iconColorClass="text-sky-600" />
                        <DetailItem icon={School} label="פירוט השכלה" value={profile.education} iconColorClass="text-sky-600" valueClassName="whitespace-pre-wrap" />
                        <DetailItem icon={Briefcase} label="עיסוק" value={profile.occupation} iconColorClass="text-emerald-600" />
                        <DetailItem icon={Award} label="שירות צבאי/לאומי" value={formatEnumValue(profile.serviceType, serviceTypeMap)} iconColorClass="text-amber-600" />
                        {profile.serviceDetails && <DetailItem icon={InfoIcon} label="פרטי שירות" value={profile.serviceDetails} iconColorClass="text-amber-600" valueClassName="whitespace-pre-wrap" />}
                    </SectionCard>
                </TabsContent>
                <TabsContent value="looking_for" className="mt-0 space-y-4">
                    <SectionCard title="העדפות לבן/בת הזוג" icon={Target} description="מה המועמד/ת מחפש/ת בהתאמה" contentClassName="space-y-5">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            {(profile.preferredAgeMin || profile.preferredAgeMax) && <DetailItem icon={Calendar} label="טווח גילאים" value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`} iconColorClass="text-blue-600" />}
                            {(profile.preferredHeightMin || profile.preferredHeightMax) && <DetailItem icon={User} label="טווח גבהים" value={`${profile.preferredHeightMin || '?'} - ${profile.preferredHeightMax || '?'} ס״מ`} iconColorClass="text-blue-600" />}
                            <DetailItem icon={ShieldQuestion} label="שמירת נגיעה" value={formatStringBooleanPreference(profile.preferredShomerNegiah)} iconColorClass="text-pink-600" tooltip="העדפה לגבי שמירת נגיעה" />
                            <DetailItem icon={Users2} label="ילדים מקשר קודם" value={formatBooleanPreference(profile.preferredHasChildrenFromPrevious)} iconColorClass="text-purple-600" tooltip="העדפה לגבי ילדים מקשר קודם" />
                        </div>
                        <div className="space-y-4">
                          {renderPreferenceBadges("סטטוסים משפחתיים", Heart, "text-rose-600", profile.preferredMaritalStatuses, "bg-rose-50 text-rose-800 border-rose-200", maritalStatusMap)}
                          {renderPreferenceBadges("רמות דתיות", BookMarked, "text-indigo-600", profile.preferredReligiousLevels, "bg-indigo-50 text-indigo-800 border-indigo-200", religiousLevelMap)}
                        </div>
                         {!profile.preferredAgeMin && !profile.preferredMaritalStatuses?.length && <EmptyState icon={Search} message="לא צוינו העדפות ספציפיות" />}
                    </SectionCard>
                </TabsContent>
                {hasDisplayableQuestionnaireAnswers && (
                    <TabsContent value="questionnaire" className="mt-0 space-y-4">
                        {Object.entries(WORLDS).map(([worldKey, worldConfig]) => {
                            const answers = (questionnaire?.formattedAnswers?.[worldKey as keyof typeof questionnaire.formattedAnswers] || []).filter(a => a.isVisible !== false && (a.answer || a.displayText));
                            if (answers.length === 0) return null;
                            return (
                                <SectionCard key={worldKey} title={worldConfig.label} icon={worldConfig.icon} titleClassName={cn(`bg-${worldConfig.color}-50 border-${worldConfig.color}-200`)} contentClassName="p-2 sm:p-3">
                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-2">
                                        {answers.map(answer => <QuestionnaireItem key={answer.questionId} answer={answer} worldColor={worldConfig.color} />)}
                                    </div>
                                </SectionCard>
                            );
                        })}
                    </TabsContent>
                )}
                {viewMode === "matchmaker" && (
                    <TabsContent value="matchmaker_info" className="mt-0">
                        <div className="bg-amber-50 border-2 border-amber-300/70 rounded-xl shadow-lg p-4 space-y-4">
                            <div className="flex items-center gap-2.5 text-amber-800"><Lock className="w-5 h-5" /><h3 className="font-semibold text-lg">מידע רגיש לשדכנים בלבד</h3></div>
                            <DetailItem icon={Phone} label="העדפת יצירת קשר" value={formatEnumValue(profile.contactPreference, contactPreferenceMap, "-")} iconColorClass="text-amber-600" />
                            <DetailItem icon={Handshake} label="העדפת מגדר שדכן/ית" value={profile.preferredMatchmakerGender ? profile.preferredMatchmakerGender === "MALE" ? "גבר" : "אישה" : "אין העדפה"} iconColorClass="text-amber-600" />
                            {profile.matchingNotes && <div>
                                <p className="text-sm font-semibold text-amber-700 mb-2 flex items-center gap-2"><Edit3 className="w-4 h-4" /> הערות לשדכנים:</p>
                                <p className="text-sm text-slate-700 whitespace-pre-wrap bg-amber-100/70 p-3 rounded-md border border-amber-200/80">{profile.matchingNotes}</p>
                            </div>}
                        </div>
                    </TabsContent>
                )}
            </div>
        </Tabs>
    );

    // --- MOBILE LAYOUT IMPLEMENTATION ---

  const MobileHeader = () => (
  <div className="p-2 flex-shrink-0 flex justify-center items-center bg-slate-100/50 border-b sticky top-0 z-30">
    <ToggleGroup 
      type="single" 
      value={mobileViewLayout} 
      onValueChange={(value: 'classic' | 'focus') => { if (value) setMobileViewLayout(value); }}
      className="bg-white rounded-full shadow-md border p-1"
    >
      <ToggleGroupItem value="focus" aria-label="Focus view" className="rounded-full px-3 data-[state=on]:bg-cyan-500 data-[state=on]:text-white">
        {/* אייקון חדש */}
        <Columns className="h-4 w-4" /> 
        {/* טקסט חדש */}
        <span className="mr-2 text-xs">תמצית</span> 
      </ToggleGroupItem>
      <ToggleGroupItem value="classic" aria-label="Classic view" className="rounded-full px-3 data-[state=on]:bg-cyan-500 data-[state=on]:text-white">
        {/* אייקון חדש */}
        <FileText className="h-4 w-4" /> 
        {/* טקסט חדש */}
        <span className="mr-2 text-xs">מפורט</span>
      </ToggleGroupItem>
    </ToggleGroup>
  </div>
);

    
    const MobileImageGallery = () => (
      orderedImages.length > 0 && (
        <div className="px-4 pt-4 pb-2 bg-slate-50">
          <ScrollArea dir="rtl" className="w-full whitespace-nowrap">
            <div className="flex gap-3 pb-2">
              {orderedImages.map((image, idx) => (
                <div key={image.id} className="relative w-32 h-44 flex-shrink-0 rounded-xl overflow-hidden cursor-pointer group shadow-md" onClick={() => handleOpenImageDialog(image)}>
                  <Image src={image.url} alt={`תמונה ${idx+1}`} fill className="object-cover" sizes="128px" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                  {image.isMain && <Badge className="absolute top-1.5 right-1.5 bg-yellow-400 text-black text-[10px] font-bold gap-1 px-1.5 py-0.5"><Star className="w-2.5 h-2.5 fill-current" /> ראשי</Badge>}
                </div>
              ))}
            </div>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>
        </div>
      )
    );

    const ClassicMobileLayout = () => (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProfileHeader 
          profile={profile} 
          age={age} 
          mainImageToDisplay={mainImageToDisplay} 
          availability={availability}
          viewMode={viewMode}
          onSuggestClick={() => setIsSuggestDialogOpen(true)}
          isMobile={true}
        />
        <MobileImageGallery />
        <div className="p-4 bg-slate-100/40"><MainContentTabs /></div>
      </div>
    );

    const FocusMobileLayout = () => (
      <div className="flex-1 min-h-0 overflow-y-auto">
        <ProfileHeader 
          profile={profile} 
          age={age} 
          mainImageToDisplay={mainImageToDisplay} 
          availability={availability}
          viewMode={viewMode}
          onSuggestClick={() => setIsSuggestDialogOpen(true)}
          isMobile={true}
        />
        <MobileImageGallery />
        <div className="p-3 space-y-4 bg-slate-100/40">
            <SectionCard title="קצת עליי" icon={InfoIcon}>
                {profile.about ? (
                    <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed p-2 bg-slate-50 rounded-md border border-slate-200/60">{`“${profile.about}”`}</p>
                ) : <EmptyState icon={InfoIcon} message="לא הוזן תיאור אישי" />}
            </SectionCard>
            
            <SectionCard title="תמצית פרופיל" icon={Gem} contentClassName="grid grid-cols-2 gap-x-2 gap-y-3">
                <DetailItem icon={BookMarked} label="רמה דתית" value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} iconColorClass="text-indigo-600" />
                <DetailItem icon={Sparkles} label="שמירת נגיעה" value={formatBooleanPreference(profile.shomerNegiah)} iconColorClass="text-pink-600" />
                <DetailItem icon={Briefcase} label="עיסוק" value={profile.occupation} iconColorClass="text-emerald-600" />
                <DetailItem icon={GraduationCap} label="רמת השכלה" value={formatEnumValue(profile.educationLevel, educationLevelMap)} iconColorClass="text-sky-600" />
                <DetailItem icon={MapPin} label="עיר" value={profile.city} iconColorClass="text-teal-600" />
                {(profile.maritalStatus === 'divorced' || profile.maritalStatus === 'widowed' || profile.maritalStatus === 'annulled') && (
                  <DetailItem icon={Users2} label="ילדים מקשר קודם" value={formatBooleanPreference(profile.hasChildrenFromPrevious)} iconColorClass="text-purple-600" />
                )}
            </SectionCard>

            <SectionCard title="תיאור המבוקש/ת" icon={Target} contentClassName="space-y-4">
                {profile.matchingNotes ? (
                    <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-100 p-3 rounded-md border">{profile.matchingNotes}</p>
                ) : (
                    <EmptyState icon={Search} message="לא הוזן תיאור על המבוקש/ת" className="py-6" />
                )}
                <div className="space-y-3 pt-3 border-t border-slate-200/60">
                    <DetailItem icon={Calendar} label="טווח גילאים מועדף" value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`} iconColorClass="text-blue-600" />
                    {renderPreferenceBadges("רמות דתיות מועדפות", BookMarked, "text-indigo-600", profile.preferredReligiousLevels, "bg-indigo-50 text-indigo-800 border-indigo-200", religiousLevelMap)}
                </div>
            </SectionCard>
            
            <SectionCard title="תכונות אופי ותחביבים" icon={Smile}>
                <div className="space-y-4">
                    <h4 className="text-sm font-semibold text-slate-600">תכונות אופי (שלי)</h4>
                    <div className="flex flex-wrap gap-2">
                        {profile.profileCharacterTraits?.length > 0 ? profile.profileCharacterTraits.map(trait => <Badge key={trait} variant="secondary" className="px-2 py-1 bg-purple-100 text-purple-800">{formatEnumValue(trait, characterTraitMap, trait)}</Badge>) : <EmptyState icon={Smile} message="לא צוינו תכונות" className="py-4 text-xs" />}
                    </div>
                    <h4 className="text-sm font-semibold text-slate-600 pt-3 border-t">תחביבים (שלי)</h4>
                    <div className="flex flex-wrap gap-2">
                         {profile.profileHobbies?.length > 0 ? profile.profileHobbies.map(hobby => <Badge key={hobby} variant="secondary" className="px-2 py-1 bg-teal-100 text-teal-800">{formatEnumValue(hobby, hobbiesMap, hobby)}</Badge>) : <EmptyState icon={Palette} message="לא צוינו תחביבים" className="py-4 text-xs" />}
                    </div>
                </div>
            </SectionCard>

            <SectionCard title="רקע משפחתי ואישי" icon={Users2} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={Users2} label="מצב הורים" value={profile.parentStatus} iconColorClass="text-purple-600" />
                <DetailItem icon={Users} label="מספר אחים/אחיות" value={profile.siblings?.toString()} iconColorClass="text-purple-600" />
                <DetailItem icon={User} label="מיקום במשפחה" value={profile.position?.toString()} iconColorClass="text-purple-600" />
                {profile.aliyaCountry && <DetailItem icon={MapPin} label="ארץ עלייה" value={profile.aliyaCountry} iconColorClass="text-cyan-600" />}
                {profile.aliyaYear && <DetailItem icon={Calendar} label="שנת עלייה" value={profile.aliyaYear.toString()} iconColorClass="text-cyan-600" />}
                {profile.additionalLanguages && profile.additionalLanguages.length > 0 && <div className="sm:col-span-2 pt-3 border-t border-slate-200/60 mt-2">
                    <p className="text-sm font-semibold text-slate-600 mb-2 flex items-center gap-2"><Languages className="w-4 h-4 text-emerald-600" /> שפות נוספות</p>
                    <div className="flex flex-wrap gap-2">{profile.additionalLanguages.map(lang => <Badge key={lang} variant="outline" className="bg-emerald-50 text-emerald-800 border-emerald-200">{formatEnumValue(lang, languageMap)}</Badge>)}</div>
                </div>}
            </SectionCard>

            <SectionCard title="דת ואמונה" icon={BookMarked} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={BookMarked} label="רמה דתית" value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} iconColorClass="text-indigo-600" />
                <DetailItem icon={Sparkles} label="שמירת נגיעה" value={formatBooleanPreference(profile.shomerNegiah)} iconColorClass="text-pink-600" />
                {profile.gender === "FEMALE" && <DetailItem icon={UserCheck} label="כיסוי ראש" value={formatEnumValue(profile.headCovering, headCoveringMap)} iconColorClass="text-slate-600" />}
                {profile.gender === "MALE" && <DetailItem icon={UserCheck} label="סוג כיפה" value={formatEnumValue(profile.kippahType, kippahTypeMap)} iconColorClass="text-slate-600" />}
            </SectionCard>

            <SectionCard title="השכלה ותעסוקה" icon={GraduationCap} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={GraduationCap} label="רמת השכלה" value={formatEnumValue(profile.educationLevel, educationLevelMap)} iconColorClass="text-sky-600" />
                <DetailItem icon={School} label="פירוט השכלה" value={profile.education} iconColorClass="text-sky-600" valueClassName="whitespace-pre-wrap" />
                <DetailItem icon={Briefcase} label="עיסוק" value={profile.occupation} iconColorClass="text-emerald-600" />
                <DetailItem icon={Award} label="שירות צבאי/לאומי" value={formatEnumValue(profile.serviceType, serviceTypeMap)} iconColorClass="text-amber-600" />
                {profile.serviceDetails && <DetailItem icon={InfoIcon} label="פרטי שירות" value={profile.serviceDetails} iconColorClass="text-amber-600" valueClassName="whitespace-pre-wrap" />}
            </SectionCard>

            {hasDisplayableQuestionnaireAnswers && (
                Object.entries(WORLDS).map(([worldKey, worldConfig]) => {
                    const answers = (questionnaire?.formattedAnswers?.[worldKey as keyof typeof questionnaire.formattedAnswers] || []).filter(a => a.isVisible !== false && (a.answer || a.displayText));
                    if (answers.length === 0) return null;
                    return (
                        <SectionCard key={worldKey} title={worldConfig.label} icon={worldConfig.icon} titleClassName={cn(`bg-${worldConfig.color}-50 border-${worldConfig.color}-200`)} contentClassName="p-2 sm:p-3">
                            <div className="space-y-2">
                                {answers.map(answer => <QuestionnaireItem key={answer.questionId} answer={answer} worldColor={worldConfig.color} />)}
                            </div>
                        </SectionCard>
                    );
                })
            )}

        </div>
      </div>
    );

    if (!isClient) {
        return (
            <Card dir="rtl" className={cn("w-full bg-white shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col h-full", className)}>
                <div className="p-6 bg-slate-100/70 border-b border-slate-200/80">
                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
                        <Skeleton className="h-32 w-32 rounded-full flex-shrink-0" />
                        <div className="flex-grow w-full space-y-4">
                            <Skeleton className="h-10 w-3/4" />
                            <Skeleton className="h-6 w-1/2" />
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-4">
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                                <Skeleton className="h-10 w-full" />
                            </div>
                        </div>
                    </div>
                </div>
                <div className="p-6 flex-grow"><Skeleton className="h-full w-full" /></div>
            </Card>
        );
    }
    
    return (
        <TooltipProvider>
            <Card dir="rtl" id="profile-card-container" className={cn("w-full bg-slate-50 shadow-2xl rounded-2xl overflow-hidden border-0 flex flex-col max-h-[calc(100vh-2rem)] h-full relative", className)}>
                {isDesktop ? (
                    <ResizablePanelGroup direction="horizontal" dir="rtl" className="flex-grow min-h-0">
                        <ResizablePanel defaultSize={60} minSize={40} className="min-w-0 bg-slate-100/40 flex flex-col">
                            <ProfileHeader 
                              profile={profile} 
                              age={age} 
                              mainImageToDisplay={mainImageToDisplay} 
                              availability={availability} 
                              viewMode={viewMode}
                              onSuggestClick={() => setIsSuggestDialogOpen(true)}
                            />
                            <ScrollArea className="flex-grow min-h-0"><div className="p-4"><MainContentTabs /></div></ScrollArea>
                        </ResizablePanel>
                        <ResizableHandle withHandle className="bg-slate-200 hover:bg-slate-300 transition-colors" />
                        <ResizablePanel defaultSize={40} minSize={25} className="min-w-0 bg-slate-100/40 flex flex-col">
                           <ScrollArea className="flex-grow min-h-0">
                                <div className="p-4 space-y-4">
                                    <SectionCard title="תמונות" icon={ImageIcon} contentClassName="p-2 space-y-2">
                                        {orderedImages.length > 0 ? (
                                            <>
                                                <div className="relative aspect-video rounded-lg overflow-hidden cursor-pointer group shadow-md" onClick={() => handleOpenImageDialog(orderedImages[0])}>
                                                    <Image src={orderedImages[0].url} alt="תמונה ראשית" fill className="object-cover" sizes="35vw" priority />
                                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"><Eye className="w-8 h-8 text-white" /></div>
                                                </div>
                                                {orderedImages.length > 1 && (
                                                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                                                        {orderedImages.slice(1, 5).map(img => (
                                                            <div key={img.id} className="relative aspect-square rounded-md overflow-hidden cursor-pointer border hover:border-cyan-400" onClick={() => handleOpenImageDialog(img)}>
                                                                <Image src={img.url} alt="תמונת פרופיל" fill className="object-cover" sizes="15vw" />
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}
                                            </>
                                        ) : <EmptyState icon={ImageIcon} message="אין תמונות להצגה" />}
                                    </SectionCard>

                                    <SectionCard title="תמצית פרופיל" icon={Gem} contentClassName="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3">
                                        <DetailItem icon={BookMarked} label="רמה דתית" value={formatEnumValue(profile.religiousLevel, religiousLevelMap)} iconColorClass="text-indigo-600" />
                                        <DetailItem icon={Sparkles} label="שמירת נגיעה" value={formatBooleanPreference(profile.shomerNegiah)} iconColorClass="text-pink-600" />
                                        <DetailItem icon={Briefcase} label="עיסוק" value={profile.occupation} iconColorClass="text-emerald-600" />
                                        <DetailItem icon={GraduationCap} label="רמת השכלה" value={formatEnumValue(profile.educationLevel, educationLevelMap)} iconColorClass="text-sky-600" />
                                        <DetailItem icon={MapPin} label="עיר" value={profile.city} iconColorClass="text-teal-600" />
                                        {(profile.maritalStatus === 'divorced' || profile.maritalStatus === 'widowed' || profile.maritalStatus === 'annulled') && (
                                          <DetailItem icon={Users2} label="ילדים מקשר קודם" value={formatBooleanPreference(profile.hasChildrenFromPrevious)} iconColorClass="text-purple-600" />
                                        )}
                                    </SectionCard>

                                    <SectionCard title="קצת עליי" icon={InfoIcon}>
                                        {profile.about ? (
                                            <p className="text-sm text-slate-800 whitespace-pre-wrap break-words leading-relaxed p-3 bg-slate-50 rounded-md border border-slate-200/60">{`“${profile.about}”`}</p>
                                        ) : <EmptyState icon={InfoIcon} message="לא הוזן תיאור אישי" />}
                                    </SectionCard>
                                    
                                    <SectionCard title="תיאור המבוקש/ת" icon={Target} contentClassName="space-y-4">
                                        {profile.matchingNotes ? (
                                            <p className="text-sm text-slate-700 whitespace-pre-wrap bg-slate-100 p-3 rounded-md border">{profile.matchingNotes}</p>
                                        ) : (
                                            <EmptyState icon={Search} message="לא הוזן תיאור על המבוקש/ת" className="py-6" />
                                        )}
                                        <div className="space-y-3 pt-3 border-t border-slate-200/60">
                                            <DetailItem icon={Calendar} label="טווח גילאים מועדף" value={`${profile.preferredAgeMin || '?'} - ${profile.preferredAgeMax || '?'} שנים`} iconColorClass="text-blue-600" />
                                            {renderPreferenceBadges("רמות דתיות מועדפות", BookMarked, "text-indigo-600", profile.preferredReligiousLevels, "bg-indigo-50 text-indigo-800 border-indigo-200", religiousLevelMap)}
                                        </div>
                                    </SectionCard>
                                </div>
                            </ScrollArea>
                        </ResizablePanel>
                    </ResizablePanelGroup>
                ) : (
                    <div className="flex flex-col h-full w-full">
                        <MobileHeader />
                        {mobileViewLayout === 'classic' ? <ClassicMobileLayout /> : <FocusMobileLayout />}
                    </div>
                )}

                {selectedImageForDialog && <Dialog open={!!selectedImageForDialog} onOpenChange={isOpen => !isOpen && handleCloseImageDialog()}>
                    <DialogContent className="max-w-5xl w-[95vw] h-[90vh] p-0 bg-black/95 backdrop-blur-md border-none rounded-lg flex flex-col" dir="rtl">
                        <DialogHeader className="p-3 text-white flex-row justify-between items-center border-b border-slate-700/50">
                            <DialogTitle className="text-lg font-semibold">תמונה {currentDialogImageIndex + 1} מתוך {orderedImages.length}</DialogTitle>
                            <Button variant="ghost" size="icon" className="text-slate-300 hover:text-white" onClick={handleCloseImageDialog}><X className="w-5 h-5" /></Button>
                        </DialogHeader>
                        <div className="relative flex-1 w-full min-h-0">
                            <Image key={selectedImageForDialog.id} src={selectedImageForDialog.url} alt={`תמונה מוגדלת ${currentDialogImageIndex + 1}`} fill className="object-contain" sizes="90vw" priority />
                            {orderedImages.length > 1 && <>
                                <Button variant="ghost" size="icon" className="absolute right-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white h-12 w-12 rounded-full" onClick={() => handleDialogNav("prev")}><ChevronRight className="h-6 w-6" /></Button>
                                <Button variant="ghost" size="icon" className="absolute left-2 top-1/2 -translate-y-1/2 bg-black/40 hover:bg-black/60 text-white h-12 w-12 rounded-full" onClick={() => handleDialogNav("next")}><ChevronLeft className="h-6 w-6" /></Button>
                            </>}
                        </div>
                        {orderedImages.length > 1 && <DialogFooter className="border-t border-slate-700/50 bg-black/70 p-0"><ScrollArea dir="rtl" className="w-full">
                            <div className="flex gap-2 p-2 justify-center">{orderedImages.map(img => (
                                <div key={img.id} className={cn("relative flex-shrink-0 w-14 h-14 rounded-md overflow-hidden cursor-pointer border-2 transition-all", img.id === selectedImageForDialog.id ? "border-cyan-400" : "border-transparent opacity-60 hover:opacity-100")} onClick={() => setSelectedImageForDialog(img)}>
                                    <Image src={img.url} alt="תמונה קטנה" fill className="object-cover" sizes="56px" />
                                </div>
                            ))}</div><ScrollBar orientation="horizontal" /></ScrollArea></DialogFooter>}
                    </DialogContent>
                </Dialog>}
                
                {viewMode === 'matchmaker'  && candidate &&  (
                    <NewSuggestionForm
                        isOpen={isSuggestDialogOpen}
                        onClose={() => setIsSuggestDialogOpen(false)}
                        candidates={allCandidates}
                        selectedCandidate={candidate} 
                        onSubmit={handleCreateSuggestion}
                    />
                )}
            </Card>
        </TooltipProvider>
    );
};

export default ProfileCard;