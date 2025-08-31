'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSearchShortcuts } from '../../hooks/useKeyboardShortcuts';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
  onSubmit?: () => void;
  placeholder?: string;
  suggestions?: string[];
  isLoading?: boolean;
  className?: string;
}

export function SearchBar({
  value,
  onChange,
  onClear,
  onSubmit,
  placeholder = "Search poses...",
  suggestions = [],
  isLoading = false,
  className = '',
}: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestion, setSelectedSuggestion] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Keyboard shortcuts
  useSearchShortcuts({
    onFocusSearch: () => {
      inputRef.current?.focus();
    },
    onClearSearch: () => {
      if (isFocused && value) {
        onClear();
      }
    },
    onSubmitSearch: () => {
      if (selectedSuggestion >= 0 && suggestions[selectedSuggestion]) {
        onChange(suggestions[selectedSuggestion]);
        setShowSuggestions(false);
      }
      onSubmit?.();
    },
  });

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  // Handle input blur
  const handleBlur = (e: React.FocusEvent) => {
    // Delay hiding suggestions to allow clicking
    setTimeout(() => {
      if (!suggestionsRef.current?.contains(e.relatedTarget as Node)) {
        setIsFocused(false);
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
      }
    }, 150);
  };

  // Handle input change
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    onChange(newValue);
    setSelectedSuggestion(-1);
    
    if (newValue.trim() && suggestions.length > 0) {
      setShowSuggestions(true);
    } else {
      setShowSuggestions(false);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestion(prev => 
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestion(prev => prev > 0 ? prev - 1 : -1);
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestion >= 0) {
          onChange(suggestions[selectedSuggestion]);
          setShowSuggestions(false);
        }
        onSubmit?.();
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestion(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Handle suggestion click
  const handleSuggestionClick = (suggestion: string) => {
    onChange(suggestion);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={`relative ${className}`}>
      {/* Search Input */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg
            className={`h-5 w-5 transition-colors ${
              isFocused ? 'text-blue-500' : 'text-gray-400'
            }`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>
        
        <input
          ref={inputRef}
          type="text"
          value={value}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className={`
            block w-full pl-10 pr-12 py-3 text-sm
            border border-gray-300 rounded-lg
            bg-white placeholder-gray-500
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            transition-all duration-200
            ${isFocused ? 'shadow-lg' : 'shadow-sm'}
          `}
        />
        
        {/* Loading spinner or clear button */}
        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
          {isLoading ? (
            <div className="animate-spin h-4 w-4 border-2 border-blue-500 border-t-transparent rounded-full" />
          ) : value ? (
            <button
              onClick={onClear}
              className="h-4 w-4 text-gray-400 hover:text-gray-600 transition-colors"
              type="button"
            >
              <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          ) : (
            <div className="text-xs text-gray-400 hidden sm:block">
              ⌘K
            </div>
          )}
        </div>
      </div>

      {/* Suggestions Dropdown */}
      <AnimatePresence>
        {showSuggestions && suggestions.length > 0 && (
          <motion.div
            ref={suggestionsRef}
            className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {suggestions.map((suggestion, index) => (
              <button
                key={suggestion}
                className={`
                  w-full px-4 py-3 text-left text-sm transition-colors
                  hover:bg-gray-50 focus:bg-gray-50 focus:outline-none
                  ${index === selectedSuggestion ? 'bg-blue-50 text-blue-700' : 'text-gray-900'}
                  ${index === 0 ? 'rounded-t-lg' : ''}
                  ${index === suggestions.length - 1 ? 'rounded-b-lg' : ''}
                `}
                onClick={() => handleSuggestionClick(suggestion)}
                onMouseEnter={() => setSelectedSuggestion(index)}
              >
                <div className="flex items-center">
                  <svg
                    className="h-4 w-4 mr-3 text-gray-400"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                  <span>{suggestion}</span>
                </div>
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default SearchBar;