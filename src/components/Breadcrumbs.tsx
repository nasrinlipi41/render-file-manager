import React from 'react';
import { Home, ChevronRight } from 'lucide-react';

interface BreadcrumbsProps {
  currentPath: string;
  onNavigate: (path: string) => void;
}

export default function Breadcrumbs({ currentPath, onNavigate }: BreadcrumbsProps) {
  // Split path into individual folder names
  const pathParts = currentPath ? currentPath.split('/').filter(Boolean) : [];

  return (
    <nav className="flex items-center gap-1 overflow-x-auto py-1 text-sm text-slate-500 whitespace-nowrap scrollbar-none">
      {/* Home / Root Path Link */}
      <button
        onClick={() => onNavigate('')}
        className="flex items-center gap-1.5 px-2 py-1 rounded-md text-slate-600 hover:text-blue-600 hover:bg-slate-50 transition-colors font-medium"
      >
        <Home className="w-4 h-4" />
        <span>রুট (Root)</span>
      </button>

      {pathParts.map((part, index) => {
        // Construct the cumulative path up to this item
        const targetPath = pathParts.slice(0, index + 1).join('/');
        const isLast = index === pathParts.length - 1;

        return (
          <React.Fragment key={index}>
            <ChevronRight className="w-3.5 h-3.5 text-slate-300 shrink-0" />
            <button
              onClick={() => !isLast && onNavigate(targetPath)}
              disabled={isLast}
              className={`px-2 py-1 rounded-md font-medium transition-colors ${
                isLast
                  ? 'text-slate-800 cursor-default font-semibold'
                  : 'text-slate-600 hover:text-blue-600 hover:bg-slate-50'
              }`}
            >
              {part}
            </button>
          </React.Fragment>
        );
      })}
    </nav>
  );
}
