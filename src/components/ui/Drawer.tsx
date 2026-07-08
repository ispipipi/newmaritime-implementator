import { X } from 'lucide-react';
import { ReactNode } from 'react';

type Props = {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
};

export function Drawer({ open, title, children, onClose }: Props) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/50 backdrop-blur-sm" role="dialog" aria-modal="true">
      <button className="absolute inset-0 cursor-default" onClick={onClose} aria-label="Cerrar panel" />
      <aside className="relative h-[100dvh] w-full overflow-y-auto border-l border-white/10 bg-[#11141d] p-4 pb-8 shadow-2xl animate-fade-in sm:max-w-2xl sm:p-6 lg:max-w-4xl xl:max-w-5xl">
        <div className="sticky -top-4 z-10 -mx-4 mb-5 flex items-center justify-between gap-4 border-b border-white/10 bg-[#11141d]/95 px-4 py-3 backdrop-blur sm:-top-6 sm:-mx-6 sm:mb-6 sm:px-6">
          <h2 className="text-xl font-semibold text-white">{title}</h2>
          <button className="rounded-lg border border-white/10 p-2 text-slate-300 hover:bg-white/10" onClick={onClose} aria-label="Cerrar">
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </aside>
    </div>
  );
}
