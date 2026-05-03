import './Skeleton.css';

interface SkeletonProps {
  variant?: 'text' | 'title' | 'button' | 'card' | 'stat';
  width?: string;
  height?: string;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton = ({ variant = 'text', width, height, className = '', style }: SkeletonProps) => {
  const getVariantClass = () => {
    switch (variant) {
      case 'title': return 'skeleton-title';
      case 'button': return 'skeleton-button';
      case 'card': return 'skeleton-card';
      case 'stat': return 'skeleton-stat-card';
      default: return 'skeleton-text';
    }
  };

  return (
    <div 
      className={`skeleton ${getVariantClass()} ${className}`}
      style={{ width, height, ...style }}
    />
  );
};

export const SkeletonCard = () => (
  <div className="skeleton-card">
    <Skeleton variant="title" />
    <Skeleton variant="text" />
    <Skeleton variant="text" width="70%" />
    <Skeleton variant="text" width="40%" />
  </div>
);

export const SkeletonStatCard = () => (
  <div className="skeleton-stat-card">
    <Skeleton variant="text" width="60%" height="32px" />
    <Skeleton variant="text" width="40%" height="16px" style={{ marginTop: '12px' }} />
  </div>
);

export const SkeletonGrid = ({ count = 4 }: { count?: number }) => (
  <div className="skeleton-grid">
    {Array.from({ length: count }).map((_, i) => (
      <SkeletonStatCard key={i} />
    ))}
  </div>
);

export default Skeleton;
