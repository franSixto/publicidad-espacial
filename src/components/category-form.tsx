"use client";
import { useActionState } from "react";
import type { Category } from "@prisma/client";
import { saveCategoryAction } from "@/app/actions/admin";
import { CATEGORY_ICON_NAMES } from "./category-icon";
import { Alert, Field, Input, Select } from "./ui";
import { SubmitButton } from "./submit-button";

export function CategoryForm({ category }: { category?: Category }) {
  const [state, action] = useActionState(saveCategoryAction.bind(null, category?.id ?? null), {});
  const fe = state.fieldErrors ?? {};
  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {state.error && <div className="sm:col-span-2 lg:col-span-4"><Alert>{state.error}</Alert></div>}
      {state.ok && <div className="sm:col-span-2 lg:col-span-4"><Alert tone="green">{state.message}</Alert></div>}
      <Field label="Nombre" error={fe.name}><Input name="name" defaultValue={category?.name} required /></Field>
      <Field label="Slug" error={fe.slug}><Input name="slug" defaultValue={category?.slug} required pattern="[a-z0-9-]+" /></Field>
      <Field label="Ícono" error={fe.icon}>
        <Select name="icon" defaultValue={category?.icon ?? "sparkles"}>{CATEGORY_ICON_NAMES.map((i) => <option key={i}>{i}</option>)}</Select>
      </Field>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Orden" error={fe.sortOrder}><Input name="sortOrder" type="number" defaultValue={category?.sortOrder ?? 10} /></Field>
        <Field label="Factor precio" error={fe.priceFactor}><Input name="priceFactor" type="number" step="0.05" defaultValue={category?.priceFactor ?? 1} /></Field>
      </div>
      <Field label="Descripción" error={fe.description} className="sm:col-span-2"><Input name="description" defaultValue={category?.description} required /></Field>
      <Field label="URL de imagen" error={fe.imageUrl} className="sm:col-span-2"><Input name="imageUrl" defaultValue={category?.imageUrl ?? ""} /></Field>
      <div className="sm:col-span-2 lg:col-span-4"><SubmitButton size="sm">{category ? "Guardar cambios" : "Crear categoría"}</SubmitButton></div>
    </form>
  );
}
