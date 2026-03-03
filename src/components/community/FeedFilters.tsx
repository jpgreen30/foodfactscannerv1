import { Flame, Clock, AlertTriangle, Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import { FeedFilter } from '@/hooks/useCommunityFeed';

interface FeedFiltersProps {
  activeFilter: FeedFilter;
  onFilterChange: (filter: FeedFilter) => void;
}

const filters: { id: FeedFilter; label: string; icon: React.ReactNode }[] = [
  { id: 'recent', label: 'Recent', icon: <Clock className="w-4 h-4" /> },
  { id: 'trending', label: 'Trending', icon: <Flame className="w-4 h-4" /> },
  { id: 'harmful', label: 'Harmful', icon: <AlertTriangle className="w-4 h-4" /> },
  { id: 'baby', label: 'Baby Food', icon: <Baby className="w-4 h-4" /> },
];

export const FeedFilters = ({ activeFilter, onFilterChange }: FeedFiltersProps) => {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
      {filters.map((filter) => (
        <button
          key={filter.id}
          onClick={() => onFilterChange(filter.id)}
          className={cn(
            'flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-all whitespace-nowrap',
            activeFilter === filter.id
              ? 'bg-primary text-primary-foreground'
              : 'bg-muted text-muted-foreground hover:bg-muted/80'
          )}
        >
          {filter.icon}
          {filter.label}
        </button>
      ))}
    </div>
  );
};
