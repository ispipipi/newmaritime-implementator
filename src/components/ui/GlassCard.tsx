import { HTMLAttributes } from 'react';

type Props = HTMLAttributes<HTMLDivElement> & {
  interactive?: boolean;
};

export function GlassCard({ className = '', interactive = false, ...props }: Props) {
  return (
    <div
      className={[
        'glass rounded-lg',
        interactive ? 'transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.075]' : '',
        className,
      ].join(' ')}
      {...props}
    />
  );
}
