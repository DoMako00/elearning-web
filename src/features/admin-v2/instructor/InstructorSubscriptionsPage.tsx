import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Alert, Badge, Button, Card, Group, SimpleGrid, Stack, Text, Title } from "@mantine/core";
import { AlertCircle, CircleDollarSign, Clock3, Plus, ReceiptText } from "lucide-react";
import { useAdminV2 } from "../layout/AdminV2Layout";
import { listInstructorPurchaseRequests, type InstructorPurchaseRequest } from "../api/instructorWorkspaceApi";
import { PurchaseFlow } from "../subscriptions/PurchaseFlow";
import { extractApiErrorMessage } from "../../../app/api/client";

const money = (minor: number, currency: string) => {
  try { return new Intl.NumberFormat("en", { style: "currency", currency, maximumFractionDigits: 2 }).format(minor / 100); }
  catch { return `${(minor / 100).toLocaleString()} ${currency}`; }
};
const statusColor = (status: InstructorPurchaseRequest["status"]) => status === "approved" ? "green" : status === "rejected" || status === "cancelled" ? "red" : "yellow";

export function InstructorSubscriptionsPage() {
  const { workspace } = useAdminV2();
  const [notice, setNotice] = useState("");
  const requests = useQuery({ queryKey: ["instructor", "purchase-requests"], queryFn: listInstructorPurchaseRequests });
  const brand = workspace.brands[0]?.code ?? "all";
  return <section className="admin-v2__page admin-v2__instructor-subscriptions" aria-label="Instructor subscription purchase requests">
    <Group justify="space-between" align="flex-end" wrap="wrap" mb="md">
      <div><Badge color="green" variant="light" mb={6}>SUBSCRIPTIONS &amp; PURCHASES</Badge><Title order={1}>Subscriptions</Title><Text c="dimmed" size="sm" mt={4}>Create a purchase request for your course students and track the Super Admin's payment decision.</Text></div>
      <Button component="a" href="#instructor-purchase-plans" leftSection={<Plus size={16} />} color="green">Create purchase request</Button>
    </Group>
    <Alert color="blue" variant="light" icon={<Clock3 size={17} />} mb="md" title="Payment approval stays with the Super Admin">You can prepare the student purchase and record real payment details. The request stays pending and does not activate access until the Super Admin approves it.</Alert>
    {notice && <Alert color="green" withCloseButton onClose={() => setNotice("")} mb="md" title="Purchase request submitted">{notice}</Alert>}
    <div id="instructor-purchase-plans"><PurchaseFlow brand={brand} mode="instructor" onInstructorOrderCreated={(order) => { setNotice(`Request ${order.orderId} is waiting for Super Admin payment review.`); void requests.refetch(); }} /></div>

    <Card withBorder shadow="xs" radius="md" p="md" mt="md">
      <Group justify="space-between" mb="sm"><div><Title order={3}>My purchase requests</Title><Text c="dimmed" size="xs" mt={3}>Requests created by your Instructor account.</Text></div><Badge variant="light" color="gray">{requests.data?.items.length ?? 0}</Badge></Group>
      {requests.isLoading ? <Text c="dimmed" py="lg" ta="center">Loading purchase requests…</Text> : requests.isError ? <Alert color="red" icon={<AlertCircle size={16} />} title="Purchase requests could not be loaded">{extractApiErrorMessage(requests.error, "Refresh to try again.")}<Button size="xs" variant="light" ml="sm" onClick={() => void requests.refetch()}>Retry</Button></Alert> : !requests.data?.items.length ? <Stack align="center" py="lg" gap="xs"><ReceiptText size={24} color="var(--mantine-color-green-7)"/><Text fw={600}>No purchase requests yet</Text><Text c="dimmed" size="sm">New requests appear here after you submit a student's purchase.</Text></Stack> : <SimpleGrid cols={{ base: 1, md: 2 }} spacing="sm">{requests.data.items.map((item) => <Card key={item.orderId} withBorder radius="sm" p="sm"><Group justify="space-between" align="flex-start"><div><Text fw={700}>{item.semesterOfferingTitle}</Text><Text size="xs" c="dimmed" mt={3}>{item.students.map((student) => student.fullName).join(", ") || `${item.capacity} seats`} · {new Date(item.createdAt).toLocaleDateString()}</Text></div><Badge color={statusColor(item.status)} variant="light">{item.status === "pending_review" ? "Awaiting payment review" : item.status}</Badge></Group><Group justify="space-between" mt="md"><Text size="xs" c="dimmed">{item.planCode.replace("semester_offering_", "")} seats · {item.students.length} selected</Text><Text fw={700}><CircleDollarSign size={14} style={{ verticalAlign: "-2px", marginRight: 4 }} />{money(item.priceTotalMinor, item.currency)}</Text></Group>{item.status === "rejected" && <Text size="xs" c="red" mt="xs">{item.reviewReason || "The Super Admin declined this payment request."}</Text>}</Card>)}</SimpleGrid>}
    </Card>
  </section>;
}

export default InstructorSubscriptionsPage;
