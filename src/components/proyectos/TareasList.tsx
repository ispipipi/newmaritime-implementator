import { Tarea } from '../../types';
import { TareasDrilldown } from './TareasDrilldown';

type Props = {
  tareas: Tarea[];
};

export function TareasList({ tareas }: Props) {
  return <TareasDrilldown tareas={tareas} showProjectLevel={false} />;
}
