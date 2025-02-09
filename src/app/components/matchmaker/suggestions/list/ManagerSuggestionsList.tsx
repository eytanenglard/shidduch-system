import React, { useMemo, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Eye, MessageCircle, Clock, Users, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { he } from "date-fns/locale";
import type { Suggestion } from "@/types/suggestions";
import StatusBadge from "../../new/shared/StatusBadge";
import SuggestionDetailsDialog from "../details/SuggestionDetailsDialog";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ManagerSuggestionsListProps {
  suggestions: Suggestion[];
  filters: Record<string, any>;
  searchQuery: string;
  type: "active" | "pending" | "history";
  onSuggestionDeleted?: (id: string) => void;
}

const ManagerSuggestionsList: React.FC<ManagerSuggestionsListProps> = ({
  suggestions,
  filters,
  searchQuery,
  type,
  onSuggestionDeleted,
}) => {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [suggestionToDelete, setSuggestionToDelete] = useState<string | null>(null);

  const filteredSuggestions = useMemo(() => {
    return suggestions.filter((suggestion) => {
      // Base status filter
      if (
        type === "active" &&
        ["CLOSED", "CANCELLED", "EXPIRED"].includes(suggestion.status)
      ) {
        return false;
      }
      if (type === "pending" && !suggestion.status.includes("PENDING")) {
        return false;
      }
      if (
        type === "history" &&
        !["CLOSED", "CANCELLED", "EXPIRED"].includes(suggestion.status)
      ) {
        return false;
      }

      // Search query
      if (searchQuery && suggestion.firstParty && suggestion.secondParty) {
        const searchTerm = searchQuery.toLowerCase();
        const searchableText = `
          ${suggestion.firstParty.firstName} 
          ${suggestion.firstParty.lastName}
          ${suggestion.secondParty.firstName}
          ${suggestion.secondParty.lastName}
          ${suggestion.matchingReason || ""}
        `.toLowerCase();

        if (!searchableText.includes(searchTerm)) {
          return false;
        }
      }

      // Other filters
      if (filters.priority && suggestion.priority !== filters.priority) {
        return false;
      }

      if (filters.timeframe) {
        const createdAt = new Date(suggestion.createdAt);
        const now = new Date();
        const diff = now.getTime() - createdAt.getTime();
        const days = diff / (1000 * 60 * 60 * 24);

        switch (filters.timeframe) {
          case "today":
            if (days > 1) return false;
            break;
          case "week":
            if (days > 7) return false;
            break;
          case "month":
            if (days > 30) return false;
            break;
        }
      }

      return true;
    });
  }, [suggestions, filters, searchQuery, type]);

  const handleViewClick = (suggestion: Suggestion) => {
    if (!suggestion.firstParty?.profile || !suggestion.secondParty?.profile) {
      toast.error("חסרים פרטי פרופיל למועמדים");
      return;
    }
    setSelectedSuggestion(suggestion);
  };

  const handleDelete = (id: string) => {
    setSuggestionToDelete(id);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!suggestionToDelete) return;

    try {
      const response = await fetch(`/api/suggestions/${suggestionToDelete}/delete`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete suggestion');
      }

      toast.success('ההצעה נמחקה בהצלחה');
      if (onSuggestionDeleted) {
        onSuggestionDeleted(suggestionToDelete);
      }
    } catch (error) {
      console.error('Error deleting suggestion:', error);
      toast.error('שגיאה במחיקת ההצעה');
    } finally {
      setShowDeleteDialog(false);
      setSuggestionToDelete(null);
    }
  };

  const handleAction = (action: string) => {
    console.log(`Action ${action} for suggestion ${selectedSuggestion?.id}`);
    // Implement action handling logic here
  };

  if (filteredSuggestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <Users className="w-12 h-12 mb-4" />
        <p>לא נמצאו הצעות</p>
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="h-[600px] rounded-md border">
        <div className="p-4 space-y-4">
          {filteredSuggestions.map((suggestion) => {
            if (!suggestion.firstParty || !suggestion.secondParty) {
              return null;
            }

            return (
              <Card
                key={suggestion.id}
                className="p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex justify-between items-start">
                  {/* Parties Info */}
                  <div className="flex-1 text-right">
                    <div className="flex items-center justify-between mb-2">
                      <StatusBadge
                        type="suggestion"
                        status={suggestion.status}
                      />
                      <Badge variant="outline" className="bg-white">
                        <Clock className="w-3 h-3 ml-1" />
                        {formatDistanceToNow(new Date(suggestion.createdAt), {
                          addSuffix: true,
                          locale: he,
                        })}
                      </Badge>
                    </div>

                    <div className="flex justify-between items-start gap-8">
                      <div className="flex-1">
                        <h4 className="font-medium">צד ראשון</h4>
                        <p>
                          {suggestion.firstParty.firstName}{" "}
                          {suggestion.firstParty.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {suggestion.firstParty.profile?.city},{" "}
                          {suggestion.firstParty.profile?.birthDate &&
                            Math.floor(
                              (new Date().getTime() -
                                new Date(
                                  suggestion.firstParty.profile.birthDate
                                ).getTime()) /
                                (365.25 * 24 * 60 * 60 * 1000)
                            )}
                        </p>
                      </div>

                      <div className="flex-1">
                        <h4 className="font-medium">צד שני</h4>
                        <p>
                          {suggestion.secondParty.firstName}{" "}
                          {suggestion.secondParty.lastName}
                        </p>
                        <p className="text-sm text-gray-500">
                          {suggestion.secondParty.profile?.city},{" "}
                          {suggestion.secondParty.profile?.birthDate &&
                            Math.floor(
                              (new Date().getTime() -
                                new Date(
                                  suggestion.secondParty.profile.birthDate
                                ).getTime()) /
                                (365.25 * 24 * 60 * 60 * 1000)
                            )}
                        </p>
                      </div>
                    </div>

                    {suggestion.matchingReason && (
                      <p className="mt-2 text-sm text-gray-600 line-clamp-2">
                        {suggestion.matchingReason}
                      </p>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mr-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleViewClick(suggestion)}
                    >
                      <Eye className="w-4 h-4 ml-2" />
                      צפייה
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageCircle className="w-4 h-4 ml-2" />
                      תקשורת
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-red-600 hover:text-red-700"
                      onClick={() => handleDelete(suggestion.id)}
                    >
                      <Trash2 className="w-4 h-4 ml-2" />
                      מחיקה
                    </Button>
                  </div>
                </div>

                {/* Timeline */}
                {suggestion.statusHistory &&
                  suggestion.statusHistory.length > 0 && (
                    <div className="mt-4 pt-4 border-t">
                      <div className="flex gap-4 text-sm text-gray-500">
                        {suggestion.statusHistory
                          .slice(-3)
                          .map((history, index) => (
                            <div
                              key={index}
                              className="flex items-center gap-2"
                            >
                              <StatusBadge
                                type="suggestion"
                                status={history.status}
                                size="sm"
                              />
                              <span>
                                {formatDistanceToNow(
                                  new Date(history.createdAt),
                                  {
                                    addSuffix: true,
                                    locale: he,
                                  }
                                )}
                              </span>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </Card>
            );
          })}
        </div>
      </ScrollArea>

      <SuggestionDetailsDialog
        suggestion={selectedSuggestion}
        isOpen={!!selectedSuggestion}
        onClose={() => setSelectedSuggestion(null)}
        onAction={handleAction}
      />

      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>האם את/ה בטוח/ה?</AlertDialogTitle>
            <AlertDialogDescription>
              פעולה זו תמחק את ההצעה לצמיתות ולא ניתן יהיה לשחזר אותה.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>ביטול</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              מחיקה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default ManagerSuggestionsList;