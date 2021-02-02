import { Langer as OriginalLanger, Options } from 'langer';

export * from 'langer';

/* istanbul ignore next */
export declare class Langer<
  TSays = any,
  TLangs extends string[] = string[],
  TDriver = undefined
> extends OriginalLanger<TSays, TLangs, TDriver> {
  constructor(options?: Options<TDriver, TSays, TLangs>);
}
