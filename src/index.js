//@ts-check

import { Langer } from 'langer'
import { action, makeObservable, observable } from 'mobx'

export * from 'langer'

export function MobxLanger(options) {
  return makeObservable(new Langer(options), {
    //@ts-expect-error
    _says: observable,
    _availableLanguages: observable,
    _currLanguage: observable,
    _initialized: observable,
    _disposed: observable,
    setSays: action,
    setAvailableLanguages: action,
    setCurrLanguage: action,
    setInitialized: action,
    dispose: action,
  })
}
