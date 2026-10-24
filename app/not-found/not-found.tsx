import { Link } from "wouter";
import { PageHeader, Shell } from "../components/layout";

export default function NotFound() {
  return (
    <Shell>
      <PageHeader eyebrow="404" title="Wrong turn" subtitle="This page doesn’t exist. Let’s get you back on the road.">
        <Link to="/" className="mt-8 inline-flex h-11 items-center rounded-xl bg-lime px-6 font-medium text-ink">
          Back home
        </Link>
      </PageHeader>
      <div className="h-24" />
    </Shell>
  );
}
