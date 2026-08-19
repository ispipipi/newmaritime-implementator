import { EstadoSemaforo } from '../../types';
import { translate, Idioma, DictKey } from '../../i18n/translations';
import { useAppStore } from '../../store/useAppStore';

const orb: Record<EstadoSemaforo, { base: string; glow: string; labelKey: DictKey }> = {
  verde: { base: '#22c55e', glow: 'rgba(34,197,94,0.42)', labelKey: 'orb_verde' },
  amarillo: { base: '#f59e0b', glow: 'rgba(245,158,11,0.42)', labelKey: 'orb_amarillo' },
  rojo: { base: '#ef4444', glow: 'rgba(239,68,68,0.45)', labelKey: 'orb_rojo' },
};

type Props = {
  estado: EstadoSemaforo;
  size?: 'sm' | 'md' | 'lg';
  label?: string;
};

const sizes = {
  sm: 'h-4 w-4',
  md: 'h-8 w-8',
  lg: 'h-32 w-32',
};

export function TrafficLightOrb({ estado, size = 'md', label }: Props) {
  const idioma = useAppStore((s) => s.idioma) as Idioma;
  const cfg = orb[estado];
  const defaultLabel = translate(cfg.labelKey, idioma);
  return (
    <div className="flex items-center gap-3">
      <span
        className={`relative inline-flex shrink-0 rounded-full ${sizes[size]}`}
        title={label ?? defaultLabel}
        aria-label={label ?? defaultLabel}
      >
        <span
          className="absolute inset-0 rounded-full animate-ping opacity-30"
          style={{ backgroundColor: cfg.base, boxShadow: `0 0 32px ${cfg.glow}` }}
        />
        <span
          className="absolute inset-0 rounded-full animate-soft-pulse"
          style={{
            background: `radial-gradient(circle at 35% 28%, #ffffff, ${cfg.base} 32%, rgba(15,17,23,0.3) 78%)`,
            boxShadow: `0 0 42px ${cfg.glow}, inset 0 0 18px rgba(255,255,255,0.25)`,
          }}
        />
      </span>
      {label ? <span className="text-sm font-medium text-slate-200">{label}</span> : null}
    </div>
  );
}
