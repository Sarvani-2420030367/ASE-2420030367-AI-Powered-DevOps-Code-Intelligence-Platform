import React, { useEffect, useState } from 'react';
import { CheckCircle2, Loader2, Sparkles } from 'lucide-react';

interface AnalysisStepperProps {
  onComplete: () => void;
}

const STEPS = [
  'Scanning repository structure...',
  'Detecting languages and frameworks...',
  'Analyzing code complexity & quality...',
  'Checking for security vulnerabilities & secrets...',
  'Computing health scores & DevOps radar...',
  'Generating AI architecture insights & recommendations...',
  'Analysis Complete!'
];

export const AnalysisStepper: React.FC<AnalysisStepperProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (currentStep < STEPS.length - 1) {
      const timer = setTimeout(() => {
        setCurrentStep((prev) => prev + 1);
      }, 700);
      return () => clearTimeout(timer);
    } else {
      const finishTimer = setTimeout(() => {
        onComplete();
      }, 900);
      return () => clearTimeout(finishTimer);
    }
  }, [currentStep, onComplete]);

  const progressPercent = Math.round(((currentStep + 1) / STEPS.length) * 100);

  return (
    <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-xl mx-auto shadow-2xl backdrop-blur-md">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-sky-500 to-indigo-600 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-sky-500/20">
          <Sparkles className="w-6 h-6 text-white animate-spin" />
        </div>
        <h3 className="text-lg font-bold text-white tracking-tight">Analyzing Codebase</h3>
        <p className="text-xs text-slate-400 mt-1">DevSight AI Static & Security Inspection Pipeline</p>
      </div>

      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between text-xs font-mono mb-1.5 text-slate-400">
          <span>Progress</span>
          <span className="text-sky-400 font-semibold">{progressPercent}%</span>
        </div>
        <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden border border-slate-700/50">
          <div
            className="h-full bg-gradient-to-r from-sky-500 to-indigo-500 transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* Steps List */}
      <div className="space-y-3">
        {STEPS.map((step, index) => {
          const isDone = index < currentStep;
          const isCurrent = index === currentStep;

          return (
            <div
              key={step}
              className={`flex items-center gap-3 text-xs transition-opacity duration-300 ${
                index > currentStep ? 'opacity-30' : 'opacity-100'
              }`}
            >
              {isDone ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : isCurrent ? (
                <Loader2 className="w-4 h-4 text-sky-400 animate-spin shrink-0" />
              ) : (
                <div className="w-4 h-4 rounded-full border border-slate-700 shrink-0" />
              )}
              <span className={`font-mono ${isCurrent ? 'text-white font-medium' : isDone ? 'text-slate-300' : 'text-slate-400'}`}>
                {step}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};
