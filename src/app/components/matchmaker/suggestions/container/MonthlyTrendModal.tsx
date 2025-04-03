import React, { useMemo } from "react";
import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Suggestion } from "@/types/suggestions";

interface MonthlyTrendModalProps {
  suggestions: Suggestion[];
}

interface MonthlyData {
  month: string;
  year: number;
  count: number;
  active: number;
  pending: number;
  success: number;
  declined: number;
}

const MonthlyTrendModal: React.FC<MonthlyTrendModalProps> = ({
  suggestions,
}) => {
  // Group suggestions by month to prepare data for chart
  const monthlyData = useMemo(() => {
    const data = suggestions.reduce((acc, s) => {
      const createdDate = new Date(s.createdAt);
      const month = createdDate.getMonth();
      const year = createdDate.getFullYear();
      const key = `${year}-${month + 1}`;

      if (!acc[key]) {
        acc[key] = {
          month: new Date(year, month).toLocaleString("he", {
            month: "short",
          }),
          year: year,
          count: 0,
          active: 0,
          pending: 0,
          success: 0,
          declined: 0,
        };
      }

      acc[key].count += 1;

      if (s.category === "ACTIVE") acc[key].active += 1;
      if (s.category === "PENDING") acc[key].pending += 1;
      if (["MARRIED", "ENGAGED"].includes(s.status)) acc[key].success += 1;
      if (
        s.status === "FIRST_PARTY_DECLINED" ||
        s.status === "SECOND_PARTY_DECLINED"
      ) {
        acc[key].declined += 1;
      }

      return acc;
    }, {} as Record<string, MonthlyData>);

    // Convert to array and sort by date
    return Object.values(data).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      const monthA = new Date(
        a.year,
        a.month === "ינו" ? 0 : new Date(`1 ${a.month} 2000`).getMonth()
      ).getMonth();
      const monthB = new Date(
        b.year,
        b.month === "ינו" ? 0 : new Date(`1 ${b.month} 2000`).getMonth()
      ).getMonth();
      return monthA - monthB;
    });
  }, [suggestions]);

  // Calculate trends
  const trends = useMemo(() => {
    if (monthlyData.length < 2)
      return { active: 0, pending: 0, success: 0, total: 0 };

    const current = monthlyData[monthlyData.length - 1];
    const previous = monthlyData[monthlyData.length - 2];

    const calculateTrend = (current: number, previous: number) => {
      if (previous === 0) return current > 0 ? 100 : 0;
      return Math.round(((current - previous) / previous) * 100);
    };

    return {
      active: calculateTrend(current.active, previous.active),
      pending: calculateTrend(current.pending, previous.pending),
      success: calculateTrend(current.success, previous.success),
      total: calculateTrend(current.count, previous.count),
    };
  }, [monthlyData]);

  if (monthlyData.length === 0) {
    return (
      <div className="p-6 text-center text-gray-500">
        <p>אין מספיק נתונים להצגת מגמה חודשית</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary stats */}
      <div className="grid grid-cols-4 gap-3">
        <Card className="p-3">
          <div className="text-sm text-gray-500"> סך כל ההצעות</div>
          <div className="text-xl font-semibold flex items-center mt-1">
            {monthlyData[monthlyData.length - 1].count}
            <span
              className={`text-xs ml-2 ${
                trends.total >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trends.total > 0 ? "+" : ""}
              {trends.total}%
            </span>
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-sm text-gray-500">הצעות פעילות</div>
          <div className="text-xl font-semibold flex items-center mt-1">
            {monthlyData[monthlyData.length - 1].active}
            <span
              className={`text-xs ml-2 ${
                trends.active >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trends.active > 0 ? "+" : ""}
              {trends.active}%
            </span>
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-sm text-gray-500">ממתינות לאישור</div>
          <div className="text-xl font-semibold flex items-center mt-1">
            {monthlyData[monthlyData.length - 1].pending}
            <span
              className={`text-xs ml-2 ${
                trends.pending >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trends.pending > 0 ? "+" : ""}
              {trends.pending}%
            </span>
          </div>
        </Card>

        <Card className="p-3">
          <div className="text-sm text-gray-500">הצעות מוצלחות</div>
          <div className="text-xl font-semibold flex items-center mt-1">
            {monthlyData[monthlyData.length - 1].success}
            <span
              className={`text-xs ml-2 ${
                trends.success >= 0 ? "text-green-600" : "text-red-600"
              }`}
            >
              {trends.success > 0 ? "+" : ""}
              {trends.success}%
            </span>
          </div>
        </Card>
      </div>

      {/* Main chart */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">מגמה חודשית</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={monthlyData}
              margin={{ top: 5, right: 5, left: 5, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip
                formatter={(value) => [`${value} הצעות`, ""]}
                labelFormatter={(label) => `חודש ${label}`}
              />
              <Legend />
              <Bar dataKey="active" name="פעילות" fill="#3B82F6" />
              <Bar dataKey="pending" name="ממתינות" fill="#F59E0B" />
              <Bar dataKey="success" name="הצלחות" fill="#10B981" />
              <Bar dataKey="declined" name="נדחו" fill="#EF4444" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>

      {/* Monthly breakdown table */}
      <Card className="p-4">
        <h3 className="text-lg font-medium mb-4">פירוט חודשי</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-50">
                <th className="p-2 border text-right">חודש</th>
                <th className="p-2 border text-center">סך הכל</th>
                <th className="p-2 border text-center">פעילות</th>
                <th className="p-2 border text-center">ממתינות</th>
                <th className="p-2 border text-center">הצלחות</th>
                <th className="p-2 border text-center">נדחו</th>
              </tr>
            </thead>
            <tbody>
              {monthlyData
                .slice()
                .reverse()
                .map((month, idx) => (
                  <tr
                    key={idx}
                    className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="p-2 border font-medium">
                      {month.month} {month.year}
                    </td>
                    <td className="p-2 border text-center">{month.count}</td>
                    <td className="p-2 border text-center">{month.active}</td>
                    <td className="p-2 border text-center">{month.pending}</td>
                    <td className="p-2 border text-center">{month.success}</td>
                    <td className="p-2 border text-center">{month.declined}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default MonthlyTrendModal;
