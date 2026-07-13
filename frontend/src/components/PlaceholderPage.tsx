import type { ReactNode } from "react";

type PlaceholderPageProps = {
  title: string;
  description: string;
  children?: ReactNode;
};

export function PlaceholderPage({ title, description, children }: PlaceholderPageProps) {
  return (
    <section className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="text-2xl font-bold text-gray-950">{title}</h2>
      <p className="mt-2 text-sm text-gray-600">{description}</p>
      {children ? <div className="mt-6">{children}</div> : null}
    </section>
  );
}
