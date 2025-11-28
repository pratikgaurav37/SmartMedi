"use client";

import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

interface ReminderToastProps {
  visible: boolean;
  medicationName: string;
  scheduledTime: string;
  onTaken: () => void;
  onSkip: () => void;
  onRemindLater: () => void;
}

export function ReminderToast({
  visible,
  medicationName,
  scheduledTime,
  onTaken,
  onSkip,
  onRemindLater,
}: ReminderToastProps) {
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="fixed bottom-4 right-4 z-50 w-full max-w-sm px-4 md:px-0"
        >
          <Card className="p-4 shadow-xl border-l-4 border-l-primary bg-white dark:bg-slate-900">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-slate-900 dark:text-slate-100">
                  Medication Reminder
                </h3>
                <p className="text-slate-600 dark:text-slate-400 text-sm">
                  It's time for <span className="font-bold text-primary">{medicationName}</span>
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Scheduled for {new Date(scheduledTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
              <div className="h-2 w-2 rounded-full bg-red-500 animate-pulse" />
            </div>

            <div className="grid grid-cols-3 gap-2 mt-4">
              <Button
                size="sm"
                variant="outline"
                className="flex flex-col h-auto py-2 gap-1 hover:bg-green-50 hover:text-green-600 hover:border-green-200"
                onClick={onTaken}
              >
                <Check className="h-4 w-4" />
                <span className="text-xs">Taken</span>
              </Button>
              
              <Button
                size="sm"
                variant="outline"
                className="flex flex-col h-auto py-2 gap-1 hover:bg-amber-50 hover:text-amber-600 hover:border-amber-200"
                onClick={onRemindLater}
              >
                <Clock className="h-4 w-4" />
                <span className="text-xs">Later</span>
              </Button>

              <Button
                size="sm"
                variant="outline"
                className="flex flex-col h-auto py-2 gap-1 hover:bg-slate-100 hover:text-slate-600"
                onClick={onSkip}
              >
                <X className="h-4 w-4" />
                <span className="text-xs">Skip</span>
              </Button>
            </div>
          </Card>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
