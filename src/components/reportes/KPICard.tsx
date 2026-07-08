import { LucideIcon } from 'lucide-react';
import { GlassCard } from '../ui/GlassCard';

type Props = {
  label: string;
  value: string | number;
  icon: LucideIcon;
  detail?: string;
};

export function KPICard({ label, value, icon: Icon, detail }: Props) {
  return (
    <GlassCard className="p-5">
      <div className="mb-4 flex items-center justify-between">
        <Icon className="h-5 w-5 text-slate-400" />
        {detail ? <span className="text-xs text-slate-500">{detail}</span> : null}
      </div>
      <p className="text-3xl font-semibold text-white">{value}</p>
      <p className="mt-1 text-sm text-slate-400">{label}</p>
    </GlassCard>
  );
}
