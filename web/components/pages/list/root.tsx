import { FC } from "react";
import { observer } from "mobx-react";
// hooks
import { useProjectPages } from "@/hooks/store";
// components
import { PageListBlock } from "./";

type TPagesListRoot = {
  workspaceSlug: string;
  projectId: string;
};

export const PagesListRoot: FC<TPagesListRoot> = observer((props) => {
  const { workspaceSlug, projectId } = props;
  // hooks
  const { pageIds } = useProjectPages(projectId);

  if (!pageIds) return <></>;
  return (
    <div className="relative w-full h-full overflow-hidden overflow-y-auto divide-y-[0.5px] divide-custom-border-200">
      {pageIds.map((pageId) => (
        <PageListBlock key={pageId} workspaceSlug={workspaceSlug} projectId={projectId} pageId={pageId} />
      ))}
    </div>
  );
});