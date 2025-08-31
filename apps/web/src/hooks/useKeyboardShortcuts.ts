'use client';

import { useEffect, useCallback, RefObject } from 'react';

type ShortcutHandler = (event: KeyboardEvent) => void;
type ShortcutMap = Record<string, ShortcutHandler>;

interface UseKeyboardShortcutsOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  stopPropagation?: boolean;
  target?: RefObject<HTMLElement> | 'document' | 'window';
}

/**
 * Custom hook for handling keyboard shortcuts
 * @param elementRef - Reference to the element to attach listeners to
 * @param shortcuts - Map of key combinations to handlers
 * @param options - Configuration options
 */
export function useKeyboardShortcuts(
  elementRef: RefObject<HTMLElement> | null,
  shortcuts: ShortcutMap,
  options: UseKeyboardShortcutsOptions = {}
) {
  const {
    enabled = true,
    preventDefault = true,
    stopPropagation = true,
    target = elementRef ? 'element' : 'document'
  } = options;

  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    if (!enabled) return;

    const key = getKeyString(event);
    const handler = shortcuts[key];

    if (handler) {
      if (preventDefault) event.preventDefault();
      if (stopPropagation) event.stopPropagation();
      handler(event);
    }
  }, [enabled, shortcuts, preventDefault, stopPropagation]);

  useEffect(() => {
    if (!enabled) return;

    let targetElement: HTMLElement | Document | Window | null = null;

    // Determine target element
    if (target === 'document') {
      targetElement = document;
    } else if (target === 'window') {
      targetElement = window;
    } else if (elementRef?.current) {
      targetElement = elementRef.current;
    }

    if (!targetElement) return;

    // Add event listener
    targetElement.addEventListener('keydown', handleKeyDown as EventListener);

    // Cleanup
    return () => {
      if (targetElement) {
        targetElement.removeEventListener('keydown', handleKeyDown as EventListener);
      }
    };
  }, [elementRef, handleKeyDown, enabled, target]);
}

/**
 * Generate a consistent key string from keyboard event
 */
function getKeyString(event: KeyboardEvent): string {
  const modifiers = [];
  
  if (event.ctrlKey) modifiers.push('Ctrl');
  if (event.altKey) modifiers.push('Alt');
  if (event.shiftKey) modifiers.push('Shift');
  if (event.metaKey) modifiers.push('Meta');
  
  // Handle special keys
  let key = event.key;
  
  // Normalize key names
  if (key === ' ') key = 'Space';
  if (key === 'Escape') key = 'Esc';
  
  // For letter keys, use event.code to get consistent behavior
  if (event.code.startsWith('Key')) {
    key = event.code; // e.g., 'KeyA', 'KeyB'
  }
  
  // Build key string
  if (modifiers.length > 0) {
    return `${modifiers.join('+')}+${key}`;
  }
  
  return key;
}

/**
 * Hook for global keyboard shortcuts (document level)
 */
export function useGlobalKeyboardShortcuts(
  shortcuts: ShortcutMap,
  options: Omit<UseKeyboardShortcutsOptions, 'target'> = {}
) {
  return useKeyboardShortcuts(null, shortcuts, {
    ...options,
    target: 'document'
  });
}

/**
 * Hook for pose card specific shortcuts
 */
export function usePoseCardShortcuts(
  elementRef: RefObject<HTMLElement>,
  handlers: {
    onCopyPNG?: () => void;
    onCopyJSON?: () => void;
    onCopyPrompt?: () => void;
    onToggleFavorite?: () => void;
    onPreviousVariant?: () => void;
    onNextVariant?: () => void;
    onToggleFullscreen?: () => void;
  }
) {
  const shortcuts: ShortcutMap = {};

  // Copy shortcuts
  if (handlers.onCopyPNG) {
    shortcuts['Enter'] = handlers.onCopyPNG;
    shortcuts['Space'] = handlers.onCopyPNG;
  }
  
  if (handlers.onCopyJSON) {
    shortcuts['KeyC'] = handlers.onCopyJSON;
  }
  
  if (handlers.onCopyPrompt) {
    shortcuts['KeyP'] = handlers.onCopyPrompt;
  }
  
  // Favorite shortcut
  if (handlers.onToggleFavorite) {
    shortcuts['KeyF'] = handlers.onToggleFavorite;
    shortcuts['KeyH'] = handlers.onToggleFavorite; // Heart
  }
  
  // Variant navigation
  if (handlers.onPreviousVariant) {
    shortcuts['ArrowLeft'] = handlers.onPreviousVariant;
    shortcuts['KeyA'] = handlers.onPreviousVariant;
  }
  
  if (handlers.onNextVariant) {
    shortcuts['ArrowRight'] = handlers.onNextVariant;
    shortcuts['KeyD'] = handlers.onNextVariant;
  }
  
  // Fullscreen toggle
  if (handlers.onToggleFullscreen) {
    shortcuts['KeyF'] = handlers.onToggleFullscreen;
    shortcuts['F11'] = handlers.onToggleFullscreen;
  }

  useKeyboardShortcuts(elementRef, shortcuts, {
    enabled: true,
    preventDefault: true,
    stopPropagation: true,
  });
}

