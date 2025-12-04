import StandardizedLoadingSpinner from '@/components/questionnaire/common/StandardizedLoadingSpinner';

export default function TestSpinnerPage() {
  return (
    // מציג את הספינר בתצורה המלאה שלו
    <StandardizedLoadingSpinner 
      text="טוען את המערכת..." 
      subtext="מכינים עבורך את ההתאמות הטובות ביותר" 
    />
  );
}