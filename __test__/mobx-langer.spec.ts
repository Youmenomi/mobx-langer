import { autorun } from 'mobx';
import { MobxLanger, presetLanguage } from '../src';
import {
  AsyncDriver,
  clearSaved,
  getSaved,
  presetSaved,
  setSaved,
} from './helper';

const env = process.env;

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

describe('mobxLanger', () => {
  const warn = jest
    .spyOn(global.console, 'warn')
    .mockImplementation(() => true);

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
    process.env = { ...env };
    warn.mockClear();
    clearSaved();
  });

  afterAll(() => {
    process.env = env;
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

    const mobxLanger = new MobxLanger<typeof fetched>();
    expect(mobxLanger.initialized).toBeFalsy();
    await mobxLanger.initialize(fetched);
    expect(mobxLanger.initialized).toBeTruthy();
    expect(mobxLanger.availableLanguages).toEqual(Object.keys(fetched));

    expect(mobxLanger.speaking).toBe('zh');
    expect(mobxLanger.says.cancel).toBe(fetched.zh.cancel);
    expect(mobxLanger.says.setting.language).toBe(fetched.zh.setting.language);

    expect(await mobxLanger.resetLanguage()).toBe(presetResult);

    expect(mobxLanger.speaking).toEqual(presetResult);
    expect(mobxLanger.says.cancel).toBe(fetched.en.cancel);
    expect(mobxLanger.says.setting.language).toBe(fetched.en.setting.language);

    await mobxLanger.speak('zh');
    expect(mobxLanger.speaking).toBe('zh');
    expect(mobxLanger.says.cancel).toBe(fetched.zh.cancel);
    expect(mobxLanger.says.setting.language).toBe(fetched.zh.setting.language);

    const updatedLanger = await mobxLanger.update(updated);
    expect(mobxLanger === updatedLanger).toBeTruthy();
    expect(updatedLanger.speaking).toBe('zh');
    expect(updatedLanger.says.enter).toBe(updated.zh.enter);
    expect(updatedLanger.says.setting.quality).toBe(updated.zh.setting.quality);

    updatedLanger.dispose();
    expect(mobxLanger.dispoed).toBeTruthy();
    expect(() => mobxLanger.availableLanguages).toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    expect(() => mobxLanger.speaking).toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    expect(() => mobxLanger.says).toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    await expect(async () => await mobxLanger.speak('en')).rejects.toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    await expect(
      async () => await mobxLanger.resetLanguage()
    ).rejects.toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    await expect(
      async () => await mobxLanger.update(updated)
    ).rejects.toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
  });

  it('error', async () => {
    const mobxLanger = new MobxLanger();
    expect(() => mobxLanger.availableLanguages).toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    expect(() => mobxLanger.says).toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    expect(() => mobxLanger.speaking).toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );

    await expect(async () => mobxLanger.resetLanguage()).rejects.toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    await expect(async () => mobxLanger.speak('en')).rejects.toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );
    await expect(async () => mobxLanger.update({})).rejects.toThrowError(
      '[langer] Not initialized yet, failed to initialize or disposed.'
    );

    await expect(async () => mobxLanger.initialize({})).rejects.toThrowError(
      '[langer] initialization failed. Unable to get the list of available languages.'
    );
    expect(mobxLanger.initialized).toBeFalsy();
    await mobxLanger.initialize(fetched);
    expect(mobxLanger.initialized).toBeTruthy();
    await expect(async () => mobxLanger.speak('ja')).rejects.toThrowError(
      '[langer] Cannot speak the "ja" language that are not on the available languages(en,zh).'
    );
    await expect(async () => mobxLanger.update({})).rejects.toThrowError(
      '[langer] initialization failed. Unable to get the list of available languages.'
    );

    clearSaved();
    await expect(async () =>
      new MobxLanger({ preset: 'ja' }).initialize(fetched)
    ).rejects.toThrowError(
      '[langer] The preset language "ja" is not on the available languages(en,zh).'
    );
  });

  it('recorder', async () => {
    const mobxLanger = await new MobxLanger().initialize(fetched);
    expect(mobxLanger.speaking).toBe(presetResult);
    await mobxLanger.speak('zh');

    const otherLanger = await new MobxLanger().initialize(updated);
    expect(otherLanger.speaking).toBe('zh');
    expect(otherLanger.says.setting.quality).toBe(updated.zh.setting.quality);

    const anotherLanger = await new MobxLanger().initialize(updated, true);
    expect(anotherLanger.speaking).toBe('en');
    expect(anotherLanger.says.enter).toBe(updated.en.enter);
  });

  it('preset', async () => {
    const mobxLanger = await new MobxLanger({ preset: 'zh' }).initialize(
      fetched
    );
    expect(mobxLanger.speaking).toBe('zh');
    expect(mobxLanger.says.confirm).toBe(fetched.zh.confirm);
  });

  it('warn', async () => {
    const mobxLanger = await new MobxLanger();
    await mobxLanger.initialize(fetched);
    await mobxLanger.initialize(fetched);

    process.env.NODE_ENV = 'development';
    expect(console.warn).toBeCalledTimes(0);
    await mobxLanger.initialize(fetched);
    expect(console.warn).toBeCalledTimes(1);
    await mobxLanger.initialize(fetched);
    expect(console.warn).toBeCalledTimes(2);
  });

  it('async recorder', async () => {
    const mobxLanger = await new MobxLanger({
      recorder: new AsyncDriver(),
    }).initialize(fetched);
    expect(mobxLanger.speaking).toBe(presetResult);
    await mobxLanger.speak('zh');

    const otherLanger = await new MobxLanger().initialize(updated);
    expect(otherLanger.speaking).toBe('zh');
    expect(otherLanger.says.setting.quality).toBe(updated.zh.setting.quality);

    const anotherLanger = await new MobxLanger().initialize(updated, true);
    expect(anotherLanger.speaking).toBe('en');
    expect(anotherLanger.says.enter).toBe(updated.en.enter);
  });

  it('mobx', async () => {
    const mobxLanger = new MobxLanger();
    await mobxLanger.initialize(updated);

    const view1 = jest.fn(() => {
      try {
        return `btn:${mobxLanger.says.cancel},btn:${mobxLanger.says.confirm}`;
      } catch (error) {
        return error;
      }
    });
    const view2 = jest.fn(() => {
      try {
        return `btn:${mobxLanger.says.enter},btn:${mobxLanger.says.setting.language},btn:${mobxLanger.says.setting.quality},btn:${mobxLanger.says.setting.volume}`;
      } catch (error) {
        return error;
      }
    });
    const view3 = jest.fn(() => {
      try {
        return `The supported languages are ${mobxLanger.availableLanguages}. The current language is ${mobxLanger.speaking}`;
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

    await mobxLanger.speak('zh');
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

    await mobxLanger.resetLanguage();
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

    await mobxLanger.update(fetched);
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

    await mobxLanger.dispose();
    expect(view1).lastReturnedWith(
      new Error(
        '[langer] Not initialized yet, failed to initialize or disposed.'
      )
    );
    expect(view2).lastReturnedWith(
      new Error(
        '[langer] Not initialized yet, failed to initialize or disposed.'
      )
    );
    expect(view3).lastReturnedWith(
      new Error(
        '[langer] Not initialized yet, failed to initialize or disposed.'
      )
    );
  });
});
