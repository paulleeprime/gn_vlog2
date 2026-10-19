"use client";

import { useRef, useState } from "react";
import {
  EditorContent,
  useEditor,
  useEditorState,
  type Editor,
  type JSONContent,
} from "@tiptap/react";
import { Placeholder } from "@tiptap/extension-placeholder";
import { postExtensions } from "@/lib/editor/extensions";
import { uploadPostImage } from "@/lib/editor/upload-image";

type Props = {
  userId: string;
  initialContent: JSONContent;
  onChange: (content: JSONContent) => void;
};

export function PostEditor({ userId, initialContent, onChange }: Props) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const editorRef = useRef<Editor | null>(null);

  async function insertImages(files: File[]) {
    const editor = editorRef.current;
    if (!editor || files.length === 0) return;
    setUploading(true);
    setUploadError(null);
    try {
      for (const file of files) {
        const src = await uploadPostImage(file, userId);
        const alt =
          window.prompt("이미지 설명을 입력하세요. 검색과 화면 낭독기가 이 문장을 사용합니다.", "") ??
          "";
        editor.chain().focus().setImage({ src, alt: alt.trim() }).run();
      }
    } catch (e) {
      setUploadError(e instanceof Error ? e.message : "이미지 업로드에 실패했습니다.");
    } finally {
      setUploading(false);
    }
  }

  function imageFilesFrom(list: FileList | null | undefined) {
    return Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));
  }

  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      ...postExtensions,
      Placeholder.configure({ placeholder: "이야기를 들려주세요..." }),
    ],
    content: initialContent,
    editorProps: {
      attributes: { class: "post-content min-h-[50vh] outline-none" },
      handlePaste(_view, event) {
        const files = imageFilesFrom(event.clipboardData?.files);
        if (files.length === 0) return false;
        void insertImages(files);
        return true;
      },
      handleDrop(_view, event) {
        const files = imageFilesFrom(event.dataTransfer?.files);
        if (files.length === 0) return false;
        event.preventDefault();
        void insertImages(files);
        return true;
      },
    },
    onCreate: ({ editor }) => {
      editorRef.current = editor;
    },
    onUpdate: ({ editor }) => onChange(editor.getJSON()),
  });

  return (
    <div className="flex flex-col gap-3">
      {editor && (
        <Toolbar
          editor={editor}
          uploading={uploading}
          onPickImages={(files) => void insertImages(files)}
        />
      )}
      {uploadError && <p className="text-sm text-red-600">{uploadError}</p>}
      <EditorContent editor={editor} />
    </div>
  );
}

function Toolbar({
  editor,
  uploading,
  onPickImages,
}: {
  editor: Editor;
  uploading: boolean;
  onPickImages: (files: File[]) => void;
}) {
  const fileInput = useRef<HTMLInputElement>(null);
  const state = useEditorState({
    editor,
    selector: ({ editor: e }) => ({
      bold: e.isActive("bold"),
      italic: e.isActive("italic"),
      strike: e.isActive("strike"),
      h2: e.isActive("heading", { level: 2 }),
      h3: e.isActive("heading", { level: 3 }),
      bulletList: e.isActive("bulletList"),
      orderedList: e.isActive("orderedList"),
      blockquote: e.isActive("blockquote"),
      codeBlock: e.isActive("codeBlock"),
      link: e.isActive("link"),
    }),
  });

  function toggleLink() {
    if (state.link) {
      editor.chain().focus().unsetLink().run();
      return;
    }
    const url = window.prompt("링크 주소를 입력하세요", "https://");
    if (!url) return;
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }

  const buttons: { label: string; active?: boolean; onClick: () => void }[] = [
    { label: "B", active: state.bold, onClick: () => editor.chain().focus().toggleBold().run() },
    { label: "I", active: state.italic, onClick: () => editor.chain().focus().toggleItalic().run() },
    { label: "S", active: state.strike, onClick: () => editor.chain().focus().toggleStrike().run() },
    { label: "H2", active: state.h2, onClick: () => editor.chain().focus().toggleHeading({ level: 2 }).run() },
    { label: "H3", active: state.h3, onClick: () => editor.chain().focus().toggleHeading({ level: 3 }).run() },
    { label: "• 목록", active: state.bulletList, onClick: () => editor.chain().focus().toggleBulletList().run() },
    { label: "1. 목록", active: state.orderedList, onClick: () => editor.chain().focus().toggleOrderedList().run() },
    { label: "인용", active: state.blockquote, onClick: () => editor.chain().focus().toggleBlockquote().run() },
    { label: "코드", active: state.codeBlock, onClick: () => editor.chain().focus().toggleCodeBlock().run() },
    { label: "링크", active: state.link, onClick: toggleLink },
  ];

  return (
    <div className="sticky top-0 z-10 flex flex-wrap gap-1 border-b border-black/10 bg-background py-2 dark:border-white/15">
      {buttons.map((b) => (
        <button
          key={b.label}
          type="button"
          onClick={b.onClick}
          className={`rounded-md px-2.5 py-1 text-sm ${
            b.active
              ? "bg-foreground text-background"
              : "hover:bg-black/5 dark:hover:bg-white/10"
          }`}
        >
          {b.label}
        </button>
      ))}
      <button
        type="button"
        disabled={uploading}
        onClick={() => fileInput.current?.click()}
        className="rounded-md px-2.5 py-1 text-sm hover:bg-black/5 disabled:opacity-50 dark:hover:bg-white/10"
      >
        {uploading ? "업로드 중..." : "이미지"}
      </button>
      <input
        ref={fileInput}
        type="file"
        accept="image/png,image/jpeg,image/gif,image/webp"
        multiple
        hidden
        onChange={(e) => {
          onPickImages(Array.from(e.target.files ?? []));
          e.target.value = "";
        }}
      />
    </div>
  );
}
