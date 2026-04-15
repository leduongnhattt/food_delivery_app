"use client";

import { FileText } from "lucide-react";

export function OrderNoteCard(props: {
  note: string;
  noteLimit: number;
  isNoteEditorOpen: boolean;
  onOpenEditor: () => void;
  onCancel: () => void;
  onChangeNote: (next: string) => void;
  onSave: () => void;
}) {
  const noteCount = props.note.length;

  return (
    <div className="flex flex-col gap-6 rounded-xl border border-gray-200 bg-white p-6">
      {!props.isNoteEditorOpen ? (
        <button
          type="button"
          className="flex w-full items-start gap-3 text-left transition-opacity hover:opacity-80"
          onClick={props.onOpenEditor}
        >
          <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563FF]" />
          <div className="flex-1">
            <h3 className="font-medium">Add a Note</h3>
          </div>
        </button>
      ) : (
        <div>
          <div className="mb-4 flex items-start gap-3">
            <FileText className="mt-0.5 h-5 w-5 flex-shrink-0 text-[#2563FF]" />
            <div className="flex-1">
              <h3 className="font-medium">Add a Note</h3>
            </div>
          </div>

          <textarea
            value={props.note}
            onChange={(e) => props.onChangeNote(e.target.value)}
            rows={4}
            placeholder="Note is not visible to buyers"
            className="mb-2 h-24 w-full resize-none rounded border border-gray-300 px-3 py-2 text-sm text-gray-900 placeholder:text-gray-400 focus:border-[#2563FF] focus:outline-none focus:ring-2 focus:ring-[#2563FF]/20"
          />
          <div className="mb-4 flex items-center justify-between">
            <div className="flex-1" />
            <span className="text-sm text-gray-500">
              {noteCount}/{props.noteLimit}
            </span>
          </div>

          <div className="flex justify-end gap-2">
            <button
              type="button"
              className="rounded border border-gray-300 px-3 py-2 text-sm hover:bg-gray-50"
              onClick={props.onCancel}
            >
              Cancel
            </button>
            <button
              type="button"
              className="rounded bg-[#2563FF] px-3 py-2 text-sm text-white hover:bg-[#1d4fd7]"
              onClick={props.onSave}
            >
              Save
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

