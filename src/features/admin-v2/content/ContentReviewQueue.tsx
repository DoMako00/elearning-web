import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, RefreshCw, X } from "lucide-react";
import { decideContentReview, listContentReviewRequests } from "../api/adminContentApi";
import { TableFrame } from "../shared/AdminV2Table";

const reasonHint="Record the decision reason for the audit trail.";

export function ContentReviewQueue() {
  const client=useQueryClient();
  const queue=useQuery({queryKey:["admin","content-review-requests"],queryFn:({signal})=>listContentReviewRequests(signal)});
  const [reasons,setReasons]=useState<Record<string,string>>({});
  const [message,setMessage]=useState("");
  const decision=useMutation({mutationFn:({id,action}:{id:string;action:"approve"|"reject"})=>{
    const reason=reasons[id]?.trim();if(!reason)throw new Error("Add a decision reason first.");
    return decideContentReview(id,action,reason);
  },onSuccess:async()=>{setMessage("Review decision saved. Approved content is now published for the relevant course.");await Promise.all([client.invalidateQueries({queryKey:["admin","content-review-requests"]}),client.invalidateQueries({queryKey:["admin","content"]}),client.invalidateQueries({queryKey:["admin","server-domains"]})]);},onError:e=>setMessage(e instanceof Error?e.message:"The review decision could not be saved.")});
  const items=queue.data?.items??[];
  return <TableFrame title="Content approvals" count={queue.isLoading?"Loading…":`${items.filter(item=>item.status==="submitted").length} awaiting review`} toolbar={<button className="admin-v2__button" type="button" onClick={()=>void queue.refetch()} disabled={queue.isFetching}><RefreshCw size={13}/>Refresh</button>}>
    {message&&<p role="status" className="admin-v2__inline-notice">{message}</p>}
    {queue.isError?<p role="alert" className="admin-v2__empty">{queue.error instanceof Error?queue.error.message:"Content review requests could not be loaded."} <button className="admin-v2__button" type="button" onClick={()=>void queue.refetch()}>Retry</button></p>:queue.isLoading?<div role="status" className="admin-v2__empty">Loading pending content reviews…</div>:!items.length?<div className="admin-v2__empty">No content has been submitted for approval.</div>:<table className="admin-v2__table"><thead><tr><th>Course content</th><th>Brand / course</th><th>Version</th><th>Status</th><th>Decision</th></tr></thead><tbody>{items.map(item=><tr key={item.id}><td><strong>{item.targetTitle??item.targetType}</strong><small>{item.targetType} · {item.submissionReason}</small>{item.status==="rejected"&&item.rejectionReason&&<small>Rejected: {item.rejectionReason}</small>}</td><td>{item.brandCode}<small>{item.courseTitle}</small></td><td>{item.submittedVersion}</td><td>{item.status}</td><td>{item.status==="submitted"?<div className="admin-v2__table-tools"><input aria-label={`Decision reason for ${item.targetTitle??"content"}`} value={reasons[item.id]??""} onChange={event=>setReasons(value=>({...value,[item.id]:event.target.value}))} placeholder={reasonHint} maxLength={500}/><button type="button" className="admin-v2__button is-primary" title="Approve and publish" disabled={!reasons[item.id]?.trim()||decision.isPending} onClick={()=>decision.mutate({id:item.id,action:"approve"})}><Check size={13}/>Approve</button><button type="button" className="admin-v2__button" title="Reject with reason" disabled={!reasons[item.id]?.trim()||decision.isPending} onClick={()=>decision.mutate({id:item.id,action:"reject"})}><X size={13}/>Reject</button></div>:item.reviewedAt?<small>{new Date(item.reviewedAt).toLocaleString()}</small>:null}</td></tr>)}</tbody></table>}
  </TableFrame>;
}

export default ContentReviewQueue;
