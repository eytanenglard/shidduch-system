import React, { ReactNode } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { DialogContent } from '@/components/ui/dialog';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
}

const ProfileModal = ({ isOpen, onClose, children }: ProfileModalProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-h-[80vh] overflow-y-auto sm:max-w-2xl">
        {children}
      </DialogContent>
    </Dialog>
  );
};

export default ProfileModal;