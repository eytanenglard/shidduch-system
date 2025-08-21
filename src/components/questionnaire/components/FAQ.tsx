import React, { useState, useMemo } from 'react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import {
  Search,
  HelpCircle,
  ArrowRight,
  Info,
  Clock,
  Star,
  AlertCircle,
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import type { FaqDict, FaqAnswerPart } from '@/types/dictionary'; // Import dictionary type

interface FAQProps {
  className?: string;
  showSearch?: boolean;
  showCategories?: boolean;
  initialOpenId?: string;
  dict: FaqDict; // Use the specific dictionary type
}

// Metadata for FAQs (category, popularity) which is not part of translation
const faqMetadata: {
  [key: string]: { category: string; isPopular?: boolean };
} = {
  'save-progress': { category: 'technical', isPopular: true },
  'time-to-complete': { category: 'process', isPopular: true },
  'required-questions': { category: 'process' },
  'how-matching-works': { category: 'process', isPopular: true },
  'privacy-info': { category: 'privacy' },
  'edit-answers': { category: 'technical' },
  'match-percentage': { category: 'results' },
  'incomplete-questionnaire': { category: 'process' },
  'inactive-account': { category: 'general' },
};

// Helper function to render the answer JSX from dictionary data
const renderAnswer = (answerParts: FaqAnswerPart[]) => (
  <div className="space-y-3">
    {answerParts.map((part, index) => {
      switch (part.type) {
        case 'p':
          return <p key={index}>{part.content}</p>;
        case 'list':
          return (
            <ol key={index} className="list-decimal mr-5 space-y-1">
              {(part.content as string[]).map((item, i) => (
                <li key={i}>{item}</li>
              ))}
            </ol>
          );
        case 'tip':
          return (
            <div
              key={index}
              className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-md"
            >
              <Clock className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p className="font-medium mb-1">{part.title}</p>
                <p>{part.content}</p>
              </div>
            </div>
          );
        case 'info':
          return (
            <div
              key={index}
              className="flex items-start gap-2 mt-2 p-3 bg-blue-50 rounded-md"
            >
              <Info className="h-5 w-5 text-blue-500 mt-0.5" />
              <div className="text-sm text-blue-700">
                <p>{part.content}</p>
              </div>
            </div>
          );
        case 'star':
          return (
            <div
              key={index}
              className="flex items-start gap-2 mt-2 p-3 bg-amber-50 rounded-md border border-amber-100"
            >
              <Star className="h-5 w-5 text-amber-500 mt-0.5" />
              <div className="text-sm text-amber-700">
                <p>{part.content}</p>
              </div>
            </div>
          );
        case 'alert':
          return (
            <div
              key={index}
              className="flex items-start gap-2 mt-2 p-3 bg-red-50 rounded-md border border-red-100"
            >
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
              <div className="text-sm text-red-700">
                <p>{part.content}</p>
              </div>
            </div>
          );
        default:
          return null;
      }
    })}
  </div>
);

export default function FAQ({
  className,
  showSearch = true,
  showCategories = true,
  initialOpenId,
  dict,
}: FAQProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [expandedItems, setExpandedItems] = useState<string[]>(
    initialOpenId ? [initialOpenId] : []
  );

  const faqItems = useMemo(() => {
    return Object.keys(dict.items).map((id) => {
      const key = id as keyof typeof dict.items;
      return {
        id,
        question: dict.items[key].question,
        answer: renderAnswer(dict.items[key].answer),
        category: faqMetadata[key].category,
        isPopular: faqMetadata[key].isPopular || false,
      };
    });
  }, [dict.items]);

  const categories = useMemo(
    () => [
      {
        id: 'process',
        label: dict.categories.process,
        icon: <ArrowRight className="h-4 w-4" />,
      },
      {
        id: 'technical',
        label: dict.categories.technical,
        icon: <HelpCircle className="h-4 w-4" />,
      },
      {
        id: 'privacy',
        label: dict.categories.privacy,
        icon: <Info className="h-4 w-4" />,
      },
      {
        id: 'results',
        label: dict.categories.results,
        icon: <Star className="h-4 w-4" />,
      },
      {
        id: 'general',
        label: dict.categories.general,
        icon: <Info className="h-4 w-4" />,
      },
    ],
    [dict.categories]
  );

  const filteredItems = useMemo(() => {
    return faqItems.filter((item) => {
      const matchesSearch =
        !searchQuery ||
        item.question.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCategory =
        !activeCategory || item.category === activeCategory;

      return matchesSearch && matchesCategory;
    });
  }, [faqItems, searchQuery, activeCategory]);

  return (
    <Card className={cn('shadow-sm', className)}>
      <CardHeader className="pb-3">
        <CardTitle className="text-lg md:text-xl">{dict.title}</CardTitle>
        <p className="text-gray-500 text-sm">{dict.subtitle}</p>

        {showSearch && (
          <div className="relative mt-2">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder={dict.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-gray-50"
            />
          </div>
        )}

        {showCategories && (
          <div className="flex flex-wrap gap-2 mt-3">
            <Badge
              variant={activeCategory === null ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => setActiveCategory(null)}
            >
              {dict.categories.all}
            </Badge>

            {categories.map((category) => (
              <Badge
                key={category.id}
                variant={activeCategory === category.id ? 'default' : 'outline'}
                className="cursor-pointer flex items-center gap-1"
                onClick={() =>
                  setActiveCategory(
                    activeCategory === category.id ? null : category.id
                  )
                }
              >
                {category.icon}
                {category.label}
              </Badge>
            ))}
          </div>
        )}
      </CardHeader>

      <CardContent>
        {filteredItems.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="h-12 w-12 mx-auto text-gray-300 mb-2" />
            <p className="text-gray-500">{dict.emptyState}</p>
          </div>
        ) : (
          <Accordion
            type="multiple"
            value={expandedItems}
            onValueChange={setExpandedItems}
            className="space-y-2"
          >
            {filteredItems.map((item) => (
              <AccordionItem
                key={item.id}
                value={item.id}
                className={cn(
                  'border rounded-lg px-4 py-1',
                  expandedItems.includes(item.id)
                    ? 'bg-blue-50 border-blue-200'
                    : 'bg-white border-gray-200 hover:border-blue-200'
                )}
              >
                <AccordionTrigger className="hover:no-underline py-3">
                  <div className="flex items-center gap-2 text-right">
                    <span className="font-medium">{item.question}</span>
                    {item.isPopular && (
                      <Badge
                        variant="outline"
                        className="bg-amber-50 text-amber-700 border-amber-200 text-xs"
                      >
                        {dict.popularBadge}
                      </Badge>
                    )}
                  </div>
                </AccordionTrigger>
                <AccordionContent className="text-gray-700 pt-1 pb-4">
                  {item.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        )}
      </CardContent>
    </Card>
  );
}
