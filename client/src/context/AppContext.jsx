import { createContext, useContext, useReducer, useEffect } from 'react';
import { api } from '../api.js';

const AppContext = createContext(null);

const initialState = {
  activePanel: 'overview',
  serverOnline: false,
  dbOnline: false,
  providers: { ollama: false, anthropic: false, openai: false, minimax: false },
  ollamaModels: [],
  thoughts: [],
  projects: [],
  setupState: {},
};

function reducer(state, action) {
  switch (action.type) {
    case 'SET_PANEL':     return { ...state, activePanel: action.payload };
    case 'SET_STATUS':    return { ...state, ...action.payload };
    case 'SET_THOUGHTS':  return { ...state, thoughts: action.payload };
    case 'SET_PROJECTS':  return { ...state, projects: action.payload };
    case 'SET_SETUP':     return { ...state, setupState: action.payload };
    case 'TOGGLE_SETUP':  return { ...state, setupState: { ...state.setupState, [action.id]: action.done } };
    case 'ADD_THOUGHT':   return { ...state, thoughts: [action.payload, ...state.thoughts] };
    case 'DEL_THOUGHT':   return { ...state, thoughts: state.thoughts.filter(t => t.id !== action.payload.id) };
    case 'ADD_PROJECT':   return { ...state, projects: [action.payload, ...state.projects] };
    case 'UPDATE_PROJECT':return { ...state, projects: state.projects.map(p => p.id === action.payload.id ? action.payload : p) };
    case 'DEL_PROJECT':   return { ...state, projects: state.projects.filter(p => p.id !== action.id) };
    default: return state;
  }
}

export function AppProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);

  // Boot: check server health
  useEffect(() => {
    checkServer();
    const interval = setInterval(checkServer, 30000);
    return () => clearInterval(interval);
  }, []);

  async function checkServer() {
    try {
      const health = await api.get('/api/health');
      const providers = await api.get('/api/ai/providers').catch(() => ({}));
      dispatch({ type: 'SET_STATUS', payload: { serverOnline: true, dbOnline: health.db, providers: { ...state.providers, ...providers } } });
    } catch {
      dispatch({ type: 'SET_STATUS', payload: { serverOnline: false } });
    }
  }

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}
