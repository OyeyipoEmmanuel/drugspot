import { ChevronRight, Inbox, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { Badge } from "@/components/ui/badge";
import { useConversations } from "@/hooks/use-pharmacist";
import { formatDate } from "@/lib/format";

export function PharmacistInboxPage() {
  const { data, isLoading, error, refetch } = useConversations();
  if (isLoading) return <LoadingState label="Loading patient conversations…" />;
  if (error) return <ErrorState message="We could not load the pharmacist inbox." onRetry={() => void refetch()} />;
  return <div className="space-y-6"><section><p className="text-sm font-semibold text-primary">Patient support</p><h1 className="mt-1 text-3xl font-bold">Pharmacist inbox</h1><p className="mt-2 text-muted-foreground">Review patient questions and provide professional, auditable guidance.</p></section><div className="grid gap-4 sm:grid-cols-3"><div className="rounded-2xl border bg-card p-5"><Inbox className="text-primary" /><p className="mt-3 text-2xl font-bold">{data?.length ?? 0}</p><p className="text-sm text-muted-foreground">Active conversations</p></div><div className="rounded-2xl border bg-card p-5"><MessageCircle className="text-primary" /><p className="mt-3 text-2xl font-bold">{data?.filter((item) => item.status === "waiting").length ?? 0}</p><p className="text-sm text-muted-foreground">Waiting for reply</p></div></div><section className="overflow-hidden rounded-3xl border bg-card shadow-sm"><div className="border-b px-5 py-4"><h2 className="font-bold">Conversation queue</h2></div><div className="divide-y">{data?.map((conversation) => <Link key={conversation.id} to={`/pharmacy/messages/${conversation.id}`} className="flex items-center gap-4 p-5 transition hover:bg-muted/50"><div className="grid size-11 shrink-0 place-items-center rounded-xl bg-secondary font-bold text-primary">{conversation.patientName.split(" ").map((part) => part[0]).join("")}</div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="font-bold">{conversation.patientName}</p><Badge variant="outline" className="capitalize">{conversation.status}</Badge></div><p className="mt-1 truncate text-sm text-muted-foreground">{conversation.subject} · {conversation.messages.at(-1)?.body}</p><p className="mt-1 text-xs text-muted-foreground">{formatDate(conversation.updatedAt, { dateStyle: "medium", timeStyle: "short" })}</p></div><ChevronRight className="size-5 text-muted-foreground" /></Link>)}{!data?.length && <p className="p-8 text-center text-sm text-muted-foreground">No patient conversations yet.</p>}</div></section></div>;
}
