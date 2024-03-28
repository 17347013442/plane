// constants
import { EUserProjectRoles } from "constants/project";
import { useEffect } from "react";
import { observer } from "mobx-react";
import { useRouter } from "next/router";
import { Control, Controller } from "react-hook-form";
// document editor
import {
  DocumentEditorWithRef,
  DocumentReadOnlyEditorWithRef,
  EditorReadOnlyRefApi,
  EditorRefApi,
  IMarking,
} from "@plane/document-editor";
// types
import { TPage } from "@plane/types";
// components
import { PageContentBrowser } from "@/components/pages";
// helpers
import { cn } from "@/helpers/common.helper";
// hooks
import { useUser, useWorkspace } from "@/hooks/store";
import useReloadConfirmations from "@/hooks/use-reload-confirmation";
// services
import { FileService } from "@/services/file.service";
// store
import { IPageStore } from "@/store/pages/page.store";

const fileService = new FileService();

type Props = {
  control: Control<TPage, any>;
  editorRef: React.RefObject<EditorRefApi>;
  readOnlyEditorRef: React.RefObject<EditorReadOnlyRefApi>;
  handleSubmit: () => void;
  markings: IMarking[];
  pageStore: IPageStore;
  sidePeekVisible: boolean;
  handleEditorReady: (value: boolean) => void;
  handleReadOnlyEditorReady: (value: boolean) => void;
  updateMarkings: (description_html: string) => void;
};

export const PageEditorBody: React.FC<Props> = observer((props) => {
  const {
    control,
    handleReadOnlyEditorReady,
    handleEditorReady,
    editorRef,
    markings,
    readOnlyEditorRef,
    handleSubmit,
    pageStore,
    sidePeekVisible,
    updateMarkings,
  } = props;

  // router
  const router = useRouter();
  const { workspaceSlug } = router.query;
  // store hooks
  const {
    membership: { currentProjectRole },
  } = useUser();
  const { getWorkspaceBySlug } = useWorkspace();
  // derived values
  const workspaceId = getWorkspaceBySlug(workspaceSlug?.toString() ?? "")?.id ?? "";
  const pageTitle = pageStore?.name ?? "";
  const pageDescription = pageStore?.description_html ?? "<p></p>";
  const { description_html, is_locked, archived_at, updateName, isSubmitting, setIsSubmitting } = pageStore;

  const { setShowAlert } = useReloadConfirmations(isSubmitting === "submitting");

  useEffect(() => {
    updateMarkings(description_html ?? "<p></p>");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // auth
  const isPageReadOnly =
    is_locked || archived_at || (!!currentProjectRole && currentProjectRole <= EUserProjectRoles.VIEWER);

  return (
    <div className="flex items-center h-full w-full overflow-y-auto">
      <div
        className={cn(
          "sticky top-0 hidden h-full w-56 flex-shrink-0 -translate-x-full p-5 duration-200 md:block lg:w-72",
          {
            "translate-x-0": sidePeekVisible,
          }
        )}
      >
        <PageContentBrowser
          editorRef={isPageReadOnly ? readOnlyEditorRef.current : editorRef.current}
          markings={markings}
        />
      </div>
      <div className="h-full w-full pt-5 px-5 md:w-[calc(100%-14rem)] md:pr-0 lg:w-[calc(100%-18rem-18rem)]">
        {isPageReadOnly ? (
          <DocumentReadOnlyEditorWithRef
            ref={readOnlyEditorRef}
            title={pageTitle}
            value={pageDescription}
            handleEditorReady={handleReadOnlyEditorReady}
            customClassName="tracking-tight w-full px-0 !border-none"
          />
        ) : (
          <Controller
            name="description_html"
            control={control}
            render={({ field: { onChange } }) => (
              <DocumentEditorWithRef
                title={pageTitle}
                fileHandler={{
                  cancel: fileService.cancelUpload,
                  delete: fileService.getDeleteImageFunction(workspaceId),
                  restore: fileService.getRestoreImageFunction(workspaceId),
                  upload: fileService.getUploadFileFunction(workspaceSlug as string, setIsSubmitting),
                }}
                handleEditorReady={handleEditorReady}
                value={pageDescription}
                ref={editorRef}
                updatePageTitle={updateName}
                customClassName="tracking-tight self-center h-full w-full right-[0.675rem]"
                onChange={(_description_json, description_html) => {
                  setIsSubmitting("submitting");
                  setShowAlert(true);
                  onChange(description_html);
                  handleSubmit();
                  updateMarkings(description_html);
                }}
              />
            )}
          />
        )}
      </div>
      <div className="hidden h-full w-56 flex-shrink-0 lg:block lg:w-72" />
    </div>
  );
});
