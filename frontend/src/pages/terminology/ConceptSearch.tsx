
import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { searchConcepts, batchLookupConcepts, type Concept } from '@/lib/terminology-service';
import { useQuery } from '@tanstack/react-query';
import { Skeleton } from '@/components/ui/skeleton';

const ConceptSearch = () => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState('');
  const [system, setSystem] = useState('');
  const [batchConceptIds, setBatchConceptIds] = useState('');
  const [batchConceptCodes, setBatchConceptCodes] = useState('');

  // Search concepts
  const { data: searchResults, isLoading: searching } = useQuery({
    queryKey: ['concepts', 'search', searchQuery, system],
    queryFn: async () => {
      if (!searchQuery) return { items: [], nextCursor: undefined };
      return searchConcepts({
        q: searchQuery,
        system: system || undefined,
        limit: 50,
      });
    },
    enabled: !!searchQuery,
  });

  // Batch lookup
  const { data: batchResults, isLoading: batchLoading } = useQuery({
    queryKey: ['concepts', 'batch', batchConceptIds, batchConceptCodes],
    queryFn: async () => {
      const request: any = {};
      if (batchConceptIds) {
        request.concept_ids = batchConceptIds.split(',').map(id => parseInt(id.trim(), 10)).filter(id => !isNaN(id));
      }
      if (batchConceptCodes) {
        request.concept_codes = batchConceptCodes.split(',').map(code => code.trim()).filter(Boolean);
      }
      if (!request.concept_ids?.length && !request.concept_codes?.length) {
        return [];
      }
      return batchLookupConcepts(request);
    },
    enabled: !!(batchConceptIds || batchConceptCodes),
  });

  const concepts = searchResults?.items || batchResults || [];

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Terminology Concept Search</h1>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Search Tab */}
        <Card>
          <CardHeader>
            <CardTitle>Search Concepts</CardTitle>
            <CardDescription>Search for medical concepts by name or code</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="search-query">Search Query</Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g., diabetes, hypertension"
              />
            </div>
            <div>
              <Label htmlFor="system">Vocabulary System (Optional)</Label>
              <Select value={system} onValueChange={setSystem}>
                <SelectTrigger>
                  <SelectValue placeholder="All systems" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All Systems</SelectItem>
                  <SelectItem value="SNOMED">SNOMED</SelectItem>
                  <SelectItem value="ICD10">ICD10</SelectItem>
                  <SelectItem value="RXNORM">RxNorm</SelectItem>
                  <SelectItem value="LOINC">LOINC</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Batch Lookup Tab */}
        <Card>
          <CardHeader>
            <CardTitle>Batch Lookup</CardTitle>
            <CardDescription>Lookup multiple concepts by IDs or codes</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="concept-ids">Concept IDs (comma-separated)</Label>
              <Input
                id="concept-ids"
                value={batchConceptIds}
                onChange={(e) => setBatchConceptIds(e.target.value)}
                placeholder="e.g., 201820, 201821"
              />
            </div>
            <div>
              <Label htmlFor="concept-codes">Concept Codes (comma-separated)</Label>
              <Input
                id="concept-codes"
                value={batchConceptCodes}
                onChange={(e) => setBatchConceptCodes(e.target.value)}
                placeholder="e.g., 44054006, 73211009"
              />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Results */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Results</CardTitle>
          <CardDescription>
            {searching || batchLoading ? 'Loading...' : `${concepts.length} concept(s) found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {searching || batchLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : concepts.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Concept ID</TableHead>
                  <TableHead>Concept Name</TableHead>
                  <TableHead>Code</TableHead>
                  <TableHead>Vocabulary</TableHead>
                  <TableHead>Domain</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {concepts.map((concept) => (
                  <TableRow key={concept.concept_id}>
                    <TableCell className="font-medium">{concept.concept_id}</TableCell>
                    <TableCell>{concept.concept_name}</TableCell>
                    <TableCell>{concept.concept_code}</TableCell>
                    <TableCell>{concept.vocabulary_id}</TableCell>
                    <TableCell>{concept.domain_id || 'N/A'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground text-center py-8">
              {searchQuery || batchConceptIds || batchConceptCodes
                ? 'No concepts found'
                : 'Enter a search query or concept IDs/codes to begin'}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ConceptSearch;

