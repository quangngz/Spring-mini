import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search } from 'lucide-react';

export type PrivacyFilter = 'all' | 'private' | 'public';

interface CourseSearchBarProps {
  searchQuery: string;
  onSearchQueryChange: (query: string) => void;
  privacyFilter: PrivacyFilter;
  onPrivacyFilterChange: (filter: PrivacyFilter) => void;
  onSearch: () => void;
}

const CourseSearchBar = ({
  searchQuery,
  onSearchQueryChange,
  privacyFilter,
  onPrivacyFilterChange,
  onSearch,
}: CourseSearchBarProps) => {
  return (
    <div className="flex gap-2 mb-8 max-w-md items-center">
      <div className="relative flex-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Tìm kiếm khóa học..."
          value={searchQuery}
          onChange={(e) => onSearchQueryChange(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && onSearch()}
          className="pl-10"
        />
      </div>
      <div className="min-w-[180px]">
        <Label className="sr-only" htmlFor="privacyFilter">Bộ lọc quyền riêng tư</Label>
        <Select value={privacyFilter} onValueChange={(val) => onPrivacyFilterChange(val as PrivacyFilter)}>
          <SelectTrigger id="privacyFilter" aria-label="Bộ lọc quyền riêng tư">
            <SelectValue placeholder="Tất cả" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tất cả</SelectItem>
            <SelectItem value="private">Riêng tư</SelectItem>
            <SelectItem value="public">Công khai</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <Button variant="secondary" onClick={onSearch}>
        Tìm kiếm
      </Button>
    </div>
  );
};

export default CourseSearchBar;
