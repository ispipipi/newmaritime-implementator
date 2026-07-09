import { useAppStore } from '../store/useAppStore';
import { DictKey, translate } from './translations';

export function useT() {
  const idioma = useAppStore((s) => s.idioma);
  return (key: DictKey) => translate(key, idioma);
}
