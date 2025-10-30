import { createQueryClient } from "@/trpc/query-client";
import { getTRPCClient } from "@/trpc/server";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";
import { ProjectView } from "./views/project-view";

interface Props {
  projectId: string;
}

export const ProjectViewWrapper = async ({ projectId }: Props) => {
  const queryClient = createQueryClient();
  const trpc = getTRPCClient();

  await queryClient.prefetchQuery(
    trpc.projects.getOne.queryOptions({ id: projectId })
  );
  await queryClient.prefetchQuery(
    trpc.messages.getMany.queryOptions({ projectId })
  );

  return (
    <HydrationBoundary state={dehydrate(queryClient)}>
      <ProjectView projectId={projectId} />
    </HydrationBoundary>
  );
};