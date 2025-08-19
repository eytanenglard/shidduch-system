import React, { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import {
  MessageCircle,
  Send,
  AlertCircle,
  Users,
  User,
  Clock,
  Sparkles,
  X,
  Mail,
  Bell,
  Info,
  Heart,
  Zap,
} from 'lucide-react';
import type { Suggestion } from '@/types/suggestions';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';

interface MessageFormProps {
  isOpen: boolean;
  onClose: () => void;
  suggestion: Suggestion | null;
  onSend: (data: {
    suggestionId: string;
    partyType: 'first' | 'second' | 'both';
    messageType: 'message' | 'reminder' | 'update';
    messageContent: string;
  }) => Promise<void>;
}

const MessageForm: React.FC<MessageFormProps> = ({
  isOpen,
  onClose,
  suggestion,
  onSend,
}) => {
  const [partyType, setPartyType] = useState<'first' | 'second' | 'both'>(
    'both'
  );
  const [messageType, setMessageType] = useState<
    'message' | 'reminder' | 'update'
  >('message');
  const [messageContent, setMessageContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!suggestion || !messageContent.trim()) return;

    try {
      setIsSubmitting(true);

      await onSend({
        suggestionId: suggestion.id,
        partyType,
        messageType,
        messageContent,
      });

      toast.success(
        `ההודעה נשלחה ${
          partyType === 'first'
            ? `ל${suggestion.firstParty.firstName}`
            : partyType === 'second'
              ? `ל${suggestion.secondParty.firstName}`
              : 'לשני הצדדים'
        }`
      );

      // Reset form
      setMessageContent('');
      setPartyType('both');
      setMessageType('message');
      onClose();
    } catch (error) {
      toast.error('שגיאה בשליחת ההודעה');
      console.error('Error sending message:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getMessagePlaceholder = () => {
    switch (messageType) {
      case 'reminder':
        return 'הודעת תזכורת למועמד/ת לגבי ההצעה...';
      case 'update':
        return 'עדכון לגבי סטטוס ההצעה או מידע חדש...';
      default:
        return 'הודעה אישית למועמד/ת...';
    }
  };

  const getMessageTypeInfo = (type: string) => {
    switch (type) {
      case 'reminder':
        return {
          label: 'תזכורת',
          icon: Clock,
          color: 'from-yellow-500 to-amber-500',
          bgColor: 'from-yellow-50 to-amber-50',
          description: 'הודעה להזכרה על ההצעה או פעולה נדרשת',
        };
      case 'update':
        return {
          label: 'עדכון סטטוס',
          icon: Info,
          color: 'from-blue-500 to-cyan-500',
          bgColor: 'from-blue-50 to-cyan-50',
          description: 'עדכון על שינוי במצב ההצעה או מידע חדש',
        };
      default:
        return {
          label: 'הודעה רגילה',
          icon: MessageCircle,
          color: 'from-purple-500 to-pink-500',
          bgColor: 'from-purple-50 to-pink-50',
          description: 'הודעה אישית כללית',
        };
    }
  };

  const getPartyTypeInfo = (type: string) => {
    switch (type) {
      case 'first':
        return {
          label: `${suggestion?.firstParty.firstName} ${suggestion?.firstParty.lastName} (צד א')`,
          icon: User,
          color: 'from-green-500 to-emerald-500',
        };
      case 'second':
        return {
          label: `${suggestion?.secondParty.firstName} ${suggestion?.secondParty.lastName} (צד ב')`,
          icon: User,
          color: 'from-blue-500 to-cyan-500',
        };
      default:
        return {
          label: 'שני הצדדים',
          icon: Users,
          color: 'from-purple-500 to-pink-500',
        };
    }
  };

  if (!suggestion) return null;

  const messageTypeInfo = getMessageTypeInfo(messageType);
  const partyTypeInfo = getPartyTypeInfo(partyType);
  const MessageTypeIcon = messageTypeInfo.icon;
  const PartyTypeIcon = partyTypeInfo.icon;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl border-0 shadow-2xl rounded-3xl p-0 overflow-hidden"
        dir="rtl"
      >
        {/* Hero Header */}
        <div
          className={cn(
            'relative overflow-hidden bg-gradient-to-br',
            messageTypeInfo.bgColor,
            'border-b border-gray-100'
          )}
        >
          <div className="absolute inset-0">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-white/30 to-transparent rounded-full blur-3xl"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-gradient-to-br from-white/20 to-transparent rounded-full blur-2xl"></div>
          </div>

          <div className="relative z-10 p-8">
            <DialogHeader>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
                    <Send className="w-8 h-8 text-purple-600" />
                  </div>
                  <div>
                    <DialogTitle className="text-3xl font-bold text-gray-800">
                      שליחת הודעה
                    </DialogTitle>
                    <DialogDescription className="text-lg text-gray-600 mt-1">
                      שליחת הודעה הקשורה להצעת השידוך בין{' '}
                      {suggestion.firstParty.firstName}{' '}
                      {suggestion.firstParty.lastName} ל
                      {suggestion.secondParty.firstName}{' '}
                      {suggestion.secondParty.lastName}
                    </DialogDescription>
                  </div>
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onClose}
                  className="rounded-full h-12 w-12 text-gray-500 hover:text-gray-700 hover:bg-white/50 backdrop-blur-sm"
                >
                  <X className="w-6 h-6" />
                </Button>
              </div>

              <div className="flex items-center gap-4">
                <Badge
                  className={cn(
                    'px-4 py-2 font-bold shadow-lg bg-gradient-to-r text-white',
                    messageTypeInfo.color
                  )}
                >
                  <MessageTypeIcon className="w-4 h-4 ml-2" />
                  {messageTypeInfo.label}
                </Badge>

                <Badge
                  className={cn(
                    'px-4 py-2 font-bold shadow-lg bg-gradient-to-r text-white',
                    partyTypeInfo.color
                  )}
                >
                  <PartyTypeIcon className="w-4 h-4 ml-2" />
                  {partyTypeInfo.label}
                </Badge>
              </div>
            </DialogHeader>
          </div>
        </div>

        <div className="p-8 space-y-8">
          {/* Suggestion Info Alert */}
          <Alert className="border-0 bg-gradient-to-r from-indigo-50 to-purple-50 shadow-lg rounded-2xl">
            <Heart className="h-5 w-5 text-indigo-500" />
            <AlertDescription className="text-indigo-800 font-medium">
              <strong>הצעה #{suggestion.id.slice(-8)}:</strong> הודעה זו תישלח
              במסגרת הצעת השידוך הפעילה.
              <br />
              <strong>סטטוס נוכחי:</strong> {suggestion.status} •{' '}
              <strong>עדיפות:</strong> {suggestion.priority}
            </AlertDescription>
          </Alert>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Recipient Selection */}
            <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg">
                  <Users className="w-5 h-5" />
                </div>
                <Label className="text-lg font-bold text-gray-800">
                  שלח אל
                </Label>
              </div>

              <Select
                value={partyType}
                onValueChange={(value) =>
                  setPartyType(value as 'first' | 'second' | 'both')
                }
              >
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-green-300 focus:border-green-500 rounded-xl transition-all">
                  <SelectValue placeholder="בחר נמען" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="first">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-green-500" />
                      <div className="text-right">
                        <div className="font-medium">
                          {suggestion.firstParty.firstName}{' '}
                          {suggestion.firstParty.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          (צד א&apos;)
                        </div>{' '}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="second">
                    <div className="flex items-center gap-3">
                      <User className="w-4 h-4 text-blue-500" />
                      <div className="text-right">
                        <div className="font-medium">
                          {suggestion.secondParty.firstName}{' '}
                          {suggestion.secondParty.lastName}
                        </div>
                        <div className="text-xs text-gray-500">
                          (צד ב&apos;)
                        </div>{' '}
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="both">
                    <div className="flex items-center gap-3">
                      <Users className="w-4 h-4 text-purple-500" />
                      <div className="font-medium">שני הצדדים</div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div className="mt-3 p-3 bg-green-50 rounded-xl">
                <p className="text-sm text-green-700">
                  <PartyTypeIcon className="w-4 h-4 inline ml-1" />
                  ההודעה תישלח ל{partyTypeInfo.label}
                </p>
              </div>
            </div>

            {/* Message Type */}
            <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
              <div className="flex items-center gap-3 mb-4">
                <div
                  className={cn(
                    'p-2 rounded-full bg-gradient-to-r text-white shadow-lg',
                    messageTypeInfo.color
                  )}
                >
                  <MessageTypeIcon className="w-5 h-5" />
                </div>
                <Label className="text-lg font-bold text-gray-800">
                  סוג ההודעה
                </Label>
              </div>

              <Select
                value={messageType}
                onValueChange={(value) =>
                  setMessageType(value as 'message' | 'reminder' | 'update')
                }
              >
                <SelectTrigger className="h-12 border-2 border-gray-200 hover:border-purple-300 focus:border-purple-500 rounded-xl transition-all">
                  <SelectValue placeholder="בחר סוג הודעה" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="message">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="w-4 h-4 text-purple-500" />
                      <div className="text-right">
                        <div className="font-medium">הודעה רגילה</div>
                        <div className="text-xs text-gray-500">
                          הודעה אישית כללית
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="reminder">
                    <div className="flex items-center gap-3">
                      <Clock className="w-4 h-4 text-yellow-500" />
                      <div className="text-right">
                        <div className="font-medium">תזכורת</div>
                        <div className="text-xs text-gray-500">
                          הזכרה על פעולה נדרשת
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                  <SelectItem value="update">
                    <div className="flex items-center gap-3">
                      <Info className="w-4 h-4 text-blue-500" />
                      <div className="text-right">
                        <div className="font-medium">עדכון סטטוס</div>
                        <div className="text-xs text-gray-500">
                          עדכון על שינוי במצב
                        </div>
                      </div>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              <div
                className={cn(
                  'mt-3 p-3 rounded-xl bg-gradient-to-r',
                  messageTypeInfo.bgColor
                )}
              >
                <p
                  className="text-sm font-medium"
                  style={{ color: messageTypeInfo.color.split(' ')[1] }}
                >
                  <MessageTypeIcon className="w-4 h-4 inline ml-1" />
                  {messageTypeInfo.description}
                </p>
              </div>
            </div>
          </div>

          {/* Message Content */}
          <div className="p-6 bg-white rounded-2xl shadow-xl border-0 hover:shadow-2xl transition-all duration-300">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 text-white shadow-lg">
                <Mail className="w-5 h-5" />
              </div>
              <Label className="text-lg font-bold text-gray-800">
                תוכן ההודעה
              </Label>
            </div>

            <Textarea
              value={messageContent}
              onChange={(e) => setMessageContent(e.target.value)}
              placeholder={getMessagePlaceholder()}
              className="h-48 border-2 border-gray-200 focus:border-indigo-400 rounded-xl transition-all resize-none text-lg"
              dir="rtl"
            />

            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Sparkles className="w-4 h-4" />
                <span>המערכת תוסיף אוטומטית חתימה מקצועית</span>
              </div>
              <div className="text-sm text-gray-500">
                {messageContent.length}/1000 תווים
              </div>
            </div>
          </div>

          {/* Preview Section */}
          {messageContent.trim() && (
            <div className="p-6 bg-gradient-to-r from-gray-50 to-slate-50 rounded-2xl border-2 border-gray-200">
              <div className="flex items-center gap-3 mb-4">
                <div className="p-2 rounded-full bg-gradient-to-r from-gray-500 to-slate-500 text-white shadow-lg">
                  <Zap className="w-5 h-5" />
                </div>
                <h3 className="text-lg font-bold text-gray-800">
                  תצוגה מקדימה
                </h3>
              </div>

              <div className="bg-white p-4 rounded-xl border-2 border-gray-100 shadow-inner">
                <div className="text-sm text-gray-600 mb-2">
                  אל: {partyTypeInfo.label} • סוג: {messageTypeInfo.label}
                </div>
                <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {messageContent}
                </div>
                <div className="mt-4 pt-3 border-t border-gray-100 text-xs text-gray-500">
                  בברכה,
                  <br />
                  צוות מערכת השידוכים
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="p-8 border-t border-gray-100 bg-gradient-to-r from-gray-50 to-slate-50">
          <div className="flex justify-between w-full items-center">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Bell className="w-4 h-4" />
              <span>הנמענים יקבלו התראה באימייל ובוואטסאפ</span>
            </div>
            <div className="flex gap-4">
              <Button
                variant="outline"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-8 py-3 border-2 border-gray-300 hover:bg-gray-50 rounded-xl transition-all"
              >
                ביטול
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting || !messageContent.trim()}
                className="px-8 py-3 bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 hover:from-purple-700 hover:via-pink-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl transition-all duration-300 rounded-xl transform hover:scale-105"
              >
                {isSubmitting ? (
                  <>
                    <Send className="w-5 h-5 ml-2 animate-pulse" />
                    שולח...
                  </>
                ) : (
                  <>
                    <Send className="w-5 h-5 ml-2" />
                    שלח הודעה
                  </>
                )}
              </Button>
            </div>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default MessageForm;
