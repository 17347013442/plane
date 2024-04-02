import Placeholder from "@tiptap/extension-placeholder";
import { IssueWidgetPlaceholder } from "src/ui/extensions/widgets/issue-embed-widget";

import { SlashCommandDocumentEditor, DragAndDrop } from "@plane/editor-extensions";
import { UploadImage } from "@plane/editor-document-core";

export const DocumentEditorExtensions = (uploadFile: UploadImage) => [
  SlashCommandDocumentEditor(uploadFile),
  DragAndDrop(),
  Placeholder.configure({
    placeholder: ({ node }) => {
      if (node.type.name === "heading") {
        return `Heading ${node.attrs.level}`;
      }
      if (node.type.name === "image" || node.type.name === "table") {
        return "";
      }

      return "Press '/' for commands...";
    },
    includeChildren: true,
  }),
  IssueWidgetPlaceholder(),
];
