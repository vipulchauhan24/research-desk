import { createFormHook } from "@tanstack/react-form";
import { CellField } from "./cell-field";
import { FileField } from "./file-field";
import { FormError } from "./form-error";
import { fieldContext, formContext } from "./form-context";
import { SelectField } from "./select-field";
import { SubmitButton } from "./submit-button";
import { TextareaField } from "./textarea-field";
import { TextField } from "./text-field";

// The one way to build a form: typed values, with our accessible controls available as form.AppField children.
export const { useAppForm } = createFormHook({
  fieldContext,
  formContext,
  fieldComponents: { TextField, SelectField, CellField, TextareaField, FileField },
  formComponents: { SubmitButton, FormError },
});
