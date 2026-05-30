import { Star } from 'lucide-react';

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  mutedColor?: string;
  activeColor?: string;
  className?: string;
}

export function StarRating({
  rating,
  max = 5,
  size = 18,
  mutedColor = 'var(--q-muted)',
  activeColor = 'var(--q-star)',
  className = '',
}: StarRatingProps) {
  return (
    <div className={['flex items-center gap-0.5', className].join(' ')}>
      {Array.from({ length: max }).map((_, index) => (
        <Star
          key={index}
          size={size}
          fill={index < rating ? activeColor : mutedColor}
          stroke="none"
        />
      ))}
    </div>
  );
}
