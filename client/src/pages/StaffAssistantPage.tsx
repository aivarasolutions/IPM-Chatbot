import { useEffect, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Paperclip, Send, Sparkles, X, Copy, ThumbsUp, ThumbsDown, BookmarkPlus, RefreshCw, MessageSquareText, ChevronDown, FileText, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { staffRequest } from "@/lib/staff-api";
import { copyText } from "@/lib/copy-text";
import type { AssistantMessage, AssistantThread, AttachmentMetadata } from "@shared/assistant-schema";
import type { Lead } from "@shared/schema";

type ThreadDetail = { thread: AssistantThread; messages: AssistantMessage[] };
const actions = [
  ["answer", "Answer this lead"], ["follow-up", "Follow up"], ["objection", "Handle objection"],
  ["promotion", "Explain 10% plan"], ["management", "Explain 20% plan"], ["onboarding", "Move toward onboarding"], ["natural", "More natural"],
] as const;
const allowed = new Set(["image/jpeg","image/png","image/webp","application/pdf","text/plain","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document"]);
const maxSize = 8 * 1024 * 1024;
const describeFile = (f: File): string => {
  const ext = f.name.split(".").pop()?.toLowerCase() || "";
  if (!allowed.has(f.type) && !["jpg","jpeg","png","webp","pdf","txt","doc","docx"].includes(ext)) return `${f.name} is not a supported file type.`;
  if (f.size > maxSize) return `${f.name} is over the 8 MB per-file limit.`;
  return "";
};

export default function StaffAssistantPage() {
  const qc = useQueryClient(); const { toast } = useToast(); const [, setLocation] = useLocation();
  const [activeId, setActiveId] = useState<string | null>(null);
  const [draft, setDraft] = useState(""); const [files, setFiles] = useState<File[]>([]);
  const [action, setAction] = useState<string>("answer"); const [responseType, setResponseType] = useState("lead"); const [language, setLanguage] = useState("auto");
  const [metadata, setMetadata] = useState<Partial<AssistantThread>>({});
  const [editingId, setEditingId] = useState<string | null>(null); const [edited, setEdited] = useState("");
  const [dragging, setDragging] = useState(false); const fileInput = useRef<HTMLInputElement>(null); const pasteRef = useRef<HTMLDivElement>(null);
  const handledLead = useRef(false);
  const list = useQuery<AssistantThread[]>({ queryKey: ["/api/assistant/threads"], queryFn: () => staffRequest("GET","/api/assistant/threads") });
  const detail = useQuery<ThreadDetail>({ queryKey: ["/api/assistant/threads",activeId], queryFn: () => staffRequest("GET",`/api/assistant/threads/${activeId}`), enabled: !!activeId });
  const leads = useQuery<Lead[]>({ queryKey: ["/api/staff/leads"], queryFn: () => staffRequest("GET","/api/staff/leads") });
  const saved = useQuery<{id:string;title:string;category:string;content:string}[]>({ queryKey: ["/api/assistant/saved-responses"], queryFn: () => staffRequest("GET","/api/assistant/saved-responses") });
  useEffect(() => { if (detail.data) { setMetadata(detail.data.thread); setResponseType(detail.data.thread.responseType); setLanguage(detail.data.thread.language); } }, [detail.data]);
  const addFiles = (incoming: FileList | File[]) => {
    const next = [...files]; let problem = "";
    for (const file of Array.from(incoming)) {
      problem = describeFile(file); if (problem) break;
      if (next.length >= 5) { problem = "You can attach up to 5 files."; break; }
      if (next.reduce((n,f)=>n+f.size,0)+file.size > 25*1024*1024) { problem = "Attachments must total 25 MB or less."; break; }
      next.push(file);
    }
    if (problem) toast({ title: "Attachment not added", description: problem, variant: "destructive" });
    setFiles(next);
  };
  useEffect(() => {
    const paste = (event: ClipboardEvent) => {
      const imageItems = Array.from(event.clipboardData?.items || []).filter(i => i.type.startsWith("image/"));
      const pasted = imageItems.map(item => item.getAsFile()).filter((f): f is File => !!f).map((f,i) => {
        const extension = f.type === "image/jpeg" ? "jpg" : f.type === "image/webp" ? "webp" : "png";
        return new File([f],`pasted-image-${Date.now()}-${i}.${extension}`,{type:f.type});
      });
      if (pasted.length) { event.preventDefault(); addFiles(pasted); }
    };
    const node = pasteRef.current; node?.addEventListener("paste", paste);
    return () => node?.removeEventListener("paste", paste);
  }, [files]);
  const createThread = async () => {
    const { leadId, leadName, propertyName, propertyLocation, phone, email, leadSource, stage } = metadata;
    const created = await staffRequest<AssistantThread>("POST","/api/assistant/threads",{leadId,leadName,propertyName,propertyLocation,phone,email,leadSource,stage,responseType,language});
    setActiveId(created.id); setMetadata(created); await qc.invalidateQueries({ queryKey:["/api/assistant/threads"] }); return created;
  };
  const generate = useMutation({
    mutationFn: async ({ chosenAction, chosenLanguage, text, includeAttachments, preserveComposer }: { chosenAction:string; chosenLanguage:string; text:string; includeAttachments:boolean; preserveComposer:boolean }) => {
      const requestFiles = includeAttachments ? files : [];
      if (!activeId && !requestFiles.length && !text.trim()) throw new Error("Add a message or attachment before generating.");
      if (chosenAction === "answer" && !requestFiles.length && !text.trim()) throw new Error("Enter a message to answer.");
      const threadId = activeId || (await createThread()).id;
      const form = new FormData(); form.append("message", text); form.append("action", chosenAction); form.append("language",chosenLanguage); form.append("responseType",responseType);
      requestFiles.forEach(f=>form.append("files",f));
      const res = await fetch(`/api/assistant/threads/${threadId}/generate`,{method:"POST",credentials:"include",body:form});
      if (!res.ok) { let err = "Unable to generate a response."; try { const data=await res.json(); err=data.error || err; } catch { /* response body was not JSON */ } throw new Error(`${res.status}:${err}`); }
      return { ...(await res.json()), threadId, preserveComposer };
    },
    onSuccess: async (result) => {
      if (!result.preserveComposer) { setDraft(""); setFiles([]); setAction("answer"); }
      setEditingId(null); setEdited(result.message?.content || "");
      await Promise.all([qc.invalidateQueries({queryKey:["/api/assistant/threads"]}),qc.invalidateQueries({queryKey:["/api/assistant/threads",result.threadId]})]);
    },
    onError: (err) => toast({title:"Response not generated",description:err instanceof Error ? err.message.replace(/^\d+:/,"") : "Please try again.",variant:"destructive"}),
  });
  const patchThread = useMutation({mutationFn: (patch:Partial<AssistantThread>) => staffRequest("PATCH",`/api/assistant/threads/${activeId}`,patch),onSuccess:()=>{qc.invalidateQueries({queryKey:["/api/assistant/threads"]});qc.invalidateQueries({queryKey:["/api/assistant/threads",activeId]});},onError:(e)=>toast({title:"Conversation details were not saved",description:errorMessage(e),variant:"destructive"})});
  const deleteThread = useMutation({mutationFn:(id:string)=>staffRequest("DELETE",`/api/assistant/threads/${id}`),onSuccess:(_,id)=>{qc.invalidateQueries({queryKey:["/api/assistant/threads"]});qc.removeQueries({queryKey:["/api/assistant/threads",id]});if(activeId===id){setActiveId(null);setMetadata({});}toast({title:"Draft deleted"});},onError:e=>toast({title:"Draft could not be deleted",description:errorMessage(e),variant:"destructive"})});
  const saveEdit = useMutation({mutationFn:({id,content}:{id:string;content:string})=>staffRequest("PATCH",`/api/assistant/messages/${id}`,{content}),onSuccess:()=>{qc.invalidateQueries({queryKey:["/api/assistant/threads",activeId]});setEditingId(null);toast({title:"Response saved",description:"Your edit is stored in this conversation."});},onError:e=>toast({title:"Response edit was not saved",description:errorMessage(e),variant:"destructive"})});
  const feedback = useMutation({mutationFn:({id,rating}:{id:string;rating:"good"|"needs_improvement"|null})=>staffRequest("POST",`/api/assistant/messages/${id}/feedback`,{rating}),onSuccess:()=>qc.invalidateQueries({queryKey:["/api/assistant/threads",activeId]}),onError:e=>toast({title:"Feedback was not saved",description:errorMessage(e),variant:"destructive"})});
  const saveResponse = async (message:AssistantMessage) => {
    const title=window.prompt("Name this saved response", "Reusable reply");
    if (!title?.trim()) return;
    try {
      await staffRequest("POST","/api/assistant/saved-responses",{title:title.trim(),category:"General",content:message.content});
      await qc.invalidateQueries({queryKey:["/api/assistant/saved-responses"]});
      toast({title:"Saved response added",description:"This response is in your personal library."});
    } catch (e) { toast({title:"Response could not be saved",description:errorMessage(e),variant:"destructive"}); }
  };
  const selectLead = async (id:string) => {
    const lead=leads.data?.find(l=>l.id===id); if (!lead) return;
    try {
      const created=await staffRequest<AssistantThread>("POST","/api/assistant/threads",{leadId:lead.id,leadName:lead.name||"",email:lead.email||"",phone:lead.phone||"",title:lead.name?`Conversation with ${lead.name}`:"Lead conversation"});
      setActiveId(created.id); setMetadata(created); await qc.invalidateQueries({queryKey:["/api/assistant/threads"]}); setLocation(`/staff/assistant`);
    } catch (e) { toast({title:"Lead could not be opened",description:errorMessage(e),variant:"destructive"}); }
  };
  useEffect(() => {
    const leadId = new URLSearchParams(window.location.search).get("leadId");
    if (leadId && leads.data && !handledLead.current) { handledLead.current = true; void selectLead(leadId); }
  }, [leads.data]);
  const current = detail.data?.messages || [];
  const latest = [...current].reverse().find(m=>m.role==="assistant");
  const refinements = new Set(["regenerate","shorter","friendlier","professional","translate"]);
  const run = (a:string, l=language) => {
    const refine = refinements.has(a);
    setAction(a);
    generate.mutate({chosenAction:a,chosenLanguage:l,text:refine?"":draft,includeAttachments:!refine,preserveComposer:refine});
  };
  const copyResponse = async (content:string) => {
    try { await copyText(content); toast({title:"Copied",description:"Response text copied to clipboard."}); }
    catch (e) { toast({title:"Could not copy response",description:errorMessage(e),variant:"destructive"}); }
  };
  function errorMessage(error:unknown) { return error instanceof Error ? error.message.replace(/^\d+:/,"") : "Please try again."; }
  const threadChange = (key:keyof AssistantThread,value:string) => { const next={...metadata,[key]:value}; setMetadata(next); if(activeId) patchThread.mutate({[key]:value} as Partial<AssistantThread>); };
  return <div className="mx-auto max-w-7xl space-y-5" ref={pasteRef} onDragOver={e=>{e.preventDefault();setDragging(true);}} onDragLeave={()=>setDragging(false)} onDrop={e=>{e.preventDefault();setDragging(false);addFiles(e.dataTransfer.files);}}>
    <section className="flex flex-col gap-4 border-b pb-5 sm:flex-row sm:items-end sm:justify-between">
      <div><div className="mb-2 flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-lg bg-primary/10 text-primary"><Sparkles className="h-4 w-4"/></span><Badge variant="secondary">Internal drafting</Badge></div><h1 className="font-serif text-3xl font-semibold tracking-tight sm:text-4xl">IPM Assistant</h1><p className="mt-2 max-w-2xl text-sm text-muted-foreground">Paste a lead’s message or upload an attachment and get a ready-to-send response.</p></div>
      <Button variant="outline" onClick={()=>{setActiveId(null);setDraft("");setFiles([]);setMetadata({});setResponseType("lead");setLanguage("auto");}}><MessageSquareText className="mr-2 h-4 w-4"/>New draft</Button>
    </section>
    <div className="grid min-w-0 gap-5 lg:grid-cols-[250px_minmax(0,1fr)_260px]">
      <aside className="order-3 min-w-0 space-y-4 lg:order-1">
        <Card className="overflow-hidden"><CardHeader className="pb-3"><CardTitle className="text-sm">Recent drafts</CardTitle></CardHeader><CardContent className="max-h-64 space-y-1 overflow-y-auto px-3 pb-3 lg:max-h-[calc(100dvh-15rem)]">{list.isLoading ? <div className="space-y-2">{[1,2,3].map(i=><div key={i} className="h-12 animate-pulse rounded bg-muted"/> )}</div> : list.isError ? <div className="text-sm text-muted-foreground"><p>Drafts could not load.</p><Button variant="ghost" className="px-0 text-primary" onClick={()=>list.refetch()}>Retry</Button></div> : list.data?.length ? list.data.map(t=><div key={t.id} className={`flex items-center gap-1 rounded-lg pr-1 ${activeId===t.id?"bg-primary/10":"hover:bg-muted"}`}><button onClick={()=>setActiveId(t.id)} className="min-w-0 flex-1 px-3 py-2.5 text-left"><span className="block truncate text-sm font-medium">{t.title || t.leadName || "Untitled conversation"}</span><span className="mt-1 block truncate text-xs text-muted-foreground">{t.leadName || t.propertyName || "General inquiry"}</span></button><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive" aria-label={`Delete ${t.title || "conversation"}`} onClick={()=>{if(window.confirm(`Delete “${t.title || t.leadName || "this draft"}” and its conversation history?`))deleteThread.mutate(t.id);}}><Trash2 className="h-4 w-4"/></Button></div>) : <p className="rounded-lg bg-muted/60 p-3 text-xs leading-5 text-muted-foreground">Your recent conversations will appear here.</p>}</CardContent></Card>
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Start from a lead</CardTitle></CardHeader><CardContent>{leads.isLoading ? <div className="h-9 animate-pulse rounded bg-muted"/> : leads.isError ? <Button variant="outline" size="sm" onClick={()=>leads.refetch()}>Retry leads</Button> : <select aria-label="Select a captured lead" className="h-10 w-full rounded-md border bg-background px-3 text-sm" defaultValue="" onChange={e=>e.target.value&&selectLead(e.target.value)}><option value="">Choose a captured lead</option>{leads.data?.map(l=><option key={l.id} value={l.id}>{l.name || l.email || l.phone || "Unnamed lead"}</option>)}</select>}</CardContent></Card>
      </aside>
      <section className="order-1 flex min-w-0 flex-col gap-4 lg:order-2">
        <Card><CardContent className="grid gap-3 p-4 sm:grid-cols-2">
          <label className="text-xs font-medium text-muted-foreground">Response type<select disabled={generate.isPending} value={responseType} onChange={e=>{setResponseType(e.target.value);threadChange("responseType",e.target.value);}} className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"><option value="lead">Lead / prospect</option><option value="owner">Existing owner</option><option value="general">General IPM question</option></select></label>
          <label className="text-xs font-medium text-muted-foreground">Language<select disabled={generate.isPending} value={language} onChange={e=>{const value=e.target.value;setLanguage(value);if(activeId)threadChange("language",value);if(latest)run("translate",value);}} className="mt-1.5 h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"><option value="auto">Auto-detect</option><option value="en">English</option><option value="es">Español</option></select></label>
          <div className="sm:col-span-2"><details><summary className="cursor-pointer text-xs font-medium text-muted-foreground">Optional lead and property details</summary><div className="mt-3 grid gap-2 sm:grid-cols-2"><Input maxLength={250} aria-label="Lead name" placeholder="Lead name" value={metadata.leadName||""} onChange={e=>setMetadata({...metadata,leadName:e.target.value})} onBlur={e=>threadChange("leadName",e.target.value)}/><Input maxLength={250} aria-label="Property name" placeholder="Property name" value={metadata.propertyName||""} onChange={e=>setMetadata({...metadata,propertyName:e.target.value})} onBlur={e=>threadChange("propertyName",e.target.value)}/><Input maxLength={250} aria-label="Property location" placeholder="Property location" value={metadata.propertyLocation||""} onChange={e=>setMetadata({...metadata,propertyLocation:e.target.value})} onBlur={e=>threadChange("propertyLocation",e.target.value)}/><Input maxLength={100} aria-label="Phone" placeholder="Phone" value={metadata.phone||""} onChange={e=>setMetadata({...metadata,phone:e.target.value})} onBlur={e=>threadChange("phone",e.target.value)}/><Input maxLength={250} aria-label="Email" placeholder="Email" value={metadata.email||""} onChange={e=>setMetadata({...metadata,email:e.target.value})} onBlur={e=>threadChange("email",e.target.value)}/><Input maxLength={250} aria-label="Lead source" placeholder="Lead source" value={metadata.leadSource||""} onChange={e=>setMetadata({...metadata,leadSource:e.target.value})} onBlur={e=>threadChange("leadSource",e.target.value)}/><label className="text-xs text-muted-foreground sm:col-span-2">Sales stage<select disabled={generate.isPending} aria-label="Sales stage" value={metadata.stage||"New lead"} onChange={e=>threadChange("stage",e.target.value)} className="mt-1 block h-10 w-full rounded-md border bg-background px-3 text-sm text-foreground"><option>New lead</option><option>Initial contact</option><option>Interested</option><option>Question/objection</option><option>Pricing question</option><option>Platform question</option><option>Trust question</option><option>Follow-up needed</option><option>Ready to onboard</option><option>Onboarding started</option><option>Owner already active</option></select></label></div></details></div>
        </CardContent></Card>
        <Card className={`min-w-0 overflow-hidden transition-colors ${dragging?"border-primary bg-primary/5":""}`}><CardHeader className="pb-2"><CardTitle className="text-base">Prospect message</CardTitle><p className="text-xs text-muted-foreground">Paste the latest message, or drop up to five attachments here.</p></CardHeader><CardContent className="space-y-3">
          <Textarea maxLength={15000} value={draft} onChange={e=>setDraft(e.target.value)} placeholder="Paste the property owner’s message here…" className="min-h-36 resize-y break-words text-base leading-6 sm:min-h-40"/>
          <p className="text-right text-[11px] text-muted-foreground">{draft.length.toLocaleString()} / 15,000 characters</p>
          {files.length>0&&<div className="space-y-2">{files.map((f,i)=><div key={`${f.name}-${i}`} className="flex min-w-0 items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2"><FileText className="h-4 w-4 shrink-0 text-primary"/><span className="min-w-0 flex-1 truncate text-sm">{f.name}<span className="ml-2 text-xs text-muted-foreground">{(f.size/1024/1024).toFixed(1)} MB</span></span><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" aria-label={`Remove ${f.name}`} onClick={()=>setFiles(files.filter((_,n)=>n!==i))}><X className="h-4 w-4"/></Button></div>)}</div>}
          <input ref={fileInput} type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf,.txt,.doc,.docx,image/jpeg,image/png,image/webp,application/pdf,text/plain" className="hidden" onChange={e=>{if(e.target.files)addFiles(e.target.files);e.currentTarget.value="";}}/>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"><Button variant="outline" className="h-11" disabled={generate.isPending} onClick={()=>fileInput.current?.click()}><Paperclip className="mr-2 h-4 w-4"/>Add attachment</Button><Button className="h-12 w-full text-base sm:w-auto sm:min-w-48" disabled={generate.isPending} onClick={()=>run("answer")}>{generate.isPending?<><RefreshCw className="mr-2 h-4 w-4 animate-spin"/>Generating…</>:<><Send className="mr-2 h-4 w-4"/>Generate response</>}</Button></div>
          <p className="text-xs leading-5 text-muted-foreground">Up to 5 files, 8 MB each, 25 MB combined. Images, PDFs (including scanned pages), TXT, DOC, and DOCX are supported. Upload only the relevant conversation or pages.</p>
          <div className="flex items-start gap-2 rounded-md bg-muted/50 px-3 py-2 text-xs leading-5 text-muted-foreground"><span className="mt-0.5 font-semibold text-foreground">Privacy</span><span>Original attachments are discarded after processing. Extracted summaries and conversation text are retained with this private draft.</span></div>
          <div className="flex flex-wrap gap-2 border-t pt-3"><span className="w-full text-xs font-medium text-muted-foreground">Quick actions</span>{actions.map(([key,label])=><Button key={key} variant={action===key?"secondary":"outline"} size="sm" disabled={generate.isPending} onClick={()=>run(key)}>{label}</Button>)}</div>
        </CardContent></Card>
        {detail.isError&&activeId&&<div role="alert" className="rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-sm">Conversation could not be loaded. <Button variant="ghost" className="text-primary" onClick={()=>detail.refetch()}>Retry</Button></div>}
        {latest&&<Card className="order-2 min-w-0 border-primary/30"><CardHeader className="flex flex-row items-center justify-between gap-3 pb-3"><div className="min-w-0"><p className="text-[10px] font-semibold uppercase tracking-[.16em] text-primary">IPM Assistant</p><CardTitle className="mt-1 text-lg">Suggested Response</CardTitle></div><Badge variant="secondary">Ready to review</Badge></CardHeader><CardContent className="min-w-0 space-y-4">
          {editingId===latest.id?<Textarea maxLength={15000} value={edited} onChange={e=>setEdited(e.target.value)} className="min-h-40 break-words text-base leading-7"/>:<div className="min-w-0 break-words whitespace-pre-wrap [overflow-wrap:anywhere] rounded-xl bg-muted/45 p-4 text-base leading-7">{latest.content}</div>}
          {editingId===latest.id?<div className="flex gap-2"><Button onClick={()=>saveEdit.mutate({id:latest.id,content:edited})} disabled={saveEdit.isPending}>Save edits</Button><Button variant="outline" onClick={()=>{setEditingId(null);setEdited(latest.content);}}>Cancel</Button></div>:<div className="grid grid-cols-1 gap-2 sm:grid-cols-2"><Button className="h-12 text-base" onClick={()=>copyResponse(latest.content)}><Copy className="mr-2 h-4 w-4"/>Copy Response</Button><Button variant="outline" className="h-12" onClick={()=>{setEdited(latest.content);setEditingId(latest.id);}}>Edit response</Button></div>}
          <div className="flex flex-wrap gap-2 border-t pt-3">{[["regenerate","Regenerate"],["shorter","Shorter"],["friendlier","Friendlier"],["professional","More Professional"]].map(([key,label])=><Button key={key} variant="outline" size="sm" disabled={generate.isPending||!latest} onClick={()=>run(key)}>{label}</Button>)}{language!=="en"&&<Button variant="outline" size="sm" disabled={generate.isPending} onClick={()=>{setLanguage("en");run("translate","en");}}>English</Button>}{language!=="es"&&<Button variant="outline" size="sm" disabled={generate.isPending} onClick={()=>{setLanguage("es");run("translate","es");}}>Español</Button>}</div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-3"><div className="flex flex-wrap items-center gap-2"><span className="text-xs text-muted-foreground">Was this useful?</span><Button disabled={feedback.isPending} variant={latest.feedback==="good"?"secondary":"ghost"} size="sm" onClick={()=>feedback.mutate({id:latest.id,rating:latest.feedback==="good"?null:"good"})} aria-label="Good response"><ThumbsUp className="mr-1.5 h-4 w-4"/>Good</Button><Button disabled={feedback.isPending} variant={latest.feedback==="needs_improvement"?"secondary":"ghost"} size="sm" onClick={()=>feedback.mutate({id:latest.id,rating:latest.feedback==="needs_improvement"?null:"needs_improvement"})} aria-label="Needs improvement"><ThumbsDown className="mr-1.5 h-4 w-4"/>Needs improvement</Button></div><Button variant="outline" size="sm" onClick={()=>saveResponse(latest)}><BookmarkPlus className="mr-2 h-4 w-4"/>Save response</Button></div>
          <p className="text-xs text-muted-foreground">Edits are saved only when you choose Save edits. Saved responses are personal to your staff account; edits do not retrain the assistant.</p>
        </CardContent></Card>}
        {current.filter(m=>m.id!==latest?.id).length>0&&<details className="order-3 rounded-xl border bg-card"><summary className="cursor-pointer px-4 py-3 text-sm font-medium">Conversation history ({current.filter(m=>m.id!==latest?.id).length})</summary><div className="max-h-56 space-y-3 overflow-y-auto border-t p-3">{current.filter(m=>m.id!==latest?.id).map(m=><div key={m.id} className={`min-w-0 break-words [overflow-wrap:anywhere] rounded-xl p-3 text-sm leading-6 ${m.role==="assistant"?"border border-primary/15 bg-primary/5":"bg-muted/60"}`}><p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{m.role==="assistant"?"Suggested response":"Prospect message"}</p>{m.content || "Attachment received"}{m.metadata?.attachments?.length ? <p className="mt-2 break-all text-xs text-muted-foreground">Attachment: {m.metadata.attachments.map((a:AttachmentMetadata)=>a.name).join(", ")}</p>:null}</div>)}</div></details>}
      </section>
      <aside className="order-2 min-w-0 space-y-4 lg:order-3 lg:sticky lg:top-24 lg:self-start">
        <Card><CardHeader className="pb-3"><CardTitle className="text-sm">Reusable responses</CardTitle><p className="text-xs text-muted-foreground">Personal library</p></CardHeader><CardContent className="space-y-2">{saved.isLoading?<div className="h-20 animate-pulse rounded bg-muted"/>:saved.isError?<Button variant="ghost" className="text-primary" onClick={()=>saved.refetch()}>Retry library</Button>:saved.data?.length?saved.data.slice(0,5).map(r=><button key={r.id} onClick={()=>copyResponse(r.content)} className="w-full min-w-0 rounded-lg border p-3 text-left hover:bg-muted/60"><span className="block truncate text-sm font-medium">{r.title}</span><span className="mt-1 block line-clamp-2 break-words text-xs leading-5 text-muted-foreground">{r.content}</span><span className="mt-2 flex items-center text-xs font-medium text-primary"><Copy className="mr-1.5 h-3.5 w-3.5"/>Copy approved response</span></button>):<p className="text-xs leading-5 text-muted-foreground">Save a useful reply to reuse it from your personal library.</p>}<Button variant="ghost" className="h-8 px-0 text-xs text-primary" onClick={()=>setLocation("/staff/saved-responses")}>Browse response library <ChevronDown className="ml-1 h-3 w-3 -rotate-90"/></Button></CardContent></Card>
        <Card><CardContent className="p-4"><p className="text-xs font-semibold">A good draft stays grounded</p><p className="mt-1.5 text-xs leading-5 text-muted-foreground">Review names, details, and policy-sensitive claims before sending. The assistant should not invent unverified terms.</p></CardContent></Card>
      </aside>
    </div>
  </div>;
}
