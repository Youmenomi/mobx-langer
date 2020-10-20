import { autorun, configure } from 'mobx';
import { MobxLanger, presetLanguage } from '../src';
import {
  AsyncDriver,
  clearSaved,
  getSaved,
  presetSaved,
  setSaved,
} from './helper';

const fetched = {
  en: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    setting: {
      language: 'Language',
    },
  },
  zh: {
    confirm: '確認',
    cancel: '取消',
    setting: {
      language: '語言',
    },
  },
} as const;
const priorities = ['en-US', 'en', 'zh-TW', 'zh'];
const presetResult = 'en';

const updated = {
  en: {
    confirm: 'Confirm',
    cancel: 'Cancel',
    enter: 'Enter',
    setting: {
      language: 'Language',
      volume: 'Volume',
      quality: 'Quality',
    },
  },
  zh: {
    confirm: '確認',
    cancel: '取消',
    enter: '進入',
    setting: {
      language: '語言',
      volume: '音量',
      quality: '畫質',
    },
  },
  ja: {
    confirm: '確認',
    cancel: 'キャンセル',
    enter: '入力',
    setting: {
      language: '言語',
      volume: 'ボリューム',
      quality: '画質',
    },
  },
} as const;

describe('mobx-langer', () => {
  jest
    .spyOn(Object.getPrototypeOf(localStorage) as Storage, 'getItem')
    .mockImplementation((name: string) => {
      return getSaved(name) ? getSaved(name) : null;
    });
  jest
    .spyOn(Object.getPrototypeOf(localStorage) as Storage, 'setItem')
    .mockImplementation((name: string, value: string) => {
      setSaved(name, value);
    });

  jest
    .spyOn(navigator as NavigatorLanguage, 'languages', 'get')
    .mockImplementation(() => {
      return priorities;
    });

  beforeEach(() => {
    clearSaved();
  });

  it('presetLanguage', () => {
    expect(presetLanguage(Object.keys(fetched), navigator.languages)).toBe(
      'en'
    );
    expect(presetLanguage(Object.keys(fetched), ['zh'])).toBe('zh');
    expect(() => presetLanguage(Object.keys(fetched), ['ja'])).toThrowError(
      '[langer] The presetLanguage function cannot preset the current language.'
    );
  });

  it('normal', async () => {
    presetSaved('zh');

    const langer = new MobxLanger<typeof fetched>();
    expect(langer.initialized).toBeFalsy();
    await langer.initialize(fetched);
    expect(langer.initialized).toBeTruthy();
    expect(langer.availableLanguages).toEqual(Object.keys(fetched));

    expect(langer.speaking).toBe('zh');
    expect(langer.says.cancel).toBe(fetched.zh.cancel);
    expect(langer.says.setting.language).toBe(fetched.zh.setting.language);

    expect(await langer.resetLanguage()).toBe(presetResult);

    expect(langer.speaking).toEqual(presetResult);
    expect(langer.says.cancel).toBe(fetched.en.cancel);
    expect(langer.says.setting.language).toBe(fetched.en.setting.language);

    await langer.speak('zh');
    expect(langer.speaking).toBe('zh');
    expect(langer.says.cancel).toBe(fetched.zh.cancel);
    expect(langer.says.setting.language).toBe(fetched.zh.setting.language);

    const updatedLanger = await langer.update(updated);
    //@ts-expect-error
    expect(langer === updatedLanger).toBeTruthy();
    expect(updatedLanger.speaking).toBe('zh');
    expect(updatedLanger.says.enter).toBe(updated.zh.enter);
    expect(updatedLanger.says.setting.quality).toBe(updated.zh.setting.quality);

    updatedLanger.dispose();
    expect(langer.disposed).toBeTruthy();
    expect(() => langer.availableLanguages).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.speaking).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.says).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.speak('en')).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.resetLanguage()).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => await langer.update(updated)).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
  });

  it('error', async () => {
    const langer = new MobxLanger();
    expect(() => langer.availableLanguages).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.says).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    expect(() => langer.speaking).toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );

    await expect(async () => langer.resetLanguage()).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => langer.speak('en')).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );
    await expect(async () => langer.update({})).rejects.toThrowError(
      '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
    );

    await expect(async () => langer.initialize({})).rejects.toThrowError(
      '[langer] Initialization failed. Unable to get the list of available languages.'
    );
    expect(langer.initialized).toBeFalsy();
    await langer.initialize(fetched);
    expect(langer.initialized).toBeTruthy();
    await expect(async () => langer.speak('ja')).rejects.toThrowError(
      '[langer] Cannot speak the "ja" language that are not on the available languages(en,zh).'
    );
    await expect(async () => langer.update({})).rejects.toThrowError(
      '[langer] Initialization failed. Unable to get the list of available languages.'
    );

    clearSaved();
    await expect(async () =>
      new MobxLanger({ preset: 'ja' }).initialize(fetched)
    ).rejects.toThrowError(
      '[langer] The preset language "ja" is not on the available languages(en,zh).'
    );

    langer.dispose();
    await expect(async () => langer.dispose()).rejects.toThrowError(
      '[langer] Invalid operation. This has been disposed.'
    );
  });

  it('recorder', async () => {
    const langer = await new MobxLanger().initialize(fetched);
    expect(langer.speaking).toBe(presetResult);
    await langer.speak('zh');

    const otherLanger = await new MobxLanger().initialize(updated);
    expect(otherLanger.speaking).toBe('zh');
    expect(otherLanger.says.setting.quality).toBe(updated.zh.setting.quality);

    const anotherLanger = await new MobxLanger().initialize(updated, true);
    expect(anotherLanger.speaking).toBe('en');
    expect(anotherLanger.says.enter).toBe(updated.en.enter);
  });

  it('preset', async () => {
    const langer = await new MobxLanger({ preset: 'zh' }).initialize(fetched);
    expect(langer.speaking).toBe('zh');
    expect(langer.says.confirm).toBe(fetched.zh.confirm);
  });

  it('warn', async () => {
    const langer = await new MobxLanger();
    await langer.initialize(fetched);
    await expect(
      async () => await langer.initialize(fetched)
    ).rejects.toThrowError(
      '[langer] Invalid operation. This has been initialized.'
    );
  });

  it('async recorder', async () => {
    const langer = await new MobxLanger({
      recorder: new AsyncDriver(),
    }).initialize(fetched);
    expect(langer.speaking).toBe(presetResult);
    await langer.speak('zh');

    const otherLanger = await new MobxLanger().initialize(updated);
    expect(otherLanger.speaking).toBe('zh');
    expect(otherLanger.says.setting.quality).toBe(updated.zh.setting.quality);

    const anotherLanger = await new MobxLanger().initialize(updated, true);
    expect(anotherLanger.speaking).toBe('en');
    expect(anotherLanger.says.enter).toBe(updated.en.enter);
  });

  it('mobx', async () => {
    configure({
      enforceActions: 'always',
      computedRequiresReaction: true,
      reactionRequiresObservable: true,
      // observableRequiresReaction: true,
      // disableErrorBoundaries: true,
    });

    const langer = new MobxLanger();
    await langer.initialize(updated);

    const view1 = jest.fn(() => {
      try {
        return `btn:${langer.says.cancel},btn:${langer.says.confirm}`;
      } catch (error) {
        return error;
      }
    });
    const view2 = jest.fn(() => {
      try {
        return `btn:${langer.says.enter},btn:${langer.says.setting.language},btn:${langer.says.setting.quality},btn:${langer.says.setting.volume}`;
      } catch (error) {
        return error;
      }
    });
    const view3 = jest.fn(() => {
      try {
        return `The supported languages are ${langer.availableLanguages}. The current language is ${langer.speaking}`;
      } catch (error) {
        return error;
      }
    });

    autorun(view1);
    autorun(view2);
    autorun(view3);

    expect(view1).toBeCalledTimes(1);
    expect(view1).lastReturnedWith(
      `btn:${updated.en.cancel},btn:${updated.en.confirm}`
    );
    expect(view2).toBeCalledTimes(1);
    expect(view2).lastReturnedWith(
      `btn:${updated.en.enter},btn:${updated.en.setting.language},btn:${updated.en.setting.quality},btn:${updated.en.setting.volume}`
    );
    expect(view3).toBeCalledTimes(1);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh,ja'}. The current language is ${presetResult}`
    );

    await langer.speak('zh');
    expect(view1).toBeCalledTimes(2);
    expect(view1).lastReturnedWith(
      `btn:${updated.zh.cancel},btn:${updated.zh.confirm}`
    );
    expect(view2).toBeCalledTimes(2);
    expect(view2).lastReturnedWith(
      `btn:${updated.zh.enter},btn:${updated.zh.setting.language},btn:${updated.zh.setting.quality},btn:${updated.zh.setting.volume}`
    );
    expect(view3).toBeCalledTimes(2);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh,ja'}. The current language is ${'zh'}`
    );

    await langer.resetLanguage();
    expect(view1).toBeCalledTimes(3);
    expect(view1).lastReturnedWith(
      `btn:${updated.en.cancel},btn:${updated.en.confirm}`
    );
    expect(view2).toBeCalledTimes(3);
    expect(view2).lastReturnedWith(
      `btn:${updated.en.enter},btn:${updated.en.setting.language},btn:${updated.en.setting.quality},btn:${updated.en.setting.volume}`
    );
    expect(view3).toBeCalledTimes(3);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh,ja'}. The current language is ${'en'}`
    );

    await langer.update(fetched);
    expect(view1).toBeCalledTimes(4);
    expect(view1).lastReturnedWith(
      `btn:${fetched.en.cancel},btn:${fetched.en.confirm}`
    );
    expect(view2).toBeCalledTimes(4);
    expect(view2).lastReturnedWith(
      //@ts-expect-error
      `btn:${fetched.en.enter},btn:${fetched.en.setting.language},btn:${fetched.en.setting.quality},btn:${fetched.en.setting.volume}`
    );
    expect(view3).toBeCalledTimes(4);
    expect(view3).lastReturnedWith(
      `The supported languages are ${'en,zh'}. The current language is ${'en'}`
    );

    await langer.dispose();
    expect(view1).lastReturnedWith(
      new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      )
    );
    expect(view2).lastReturnedWith(
      new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      )
    );
    expect(view3).lastReturnedWith(
      new Error(
        '[langer] Invalid operation. Not initialized yet, failed to initialize or has been disposed.'
      )
    );
  });
});
