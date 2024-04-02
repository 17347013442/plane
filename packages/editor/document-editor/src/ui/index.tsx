import React from "react";
import {
  UploadImage,
  DeleteImage,
  RestoreImage,
  getEditorClassNames,
  useEditor,
  EditorRefApi,
} from "@plane/editor-document-core";
import { DocumentEditorExtensions } from "src/ui/extensions";
import { useEditorMarkings } from "src/hooks/use-editor-markings";
import { PageRenderer } from "src/ui/components/page-renderer";
import { IMentionHighlight, IMentionSuggestion } from "@plane/editor-core";

interface IDocumentEditor {
  title: string;
  value: string;
  fileHandler: {
    cancel: () => void;
    delete: DeleteImage;
    upload: UploadImage;
    restore: RestoreImage;
  };
  handleEditorReady?: (value: boolean) => void;
  customClassName?: string;
  editorContentCustomClassNames?: string;
  onChange: (json: object, html: string) => void;
  forwardedRef?: React.MutableRefObject<EditorRefApi | null>;
  mentionHighlights: () => Promise<IMentionHighlight[]>;
  mentionSuggestions: () => Promise<IMentionSuggestion[]>;
  updatePageTitle: (title: string) => void;
  tabIndex?: number;
}

const DocumentEditor = (props: IDocumentEditor) => {
  const {
    title,
    onChange,
    editorContentCustomClassNames,
    value,
    fileHandler,
    customClassName,
    mentionHighlights,
    mentionSuggestions,
    handleEditorReady,
    forwardedRef,
    updatePageTitle,
    tabIndex,
  } = props;

  const { updateMarkings } = useEditorMarkings();

  const editor = useEditor({
    onChange(json, html) {
      updateMarkings(html);
      onChange(json, html);
    },
    onStart(_json, html) {
      updateMarkings(html);
    },
    restoreFile: fileHandler.restore,
    value,
    uploadFile: fileHandler.upload,
    handleEditorReady,
    deleteFile: fileHandler.delete,
    cancelUploadImage: fileHandler.cancel,
    forwardedRef,
    mentionHighlights,
    mentionSuggestions,
    extensions: DocumentEditorExtensions(fileHandler.upload),
  });

  if (!editor) {
    return null;
  }

  const editorClassNames = getEditorClassNames({
    noBorder: true,
    borderOnFocus: false,
    customClassName,
  });

  return (
    <PageRenderer
      tabIndex={tabIndex}
      readonly={false}
      editor={editor}
      editorContentCustomClassNames={editorContentCustomClassNames}
      editorClassNames={editorClassNames}
      title={title}
      updatePageTitle={updatePageTitle}
    />
  );
};

const DocumentEditorWithRef = React.forwardRef<EditorRefApi, IDocumentEditor>((props, ref) => (
  <DocumentEditor {...props} forwardedRef={ref as React.MutableRefObject<EditorRefApi | null>} />
));

DocumentEditorWithRef.displayName = "DocumentEditorWithRef";

export { DocumentEditor, DocumentEditorWithRef };
