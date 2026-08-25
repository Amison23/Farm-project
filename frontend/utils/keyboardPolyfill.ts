import { NativeModules, TurboModuleRegistry } from 'react-native';

const dummyKeyboardController = {
  setDefaultMode: () => {},
  setInputMode: () => {},
  preload: () => {},
  setTranslucent: () => {},
  dismiss: () => {},
  setFocusTo: () => {},
  viewPositionInWindow: () => Promise.resolve({ x: 0, y: 0, width: 0, height: 0 }),
  addListener: () => {},
  removeListeners: () => {},
  getConstants: () => ({ keyboardBorderRadius: 0 }),
};

export function initKeyboardPolyfill() {
  try {
    if (NativeModules && !NativeModules.KeyboardController) {
      NativeModules.KeyboardController = dummyKeyboardController;
    }
  } catch (e) {}

  try {
    if (typeof TurboModuleRegistry !== 'undefined' && TurboModuleRegistry && typeof TurboModuleRegistry.get === 'function') {
      const existing = TurboModuleRegistry.get('KeyboardController');
      if (!existing) {
        const originalGet = TurboModuleRegistry.get.bind(TurboModuleRegistry);
        (TurboModuleRegistry as any).get = (name: string) => {
          if (name === 'KeyboardController') {
            return dummyKeyboardController;
          }
          return originalGet(name);
        };
      }
    }
  } catch (e) {}
}

initKeyboardPolyfill();
