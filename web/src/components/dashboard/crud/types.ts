import type { ReactNode } from "react";

/** A form field descriptor driving the generic CRUD modal. */
export type FieldType =
  | "text"
  | "textarea"
  | "number"
  | "url"
  | "email"
  | "password"
  | "select"
  | "checkbox"
  | "color"
  | "file"
  | "datetime";

export interface Field {
  name: string;
  label: string;
  type: FieldType;
  options?: { value: string | number; label: string }[];
  required?: boolean;
  placeholder?: string;
  help?: string;
  /** Only shown on create (e.g. password when adding an author). */
  createOnly?: boolean;
}

/** A table column descriptor. */
export interface Column<T> {
  header: string;
  render: (row: T) => ReactNode;
  className?: string;
}
