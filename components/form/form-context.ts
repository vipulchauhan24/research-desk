import { createFormHookContexts } from "@tanstack/react-form";

// Shared by every form: field components read their field from fieldContext, form components read the form.
export const { fieldContext, formContext, useFieldContext, useFormContext } = createFormHookContexts();
