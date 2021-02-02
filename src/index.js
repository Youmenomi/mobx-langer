//@ts-check

import { Langer as originalLanger } from 'langer'
import { action, makeObservable, observable, computed } from 'mobx'

export * from 'langer'

export function Langer(options) {
  return makeObservable(new originalLanger(options), {
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
    availableLanguages: computed,
    initialize: action,
    restore: action,
    isAvailable: action,
    speak: action,
    reset: action,
    boost: action,
  })
}
