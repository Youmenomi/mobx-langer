//@ts-check

import { Langer } from 'langer'
import { makeAutoObservable } from 'mobx'

export * from 'langer'

export function MobxLanger(options) {
  return makeAutoObservable(new Langer(options), {
    //@ts-expect-error
    _recorder: false,
    _preset: false,
    initialize: false,
    internalUpdate: false,
    update: false,
    changeSays: false,
    speak: false,
    resetLanguage: false,
    dispose: false,
  })
}
