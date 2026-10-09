export interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  /** Read by screen readers. The visible text sits beside the control. */
  label: string;
}
