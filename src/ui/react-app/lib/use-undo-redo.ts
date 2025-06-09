import { useState, useCallback, useRef } from 'react';

export interface UndoRedoAction {
  id: string;
  type: 'single_mutation' | 'batch_mutation';
  timestamp: string;
  description: string;
  rollbackData: any;
  rollbackFunction?: () => Promise<void>;
}

interface UndoRedoState {
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
  isUndoing: boolean;
  isRedoing: boolean;
  maxStackSize: number;
}

interface UndoRedoHook {
  // State
  canUndo: boolean;
  canRedo: boolean;
  isUndoing: boolean;
  isRedoing: boolean;
  undoStack: UndoRedoAction[];
  redoStack: UndoRedoAction[];
  
  // Actions
  addAction: (action: Omit<UndoRedoAction, 'id' | 'timestamp'>) => void;
  undo: () => Promise<boolean>;
  redo: () => Promise<boolean>;
  clearHistory: () => void;
  
  // Utilities
  getLastActionDescription: () => string | null;
  getNextRedoDescription: () => string | null;
}

export function useUndoRedo(maxStackSize = 50): UndoRedoHook {
  const [state, setState] = useState<UndoRedoState>({
    undoStack: [],
    redoStack: [],
    isUndoing: false,
    isRedoing: false,
    maxStackSize
  });

  const actionIdRef = useRef(0);

  const generateActionId = () => {
    actionIdRef.current += 1;
    return `action-${actionIdRef.current}-${Date.now()}`;
  };

  const addAction = useCallback((action: Omit<UndoRedoAction, 'id' | 'timestamp'>) => {
    setState(prevState => {
      const newAction: UndoRedoAction = {
        ...action,
        id: generateActionId(),
        timestamp: new Date().toISOString()
      };

      let newUndoStack = [...prevState.undoStack, newAction];
      
      // Trim stack to max size
      if (newUndoStack.length > prevState.maxStackSize) {
        newUndoStack = newUndoStack.slice(-prevState.maxStackSize);
      }

      return {
        ...prevState,
        undoStack: newUndoStack,
        redoStack: [] // Clear redo stack when new action is added
      };
    });
  }, []);

  const undo = useCallback(async (): Promise<boolean> => {
    if (state.undoStack.length === 0 || state.isUndoing) {
      return false;
    }

    setState(prevState => ({ ...prevState, isUndoing: true }));

    try {
      const lastAction = state.undoStack[state.undoStack.length - 1];
      
      // Execute rollback if available
      if (lastAction.rollbackFunction) {
        await lastAction.rollbackFunction();
      }

      setState(prevState => ({
        ...prevState,
        undoStack: prevState.undoStack.slice(0, -1),
        redoStack: [...prevState.redoStack, lastAction],
        isUndoing: false
      }));

      return true;
    } catch (error) {
      console.error('Error during undo operation:', error);
      setState(prevState => ({ ...prevState, isUndoing: false }));
      return false;
    }
  }, [state.undoStack, state.isUndoing]);

  const redo = useCallback(async (): Promise<boolean> => {
    if (state.redoStack.length === 0 || state.isRedoing) {
      return false;
    }

    setState(prevState => ({ ...prevState, isRedoing: true }));

    try {
      const nextAction = state.redoStack[state.redoStack.length - 1];
      
      // Note: Redo would need custom logic based on action type
      // For now, we'll just move the action back to undo stack
      setState(prevState => ({
        ...prevState,
        redoStack: prevState.redoStack.slice(0, -1),
        undoStack: [...prevState.undoStack, nextAction],
        isRedoing: false
      }));

      return true;
    } catch (error) {
      console.error('Error during redo operation:', error);
      setState(prevState => ({ ...prevState, isRedoing: false }));
      return false;
    }
  }, [state.redoStack, state.isRedoing]);

  const clearHistory = useCallback(() => {
    setState(prevState => ({
      ...prevState,
      undoStack: [],
      redoStack: []
    }));
  }, []);

  const getLastActionDescription = useCallback((): string | null => {
    if (state.undoStack.length === 0) {
      return null;
    }
    return state.undoStack[state.undoStack.length - 1].description;
  }, [state.undoStack]);

  const getNextRedoDescription = useCallback((): string | null => {
    if (state.redoStack.length === 0) {
      return null;
    }
    return state.redoStack[state.redoStack.length - 1].description;
  }, [state.redoStack]);

  return {
    // State
    canUndo: state.undoStack.length > 0 && !state.isUndoing,
    canRedo: state.redoStack.length > 0 && !state.isRedoing,
    isUndoing: state.isUndoing,
    isRedoing: state.isRedoing,
    undoStack: state.undoStack,
    redoStack: state.redoStack,
    
    // Actions
    addAction,
    undo,
    redo,
    clearHistory,
    
    // Utilities
    getLastActionDescription,
    getNextRedoDescription
  };
} 