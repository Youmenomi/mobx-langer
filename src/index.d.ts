import { Langer, Options } from 'langer';
import { Dictionary } from 'langer/dist/types/helper';

export * from 'langer';

export declare class MobxLanger<TData = Dictionary> extends Langer<TData> {
  constructor(options?: Options);
}