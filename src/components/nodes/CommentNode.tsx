import { NodeResizer } from "reactflow";
import { useState, useEffect } from "react";

export default function CommentNode({ id, data, selected }: { id: string, data: any, selected: boolean }) {
    const [text, setText] = useState(data.text || "");

    const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setText(e.target.value);
        data.text = e.target.value;
        if (data.onSave) data.onSave(id, data);
    };

    return (
        <div className="h-full w-full min-w-[200px] min-h-[100px] bg-yellow-100 dark:bg-yellow-900/40 border border-yellow-300 dark:border-yellow-700 rounded shadow-sm relative group">
            <NodeResizer
                isVisible={selected}
                minWidth={200}
                minHeight={100}
                lineClassName="border-yellow-400"
                handleClassName="h-3 w-3 bg-yellow-500 border-none rounded"
            />
            <div className="h-full w-full p-2 flex flex-col">
                <textarea
                    className="flex-1 w-full bg-transparent border-none resize-none focus:outline-none text-sm font-sans text-yellow-900 dark:text-yellow-100 placeholder-yellow-900/30 dark:placeholder-yellow-100/30"
                    placeholder="Add a note..."
                    value={text}
                    onChange={onChange}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            </div>
        </div>
    );
}
