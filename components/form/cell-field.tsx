import { GridInput } from "@/components/ui/grid-input";
import { firstErrorMessage } from "./field-error";
import { useFieldContext } from "./form-context";

interface CellFieldProps {
  // A grid cell has no visible label, so the name says which row and column it is ("Sales, FY27E").
  label: string;
}

export function CellField({ label }: CellFieldProps) {
  const field = useFieldContext<string>();
  const { isTouched, errors } = field.state.meta;
  const error = isTouched ? firstErrorMessage(errors) : undefined;

  return (
    <GridInput
      name={field.name}
      aria-label={label}
      aria-invalid={Boolean(error)}
      // The cell is too narrow for an error line; the message is the tooltip and the accessible description.
      title={error}
      value={field.state.value}
      onChange={(event) => field.handleChange(event.target.value)}
      onBlur={field.handleBlur}
      autoComplete="off"
    />
  );
}
