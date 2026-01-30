import { useReducer, useCallback, useEffect } from 'react';
import {
  DEMO_CODE,
  DEFAULT_INTERVAL,
  DEFAULT_SETTINGS_TAB,
  DEFAULT_ENABLE_3D,
  STORAGE_KEYS
} from '../config/appConfig';

const getInitialState = () => {
  if (typeof window === 'undefined') {
    return {
      code: DEMO_CODE,
      interval: DEFAULT_INTERVAL,
      enable3D: DEFAULT_ENABLE_3D,
      showSettings: false,
      settingsTab: DEFAULT_SETTINGS_TAB
    };
  }

  const storedCode = window.localStorage.getItem(STORAGE_KEYS.code);
  const storedEnable3D = window.localStorage.getItem(STORAGE_KEYS.enable3D);

  return {
    code: storedCode ?? DEMO_CODE,
    interval: DEFAULT_INTERVAL,
    enable3D: storedEnable3D === null ? DEFAULT_ENABLE_3D : storedEnable3D === 'true',
    showSettings: false,
    settingsTab: DEFAULT_SETTINGS_TAB
  };
};

const appReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CODE':
      return { ...state, code: action.value };
    case 'SET_INTERVAL':
      return { ...state, interval: action.value };
    case 'SET_ENABLE_3D':
      return { ...state, enable3D: action.value };
    case 'TOGGLE_SETTINGS':
      return { ...state, showSettings: !state.showSettings };
    case 'SET_SETTINGS_TAB':
      return { ...state, settingsTab: action.value };
    default:
      return state;
  }
};

const useAppState = () => {
  const [state, dispatch] = useReducer(appReducer, undefined, getInitialState);

  const setCode = useCallback((value) => {
    dispatch({ type: 'SET_CODE', value });
  }, []);

  const clearCode = useCallback(() => {
    dispatch({ type: 'SET_CODE', value: '' });
  }, []);

  const setInterval = useCallback((value) => {
    dispatch({ type: 'SET_INTERVAL', value });
  }, []);

  const setEnable3D = useCallback((value) => {
    dispatch({ type: 'SET_ENABLE_3D', value });
  }, []);

  const toggleSettings = useCallback(() => {
    dispatch({ type: 'TOGGLE_SETTINGS' });
  }, []);

  const setSettingsTab = useCallback((value) => {
    dispatch({ type: 'SET_SETTINGS_TAB', value });
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.code, state.code);
  }, [state.code]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(STORAGE_KEYS.enable3D, String(state.enable3D));
  }, [state.enable3D]);

  return {
    ...state,
    setCode,
    clearCode,
    setInterval,
    setEnable3D,
    toggleSettings,
    setSettingsTab
  };
};

export default useAppState;
