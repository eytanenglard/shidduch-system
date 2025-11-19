// src/components/auth/steps/SubmissionStatusIndicator.tsx
'use client';

import { CheckCircle, Loader2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// ▼▼▼ 1. הוספת 'redirecting' לטיפוס ▼▼▼
export type SubmissionStatus =
  | 'idle'
  | 'creatingAccount'
  | 'sendingCode'
  | 'savingProfile'
  | 'updatingSession'
  | 'redirecting' // <--- חדש
  | 'error';

interface Step {
  id: SubmissionStatus;
  text: string;
}

interface SubmissionStatusIndicatorProps {
  currentStatus: SubmissionStatus;
  steps: Step[];
  dict: {
    title: string;
    subtitle: string;
  };
}

const SubmissionStatusIndicator: React.FC<SubmissionStatusIndicatorProps> = ({
  currentStatus,
  steps,
  dict,
}) => {
  const getStepStatus = (
    stepId: SubmissionStatus,
    current: SubmissionStatus
  ): 'completed' | 'in-progress' | 'pending' => {
    const stepIndex = steps.findIndex((s) => s.id === stepId);
    const currentIndex = steps.findIndex((s) => s.id === current);

    if (currentIndex === -1 || current === 'idle' || current === 'error') {
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
    pending: (
      <div className="h-6 w-6 rounded-full border-2 border-gray-300"></div>
    ),
  };

  const isVisible = currentStatus !== 'idle' && currentStatus !== 'error';

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 bg-black/50 backdrop-blur-md flex items-center justify-center z-50 p-4"
          aria-modal="true"
          role="dialog"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 260, damping: 20 }}
            className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden"
          >
            <div className="h-2 bg-gradient-to-r from-cyan-500 to-pink-500"></div>

            <div className="p-6 text-center">
              <div className="flex justify-center items-center gap-2 mb-4">
                <ShieldCheck className="h-7 w-7 text-cyan-500" />
                <h3 className="text-xl font-bold text-gray-800">
                  {dict.title}
                </h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">{dict.subtitle}</p>

              <div className="space-y-4">
                {steps.map((step) => {
                  const status = getStepStatus(step.id, currentStatus);
                  return (
                    <div
                      key={step.id}
                      className="flex items-center gap-4 text-right p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center">
                        {statusIcons[status]}
                      </div>
                      <span
                        className={`text-base font-medium ${status === 'pending' ? 'text-gray-400' : 'text-gray-700'}`}
                      >
                        {step.text}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SubmissionStatusIndicator;
