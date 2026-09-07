import { createFileRoute } from "@tanstack/react-router";
import { RitmoApp } from "@/components/ritmo-app";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return <RitmoApp />;
}
