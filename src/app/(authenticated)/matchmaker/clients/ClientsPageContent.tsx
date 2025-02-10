"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useNotifications } from "@/app/contexts/NotificationContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
} from "@/components/ui/command";
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
import { Label } from "@/components/ui/label";
import { Search, Filter, Users, Plus, Mail } from "lucide-react";
import AddCandidateWizard from "@/app/components/matchmaker/forms/AddCandidateWizard";
import type { Client, ClientStatus } from "@/app/types/matchmaker";
import ClientCard from "@/app/components/matchmaker/dashboard/ClientCard";
import AddCandidateForm from "@/app/components/matchmaker/forms/AddCandidateForm";
import NewSuggestionForm from "@/app/components/matchmaker/forms/NewSuggestionForm";
import {
  AvailabilityStatus,
  Gender,
  UserStatus,
  InvitationStatus,
} from "@prisma/client";
import type { ExtendedClient } from "@/app/types/matchmaker";
// עדכון הממשק ExtendedClient בתחילת הקובץ
import { useInterval } from "@/hooks/useInterval";

export default function ClientsPageContent() {
  const { data: session, status } = useSession();
  const { refreshNotifications } = useNotifications();
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

  const [filters, setFilters] = useState({
    gender: "all" as "all" | Gender,
    religiousLevel: "all",
    status: "all" as "all" | ClientStatus,
    hasInvitation: "all" as "all" | "sent" | "pending" | "accepted",
    ageRange: { min: 18, max: 99 },
    availability: "all" as "all" | AvailabilityStatus, // סינון לפי זמינות כללית
    immediateAvailability: "all" as
      | "all"
      | "available"
      | "unavailable"
      | "pending", // סינון לפי זמינות מיידית
  });

  const [showFilters, setShowFilters] = useState(false);
  useEffect(() => {
    if (session?.user) {
      loadClients();
    }
  }, [session]);

  // Helper function to calculate age
  const calculateAge = (birthDate: string) => {
    const today = new Date();
    const birth = new Date(birthDate);
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birth.getDate())
    ) {
      age--;
    }
    return age;
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

      await loadClients();
      await refreshNotifications();
    } catch (error) {
      setError(
        error instanceof Error ? error.message : "Failed to check availability"
      );
    }
  };
  const loadClients = async () => {
    try {
      setLoading(true);
      setError("");

      if (status === "loading" || !session) {
        return;
      }

      const response = await fetch("/api/matchmaker/clients");
      if (!response.ok) {
        throw new Error(await response.text());
      }
      const data = await response.json();

      const formattedClients = data.clients.map((client: any) => ({
        id: client.id,
        firstName: client.firstName,
        lastName: client.lastName,
        email: client.email,
        gender: client.gender,
        birthDate: client.birthDate,
        status: client.status,
        personalInfo: client.personalInfo || {},
        location: client.location || "",
        lastActive: client.lastActive || new Date().toISOString(),
        contactPreferences: client.contactPreferences || [],
        invitation: client.invitation,
        latestInquiry: client.latestInquiry || null, // הוספת השדה החדש
        profile: client.profile,
      }));

      setClients(formattedClients);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load clients");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadClients();
  }, [session, status]);

  const handleSendInvite = async () => {
    if (!clientToInvite || !inviteEmail) {
      console.error("Missing required data:", { clientToInvite, inviteEmail });
      return;
    }

    try {
      console.log("Sending invitation with data:", {
        clientId: clientToInvite.id,
        email: inviteEmail,
        firstName: clientToInvite.firstName,
        lastName: clientToInvite.lastName,
        // Add all required fields
        gender: clientToInvite.gender,
        birthDate: clientToInvite.birthDate,
        sendInvitation: true,
      });

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
          sendInvitation: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to send invitation");
      }

      const data = await response.json();
      console.log("Invitation sent successfully:", data);

      // Clear form and close dialog
      setShowSendInviteDialog(false);
      setClientToInvite(null);
      setInviteEmail("");

      // Optional: Refresh the clients list
      await loadClients();
      await refreshNotifications();
    } catch (error) {
      console.error("Error sending invitation:", error);
      setError(
        error instanceof Error ? error.message : "Failed to send invitation"
      );
    }
  };

  const handleCreateSuggestion = (client: ExtendedClient) => {
    setSelectedClient(client);
    setShowNewSuggestionDialog(true);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="m-4">
        <CardHeader>
          <CardTitle className="text-red-500">שגיאה</CardTitle>
        </CardHeader>
        <CardContent>
          <p>{error}</p>
          <Button className="mt-4" onClick={() => window.location.reload()}>
            נסה שוב
          </Button>
        </CardContent>
      </Card>
    );
  }

  const filteredClients = clients.filter((client) => {
    // Text search
    if (
      searchQuery &&
      !`${client.firstName} ${client.lastName} ${
        client.personalInfo?.occupation || ""
      } ${client.location}`.includes(searchQuery)
    )
      return false;
    // הוספת סינון לפי זמינות כללית
    if (
      filters.availability !== "all" &&
      client.profile?.availabilityStatus !== filters.availability
    ) {
      return false;
    }

    // הוספת סינון לפי זמינות מיידית
    if (filters.immediateAvailability !== "all") {
      const latestInquiry = client.latestInquiry;
      if (!latestInquiry) return filters.immediateAvailability === "pending";

      if (
        filters.immediateAvailability === "available" &&
        !latestInquiry.firstPartyResponse
      )
        return false;
      if (
        filters.immediateAvailability === "unavailable" &&
        latestInquiry.firstPartyResponse
      )
        return false;
    }

    return true;

    // Gender filter
    if (filters.gender !== "all" && client.gender !== filters.gender)
      return false;

    // Religious level filter
    if (
      filters.religiousLevel !== "all" &&
      client.personalInfo?.religiousLevel !== filters.religiousLevel
    )
      return false;

    // Status filter
    if (filters.status !== "all" && client.status !== filters.status)
      return false;

    // Invitation status filter
    if (filters.hasInvitation !== "all") {
      if (filters.hasInvitation === "sent" && !client.invitation) return false;
      if (
        filters.hasInvitation === "pending" &&
        client.invitation?.status !== "PENDING"
      )
        return false;
      if (
        filters.hasInvitation === "accepted" &&
        client.invitation?.status !== "ACCEPTED"
      )
        return false;
    }

    // Age filter
    const age = calculateAge(client.birthDate);
    if (age < filters.ageRange.min || age > filters.ageRange.max) return false;

    return true;
  });

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

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">{clients.length}</div>
              <div className="text-gray-500">סה"כ מועמדים</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {clients.filter((c) => c.status === "ACTIVE").length}
              </div>
              <div className="text-gray-500">מועמדים פעילים</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {
                  clients.filter((c) => c.invitation?.status === "PENDING")
                    .length
                }
              </div>
              <div className="text-gray-500">הזמנות ממתינות</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-6">
              <div className="text-2xl font-bold">
                {
                  clients.filter((c) => c.invitation?.status === "ACCEPTED")
                    .length
                }
              </div>
              <div className="text-gray-500">הזמנות שאושרו</div>
            </CardContent>
          </Card>
        </div>

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
          <CardContent>
            <div className="flex gap-4 mb-4">
              <div className="flex-1">
                <Command>
                  <CommandInput
                    placeholder="חיפוש מועמדים..."
                    value={searchQuery}
                    onValueChange={setSearchQuery}
                  />
                  <CommandEmpty>לא נמצאו תוצאות</CommandEmpty>
                  <CommandGroup>
                    {clients.map((client) => (
                      <CommandItem
                        key={client.id}
                        value={`${client.firstName} ${client.lastName}`}
                        onSelect={(value) => setSearchQuery(value)}
                      >
                        {client.firstName} {client.lastName}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </Command>
              </div>
            </div>

            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div>
                  <Select
                    value={filters.gender}
                    onValueChange={(value: typeof filters.gender) =>
                      setFilters((prev) => ({ ...prev, gender: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="מגדר" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="MALE">זכר</SelectItem>
                      <SelectItem value="FEMALE">נקבה</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filters.religiousLevel}
                    onValueChange={(value) =>
                      setFilters((prev) => ({ ...prev, religiousLevel: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="רמת דתיות" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="charedi">חרדי</SelectItem>
                      <SelectItem value="dati">דתי</SelectItem>
                      <SelectItem value="masorti">מסורתי</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filters.status}
                    onValueChange={(value: typeof filters.status) =>
                      setFilters((prev) => ({ ...prev, status: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="סטטוס" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="ACTIVE">פעיל</SelectItem>
                      <SelectItem value="PAUSED">מושהה</SelectItem>
                      <SelectItem value="INACTIVE">לא פעיל</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Select
                    value={filters.hasInvitation}
                    onValueChange={(value: typeof filters.hasInvitation) =>
                      setFilters((prev) => ({ ...prev, hasInvitation: value }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="סטטוס הזמנה" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">הכל</SelectItem>
                      <SelectItem value="sent">נשלחה הזמנה</SelectItem>
                      <SelectItem value="pending">ממתין לאישור</SelectItem>
                      <SelectItem value="accepted">אושר</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredClients.map((client: ExtendedClient) => (
          <ClientCard
            key={client.id}
            client={client}
            onSendInvite={() => {
              setClientToInvite(client);
              setShowSendInviteDialog(true);
            }}
            onSuggest={() => handleCreateSuggestion(client)}
            onCheckAvailability={handleCheckAvailability} // להוסיף שורה זו
          />
        ))}
      </div>

      {filteredClients.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Users className="mx-auto h-12 w-12 mb-4" />
          <h3 className="text-lg font-medium">לא נמצאו מועמדים</h3>
          <p>נסה לשנות את הסינון או לחפש משהו אחר</p>
        </div>
      )}

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
            <Label htmlFor="invite-email">כתובת אימייל</Label>
            <Input
              id="invite-email"
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
              <Mail className="ml-2 h-4 w-4" />
              שלח הזמנה
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Dialog for new suggestion */}
      <Dialog
        open={showNewSuggestionDialog}
        onOpenChange={setShowNewSuggestionDialog}
      >
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>הצעת שידוך חדשה</DialogTitle>
          </DialogHeader>
          <NewSuggestionForm
            isOpen={showNewSuggestionDialog}
            onClose={() => {
              setShowNewSuggestionDialog(false);
              setSelectedClient(null);
            }}
            selectedClient={selectedClient}
            onSubmit={async (data) => {
              try {
                // כאן נוסיף את הלוגיקה של שליחת ההצעה לשרת
                // למשל:
                // await createSuggestion(data);
                setShowNewSuggestionDialog(false);
                setSelectedClient(null);
              } catch (error) {
                console.error("Error creating suggestion:", error);
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
