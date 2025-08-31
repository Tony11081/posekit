'use client';

import { useState, useEffect, useCallback } from 'react';

type SetValue<T> = T | ((val: T) => T);

/**
 * Custom hook for localStorage with TypeScript support and SSR safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: SetValue<T>) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    try {
      // Get from local storage by key
      if (typeof window !== 'undefined') {
        const item = window.localStorage.getItem(key);
        if (item !== null) {
          const parsed = JSON.parse(item);
          setStoredValue(parsed);
        }
        setIsInitialized(true);
      }
    } catch (error) {
      console.error(`Error reading localStorage key "${key}":`, error);
      setIsInitialized(true);
    }
  }, [key]);

  // Return a wrapped version of useState's setter function that persists the new value to localStorage
  const setValue = useCallback((value: SetValue<T>) => {
    try {
      // Allow value to be a function so we have the same API as useState
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      
      // Save state
      setStoredValue(valueToStore);
      
      // Save to local storage
      if (typeof window !== 'undefined') {
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
        
        // Dispatch storage event for cross-tab synchronization
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: JSON.stringify(valueToStore),
            url: window.location.href,
          })
        );
      }
    } catch (error) {
      console.error(`Error setting localStorage key "${key}":`, error);
    }
  }, [key, storedValue]);

  // Function to remove the item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== 'undefined') {
        window.localStorage.removeItem(key);
        
        // Dispatch storage event
        window.dispatchEvent(
          new StorageEvent('storage', {
            key,
            newValue: null,
            url: window.location.href,
          })
        );
      }
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  // Listen for changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === key && e.newValue !== null) {
        try {
          const newValue = JSON.parse(e.newValue);
          setStoredValue(newValue);
        } catch (error) {
          console.error(`Error parsing localStorage value for key "${key}":`, error);
        }
      } else if (e.key === key && e.newValue === null) {
        // Key was removed
        setStoredValue(initialValue);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener('storage', handleStorageChange);
      return () => window.removeEventListener('storage', handleStorageChange);
    }
  }, [key, initialValue]);

  // Return initial value during SSR and before client-side hydration
  return [isInitialized ? storedValue : initialValue, setValue, removeValue];
}

/**
 * Hook for managing localStorage with additional utilities
 */
export function useLocalStorageWithUtils<T>(key: string, initialValue: T) {
  const [value, setValue, removeValue] = useLocalStorage(key, initialValue);

  // Check if key exists in localStorage
  const hasValue = useCallback((): boolean => {
    if (typeof window === 'undefined') return false;
    return window.localStorage.getItem(key) !== null;
  }, [key]);

  // Get raw string value from localStorage
  const getRawValue = useCallback((): string | null => {
    if (typeof window === 'undefined') return null;
    return window.localStorage.getItem(key);
  }, [key]);

  // Get size of stored data in bytes
  const getSize = useCallback((): number => {
    const rawValue = getRawValue();
    return rawValue ? new Blob([rawValue]).size : 0;
  }, [getRawValue]);

  // Merge with existing object (useful for objects/arrays)
  const mergeValue = useCallback((newData: Partial<T>) => {
    setValue(prevValue => {
      if (typeof prevValue === 'object' && prevValue !== null && !Array.isArray(prevValue)) {
        return { ...prevValue, ...newData };
      }
      return newData as T;
    });
  }, [setValue]);

  // Reset to initial value
  const resetValue = useCallback(() => {
    setValue(initialValue);
  }, [setValue, initialValue]);

  return {
    value,
    setValue,
    removeValue,
    resetValue,
    mergeValue,
    hasValue,
    getRawValue,
    getSize,
  };
}

/**
 * Hook for managing multiple localStorage keys as a single object
 */
export function useLocalStorageState<T extends Record<string, any>>(
  keys: (keyof T)[],
  initialValues: T
) {
  const [state, setState] = useState<T>(initialValues);

  // Initialize from localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const newState = { ...initialValues };
      let hasChanges = false;

      keys.forEach(key => {
        try {
          const item = window.localStorage.getItem(key as string);
          if (item !== null) {
            newState[key] = JSON.parse(item);
            hasChanges = true;
          }
        } catch (error) {
          console.error(`Error reading localStorage key "${key as string}":`, error);
        }
      });

      if (hasChanges) {
        setState(newState);
      }
    }
  }, [keys]);

  // Update specific key
  const updateKey = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setState(prev => ({ ...prev, [key]: value }));
    
    if (typeof window !== 'undefined') {
      try {
        window.localStorage.setItem(key as string, JSON.stringify(value));
      } catch (error) {
        console.error(`Error setting localStorage key "${key as string}":`, error);
      }
    }
  }, []);

  // Update multiple keys
  const updateKeys = useCallback((updates: Partial<T>) => {
    setState(prev => ({ ...prev, ...updates }));
    
    if (typeof window !== 'undefined') {
      Object.entries(updates).forEach(([key, value]) => {
        try {
          window.localStorage.setItem(key, JSON.stringify(value));
        } catch (error) {
          console.error(`Error setting localStorage key "${key}":`, error);
        }
      });
    }
  }, []);

  // Clear all keys
  const clearAll = useCallback(() => {
    setState(initialValues);
    
    if (typeof window !== 'undefined') {
      keys.forEach(key => {
        window.localStorage.removeItem(key as string);
      });
    }
  }, [keys, initialValues]);

  return {
    state,
    updateKey,
    updateKeys,
    clearAll,
  };
}

export default useLocalStorage;