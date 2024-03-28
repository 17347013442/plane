import { observer } from "mobx-react";
import { Clipboard, Copy, Link, Lock } from "lucide-react";
import { EditorReadOnlyRefApi, EditorRefApi } from "@plane/document-editor";
import { ArchiveIcon, CustomMenu, TOAST_TYPE, setToast } from "@plane/ui";
import { EUserProjectRoles } from "@/constants/project";
import { copyTextToClipboard, copyUrlToClipboard } from "@/helpers/string.helper";
import { useApplication, useProjectPages, useUser } from "@/hooks/store";
import { IPageStore } from "@/store/pages/page.store";

type Props = {
  editorRef: EditorRefApi | EditorReadOnlyRefApi | null;
  handleDuplicatePage: () => void;
  pageStore: IPageStore;
};

export const PageOptionsDropdown: React.FC<Props> = observer((props) => {
  const { editorRef, handleDuplicatePage, pageStore } = props;
  // store values
  const { lock, unlock, owned_by } = pageStore;
  // store hooks
  const {
    router: { workspaceSlug, projectId },
  } = useApplication();
  const {
    currentUser,
    membership: { currentProjectRole },
  } = useUser();

  const handleArchivePage = async () => {
    if (!workspaceSlug || !projectId) return;
    try {
      await archivePage(workspaceSlug.toString(), projectId.toString(), pageStore.id);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be archived. Please try again later.",
      });
    }
  };

  const handleRestorePage = async () => {
    if (!workspaceSlug || !projectId) return;
    try {
      await restorePage(workspaceSlug.toString(), projectId.toString(), pageStore.id);
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be restored. Please try again later.",
      });
    }
  };

  const handleLockPage = async () => {
    try {
      await lock();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be locked. Please try again later.",
      });
    }
  };

  const handleUnlockPage = async () => {
    try {
      await unlock();
    } catch (error) {
      setToast({
        type: TOAST_TYPE.ERROR,
        title: "Error!",
        message: "Page could not be unlocked. Please try again later.",
      });
    }
  };

  // auth
  const isCurrentUserOwner = owned_by === currentUser?.id;
  const canUserDuplicate = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  const canUserArchive = isCurrentUserOwner || currentProjectRole === EUserProjectRoles.ADMIN;
  const canUserLock = !!currentProjectRole && currentProjectRole >= EUserProjectRoles.MEMBER;
  // menu items list
  const MENU_ITEMS: {
    key: string;
    action: () => void;
    label: string;
    icon: React.FC<any>;
    shouldRender: boolean;
  }[] = [
    {
      key: "copy-markdown",
      action: () => {
        if (!editorRef) return;
        copyTextToClipboard(editorRef.getMarkDown()).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Successful!",
            message: "Markdown copied to clipboard.",
          })
        );
      },
      label: "Copy markdown",
      icon: Clipboard,
      shouldRender: true,
    },
    {
      key: "copy-page-;ink",
      action: () => {
        copyUrlToClipboard(`${workspaceSlug}/projects/${projectId}/pages/${pageStore.id}`).then(() =>
          setToast({
            type: TOAST_TYPE.SUCCESS,
            title: "Successful!",
            message: "Page link copied to clipboard.",
          })
        );
      },
      label: "Copy page link",
      icon: Link,
      shouldRender: true,
    },
    {
      key: "make-a-copy",
      action: handleDuplicatePage,
      label: "Make a copy",
      icon: Copy,
      shouldRender: canUserDuplicate,
    },
    {
      key: "lock-page",
      action: handleLockPage,
      label: "Lock page",
      icon: Lock,
      shouldRender: !pageStore.is_locked && canUserLock,
    },
    {
      key: "unlock-page",
      action: handleUnlockPage,
      label: "Unlock page",
      icon: Lock,
      shouldRender: pageStore.is_locked && canUserLock,
    },
    {
      key: "archive-page",
      action: handleArchivePage,
      label: "Archive page",
      icon: ArchiveIcon,
      shouldRender: !pageStore.archived_at && canUserArchive,
    },
    {
      key: "restore-page",
      action: handleRestorePage,
      label: "Restore page",
      icon: ArchiveIcon,
      shouldRender: !!pageStore.archived_at && canUserArchive,
    },
  ];

  return (
    <CustomMenu maxHeight="md" placement="bottom-start" verticalEllipsis closeOnSelect>
      {MENU_ITEMS.map((item) => {
        if (!item.shouldRender) return null;
        return (
          <CustomMenu.MenuItem key={item.key} onClick={item.action} className="flex items-center gap-2">
            <item.icon className="h-3 w-3" />
            <div className="text-custom-text-300">{item.label}</div>
          </CustomMenu.MenuItem>
        );
      })}
    </CustomMenu>
  );
});