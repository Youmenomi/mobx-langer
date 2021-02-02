import { Langer as originalLanger, Options } from './original';

export * from 'langer';

/* istanbul ignore next */
export declare class Langer<
  TSays = any,
  TLangs extends string[] = string[],
  TDriver = undefined
> extends originalLanger<TSays, TLangs, TDriver> {
  constructor(options?: Options<TDriver, TSays, TLangs>);
}
