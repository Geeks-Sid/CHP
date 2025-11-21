import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Button } from '@/components/ui/button';
import { searchConcepts, Concept } from '@/lib/terminology-service';
import { useQuery } from '@tanstack/react-query';
import { Search, Check } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface DiagnosisSelectorProps {
  value?: number;
  onSelect: (concept: Concept | null) => void;
  error?: string;
}

export const DiagnosisSelector = ({ value, onSelect, error }: DiagnosisSelectorProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const [selectedConcept, setSelectedConcept] = useState<Concept | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Search concepts (ICD-10 only for diagnoses)
  const { data: searchResults, isLoading } = useQuery({
    queryKey: ['concepts', 'search', 'ICD10', searchQuery],
    queryFn: async () => {
      if (!searchQuery || searchQuery.length < 2) return { items: [], nextCursor: undefined };
      return searchConcepts({
        q: searchQuery,
        system: 'ICD10',
        limit: 20,
      });
    },
    enabled: isOpen && searchQuery.length >= 2,
  });

  // Load selected concept if value is provided
  useEffect(() => {
    if (value && !selectedConcept) {
      // Try to find in search results or fetch separately
      // For now, we'll just show the ID
    }
  }, [value, selectedConcept]);

  const handleSelect = (concept: Concept) => {
    setSelectedConcept(concept);
    onSelect(concept);
    setIsOpen(false);
    setSearchQuery('');
  };

  const handleClear = () => {
    setSelectedConcept(null);
    onSelect(null);
    setSearchQuery('');
  };

  const concepts = searchResults?.items || [];

  return (
    <div className="space-y-2">
      <Label htmlFor="diagnosis-selector">ICD-10 Diagnosis *</Label>
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            className={cn(
              "w-full justify-between",
              !selectedConcept && "text-muted-foreground",
              error && "border-red-500"
            )}
          >
            {selectedConcept
              ? `${selectedConcept.concept_code} - ${selectedConcept.concept_name}`
              : "Search for ICD-10 diagnosis..."}
            <Search className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[400px] p-0" align="start">
          <div className="p-2">
            <Input
              ref={inputRef}
              placeholder="Search by name or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="mb-2"
            />
          </div>
          <div className="max-h-[300px] overflow-auto">
            {isLoading && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Searching...
              </div>
            )}
            {!isLoading && searchQuery.length < 2 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                Type at least 2 characters to search
              </div>
            )}
            {!isLoading && searchQuery.length >= 2 && concepts.length === 0 && (
              <div className="p-4 text-center text-sm text-muted-foreground">
                No diagnoses found
              </div>
            )}
            {concepts.map((concept) => (
              <div
                key={concept.concept_id}
                className={cn(
                  "flex items-center justify-between px-4 py-2 cursor-pointer hover:bg-accent",
                  selectedConcept?.concept_id === concept.concept_id && "bg-accent"
                )}
                onClick={() => handleSelect(concept)}
              >
                <div className="flex-1">
                  <div className="font-medium">{concept.concept_code}</div>
                  <div className="text-sm text-muted-foreground">{concept.concept_name}</div>
                </div>
                {selectedConcept?.concept_id === concept.concept_id && (
                  <Check className="h-4 w-4 text-primary" />
                )}
              </div>
            ))}
          </div>
        </PopoverContent>
      </Popover>
      {selectedConcept && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={handleClear}
          className="h-6 text-xs"
        >
          Clear selection
        </Button>
      )}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
      {selectedConcept && (
        <input type="hidden" name="condition_concept_id" value={selectedConcept.concept_id} />
      )}
    </div>
  );
};

