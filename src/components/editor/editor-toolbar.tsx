"use client";

import * as React from "react";
import { type Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Table as TableIcon,
  Minus,
  Undo2,
  Redo2,
  Link as LinkIcon,
  Unlink,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";

interface EditorToolbarProps {
  editor: Editor | null;
  disabled?: boolean;
}

export function EditorToolbar({ editor, disabled }: EditorToolbarProps) {
  if (!editor) return null;

  const setLink = () => {
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("Enter link URL (e.g. https://example.com):", previousUrl);

    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }

    // Disallow dangerous protocols like javascript:
    if (!url.startsWith("http://") && !url.startsWith("https://") && !url.startsWith("mailto:")) {
      alert("Invalid link URL. Protocol must be http, https, or mailto.");
      return;
    }

    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  };

  const insertTable = () => {
    editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run();
  };

  return (
    <div className="flex flex-wrap items-center gap-0.5 border-b border-border bg-card/60 p-1.5 backdrop-blur-xs select-none">
      {/* History */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={() => editor.chain().focus().undo().run()}
            disabled={disabled || !editor.can().undo()}
            aria-label="Undo edit (Ctrl+Z)"
          >
            <Undo2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Undo (Ctrl+Z)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={() => editor.chain().focus().redo().run()}
            disabled={disabled || !editor.can().redo()}
            aria-label="Redo edit (Ctrl+Y)"
          >
            <Redo2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Redo (Ctrl+Y)</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Headings */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 1 }) ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            disabled={disabled}
            aria-label="Heading 1"
          >
            <Heading1 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Heading 1</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 2 }) ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            disabled={disabled}
            aria-label="Heading 2"
          >
            <Heading2 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Heading 2</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("heading", { level: 3 }) ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            disabled={disabled}
            aria-label="Heading 3"
          >
            <Heading3 className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Heading 3</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Formatting Marks */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("bold") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={disabled}
            aria-label="Bold text (Ctrl+B)"
          >
            <Bold className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bold (Ctrl+B)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("italic") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={disabled}
            aria-label="Italic text (Ctrl+I)"
          >
            <Italic className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Italic (Ctrl+I)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("underline") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={disabled}
            aria-label="Underline text (Ctrl+U)"
          >
            <UnderlineIcon className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Underline (Ctrl+U)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("strike") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={disabled}
            aria-label="Strikethrough text"
          >
            <Strikethrough className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Strikethrough</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("code") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleCode().run()}
            disabled={disabled}
            aria-label="Inline code"
          >
            <Code className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Inline Code</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Lists & Quotes */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("bulletList") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            disabled={disabled}
            aria-label="Bullet list"
          >
            <List className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Bullet List</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("orderedList") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            disabled={disabled}
            aria-label="Numbered list"
          >
            <ListOrdered className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Numbered List</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("blockquote") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            disabled={disabled}
            aria-label="Quote block"
          >
            <Quote className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Blockquote</TooltipContent>
      </Tooltip>

      <Separator orientation="vertical" className="mx-1 h-5" />

      {/* Table & Links */}
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={insertTable}
            disabled={disabled}
            aria-label="Insert Table"
          >
            <TableIcon className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Insert Table (3x3)</TooltipContent>
      </Tooltip>

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant={editor.isActive("link") ? "secondary" : "ghost"}
            size="iconSm"
            onClick={setLink}
            disabled={disabled}
            aria-label="Add or edit link"
          >
            <LinkIcon className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Link</TooltipContent>
      </Tooltip>

      {editor.isActive("link") && (
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="iconSm"
              onClick={() => editor.chain().focus().unsetLink().run()}
              disabled={disabled}
              aria-label="Remove link"
            >
              <Unlink className="h-3.5 w-3.5 text-destructive" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove Link</TooltipContent>
        </Tooltip>
      )}

      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="iconSm"
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            disabled={disabled}
            aria-label="Horizontal line"
          >
            <Minus className="h-3.5 w-3.5" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>Horizontal Rule</TooltipContent>
      </Tooltip>
    </div>
  );
}
