'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { motion } from 'framer-motion';

interface MasonryGridProps {
  children: React.ReactElement[];
  columns?: number;
  gap?: number;
  className?: string;
}

export function MasonryGrid({ 
  children, 
  columns = 3, 
  gap = 16, 
  className = '' 
}: MasonryGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [columnCount, setColumnCount] = useState(columns);

  // Responsive column calculation
  const calculateColumns = useCallback(() => {
    if (!containerRef.current) return columns;
    
    const containerWidth = containerRef.current.offsetWidth;
    const minItemWidth = 280; // Minimum width for pose cards
    const calculatedColumns = Math.floor((containerWidth + gap) / (minItemWidth + gap));
    
    // Ensure at least 1 column and max specified columns
    return Math.max(1, Math.min(calculatedColumns, columns));
  }, [columns, gap]);

  // Update columns on resize
  useEffect(() => {
    const handleResize = () => {
      setColumnCount(calculateColumns());
    };

    handleResize(); // Initial calculation
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [calculateColumns]);

  // Distribute items across columns
  const distributeItems = useCallback(() => {
    const columnArrays: React.ReactElement[][] = Array.from(
      { length: columnCount }, 
      () => []
    );

    children.forEach((child, index) => {
      const columnIndex = index % columnCount;
      columnArrays[columnIndex].push(
        React.cloneElement(child, {
          key: child.key || index,
          ...child.props
        })
      );
    });

    return columnArrays;
  }, [children, columnCount]);

  const columns_arrays = distributeItems();

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
    >
      <div 
        className="flex items-start"
        style={{ gap: `${gap}px` }}
      >
        {columns_arrays.map((column, columnIndex) => (
          <div
            key={columnIndex}
            className="flex-1 flex flex-col"
            style={{ gap: `${gap}px` }}
          >
            {column.map((item, itemIndex) => (
              <motion.div
                key={item.key || `${columnIndex}-${itemIndex}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ 
                  duration: 0.4,
                  delay: itemIndex * 0.05,
                  ease: [0.25, 0.46, 0.45, 0.94]
                }}
              >
                {item}
              </motion.div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// Alternative CSS-based Masonry (for simpler cases)
export function CSSMasonryGrid({ 
  children, 
  columns = 3, 
  gap = 16, 
  className = '' 
}: MasonryGridProps) {
  const [columnCount, setColumnCount] = useState(columns);
  const containerRef = useRef<HTMLDivElement>(null);

  // Responsive column calculation
  useEffect(() => {
    const calculateColumns = () => {
      if (!containerRef.current) return columns;
      
      const containerWidth = containerRef.current.offsetWidth;
      const minItemWidth = 280;
      const calculatedColumns = Math.floor((containerWidth + gap) / (minItemWidth + gap));
      
      return Math.max(1, Math.min(calculatedColumns, columns));
    };

    const handleResize = () => {
      setColumnCount(calculateColumns());
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    
    return () => window.removeEventListener('resize', handleResize);
  }, [columns, gap]);

  return (
    <div 
      ref={containerRef}
      className={`w-full ${className}`}
      style={{
        columnCount,
        columnGap: `${gap}px`,
        columnFill: 'balance',
      }}
    >
      {children.map((child, index) => (
        <motion.div
          key={child.key || index}
          className="break-inside-avoid"
          style={{ marginBottom: `${gap}px` }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ 
            duration: 0.4,
            delay: index * 0.05,
            ease: [0.25, 0.46, 0.45, 0.94]
          }}
        >
          {child}
        </motion.div>
      ))}
    </div>
  );
}

// Hook for masonry layout calculations
export function useMasonryLayout(itemCount: number, columns: number = 3) {
  const [layout, setLayout] = useState({
    columns: columns,
    itemsPerColumn: Math.ceil(itemCount / columns)
  });

  useEffect(() => {
    const calculateLayout = () => {
      const itemsPerColumn = Math.ceil(itemCount / columns);
      setLayout({
        columns,
        itemsPerColumn
      });
    };

    calculateLayout();
  }, [itemCount, columns]);

  const getColumnIndex = useCallback((itemIndex: number) => {
    return itemIndex % layout.columns;
  }, [layout.columns]);

  const getItemsForColumn = useCallback((columnIndex: number) => {
    const items = [];
    for (let i = columnIndex; i < itemCount; i += layout.columns) {
      items.push(i);
    }
    return items;
  }, [itemCount, layout.columns]);

  return {
    layout,
    getColumnIndex,
    getItemsForColumn
  };
}

export default MasonryGrid;