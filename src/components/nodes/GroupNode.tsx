import { NodeResizer } from "reactflow";
import { useState } from "react";

export default function GroupNode({ id, data, selected }: { id: string, data: any, selected: boolean }) {
    const [label, setLabel] = useState(data.label || "Group");

    const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setLabel(e.target.value);
        data.label = e.target.value;
        if (data.onSave) data.onSave(id, data);
    };

    return (
        <div className="h-full w-full min-w-[300px] min-h-[300px] bg-slate-100/50 dark:bg-slate-800/30 border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-lg relative group -z-10 group-node">
            <NodeResizer
                isVisible={selected}
                minWidth={300}
                minHeight={300}
                lineClassName="border-slate-400"
                handleClassName="h-3 w-3 bg-slate-500 border-none rounded"
            />
            <div className="absolute -top-8 left-0">
                <input
                    className="bg-transparent text-lg font-bold text-slate-500 dark:text-slate-400 focus:outline-none focus:text-slate-700 dark:focus:text-slate-200 w-full"
                    value={label}
                    onChange={onChange}
                    onPointerDown={(e) => e.stopPropagation()}
                />
            </div>
            <div className="absolute bottom-2 right-2 text-xs text-slate-300 pointer-events-none">
                Visual Group
            </div>
        </div>
    );
}
