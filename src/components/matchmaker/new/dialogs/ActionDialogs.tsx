'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Priority, MatchSuggestionStatus } from '@prisma/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Clock,
  Mail,
  Loader2,
  Send,
  User,
  Sparkles,
  CheckCircle,
  Heart,
  MessageCircle,
  Calendar,
  AlertCircle,
  X,
} from 'lucide-react';
import type { Candidate } from '../types/candidates';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRelativeCloudinaryPath, getInitials } from '@/lib/utils';
import type { MatchmakerPageDictionary } from '@/types/dictionaries/matchmaker';

interface NewSuggestionFormData {
  firstPartyId: string;
  secondPartyId: string;
  priority: Priority;
  status: MatchSuggestionStatus;
}

interface ActionDialogsProps {
  suggestDialog: {
    isOpen: boolean;
    onClose: () => void;
    onSubmit: (data: NewSuggestionFormData) => Promise<void>;
    selectedCandidate: Candidate | null;
  };
  availabilityDialog: {
    isOpen: boolean;
    onClose: () => void;
    onCheck: (candidate: Candidate) => Promise<void>;
    selectedCandidate: Candidate | null;
  };
  inviteDialog: {
    isOpen: boolean;
    onClose: () => void;
    onInvite: (candidate: Candidate, email: string) => Promise<void>;
    selectedCandidate: Candidate | null;
  };
  dict: MatchmakerPageDictionary['candidatesManager']['actionDialogs'];
}

