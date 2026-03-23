'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Users, Send, Copy, Loader2, Trash2, MessageCircle, Quote, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { UserProfile, FriendTestimonial } from '@/types/next-auth';
import { ProfileSectionDict, FriendTestimonialsDict } from '@/types/dictionary';

interface FriendTestimonialsManagerProps {
  profile: UserProfile | null;
  isEditing: boolean;
  dict: ProfileSectionDict;
  handleChange: (field: keyof UserProfile, value: any) => void;
  formData: Partial<UserProfile>;
  direction: 'rtl' | 'ltr';
}

const AddTestimonialModal: React.FC<{
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  dict: FriendTestimonialsDict['addModal'];
  toasts: { success: string; error: string };
  onSuccess: () => void;
}> = ({ isOpen, setIsOpen, dict, toasts, onSuccess }) => {
  const [formData, setFormData] = useState({
    authorName: '',
    relationship: '',
    content: '',
    authorPhone: '',
    isPhoneVisibleToMatch: false,
  });
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/testimonials', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (!response.ok) throw new Error('Failed to add testimonial');
      toast.success(toasts.success);
      onSuccess();
      setIsOpen(false);
      setFormData({
        authorName: '',
        relationship: '',
        content: '',
        authorPhone: '',
        isPhoneVisibleToMatch: false,
      });
    } catch {
      toast.error(toasts.error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{dict.title}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>{dict.authorNameLabel}</Label>
            <Input
              name="authorName"
              value={formData.authorName}
              onChange={(e) => setFormData((p) => ({ ...p, authorName: e.target.value }))}
              required
              placeholder={dict.authorNamePlaceholder}
            />
          </div>
          <div>
            <Label>{dict.relationshipLabel}</Label>
            <Input
              name="relationship"
              value={formData.relationship}
              onChange={(e) => setFormData((p) => ({ ...p, relationship: e.target.value }))}
              required
              placeholder={dict.relationshipPlaceholder}
            />
          </div>
          <div>
            <Label>{dict.contentLabel}</Label>
            <Textarea
              name="content"
              value={formData.content}
              onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))}
              required
              placeholder={dict.contentPlaceholder}
              className="min-h-[100px]"
            />
            <p className="text-xs text-gray-500 mt-1 text-end">
              {formData.content.length}/500
            </p>
          </div>
          <div>
            <Label>{dict.phoneLabel}</Label>
            <Input
              name="authorPhone"
              type="tel"
              value={formData.authorPhone}
              onChange={(e) => setFormData((p) => ({ ...p, authorPhone: e.target.value }))}
              placeholder={dict.phonePlaceholder}
            />
          </div>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Checkbox
              id="consent"
              checked={formData.isPhoneVisibleToMatch}
              onCheckedChange={(c) => setFormData((p) => ({ ...p, isPhoneVisibleToMatch: !!c }))}
            />
            <Label htmlFor="consent">{dict.consentLabel}</Label>
          </div>
          <DialogFooter>
            <Button type="button" variant="ghost" onClick={() => setIsOpen(false)}>
              {dict.cancelButton}
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? <Loader2 className="animate-spin" /> : dict.saveButton}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const FriendTestimonialsManager: React.FC<FriendTestimonialsManagerProps> = ({
  profile,
  isEditing,
  dict,
  handleChange,
  formData,
  direction,
}) => {
  const [testimonials, setTestimonials] = useState<FriendTestimonial[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isLinkModalOpen, setIsLinkModalOpen] = useState(false);
  const [requestLink, setRequestLink] = useState('');

  const t = dict.friendTestimonials;

  const fetchTestimonials = useCallback(async () => {
    if (!profile) return;
    setIsLoading(true);
    try {
      const response = await fetch('/api/profile/testimonials');
      const data = await response.json();
      if (data.success) {
        setTestimonials(data.testimonials);
      } else {
        throw new Error(data.message || 'Failed to fetch');
      }
    } catch (error) {
      toast.error(t.fetchError);
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    fetchTestimonials();
  }, [fetchTestimonials]);

  const handleStatusChange = async (id: string, status: 'APPROVED' | 'HIDDEN') => {
    try {
      const response = await fetch(`/api/profile/testimonials/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      toast.success(t.statusUpdated);
      fetchTestimonials();
    } catch {
      toast.error(t.statusUpdateError);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm(t.deleteConfirm)) {
      try {
        const response = await fetch(`/api/profile/testimonials/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error('Failed to delete');
        toast.success(t.deleteSuccess);
        fetchTestimonials();
      } catch {
        toast.error(t.deleteError);
      }
    }
  };

  const handleGenerateLink = async () => {
    try {
      const response = await fetch('/api/profile/testimonials/request-link', { method: 'POST' });
      const data = await response.json();
      if (data.success) {
        setRequestLink(data.link);
        setIsLinkModalOpen(true);
      } else {
        throw new Error(data.message || 'Failed to generate link');
      }
    } catch {
      toast.error(t.linkGenerateError);
    }
  };

  const handleShareViaWhatsApp = () => {
    const text = encodeURIComponent(requestLink);
    window.open(`https://wa.me/?text=${text}`, '_blank');
  };

  const getStatusBadge = (status: 'PENDING' | 'APPROVED' | 'HIDDEN') => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="warning" className="text-xs">{t.pendingApproval}</Badge>;
      case 'APPROVED':
        return <Badge variant="success" className="text-xs">{t.approvedAndVisible}</Badge>;
      case 'HIDDEN':
        return <Badge variant="secondary" className="text-xs">{t.hidden}</Badge>;
    }
  };

  const approvedCount = testimonials.filter((t) => t.status === 'APPROVED').length;

  return (
    <Card className="bg-white/80 backdrop-blur-md rounded-2xl shadow-lg border border-gray-200/40 overflow-hidden transition-all duration-300 hover:shadow-xl hover:border-gray-300/50">
      <CardHeader className="bg-gradient-to-r from-teal-50/60 to-green-50/60 border-b border-gray-200/50 px-4 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500/10 to-teal-600/10 flex items-center justify-center flex-shrink-0">
            <Users className="w-4 h-4 text-teal-700" />
          </div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base font-semibold text-gray-700">{t.cardTitle}</CardTitle>
            {approvedCount > 0 && (
              <Badge variant="secondary" className="text-xs bg-teal-100 text-teal-700">
                {approvedCount}
              </Badge>
            )}
          </div>
        </div>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Switch
                checked={formData.isFriendsSectionVisible ?? true}
                onCheckedChange={(checked) => handleChange('isFriendsSectionVisible', checked)}
                disabled={!isEditing}
              />
            </TooltipTrigger>
            <TooltipContent dir={direction} sideOffset={5} collisionPadding={10}>
              <p>{t.visibilityTooltip}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </CardHeader>
      <CardContent className="p-3 md:p-4">
        {isEditing && (
          <div className="flex flex-col sm:flex-row gap-2 mb-4 p-4 bg-slate-50 rounded-lg border">
            <Button size="sm" className="flex-1" onClick={() => setIsAddModalOpen(true)}>
              {t.addManualButton}
            </Button>
            <Button size="sm" variant="outline" className="flex-1" onClick={handleGenerateLink}>
              <Send className="w-4 h-4 me-2" />
              {t.requestLinkButton}
            </Button>
          </div>
        )}

        {isLoading ? (
          <div className="flex justify-center p-4">
            <Loader2 className="animate-spin" />
          </div>
        ) : (
          <div className="space-y-3">
            {testimonials.length === 0 ? (
              <div className="text-center py-8 px-4">
                <div className="w-12 h-12 rounded-full bg-teal-100/50 flex items-center justify-center mx-auto mb-3">
                  <Quote className="w-6 h-6 text-teal-400" />
                </div>
                <p className="text-sm text-gray-500">{t.emptyState}</p>
                {isEditing && (
                  <p className="text-xs text-gray-400 mt-1">
                    {t.emptyStateHint}
                  </p>
                )}
              </div>
            ) : (
              testimonials.map((item) => (
                <div
                  key={item.id}
                  className="relative border rounded-xl p-4 bg-gradient-to-br from-white to-slate-50/50 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Status badge */}
                  <div className="flex items-center justify-between mb-2">
                    {getStatusBadge(item.status as 'PENDING' | 'APPROVED' | 'HIDDEN')}
                  </div>

                  {/* Quote content */}
                  <div className="relative ps-4 border-s-2 border-teal-300/50">
                    <Quote className="absolute -start-2 -top-1 w-4 h-4 text-teal-300" />
                    <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
                      {item.content}
                    </p>
                  </div>

                  {/* Author info */}
                  <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-100">
                    <p className="text-xs font-semibold text-gray-600">
                      — {item.authorName}
                      <span className="font-normal text-gray-400 ms-1">
                        ({item.relationship})
                      </span>
                    </p>
                  </div>

                  {/* Edit actions */}
                  {isEditing && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-gray-100">
                      {item.status !== 'APPROVED' && (
                        <Button size="xs" variant="outline" onClick={() => handleStatusChange(item.id, 'APPROVED')}>
                          <Eye className="w-3 h-3 me-1" />
                          {t.approveButton}
                        </Button>
                      )}
                      {item.status === 'APPROVED' && (
                        <Button size="xs" variant="outline" onClick={() => handleStatusChange(item.id, 'HIDDEN')}>
                          <EyeOff className="w-3 h-3 me-1" />
                          {t.hideButton}
                        </Button>
                      )}
                      {item.status === 'HIDDEN' && (
                        <Button size="xs" variant="outline" onClick={() => handleStatusChange(item.id, 'APPROVED')}>
                          <Eye className="w-3 h-3 me-1" />
                          {t.showButton}
                        </Button>
                      )}
                      <Button size="xs" variant="destructive" onClick={() => handleDelete(item.id)}>
                        <Trash2 className="w-3 h-3 me-1" />
                        {t.deleteButton}
                      </Button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}
      </CardContent>

      <AddTestimonialModal
        isOpen={isAddModalOpen}
        setIsOpen={setIsAddModalOpen}
        dict={t.addModal}
        toasts={{ success: t.testimonialAdded, error: t.testimonialAddError }}
        onSuccess={fetchTestimonials}
      />

      {/* Link sharing dialog with WhatsApp option */}
      <Dialog open={isLinkModalOpen} onOpenChange={setIsLinkModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t.linkModal.title}</DialogTitle>
            <DialogDescription>{t.linkModal.description}</DialogDescription>
          </DialogHeader>
          <div className="flex items-center space-x-2 rtl:space-x-reverse">
            <Input value={requestLink} readOnly className="text-sm" dir="ltr" />
            <Button
              onClick={() =>
                navigator.clipboard
                  .writeText(requestLink)
                  .then(() => toast.success(t.linkModal.copiedTooltip))
              }
              size="icon"
              variant="outline"
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
          <Button
            variant="outline"
            onClick={handleShareViaWhatsApp}
            className="w-full mt-2 text-green-700 border-green-300 hover:bg-green-50"
          >
            <MessageCircle className="w-4 h-4 me-2" />
            {t.shareViaWhatsApp}
          </Button>
          <DialogFooter>
            <Button onClick={() => setIsLinkModalOpen(false)}>
              {t.linkModal.closeButton}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default FriendTestimonialsManager;
