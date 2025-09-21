'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface FormProps {
  token: string;
  userName: string;
}

export function TestimonialSubmissionForm({ token, userName }: FormProps) {
  const [formData, setFormData] = useState({
    authorName: '',
    relationship: '',
    content: '',
    authorPhone: '',
    isPhoneVisibleToMatch: false,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // ======================= התיקון מתחיל כאן =======================

      // 1. נבנה את המטען (payload) שישלח לשרת.
      // הוא יכיל את כל פרטי הטופס, ובנוסף את הטוקן.
      const payload = {
        ...formData,
        token: token,
      };

      // 2. נשנה את כתובת ה-API לכתובת הנכונה שיצרנו ליצירת המלצות.
      const response = await fetch(`/api/profile/testimonials`, {
        // <-- שינוי הנתיב
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload), // <-- שליחת המטען המלא
      });

      // ======================= התיקון מסתיים כאן =======================

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.message || 'שגיאה בשליחת ההמלצה.');
      }

      toast.success('ההמלצה נשלחה בהצלחה!');
      setIsSubmitted(true);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'אירעה שגיאה לא צפויה.';
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  if (isSubmitted) {
    return (
      <div className="text-center p-8 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-bold text-green-600">תודה רבה!</h2>
        <p className="mt-2 text-gray-700">
          ההמלצה שלך נשלחה ל{userName} ותעזור לו/לה המון במסע. מעריכים את זה
          מאוד!
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="p-8 bg-white rounded-lg shadow-md space-y-6"
    >
      <div className="space-y-2">
        <Label htmlFor="authorName">שמך המלא</Label>
        <Input
          id="authorName"
          name="authorName"
          value={formData.authorName}
          onChange={handleChange}
          required
          placeholder="לדוגמה: יוסי כהן"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="relationship">הקשר שלכם</Label>
        <Input
          id="relationship"
          name="relationship"
          value={formData.relationship}
          onChange={handleChange}
          required
          placeholder="לדוגמה: חבר מהצבא, שותפה לדירה"
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">ההמלצה שלך</Label>
        <Textarea
          id="content"
          name="content"
          value={formData.content}
          onChange={handleChange}
          required
          minLength={50}
          rows={5}
          placeholder={`ספר/י קצת על ${userName}, על התכונות הבולטות שלו/ה, וכל מה שחשוב שהצד השני יכיר...`}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="authorPhone">מספר טלפון (אופציונלי)</Label>
        <Input
          id="authorPhone"
          name="authorPhone"
          type="tel"
          value={formData.authorPhone}
          onChange={handleChange}
          placeholder="למקרה שירצו לשמוע ממך עוד"
        />
      </div>
      <div className="flex items-start space-x-2 rtl:space-x-reverse rounded-md border p-4">
        <Checkbox
          id="isPhoneVisibleToMatch"
          checked={formData.isPhoneVisibleToMatch}
          onCheckedChange={(checked) =>
            setFormData((prev) => ({
              ...prev,
              isPhoneVisibleToMatch: !!checked,
            }))
          }
          disabled={!formData.authorPhone}
        />
        <div className="grid gap-1.5 leading-none">
          <label
            htmlFor="isPhoneVisibleToMatch"
            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
          >
            אני מאשר/ת שמספר הטלפון שלי יישמר ויוצג למועמדים רלוונטיים שאושרו על
            ידי צוות NeshamaTech.
          </label>
          <p className="text-xs text-muted-foreground">
            זוהי הזדמנות נהדרת לתת המלצה אישית וחמה.
          </p>
        </div>
      </div>
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
        {isLoading ? 'שולח...' : 'שלח המלצה'}
      </Button>
    </form>
  );
}
