'use client';

import { useState, useCallback } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { BuilderFilters, INTERESTS, SKILL_OPTIONS, ExperienceLevel, EXPERIENCE_LEVELS } from '@/types';
import { Search, X, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface BuilderFiltersProps {
  filters: BuilderFilters;
  onFiltersChange: (filters: BuilderFilters) => void;
  onClearFilters: () => void;
}

export function BuilderFilters({ filters, onFiltersChange, onClearFilters }: BuilderFiltersProps) {
  const [isOpen, setIsOpen] = useState(false);
  
  const updateFilters = useCallback((updates: Partial<BuilderFilters>) => {
    onFiltersChange({ ...filters, ...updates });
  }, [filters, onFiltersChange]);

  const handleSearchChange = (value: string) => {
    updateFilters({ search: value || undefined });
  };

  const handleInterestToggle = (interestId: string) => {
    const currentInterests = filters.interests || [];
    const newInterests = currentInterests.includes(interestId)
      ? currentInterests.filter((id) => id !== interestId)
      : [...currentInterests, interestId];
    
    updateFilters({ 
      interests: newInterests.length > 0 ? newInterests : undefined 
    });
  };

  const handleSkillToggle = (skill: string) => {
    const currentSkills = filters.skills || [];
    const newSkills = currentSkills.includes(skill)
      ? currentSkills.filter((s) => s !== skill)
      : [...currentSkills, skill];
    
    updateFilters({ 
      skills: newSkills.length > 0 ? newSkills : undefined 
    });
  };

  const handleExperienceLevelToggle = (level: ExperienceLevel) => {
    const currentLevels = filters.experience_level || [];
    const newLevels = currentLevels.includes(level)
      ? currentLevels.filter((l) => l !== level)
      : [...currentLevels, level];
    
    updateFilters({ 
      experience_level: newLevels.length > 0 ? newLevels : undefined 
    });
  };

  const handleReputationMinChange = (value: string) => {
    const min = value === 'all' ? undefined : parseInt(value);
    updateFilters({ reputation_min: min });
  };

  const handleExperienceLevelChange = (value: string) => {
    const level = value === 'all' ? undefined : [value as ExperienceLevel];
    updateFilters({ experience_level: level });
  };

  const activeFilterCount = [
    filters.search,
    filters.interests?.length,
    filters.skills?.length,
    filters.experience_level?.length,
    filters.reputation_min || filters.reputation_max,
    filters.looking_for_collaborators,
    filters.has_projects
  ].filter(Boolean).length;

  const hasActiveFilters = activeFilterCount > 0;

  return (
    <Card className="border border-border/50">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Find Builders</CardTitle>
          <div className="flex items-center gap-2">
            {hasActiveFilters && (
              <Badge variant="secondary" className="text-xs">
                {activeFilterCount} filter{activeFilterCount !== 1 ? 's' : ''}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2"
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search builders by name..."
            value={filters.search || ''}
            onChange={(e) => handleSearchChange(e.target.value)}
            className="pl-10 pr-10"
          />
          {filters.search && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleSearchChange('')}
              className="absolute right-1 top-1/2 transform -translate-y-1/2 p-1 h-8 w-8"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="space-y-6 border-t border-border/50 pt-4">
            {/* Quick Filters */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Quick Filters</Label>
              <div className="flex flex-wrap gap-2">
                <Badge
                  variant={filters.looking_for_collaborators ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => updateFilters({ 
                    looking_for_collaborators: !filters.looking_for_collaborators || undefined 
                  })}
                >
                  Looking for collaborators
                </Badge>
                
                <Badge
                  variant={filters.has_projects ? "default" : "outline"}
                  className="cursor-pointer hover:bg-primary/80 transition-colors"
                  onClick={() => updateFilters({ 
                    has_projects: !filters.has_projects || undefined 
                  })}
                >
                  Has published projects
                </Badge>
              </div>
            </div>

            {/* Experience Level */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Experience Level</Label>
              <Select
                value={filters.experience_level?.[0] || 'all'}
                onValueChange={handleExperienceLevelChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any experience level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any experience level</SelectItem>
                  {EXPERIENCE_LEVELS.map((level) => (
                    <SelectItem key={level.id} value={level.id}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Reputation */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Minimum Reputation</Label>
              <Select
                value={filters.reputation_min?.toString() || 'all'}
                onValueChange={handleReputationMinChange}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Any reputation" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Any reputation</SelectItem>
                  <SelectItem value="0">Newcomer (0+)</SelectItem>
                  <SelectItem value="100">Contributor (100+)</SelectItem>
                  <SelectItem value="500">Veteran (500+)</SelectItem>
                  <SelectItem value="1000">Expert (1000+)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Interests */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Interests</Label>
              <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                {INTERESTS.map((interest) => (
                  <Badge
                    key={interest.id}
                    variant={(filters.interests || []).includes(interest.id) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => handleInterestToggle(interest.id)}
                  >
                    {interest.label}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Skills */}
            <div className="space-y-3">
              <Label className="text-sm font-medium">Skills</Label>
              <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                {SKILL_OPTIONS.map((skill) => (
                  <Badge
                    key={skill}
                    variant={(filters.skills || []).includes(skill) ? "default" : "outline"}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => handleSkillToggle(skill)}
                  >
                    {skill}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Clear Filters */}
            {hasActiveFilters && (
              <div className="pt-4 border-t border-border/50">
                <Button
                  variant="outline"
                  onClick={onClearFilters}
                  className="w-full"
                >
                  <X className="h-4 w-4 mr-2" />
                  Clear All Filters
                </Button>
              </div>
            )}
        </CardContent>
      )}
    </Card>
  );
}