export interface ActionProps {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  large?: boolean;
  /** Compact size that hugs its label, for the nav and inline actions. */
  small?: boolean;
}
