"use client";
import React, { useState} from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, Heart, Filter, Users } from "lucide-react";

// סימולציה של תוצאות חיפוש
const MOCK_MATCHES = [
  {
    id: "1",
    compatibility: 95,
    profile: {
      age: 25,
      religiousLevel: "דתי",
      location: "ירושלים",
      occupation: "מורה",
      education: "תואר ראשון",
      height: 170,
      maritalStatus: "רווק",
      about: "בן תורה, עובד בחינוך, מחפש בת זוג עם יראת שמיים ומידות טובות",
    },
  },
  {
    id: "2",
    compatibility: 88,
    profile: {
      age: 27,
      religiousLevel: "חרדי",
      location: "בני ברק",
      occupation: "אברך",
      education: "ישיבה גדולה",
      height: 180,
      maritalStatus: "רווק",
      about: "לומד בכולל, מחפש בת זוג למשפחה של תורה",
    },
  },
];

const MatchingSystem = () => {
  const [activeTab, setActiveTab] = useState("recommendations");
  const [filters, setFilters] = useState({
    ageRange: { min: 20, max: 35 },
    location: "",
    religiousLevel: "",
    height: { min: 150, max: 200 },
  });
  const [showFilters, setShowFilters] = useState(false);

  return (
    <div className="container mx-auto py-8 px-4">
      {/* כותרת וטאבים */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-8">
        <h1 className="text-3xl font-bold mb-4 md:mb-0">חיפוש והתאמות</h1>
        <div className="flex gap-4">
          <Button
            variant={activeTab === "recommendations" ? "default" : "outline"}
            onClick={() => setActiveTab("recommendations")}
          >
            <Heart className="ml-2 h-4 w-4" />
            התאמות מומלצות
          </Button>
          <Button
            variant={activeTab === "search" ? "default" : "outline"}
            onClick={() => setActiveTab("search")}
          >
            <Search className="ml-2 h-4 w-4" />
            חיפוש מתקדם
          </Button>
        </div>
      </div>

      {/* פילטרים */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-xl">סינון תוצאות</CardTitle>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="ml-2 h-4 w-4" />
            {showFilters ? "הסתר פילטרים" : "הצג פילטרים"}
          </Button>
        </CardHeader>
        {showFilters && (
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div>
                <Label>טווח גילאים</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="מ-"
                    value={filters.ageRange.min}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ageRange: {
                          ...filters.ageRange,
                          min: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="עד-"
                    value={filters.ageRange.max}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        ageRange: {
                          ...filters.ageRange,
                          max: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>

              <div>
                <Label>מיקום</Label>
                <Select
                  value={filters.location}
                  onValueChange={(value) =>
                    setFilters({ ...filters, location: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="בחר מיקום" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="jerusalem">ירושלים</SelectItem>
                    <SelectItem value="bnei-brak">בני ברק</SelectItem>
                    <SelectItem value="modiin-illit">מודיעין עילית</SelectItem>
                    <SelectItem value="beit-shemesh">בית שמש</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>רמת דתיות</Label>
                <Select
                  value={filters.religiousLevel}
                  onValueChange={(value) =>
                    setFilters({ ...filters, religiousLevel: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue placeholder="בחר רמת דתיות" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="charedi">חרדי</SelectItem>
                    <SelectItem value="dati">דתי</SelectItem>
                    <SelectItem value="chardal">חרד"ל</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>גובה (בס"מ)</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="number"
                    placeholder="מ-"
                    value={filters.height.min}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        height: {
                          ...filters.height,
                          min: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                  <Input
                    type="number"
                    placeholder="עד-"
                    value={filters.height.max}
                    onChange={(e) =>
                      setFilters({
                        ...filters,
                        height: {
                          ...filters.height,
                          max: parseInt(e.target.value),
                        },
                      })
                    }
                  />
                </div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* תוצאות */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_MATCHES.map((match) => (
          <Card key={match.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-center">
                <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
                  <Users className="w-8 h-8 text-blue-500" />
                </div>
                <div className="text-left">
                  <div className="text-2xl font-bold text-blue-600">
                    {match.compatibility}%
                  </div>
                  <div className="text-sm text-gray-500">התאמה</div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold">גיל:</span>{" "}
                    {match.profile.age}
                  </div>
                  <div>
                    <span className="font-semibold">מצב משפחתי:</span>{" "}
                    {match.profile.maritalStatus}
                  </div>
                  <div>
                    <span className="font-semibold">מיקום:</span>{" "}
                    {match.profile.location}
                  </div>
                  <div>
                    <span className="font-semibold">רמת דתיות:</span>{" "}
                    {match.profile.religiousLevel}
                  </div>
                  <div>
                    <span className="font-semibold">עיסוק:</span>{" "}
                    {match.profile.occupation}
                  </div>
                  <div>
                    <span className="font-semibold">השכלה:</span>{" "}
                    {match.profile.education}
                  </div>
                </div>

                <p className="text-gray-600 text-sm mt-4">
                  {match.profile.about}
                </p>

                <div className="flex gap-2 mt-4">
                  <Button className="flex-1">
                    <Heart className="ml-2 h-4 w-4" />
                    שמירה למועדפים
                  </Button>
                  <Button variant="outline" className="flex-1">
                    צפייה בפרופיל
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default MatchingSystem;
