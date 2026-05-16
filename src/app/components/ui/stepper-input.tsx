import { Minus, Plus } from "lucide-react";
import { motion } from "motion/react";

interface StepperInputProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export function StepperInput({ value, onChange, min = 0, max = 100, step = 1 }: StepperInputProps) {
  const handleDecrement = () => {
    if (value > min) {
      onChange(Math.max(min, value - step));
    }
  };

  const handleIncrement = () => {
    if (value < max) {
      onChange(Math.min(max, value + step));
    }
  };

  return (
    <div className="flex items-center gap-4 bg-white border border-slate-300 rounded-lg p-1 w-full max-w-[200px] focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 transition-all shadow-sm">
      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={handleDecrement}
        disabled={value <= min}
        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Minus className="w-5 h-5" />
      </motion.button>
      
      <div className="flex-1 text-center font-bold text-slate-800 text-lg">
        {value}
      </div>

      <motion.button
        whileTap={{ scale: 0.9 }}
        type="button"
        onClick={handleIncrement}
        disabled={value >= max}
        className="w-10 h-10 flex items-center justify-center bg-slate-50 text-slate-600 rounded-md hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        <Plus className="w-5 h-5" />
      </motion.button>
    </div>
  );
}
