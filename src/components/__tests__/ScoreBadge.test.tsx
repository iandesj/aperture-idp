import { render, screen } from '@testing-library/react';
import { ScoreBadge } from '../ScoreBadge';
import { ComponentScore } from '@/lib/scoring';

describe('ScoreBadge', () => {
  const createScore = (total: number, tier: ComponentScore['tier']): ComponentScore => ({
    total,
    tier,
    breakdown: {
      metadata: 0,
      architecture: 0,
      lifecycle: 0,
    },
    details: {
      hasDescription: false,
      hasThreePlusTags: false,
      hasDocumentationLink: false,
      hasOwner: false,
      isPartOfSystem: false,
      hasDependencies: false,
      lifecycle: 'deprecated',
    },
  });

  it('should render score with correct value', () => {
    const score = createScore(85, 'gold');
    render(<ScoreBadge score={score} />);
    
    expect(screen.getByText('85')).toBeInTheDocument();
  });

  it('should apply correct colors for gold tier', () => {
    const score = createScore(90, 'gold');
    const { container } = render(<ScoreBadge score={score} />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('bg-yellow');
    expect(badge?.className).toContain('text-yellow');
  });

  it('should apply correct colors for silver tier', () => {
    const score = createScore(70, 'silver');
    const { container } = render(<ScoreBadge score={score} />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('bg-gray');
    expect(badge?.className).toContain('text-gray');
  });

  it('should apply correct colors for bronze tier', () => {
    const score = createScore(50, 'bronze');
    const { container } = render(<ScoreBadge score={score} />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('bg-orange');
    expect(badge?.className).toContain('text-orange');
  });

  it('should apply correct colors for needs-improvement tier', () => {
    const score = createScore(30, 'needs-improvement');
    const { container } = render(<ScoreBadge score={score} />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('bg-red');
    expect(badge?.className).toContain('text-red');
  });

  it('should render small size by default', () => {
    const score = createScore(75, 'silver');
    const { container } = render(<ScoreBadge score={score} />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-sm');
  });

  it('should render with small size when specified', () => {
    const score = createScore(75, 'silver');
    const { container } = render(<ScoreBadge score={score} size="sm" />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-xs');
  });

  it('should render with large size when specified', () => {
    const score = createScore(75, 'silver');
    const { container } = render(<ScoreBadge score={score} size="lg" />);
    
    const badge = container.querySelector('div');
    expect(badge?.className).toContain('text-base');
  });

  it('should not show label by default', () => {
    const score = createScore(85, 'gold');
    render(<ScoreBadge score={score} />);
    
    expect(screen.queryByText('Gold')).not.toBeInTheDocument();
  });

  it('should show label when showLabel is true', () => {
    const score = createScore(85, 'gold');
    render(<ScoreBadge score={score} showLabel />);
    
    expect(screen.getByText('Gold')).toBeInTheDocument();
  });

  it('should render icon', () => {
    const score = createScore(75, 'silver');
    const { container } = render(<ScoreBadge score={score} />);
    
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
  });

  it('should have appropriate title attribute for accessibility', () => {
    const score = createScore(85, 'gold');
    const { container } = render(<ScoreBadge score={score} />);
    
    const badge = container.querySelector('div');
    expect(badge?.getAttribute('title')).toBe('Score: 85/100 - Gold');
  });

  it('should render all tier labels correctly when shown', () => {
    const tiers: Array<{ score: number; tier: ComponentScore['tier']; label: string }> = [
      { score: 90, tier: 'gold', label: 'Gold' },
      { score: 70, tier: 'silver', label: 'Silver' },
      { score: 50, tier: 'bronze', label: 'Bronze' },
      { score: 30, tier: 'needs-improvement', label: 'Needs Improvement' },
    ];

    tiers.forEach(({ score: scoreValue, tier, label }) => {
      const score = createScore(scoreValue, tier);
      const { unmount } = render(<ScoreBadge score={score} showLabel />);
      
      expect(screen.getByText(label)).toBeInTheDocument();
      unmount();
    });
  });
});