// Enhanced Dialog Header Component
const EnhancedDialogHeader: React.FC<{
  title: string;
  description: string;
  candidate: Candidate | null;
  icon: React.ReactNode;
  gradient: string;
}> = ({ title, description, candidate, icon, gradient }) => {
  const mainImage = candidate?.images?.find((img) => img.isMain);

  return (
    <div
      className={cn(
        'relative bg-gradient-to-br overflow-hidden rounded-t-3xl -mx-6 -mt-6 mb-6',
        gradient
      )}
    >
      <div className="absolute inset-0">
        <div className="absolute top-0 right-0 w-32 h-32 bg-white/20 rounded-full blur-2xl"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
      </div>
      <div className="relative z-10 p-6 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="p-3 rounded-full bg-white/20 backdrop-blur-sm shadow-lg">
            {icon}
          </div>
          <div>
            <DialogTitle className="text-2xl font-bold text-white mb-1">
              {title}
            </DialogTitle>
            <DialogDescription className="text-white/90 text-lg">
              {description}
            </DialogDescription>
          </div>
        </div>
        {candidate && (
          <div className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20">
            <Avatar className="w-12 h-12 border-2 border-white/30 shadow-lg">
              {mainImage ? (
                <AvatarImage
                  src={getRelativeCloudinaryPath(mainImage.url)}
                  alt={`${candidate.firstName} ${candidate.lastName}`}
                />
              ) : (
                <AvatarFallback className="bg-white/20 text-white font-bold">
                  {getInitials(`${candidate.firstName} ${candidate.lastName}`)}
                </AvatarFallback>
              )}
            </Avatar>
            <div>
              <h3 className="font-bold text-white text-lg">
                {candidate.firstName} {candidate.lastName}
              </h3>
              <div className="flex items-center gap-2 mt-1">
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {candidate.profile.city || 'לא צוין'}
                </Badge>
                <Badge className="bg-white/20 text-white border-white/30 text-xs">
                  {candidate.profile.availabilityStatus === 'AVAILABLE'
                    ? 'זמין/ה'
                    : 'לא זמין/ה'}
                </Badge>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export const ActionDialogs: React.FC<ActionDialogsProps> = ({
  suggestDialog,
  availabilityDialog,
  inviteDialog,
  dict,
}) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [isInviting, setIsInviting] = useState(false);
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [inviteSuccess, setInviteSuccess] = useState(false);

  const [isChecking, setIsChecking] = useState(false);
  const [availabilityError, setAvailabilityError] = useState<string | null>(
    null
  );
  const [availabilitySuccess, setAvailabilitySuccess] = useState(false);

  useEffect(() => {
    if (inviteDialog.isOpen && inviteDialog.selectedCandidate) {
      setInviteEmail(inviteDialog.selectedCandidate.email || '');
      setInviteError(null);
      setInviteSuccess(false);
    }
  }, [inviteDialog.isOpen, inviteDialog.selectedCandidate]);

  useEffect(() => {
    if (availabilityDialog.isOpen) {
      setAvailabilityError(null);
      setAvailabilitySuccess(false);
    }
  }, [availabilityDialog.isOpen]);

  const handleInviteSubmit = async () => {
    if (!inviteDialog.selectedCandidate || !inviteEmail) return;
    try {
      setIsInviting(true);
      setInviteError(null);
      await inviteDialog.onInvite(inviteDialog.selectedCandidate, inviteEmail);
      setInviteSuccess(true);
      setTimeout(() => inviteDialog.onClose(), 2000);
    } catch (error) {
      setInviteError(
        error instanceof Error ? error.message : dict.invite.submissionError
      );
    } finally {
      setIsInviting(false);
    }
  };

  const handleAvailabilityCheck = async () => {
    if (!availabilityDialog.selectedCandidate) return;
    try {
      setIsChecking(true);
      setAvailabilityError(null);
      await availabilityDialog.onCheck(availabilityDialog.selectedCandidate);
      setAvailabilitySuccess(true);
      setTimeout(() => availabilityDialog.onClose(), 2000);
    } catch (error) {
      setAvailabilityError(
        error instanceof Error
          ? error.message
          : dict.availability.submissionError
      );
    } finally {
      setIsChecking(false);
    }
  };

  const validateEmail = (email: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  return (
    <>
      <Dialog open={inviteDialog.isOpen} onOpenChange={inviteDialog.onClose}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <EnhancedDialogHeader
            title={dict.invite.title}
            description={dict.invite.description}
            candidate={inviteDialog.selectedCandidate}
            icon={<Send className="w-8 h-8" />}
            gradient="from-purple-500 to-indigo-500"
          />
          <div className="space-y-6 p-6 -mt-6">
            {inviteSuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  {dict.invite.successMessage}
                </h3>
                <p className="text-green-600">
                  {dict.invite.successDescription}
                </p>
              </div>
            ) : (
              <>
                <div className="space-y-3">
                  <Label className="text-sm font-bold text-gray-700 flex items-center gap-2">
                    <Mail className="w-4 h-4 text-purple-500" />
                    {dict.invite.emailLabel}
                  </Label>
                  <div className="relative">
                    <Input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => {
                        setInviteEmail(e.target.value);
                        setInviteError(null);
                      }}
                      placeholder={dict.invite.emailPlaceholder}
                      className={cn(
                        'pr-12 h-12 bg-gray-50 border-2 border-gray-200 focus:border-purple-400 focus:ring-purple-200 rounded-xl transition-all duration-300',
                        !validateEmail(inviteEmail) &&
                          inviteEmail.length > 0 &&
                          'border-red-300 focus:border-red-400'
                      )}
                      dir="ltr"
                    />
                    <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                      <Mail className="w-5 h-5 text-gray-400" />
                    </div>
                  </div>
                  {inviteEmail && !validateEmail(inviteEmail) && (
                    <p className="text-red-500 text-sm flex items-center gap-1">
                      <AlertCircle className="w-4 h-4" />
                      {dict.invite.invalidEmailError}
                    </p>
                  )}
                </div>
                {inviteError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 font-medium">
                      {inviteError}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 p-4 rounded-xl border border-purple-100">
                  <h4 className="font-bold text-purple-800 mb-2 flex items-center gap-2">
                    <Sparkles className="w-4 h-4" />
                    {dict.invite.whatsNextTitle}
                  </h4>
                  <ul className="text-sm text-purple-700 space-y-1">
                    {dict.invite.whatsNextItems.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
          {!inviteSuccess && (
            <DialogFooter className="p-6 pt-0 gap-3">
              <Button
                variant="outline"
                onClick={inviteDialog.onClose}
                disabled={isInviting}
                className="border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
              >
                {dict.invite.buttons.cancel}
              </Button>
              <Button
                onClick={handleInviteSubmit}
                disabled={
                  isInviting || !inviteEmail || !validateEmail(inviteEmail)
                }
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold px-6"
              >
                {isInviting ? (
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                ) : (
                  <Send className="ml-2 h-5 w-5" />
                )}
                {isInviting
                  ? dict.invite.buttons.sending
                  : dict.invite.buttons.send}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog
        open={availabilityDialog.isOpen}
        onOpenChange={availabilityDialog.onClose}
      >
        <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <EnhancedDialogHeader
            title={dict.availability.title}
            description={dict.availability.description}
            candidate={availabilityDialog.selectedCandidate}
            icon={<Calendar className="w-8 h-8" />}
            gradient="from-orange-500 to-amber-500"
          />
          <div className="space-y-6 p-6 -mt-6">
            {availabilitySuccess ? (
              <div className="text-center py-8">
                <div className="w-16 h-16 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <CheckCircle className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-xl font-bold text-green-800 mb-2">
                  {dict.availability.successMessage}
                </h3>
                <p className="text-green-600">
                  {dict.availability.successDescription}
                </p>
              </div>
            ) : (
              <>
                <div className="bg-gradient-to-r from-orange-50 to-amber-50 p-4 rounded-xl border border-orange-100">
                  <h4 className="font-bold text-orange-800 mb-2 flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    {dict.availability.whatsNextTitle}
                  </h4>
                  <ul className="text-sm text-orange-700 space-y-1">
                    {dict.availability.whatsNextItems.map((item, i) => (
                      <li key={i}>• {item}</li>
                    ))}
                  </ul>
                </div>
                {availabilityError && (
                  <Alert className="border-red-200 bg-red-50">
                    <AlertCircle className="h-4 w-4 text-red-600" />
                    <AlertDescription className="text-red-700 font-medium">
                      {availabilityError}
                    </AlertDescription>
                  </Alert>
                )}
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                  <div className="flex items-center gap-3 mb-3">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="font-medium text-gray-800">
                      {dict.availability.messageToSendTitle}
                    </span>
                  </div>
                  <p className="text-sm text-gray-600 bg-white p-3 rounded-lg border italic">
                    {dict.availability.messageContent.replace(
                      '{{firstName}}',
                      availabilityDialog.selectedCandidate?.firstName || ''
                    )}
                  </p>
                </div>
              </>
            )}
          </div>
          {!availabilitySuccess && (
            <DialogFooter className="p-6 pt-0 gap-3">
              <Button
                variant="outline"
                onClick={availabilityDialog.onClose}
                disabled={isChecking}
                className="border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
              >
                {dict.availability.buttons.cancel}
              </Button>
              <Button
                onClick={handleAvailabilityCheck}
                disabled={isChecking}
                className="bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold px-6"
              >
                {isChecking ? (
                  <Loader2 className="ml-2 h-5 w-5 animate-spin" />
                ) : (
                  <Clock className="ml-2 h-5 w-5" />
                )}
                {isChecking
                  ? dict.availability.buttons.checking
                  : dict.availability.buttons.check}
              </Button>
            </DialogFooter>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={suggestDialog.isOpen} onOpenChange={suggestDialog.onClose}>
        <DialogContent className="sm:max-w-md border-0 shadow-2xl bg-white rounded-3xl overflow-hidden">
          <EnhancedDialogHeader
            title={dict.suggest.title}
            description={dict.suggest.description}
            candidate={suggestDialog.selectedCandidate}
            icon={<Heart className="w-8 h-8" />}
            gradient="from-pink-500 to-rose-500"
          />
          <div className="p-6 -mt-6">
            <div className="bg-gradient-to-r from-pink-50 to-rose-50 p-4 rounded-xl border border-pink-100">
              <h4 className="font-bold text-pink-800 mb-2 flex items-center gap-2">
                <Sparkles className="w-4 h-4" />
                {dict.suggest.whatsNextTitle}
              </h4>
              <p className="text-sm text-pink-700">
                {dict.suggest.whatsNextDescription}
              </p>
            </div>
          </div>
          <DialogFooter className="p-6 pt-0 gap-3">
            <Button
              variant="outline"
              onClick={suggestDialog.onClose}
              className="border-2 border-gray-200 hover:bg-gray-50 rounded-xl font-medium"
            >
              {dict.suggest.buttons.cancel}
            </Button>
            <Button
              onClick={suggestDialog.onClose}
              className="bg-gradient-to-r from-pink-600 to-rose-600 hover:from-pink-700 hover:to-rose-700 text-white shadow-lg hover:shadow-xl transition-all duration-300 rounded-xl font-bold px-6"
            >
              <Heart className="ml-2 h-5 w-5" />
              {dict.suggest.buttons.continue}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ActionDialogs;
