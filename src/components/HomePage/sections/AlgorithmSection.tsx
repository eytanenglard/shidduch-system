import React from "react";
import { Cpu, UserCheck, Lock } from "lucide-react";

const AlgorithmSection: React.FC = () => {
  return (
    <section className="py-16 md:py-20 px-4 bg-gray-50 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-50 to-white opacity-70"></div>

      <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
        <div className="absolute left-0 top-1/3 w-40 h-40 bg-blue-200/20 rounded-full blur-3xl"></div>
        <div className="absolute right-0 bottom-1/4 w-60 h-60 bg-orange-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-6xl mx-auto relative">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <div>
            <div className="mb-8">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-blue-700">
                  הטכנולוגיה
                </span>{" "}
                שמאחורי ההתאמה המושלמת
              </h2>
              <div className="w-24 h-1 bg-gradient-to-r from-blue-600 to-blue-700 rounded-full mb-6"></div>
              <p className="text-lg text-gray-600 mb-8">
                במערכת Match Point אנו משלבים בינה מלאכותית מתקדמת עם ההבנה
                האנושית העמוקה של שדכנים מקצועיים
              </p>
            </div>

            <div className="space-y-6">
              <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="flex items-start">
                  <div className="p-3 rounded-full bg-gradient-to-br from-blue-50 to-blue-100 text-blue-600 mr-4">
                    <Cpu className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">
                      התאמה עם 27 ממדים
                    </h3>
                    <p className="text-gray-600">
                      האלגוריתם שלנו מנתח את הפרופילים ומייצר התאמות פוטנציאליות
                      על בסיס 27 ממדי התאמה שונים - הרבה מעבר למה שעין אנושית
                      יכולה לעבד
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="flex items-start">
                  <div className="p-3 rounded-full bg-gradient-to-br from-green-50 to-green-100 text-green-600 mr-4">
                    <UserCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">
                      שיפור מתמיד מהמשוב
                    </h3>
                    <p className="text-gray-600">
                      המערכת לומדת ומשתפרת באופן מתמיד מהמשוב של המשתמשים
                      והשדכנים, מה שמוביל להתאמות טובות יותר עם הזמן
                    </p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg p-5 shadow-md hover:shadow-lg transition-shadow duration-300 border border-gray-100">
                <div className="flex items-start">
                  <div className="p-3 rounded-full bg-gradient-to-br from-orange-50 to-orange-100 text-orange-600 mr-4">
                    <Lock className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2">
                      ארכיטקטורת פרטיות
                    </h3>
                    <p className="text-gray-600">
                      הצפנה מקצה לקצה ואבטחת מידע ברמה הגבוהה ביותר מבטיחים
                      שהפרטים האישיים שלך נשארים פרטיים לחלוטין
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="relative">
            <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-blue-700/5 rounded-2xl transform rotate-3"></div>
            <div className="relative bg-white p-8 rounded-2xl shadow-xl border border-blue-100">
              <div className="flex justify-between mb-6">
                <div className="flex space-x-2 rtl:space-x-reverse">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
                  <div className="w-3 h-3 rounded-full bg-green-500"></div>
                </div>
                <div className="text-xs text-gray-500">match-algorithm.js</div>
              </div>

              <div
                className="font-mono text-sm text-left overflow-hidden"
                dir="ltr"
              >
                <div className="mb-1">
                  <span className="text-purple-600">const</span>{" "}
                  <span className="text-blue-600">computeCompatibility</span>{" "}
                  <span className="text-gray-500">=</span>{" "}
                  <span className="text-purple-600">(</span>
                  <span className="text-orange-600">profile1</span>,{" "}
                  <span className="text-orange-600">profile2</span>
                  <span className="text-purple-600">)</span>{" "}
                  <span className="text-purple-600">{`=>`}</span>{" "}
                  <span className="text-purple-600">{"{"}</span>
                </div>
                <div className="mb-1 pl-4">
                  <span className="text-purple-600">let</span>{" "}
                  compatibilityScore <span className="text-gray-500">=</span>{" "}
                  <span className="text-blue-600">0</span>;
                </div>
                <div className="mb-1 pl-4 text-gray-500">
                  {"// Core values compatibility (weighted x3)"}
                </div>
                <div className="mb-1 pl-4">
                  compatibilityScore <span className="text-gray-500">+=</span>{" "}
                  <span className="text-blue-600">valueCompatibility</span>
                  <span className="text-purple-600">(</span>profile1, profile2
                  <span className="text-purple-600">)</span>{" "}
                  <span className="text-gray-500">*</span>{" "}
                  <span className="text-blue-600">3</span>;
                </div>
                <div className="mb-1 pl-4 text-gray-500">
                  {"// Lifestyle compatibility (weighted x2)"}
                </div>
                <div className="mb-1 pl-4">
                  compatibilityScore <span className="text-gray-500">+=</span>{" "}
                  <span className="text-blue-600">lifestyleCompatibility</span>
                  <span className="text-purple-600">(</span>profile1, profile2
                  <span className="text-purple-600">)</span>{" "}
                  <span className="text-gray-500">*</span>{" "}
                  <span className="text-blue-600">2</span>;
                </div>
                <div className="mb-1 pl-4 text-gray-500">
                  {"// Family background compatibility"}
                </div>
                <div className="mb-1 pl-4">
                  compatibilityScore <span className="text-gray-500">+=</span>{" "}
                  <span className="text-blue-600">familyCompatibility</span>
                  <span className="text-purple-600">(</span>profile1, profile2
                  <span className="text-purple-600">)</span>;
                </div>
                <div className="mb-1 pl-4 text-gray-500">
                  {"// Goals and aspirations alignment"}
                </div>
                <div className="mb-1 pl-4">
                  compatibilityScore <span className="text-gray-500">+=</span>{" "}
                  <span className="text-blue-600">goalsCompatibility</span>
                  <span className="text-purple-600">(</span>profile1, profile2
                  <span className="text-purple-600">)</span>{" "}
                  <span className="text-gray-500">*</span>{" "}
                  <span className="text-blue-600">1.5</span>;
                </div>
                <div className="mb-1 pl-4 text-gray-500">
                  {"// Additional dimensions..."}
                </div>
                <div className="mb-1 pl-4">
                  <span className="text-purple-600">return</span>{" "}
                  compatibilityScore <span className="text-gray-500">/</span>{" "}
                  <span className="text-blue-600">maxPossibleScore</span>;
                </div>
                <div>
                  <span className="text-purple-600">{"}"}</span>;
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AlgorithmSection;
