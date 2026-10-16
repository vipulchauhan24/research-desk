import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { CASE_KEYS, CASE_LABEL, GRID_MODES, MODE_LABEL, type CaseKey, type GridMode } from "@/lib/scenarios";

export function CaseToggle({ value, onChange }: { value: CaseKey; onChange: (value: CaseKey) => void }) {
  return (
    <ToggleGroup
      aria-label="Scenario case"
      value={value}
      onValueChange={(next) => onChange(CASE_KEYS.find((key) => key === next) ?? value)}
    >
      {CASE_KEYS.map((key) => (
        <ToggleGroupItem key={key} value={key}>
          {CASE_LABEL[key]}
        </ToggleGroupItem>
      ))}
      <ToggleGroupItem value="management" disabled disabledReason="Coming later">
        Management
      </ToggleGroupItem>
    </ToggleGroup>
  );
}

export function ModeToggle({ value, onChange }: { value: GridMode; onChange: (value: GridMode) => void }) {
  return (
    <ToggleGroup
      aria-label="Period type"
      value={value}
      onValueChange={(next) => onChange(GRID_MODES.find((mode) => mode === next) ?? value)}
    >
      {GRID_MODES.map((mode) => (
        <ToggleGroupItem key={mode} value={mode}>
          {MODE_LABEL[mode]}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  );
}
