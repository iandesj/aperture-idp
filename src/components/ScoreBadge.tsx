import { ComponentScore, getScoreTierLabel, getScoreTierColor } from "@/lib/scoring";
import { Award } from "lucide-react";

interface ScoreBadgeProps {
  score: ComponentScore;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ScoreBadge({ score, size = 'md', showLabel = false }: ScoreBadgeProps) {
  const colors = getScoreTierColor(score.tier);
  const label = getScoreTierLabel(score.tier);
  
  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5',
    md: 'text-sm px-2.5 py-1',
    lg: 'text-base px-3 py-1.5',
  };
  
  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };
  
  return (
    <div
      className={`inline-flex items-center gap-1.5 rounded font-medium border ${colors.bg} ${colors.text} ${colors.border} ${sizeClasses[size]}`}
      title={`Score: ${score.total}/100 - ${label}`}
    >
      <Award className={iconSizes[size]} />
      <span className="font-semibold">{score.total}</span>
      {showLabel && <span className="text-xs opacity-80">{label}</span>}
    </div>
  );
}

