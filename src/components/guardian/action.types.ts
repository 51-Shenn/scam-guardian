export interface ActionProps {
  label: string;
  onPress: () => void;
  secondary?: boolean;
  disabled?: boolean;
  large?: boolean;
}
