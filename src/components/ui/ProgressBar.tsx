export function ProgressBar({ value, tone = 'emerald' }: { value: number; tone?: 'emerald' | 'blue' | 'amber' | 'red' }) {
  const color = {
    emerald: 'from-emerald-400 to-green-500',
    blue: 'from-blue-400 to-cyan-400',
    amber: 'from-amber-300 to-orange-400',
    red: 'from-red-400 to-rose-500',
  }[tone];

  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-white/8">
      <div className={`h-full rounded-full bg-gradient-to-r ${color} transition-all`} style={{ width: `${Math.min(100, Math.max(0, value))}%` }} />
    </div>
  );
}
