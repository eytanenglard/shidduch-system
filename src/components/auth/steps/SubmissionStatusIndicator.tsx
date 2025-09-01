// src/components/auth/steps/SubmissionStatusIndicator.tsx
'use client';

import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// === NEW: Added 'allDone' to the status types ===
export type SubmissionStatus =
  | 'idle'
  | 'savingProfile'
  | 'updatingSession'
  | 'sendingCode'
  | 'error';

interface Step {
  id: SubmissionStatus;
  text: string;
}

interface SubmissionStatusIndicatorProps {
  currentStatus: SubmissionStatus;
  dict: {
    saving: string;
    updating: string;
    sendingCode: string;
  };
}

const SubmissionStatusIndicator: React.FC<SubmissionStatusIndicatorProps> = ({
  currentStatus,
  dict,
}) => {
  const steps: Step[] = [
    { id: 'savingProfile', text: dict.saving },
    { id: 'updatingSession', text: dict.updating },
    { id: 'sendingCode', text: dict.sendingCode },
  ];

  const getStepStatus = (
    stepId: SubmissionStatus,
    currentStatus: SubmissionStatus
  ): 'completed' | 'in-progress' | 'pending' => {
    // === NEW: If the status is 'allDone', all steps are completed ===
  
    
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === currentStatus);

    if (currentIndex === -1 || currentStatus === 'idle' || currentStatus === 'error') {
      return 'pending';
    }
    if (stepIndex < currentIndex) {
      return 'completed';
    }
    if (stepIndex === currentIndex) {
      return 'in-progress';
    }
    return 'pending';
  };

  const statusIcons = {
    completed: <CheckCircle className="h-6 w-6 text-green-500" />,
    'in-progress': <Loader2 className="h-6 w-6 animate-spin text-cyan-500" />,
    pending: <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>,
  };

  const isVisible = currentStatus !== 'idle' && currentStatus !== 'error';

  return (
    <AnimatePresence>
      {isVisible && (
        // === FIX: Stronger, more visible backdrop ===
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            {/* === NEW: Themed gradient top bar for better design === */}
            <div className="h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>
            
            <div className="p-6 text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                <ShieldCheck className="h-7 w-7 text-cyan-500" />
                <h3 className="text-xl font-bold text-gray-800">
                  מאמתים את הפרטים
                </h3>
              </div>

              <p className="text-sm text-gray-600 mb-6">
                זה לוקח רק מספר שניות, נא לא לסגור את החלון.
              </p>

              <div className="space-y-4">
                {steps.map((step) => {
                  const status = getStepStatus(step.id, currentStatus);
                  return (
                    <div key={step.id} className="flex items-center gap-4 text-right p-2 bg-gray-50 rounded-lg">
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        {statusIcons[status]}
                      </div>
                      <span className={`text-base font-medium ${status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}>
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* === NEW: Final success message before redirecting === */}
            
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionStatusIndicator;