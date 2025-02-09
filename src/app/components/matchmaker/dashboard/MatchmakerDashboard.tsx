"use client";

import React, { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import ClientCard from "./ClientCard";
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
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Users, Plus, Filter, Mail as MailIcon, Search } from "lucide-react";
import AddCandidateWizard from "../forms/AddCandidateWizard";
import NewSuggestionForm from "../forms/NewSuggestionForm";
import type { Client, ExtendedClient } from "@/app/types/matchmaker";
import type { Session } from "@/types/next-auth";
import { AvailabilityStatus, UserStatus } from "@prisma/client";
import type { CreateSuggestionData } from "@/app/types/suggestions";
import { AvailabilityService } from "@/lib/services/availabilityService";

interface DashboardStats {
  available: number;
  unavailable: number;
  dating: number;
  pending: number;
}

export function MatchmakerDashboard() {
  const { data: session } = useSession() as { data: Session | null };
  const [clients, setClients] = useState<ExtendedClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showAddCandidateDialog, setShowAddCandidateDialog] = useState(false);
  const [showNewSuggestionDialog, setShowNewSuggestionDialog] = useState(false);
  const [selectedClient, setSelectedClient] = useState<ExtendedClient | null>(
    null
  );
  const [showSendInviteDialog, setShowSendInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [clientToInvite, setClientToInvite] = useState<ExtendedClient | null>(
    null
  );
  const [availabilityStats, setAvailabilityStats] = useState<DashboardStats>({
    available: 0,
    unavailable: 0,
    dating: 0,
    pending: 0,
  });
  const [filters, setFilters] = useState({
    status: "all" as UserStatus | "all",
    availabilityStatus: "all" as AvailabilityStatus | "all",
  });
  const [showFilters, setShowFilters] = useState(false);

  const loadClients = async () => {
    if (!session?.user?.id) return;

    try {
      setLoading(true);
      const response = await fetch("/api/matchmaker/clients");
      if (!response.ok) {
        throw new Error("Failed to fetch clients");
      }
      const data = await response.json();
      setClients(data.clients);

      // Load availability stats
      const stats = await AvailabilityService.getAvailabilityStats(
        session.user.id
      );
      setAvailabilityStats(stats);
    } catch (err) {
      console.error("Error loading clients:", err);
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [session]);

  const handleSendInvite = async () => {
    if (!clientToInvite || !inviteEmail) return;

    try {
      const response = await fetch("/api/matchmaker/candidates/invite", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          clientId: clientToInvite.id,
          email: inviteEmail,
          firstName: clientToInvite.firstName,
          lastName: clientToInvite.lastName,
          gender: clientToInvite.gender,
          birthDate: clientToInvite.birthDate,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to send invitation");
      }

      setShowSendInviteDialog(false);
      setClientToInvite(null);
      setInviteEmail("");
      await loadClients();
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError("Failed to send invitation");
    }
  };

  const handleCheckAvailability = async (client: ExtendedClient) => {
    try {
      const response = await fetch("/api/availability/check", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ clientId: client.id }),
      });

      if (!response.ok) {
        throw new Error("Failed to check availability");
      }

      // Refresh data after successful check
      await loadClients();
    } catch (error) {
      console.error("Error checking availability:", error);
      throw error;
    }
  };
  const handleCreateSuggestion = async (data: CreateSuggestionData) => {
    try {
      const response = await fetch("/api/matchmaker/suggestions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          ...data,
          matchmakerId: session?.user?.id,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create suggestion");
      }

      setShowNewSuggestionDialog(false);
      setSelectedClient(null);
      await loadClients();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to create suggestion"
      );
    }
  };

  const getFilteredClients = () => {
    return clients.filter((client) => {
      // Status filter
      if (filters.status !== "all" && client.status !== filters.status) {
        return false;
      }

      // Availability filter
      if (
        filters.availabilityStatus !== "all" &&
        client.profile?.availabilityStatus !== filters.availabilityStatus
      ) {
        return false;
      }

      // Search query
      if (searchQuery) {
        const searchString = `${client.firstName} ${client.lastName} ${
          client.profile?.city || ""
        }`.toLowerCase();
        if (!searchString.includes(searchQuery.toLowerCase())) {
          return false;
        }
      }

      return true;
    });
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">ניהול מועמדים</h1>
          <Button
            className="bg-green-600 hover:bg-green-700"
            onClick={() => setShowAddCandidateDialog(true)}
          >
            <Plus className="ml-2 h-4 w-4" />
            הוספת מועמד
          </Button>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {availabilityStats.available}
              </div>
              <div className="text-gray-500">זמינים להצעות</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {availabilityStats.dating}
              </div>
              <div className="text-gray-500">בתהליך היכרות</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {availabilityStats.unavailable}
              </div>
              <div className="text-gray-500">לא זמינים</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {availabilityStats.pending}
              </div>
              <div className="text-gray-500">בדיקות זמינות</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>סינון מועמדים</CardTitle>
            <Button
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
            >
              <Filter className="ml-2 h-4 w-4" />
              {showFilters ? "הסתר סינון" : "הצג סינון"}
            </Button>
          </CardHeader>
          {showFilters && (
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Input
                    placeholder="חיפוש..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full"
                  />
                </div>
                <div>
                  <Select
                    value={filters.status}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        status: value as UserStatus | "all",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="ACTIVE">פעיל</SelectItem>
                      <SelectItem value="INACTIVE">לא פעיל</SelectItem>
                      <SelectItem value="PENDING">ממתין</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Select
                    value={filters.availabilityStatus}
                    onValueChange={(value) =>
                      setFilters((prev) => ({
                        ...prev,
                        availabilityStatus: value as AvailabilityStatus | "all",
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="זמינות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="AVAILABLE">זמין</SelectItem>
                      <SelectItem value="UNAVAILABLE">לא זמין</SelectItem>
                      <SelectItem value="DATING">בתהליך היכרות</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>

      {/* Clients Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {getFilteredClients().map((client) => (
          <ClientCard
            key={client.id}
            client={client}
            onSendInvite={() => {
              setClientToInvite(client);
              setShowSendInviteDialog(true);
            }}
            onSuggest={() => {
              setSelectedClient(client);
              setShowNewSuggestionDialog(true);
            }}
            onCheckAvailability={() => handleCheckAvailability(client)}
          />
        ))}
      </div>

      {/* Empty State */}
      {getFilteredClients().length === 0 && (
        <div className="text-center py-12">
          <Users className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium">אין מועמדים</h3>
          <p className="mt-1 text-sm text-gray-500">
            לא נמצאו מועמדים התואמים את החיפוש
          </p>
        </div>
      )}

      {/* Dialogs */}
      {showAddCandidateDialog && (
        <AddCandidateWizard
          isOpen={showAddCandidateDialog}
          onClose={() => setShowAddCandidateDialog(false)}
          onSuccess={() => {
            setShowAddCandidateDialog(false);
            loadClients();
          }}
        />
      )}

      <AlertDialog
        open={showSendInviteDialog}
        onOpenChange={setShowSendInviteDialog}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>שליחת הזמנה למועמד</AlertDialogTitle>
            <AlertDialogDescription>
              {clientToInvite && (
                <span>
                  שליחת הזמנה ל: {clientToInvite.firstName}{" "}
                  {clientToInvite.lastName}
                </span>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4">
            <Input
              type="email"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
              placeholder="הזן כתובת אימייל"
              className="mt-2"
            />
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowSendInviteDialog(false);
                setClientToInvite(null);
                setInviteEmail("");
              }}
            >
              ביטול
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleSendInvite}>
              <MailIcon className="ml-2 h-4 w-4" />
              שלח הזמנה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <NewSuggestionForm
        isOpen={showNewSuggestionDialog}
        onClose={() => {
          setShowNewSuggestionDialog(false);
          setSelectedClient(null);
        }}
        selectedClient={selectedClient}
        onSubmit={handleCreateSuggestion}
      />

      {/* Error Alert */}
      {error && (
        <AlertDialog open={!!error} onOpenChange={() => setError("")}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>שגיאה</AlertDialogTitle>
              <AlertDialogDescription>{error}</AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogAction onClick={() => setError("")}>
                הבנתי
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      )}
    </div>
  );
}

export default MatchmakerDashboard;
