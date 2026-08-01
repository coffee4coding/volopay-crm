import { motion } from 'framer-motion';
import type { LucideIcon } from 'lucide-react';
import { useCountUp } from '../hooks/useCountUp';

export function StatCard({
  label,
  value,
  suffix,
  icon: Icon,
  iconBg,
  iconColor,
  index,
}: {
  label: string;
  value: number;
  suffix?: string;
  icon: LucideIcon;
  iconBg: string;
  iconColor: string;
  index: number;
}) {
  const animated = useCountUp(value);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08, ease: 'easeOut' }}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
    >
      <div className={`mb-3 inline-flex rounded-lg p-2 ${iconBg}`}>
        <Icon size={18} className={iconColor} />
      </div>
      <div className="text-2xl font-bold tabular-nums text-slate-900">
        {animated}
        {suffix}
      </div>
      <div className="text-sm text-slate-500">{label}</div>
    </motion.div>
  );
}
