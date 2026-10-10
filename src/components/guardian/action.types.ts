import type { Icon } from '@/components/bank/icons';

export interface ActionProps {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  large?: boolean;
  /** Compact size that hugs its label, for the nav and inline actions. */
  small?: boolean;
  /** Drawn before the label. */
  icon?: Icon;
  /** Shows the icon alone, for an action the icon states in full. The label stays as the accessible name and, on web, the tooltip. */
  iconOnly?: boolean;
  /** Frosted glass in place of the plain outline, for a secondary action that sits over the page art. */
  glass?: boolean;
}
