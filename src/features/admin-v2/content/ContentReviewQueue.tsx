import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Alert, Badge, Button, Card, Group, SimpleGrid, Skeleton, Stack, Text, Textarea, ThemeIcon, Title } from "@mantine/core";
import { AlertCircle, BookOpen, Check, FileCheck2, FileText, RefreshCw, X } from "lucide-react";
import { decideContentReview, listContentReviewRequests, type ContentReviewRequestDto } from "../api/adminContentApi";
import { useAdminV2 } from "../layout/AdminV2Layout";

const formatDate = (value: string) => {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "Date unavailable" : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
};

export function ContentReviewQueue() {
  const client = useQueryClient();
  const { brand } = useAdminV2();
  const queue = useQuery({ queryKey: ["admin", "content-review-requests"], queryFn: ({ signal }) => listContentReviewRequests(signal) });
  const [reasons, setReasons] = useState<Record<string, string>>({});
  const [message, setMessage] = useState("");
  const decision = useMutation({
    mutationFn: ({ id, action }: { id: string; action: "approve" | "reject" }) => {
      const reason = reasons[id]?.trim();
      if (!reason) throw new Error("Add a decision note before approving or returning this material.");
      return decideContentReview(id, action, reason);
    },
    onSuccess: async (_result, variables) => {
      setMessage(variables.action === "approve" ? "Material approved and published to its course." : "Material returned to the instructor with your note.");
      setReasons((current) => ({ ...current, [variables.id]: "" }));
      await Promise.all([
        client.invalidateQueries({ queryKey: ["admin", "content-review-requests"] }),
        client.invalidateQueries({ queryKey: ["admin", "content"] }),
        client.invalidateQueries({ queryKey: ["admin", "server-domains"] }),
      ]);
    },
    onError: (error) => setMessage(error instanceof Error ? error.message : "The review decision could not be saved."),
  });

  const allItems = queue.data?.items ?? [];
  const items = allItems.filter((item) => brand === "all" || item.brandCode === brand);
  const pending = items.filter((item) => item.status === "submitted");
  const reviewed = items.filter((item) => item.status !== "submitted");

  return <section className="admin-v2__approvals" aria-labelledby="content-approvals-title">
    <Group className="admin-v2__approvals-heading" justify="space-between" align="center" wrap="wrap">
      <Stack gap={4}>
        <Badge color="green" variant="light" w="fit-content">TEACHING CONTENT · REVIEW REQUIRED</Badge>
        <Title id="content-approvals-title" order={2}>Content approvals</Title>
        <Text c="dimmed" size="sm">Check the course and submitted file, then approve it for students or return it to the instructor with a clear reason.</Text>
      </Stack>
      <Button leftSection={<RefreshCw size={15} />} variant="light" color="green" loading={queue.isFetching} onClick={() => void queue.refetch()}>Refresh</Button>
    </Group>

    {message && <Alert color={decision.isError ? "red" : "green"} variant="light" icon={decision.isError ? <AlertCircle size={16} /> : <Check size={16} />} role="status">{message}</Alert>}
    {queue.isError && <Alert color="red" variant="light" icon={<AlertCircle size={16} />} title="The approval queue is unavailable">
      <Group justify="space-between" mt="xs"><Text size="sm">{queue.error instanceof Error ? queue.error.message : "Review records could not be loaded."}</Text><Button size="xs" variant="light" onClick={() => void queue.refetch()}>Try again</Button></Group>
    </Alert>}

    <Card className="admin-v2__approvals-panel" withBorder shadow="xs" p="md">
      <Group justify="space-between" mb="md">
        <div><Title order={3}>Waiting for your decision</Title><Text c="dimmed" size="xs">{pending.length} item{pending.length === 1 ? "" : "s"}{brand === "all" ? " across all brands" : ` in ${brand}`}</Text></div>
        <Badge color={pending.length ? "orange" : "green"} variant="light">{queue.isLoading ? "Loading" : pending.length ? `${pending.length} pending` : "Up to date"}</Badge>
      </Group>
      {queue.isLoading ? <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="sm">{[0, 1].map((id) => <Skeleton key={id} height={206} radius="md" />)}</SimpleGrid> : queue.isError ? null : pending.length ? <SimpleGrid cols={{ base: 1, xl: 2 }} spacing="sm">{pending.map((item) => <ReviewCard key={item.id} item={item} reason={reasons[item.id] ?? ""} pending={decision.isPending} onReason={(value) => setReasons((current) => ({ ...current, [item.id]: value }))} onDecision={(action) => decision.mutate({ id: item.id, action })} />)}</SimpleGrid> : <div className="admin-v2__approvals-empty"><ThemeIcon color="green" variant="light" size={48} radius="xl"><FileCheck2 size={22} /></ThemeIcon><Stack gap={3}><Text fw={700}>No materials are waiting</Text><Text c="dimmed" size="sm">Instructor-submitted lesson videos and PDFs will appear here when they are ready for review.</Text></Stack></div>}
    </Card>

    {reviewed.length > 0 && <Card className="admin-v2__approvals-history" withBorder shadow="xs" p="md">
      <Group justify="space-between" mb="md"><div><Title order={3}>Previous decisions</Title><Text c="dimmed" size="xs">Review history for the selected brand scope.</Text></div><Badge variant="light" color="gray">{reviewed.length} records</Badge></Group>
      <Stack gap="xs">{reviewed.slice(0, 8).map((item) => <HistoryRow key={item.id} item={item} />)}</Stack>
    </Card>}
  </section>;
}