/**
 * Hook for search shortcuts
 */
export function useSearchShortcuts(
  handlers: {
    onFocusSearch?: () => void;
    onClearSearch?: () => void;
    onSubmitSearch?: () => void;
  }
) {
  const shortcuts: ShortcutMap = {};

  if (handlers.onFocusSearch) {
    shortcuts['Ctrl+KeyK'] = handlers.onFocusSearch;
    shortcuts['Meta+KeyK'] = handlers.onFocusSearch;
    shortcuts['Slash'] = handlers.onFocusSearch;
  }

  if (handlers.onClearSearch) {
    shortcuts['Esc'] = handlers.onClearSearch;
  }

  if (handlers.onSubmitSearch) {
    shortcuts['Enter'] = handlers.onSubmitSearch;
  }

  useGlobalKeyboardShortcuts(shortcuts);
}

/**
 * Hook for navigation shortcuts
 */
export function useNavigationShortcuts(
  handlers: {
    onGoHome?: () => void;
    onGoSearch?: () => void;
    onGoFavorites?: () => void;
    onGoBuilder?: () => void;
    onToggleTheme?: () => void;
  }
) {
  const shortcuts: ShortcutMap = {};

  if (handlers.onGoHome) {
    shortcuts['KeyG+KeyH'] = handlers.onGoHome;
    shortcuts['Alt+Digit1'] = handlers.onGoHome;
  }

  if (handlers.onGoSearch) {
    shortcuts['KeyG+KeyS'] = handlers.onGoSearch;
    shortcuts['Alt+Digit2'] = handlers.onGoSearch;
  }

  if (handlers.onGoFavorites) {
    shortcuts['KeyG+KeyF'] = handlers.onGoFavorites;
    shortcuts['Alt+Digit3'] = handlers.onGoFavorites;
  }

  if (handlers.onGoBuilder) {
    shortcuts['KeyG+KeyB'] = handlers.onGoBuilder;
    shortcuts['Alt+Digit4'] = handlers.onGoBuilder;
  }

  if (handlers.onToggleTheme) {
    shortcuts['Ctrl+Shift+KeyT'] = handlers.onToggleTheme;
    shortcuts['Meta+Shift+KeyT'] = handlers.onToggleTheme;
  }

  useGlobalKeyboardShortcuts(shortcuts);
}

/**
 * Utility function to format shortcuts for display
 */
export function formatShortcut(keyString: string): string {
  return keyString
    .replace(/Ctrl\+/g, '⌃')
    .replace(/Alt\+/g, '⌥')
    .replace(/Shift\+/g, '⇧')
    .replace(/Meta\+/g, '⌘')
    .replace(/Key([A-Z])/g, '$1')
    .replace(/Digit([0-9])/g, '$1')
    .replace(/Arrow(Left|Right|Up|Down)/g, (_, direction) => {
      const arrows = { Left: '←', Right: '→', Up: '↑', Down: '↓' };
      return arrows[direction as keyof typeof arrows];
    })
    .replace(/Enter/g, '↵')
    .replace(/Space/g, '␣')
    .replace(/Esc/g, '⎋')
    .replace(/Slash/g, '/');
}

/**
 * Component to display keyboard shortcuts help
 */
export const KeyboardShortcutsHelp: React.FC<{
  shortcuts: Array<{ keys: string; description: string; category?: string }>;
}> = ({ shortcuts }) => {
  const categories = shortcuts.reduce((acc, shortcut) => {
    const category = shortcut.category || 'General';
    if (!acc[category]) acc[category] = [];
    acc[category].push(shortcut);
    return acc;
  }, {} as Record<string, typeof shortcuts>);

  return (
    <div className="keyboard-shortcuts-help">
      {Object.entries(categories).map(([category, items]) => (
        <div key={category} className="mb-6">
          <h3 className="font-semibold text-gray-900 mb-3">{category}</h3>
          <div className="space-y-2">
            {items.map((item, index) => (
              <div key={index} className="flex justify-between items-center">
                <span className="text-sm text-gray-700">{item.description}</span>
                <kbd className="px-2 py-1 text-xs font-semibold text-gray-800 bg-gray-100 border border-gray-300 rounded">
                  {formatShortcut(item.keys)}
                </kbd>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default useKeyboardShortcuts;