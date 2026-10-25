import { Badge, Button, Card, Group, SimpleGrid, Stack, Stepper, Text, ThemeIcon, Title } from "@mantine/core";
import { useMediaQuery } from "@mantine/hooks";
import type { LucideIcon } from "lucide-react";
import { Link } from "react-router-dom";

export interface WorkspaceWorkflowStep {
  title: string;
  detail: string;
  action: string;
  to: string;
  icon: LucideIcon;
}

export function WorkspaceWorkflow({
  eyebrow,
  title,
  description,
  steps,
}: {
  eyebrow: string;
  title: string;
  description: string;
  steps: WorkspaceWorkflowStep[];
}) {
  const compact = useMediaQuery("(max-width: 48em)");
  return (
    <section className="admin-v2__workflow" aria-labelledby="workspace-workflow-title">
      <Group className="admin-v2__workflow-heading" justify="space-between" align="flex-end" wrap="wrap">
        <Stack gap={5}>
          <Badge variant="light" color="green" w="fit-content" size="sm">{eyebrow}</Badge>
          <Title id="workspace-workflow-title" order={2}>{title}</Title>
          <Text c="dimmed" size="sm">{description}</Text>
        </Stack>
        <Text className="admin-v2__workflow-note" size="xs">Recommended order · open a step to get started</Text>
      </Group>

      <Card className="admin-v2__workflow-sequence" withBorder shadow="xs" p="md">
        <Stepper active={0} allowNextStepsSelect={false} orientation={compact ? "vertical" : "horizontal"} size="sm" aria-label={`${title} sequence`}>
          {steps.map((step) => {
            const Icon = step.icon;
            return <Stepper.Step key={step.title} label={step.title} description={step.detail} icon={<Icon size={15} />} />;
          })}
        </Stepper>
      </Card>

      <SimpleGrid className="admin-v2__workflow-actions" cols={{ base: 1, sm: 2, lg: steps.length >= 5 ? 3 : steps.length >= 4 ? 4 : steps.length }} spacing="sm">
        {steps.map((step, index) => {
          const Icon = step.icon;
          return (
            <Card key={step.title} className="admin-v2__workflow-action" withBorder shadow="xs" p="md">
              <Group justify="space-between" align="flex-start" wrap="nowrap">
                <ThemeIcon variant="light" color="green" size={42} radius="md"><Icon size={20} /></ThemeIcon>
                <Badge variant="light" color={index === 0 ? "green" : "gray"}>{index === 0 ? "Start here" : `Step ${index + 1}`}</Badge>
              </Group>
              <Stack gap={6} mt="md" mb="md" className="admin-v2__workflow-action-copy">
                <Text fw={700} size="sm">{step.title}</Text>
                <Text c="dimmed" size="xs" lh={1.55}>{step.detail}</Text>
              </Stack>
              <Button component={Link} to={step.to} variant={index === 0 ? "filled" : "light"} color="green" fullWidth mt="auto">
                {step.action}
              </Button>
            </Card>
          );
        })}
      </SimpleGrid>
    </section>
  );
}