function ReviewCard({ item, reason, pending, onReason, onDecision }: { item: ContentReviewRequestDto; reason: string; pending: boolean; onReason: (value: string) => void; onDecision: (action: "approve" | "reject") => void }) {
  const Icon = item.targetType === "lesson" ? BookOpen : FileText;
  return <Card className="admin-v2__approval-card" withBorder shadow="xs" p="md">
    <Group justify="space-between" align="flex-start" wrap="nowrap">
      <Group wrap="nowrap" align="flex-start">
        <ThemeIcon color="green" variant="light" size={42} radius="md"><Icon size={19} /></ThemeIcon>
        <Stack gap={3}>
          <Text fw={700} size="sm">{item.targetTitle || (item.targetType === "lesson" ? "Lesson update" : "Learning resource")}</Text>
          <Text c="dimmed" size="xs">{item.courseTitle} · {item.brandCode.toUpperCase()}</Text>
        </Stack>
      </Group>
      <Badge variant="light" color="orange">Version {item.submittedVersion}</Badge>
    </Group>
    <div className="admin-v2__approval-meta">
      <span><strong>Type</strong>{item.targetType === "lesson" ? "Lesson" : "Resource"}</span>
      <span><strong>Submitted</strong>{formatDate(item.createdAt)}</span>
    </div>
    <Text className="admin-v2__approval-reason" size="xs" c="dimmed">Instructor note: {item.submissionReason || "No additional note provided."}</Text>
    <Textarea label="Decision note" description="Required for an audit trail and visible to the instructor if you return this item." placeholder="Add a clear approval or change note…" value={reason} onChange={(event) => onReason(event.currentTarget.value)} minRows={2} maxLength={500} autosize />
    <Group justify="flex-end" mt="xs">
      <Button leftSection={<X size={15} />} variant="light" color="gray" disabled={!reason.trim() || pending} onClick={() => onDecision("reject")}>Return to instructor</Button>
      <Button leftSection={<Check size={15} />} color="green" disabled={!reason.trim() || pending} loading={pending} onClick={() => onDecision("approve")}>Approve and publish</Button>
    </Group>
  </Card>;
}

function HistoryRow({ item }: { item: ContentReviewRequestDto }) {
  const status = item.status === "approved" ? "Approved" : item.status === "rejected" ? "Returned" : "Cancelled";
  return <div className="admin-v2__approval-history-row">
    <div><Text size="sm" fw={650}>{item.targetTitle || (item.targetType === "lesson" ? "Lesson update" : "Learning resource")}</Text><Text c="dimmed" size="xs">{item.courseTitle} · {item.brandCode.toUpperCase()}</Text></div>
    <div><Badge variant="light" color={item.status === "approved" ? "green" : item.status === "rejected" ? "orange" : "gray"}>{status}</Badge>{item.reviewedAt && <Text c="dimmed" size="xs" mt={3}>{formatDate(item.reviewedAt)}</Text>}</div>
    {item.rejectionReason && <Text className="admin-v2__approval-history-reason" c="dimmed" size="xs">{item.rejectionReason}</Text>}
  </div>;
}

export default ContentReviewQueue;
