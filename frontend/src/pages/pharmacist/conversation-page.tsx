import { ArrowLeft, FileText, LoaderCircle, Paperclip, Send, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "react-router-dom";

import { ErrorState, LoadingState } from "@/components/feedback-states";
import { VerifiedBadge } from "@/components/marketplace/verified-badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useConversation, useSendMessage } from "@/hooks/use-pharmacist";
import { cn } from "@/lib/utils";
import { useAuth } from "@/providers/auth-provider";

export function ConversationPage() {
  const { id = "" } = useParams();
  const { session } = useAuth();
  const staffView = session?.user.role !== "patient";
  const conversation = useConversation(id);
  const send = useSendMessage(id);
  const [body, setBody] = useState("");
  const [attachmentName, setAttachmentName] = useState("");
  if (conversation.isLoading) return <LoadingState label="Loading secure conversation…" />;
  if (conversation.error || !conversation.data) return <ErrorState message="Conversation not found." onRetry={() => void conversation.refetch()} />;
  const item = conversation.data;
  const submit = async () => { if (body.trim().length < 2) return; await send.mutateAsync({ body: body.trim(), senderRole: staffView ? "pharmacist" : "patient", attachmentName: attachmentName || undefined }); setBody(""); setAttachmentName(""); };
  return <div className="mx-auto max-w-4xl space-y-4"><Button asChild variant="ghost" className="-ml-3"><Link to={staffView ? "/pharmacy/messages" : "/pharmacist"}><ArrowLeft />{staffView ? "Inbox" : "Conversations"}</Link></Button><section className="overflow-hidden rounded-3xl border bg-card shadow-sm"><header className="flex flex-col justify-between gap-4 border-b p-5 sm:flex-row sm:items-center"><div className="flex items-center gap-3"><div className="grid size-12 place-items-center rounded-2xl bg-secondary font-bold text-primary">{staffView ? item.patientName.split(" ").map((part) => part[0]).join("") : `${item.pharmacist.firstName[0]}${item.pharmacist.lastName[0]}`}</div><div><div className="flex flex-wrap items-center gap-2"><h1 className="font-bold">{staffView ? item.patientName : `Pharm. ${item.pharmacist.firstName} ${item.pharmacist.lastName}`}</h1>{!staffView && <VerifiedBadge />}</div><p className="text-sm text-muted-foreground">{item.subject}</p></div></div><span className="flex items-center gap-2 text-xs font-medium text-muted-foreground"><ShieldCheck className="size-4 text-primary" />Private care conversation</span></header><div className="min-h-[390px] space-y-5 bg-muted/25 p-4 sm:p-6">{item.messages.map((message) => { const mine = staffView ? message.senderRole === "pharmacist" : message.senderRole === "patient"; return <div key={message.id} className={cn("flex", mine ? "justify-end" : "justify-start")}><div className={cn("max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm sm:max-w-[70%]", mine ? "rounded-br-md bg-primary text-primary-foreground" : "rounded-bl-md border bg-background")}><p className="text-xs font-semibold opacity-75">{message.senderName}</p>{message.medicationName && <p className={cn("mt-2 rounded-lg px-2 py-1 text-xs font-semibold", mine ? "bg-white/15" : "bg-secondary text-primary")}>{message.medicationName}</p>}<p className="mt-2 whitespace-pre-wrap leading-6">{message.body}</p>{message.attachmentName && <p className="mt-3 flex items-center gap-2 rounded-lg bg-black/10 px-2 py-1.5 text-xs"><FileText className="size-3.5" />{message.attachmentName}</p>}<p className="mt-2 text-[0.65rem] opacity-65">{new Intl.DateTimeFormat("en-NG", { hour: "numeric", minute: "2-digit" }).format(new Date(message.createdAt))}</p></div></div>; })}</div><footer className="border-t p-4 sm:p-5"><Textarea aria-label="Message" value={body} onChange={(event) => setBody(event.target.value)} placeholder={staffView ? "Reply with clear, professional guidance…" : "Write your medicine question…"} className="min-h-24" /><div className="mt-3 flex flex-col justify-between gap-3 sm:flex-row sm:items-center"><label className="inline-flex cursor-pointer items-center gap-2 text-sm font-semibold text-primary"><Paperclip className="size-4" /><span>{attachmentName || "Attach a relevant file"}</span><input type="file" className="sr-only" accept="image/jpeg,image/png,image/webp,application/pdf" onChange={(event) => setAttachmentName(event.target.files?.[0]?.name ?? "")} /></label><Button onClick={() => void submit()} disabled={send.isPending || body.trim().length < 2}>{send.isPending ? <LoaderCircle className="animate-spin" /> : <Send />}{send.isPending ? "Sending…" : "Send message"}</Button></div>{send.error && <p className="mt-3 text-sm text-destructive">{send.error.message}</p>}</footer></section><p className="text-center text-xs leading-5 text-muted-foreground">Messages are retained according to DrugSpot's privacy policy. Do not use chat for emergencies.</p></div>;
}
