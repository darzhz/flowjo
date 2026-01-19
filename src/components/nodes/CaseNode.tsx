import { Handle, Position } from "reactflow";
import { Card } from "../ui/card";
import { CheckCircle2, XCircle } from "lucide-react";

export default function CaseNode({ data, type }: { data: any, type: string }) {
    const isSuccess = type === "caseSuccess";

    return (
        <Card className={`min-w-[150px] p-3 flex items-center gap-2 border shadow-sm ${isSuccess ? "bg-green-50 border-green-200 dark:bg-green-900/20 dark:border-green-800" : "bg-red-50 border-red-200 dark:bg-red-900/20 dark:border-red-800"}`}>
            <Handle type="target" position={Position.Left} className="!bg-gray-400" />

            {isSuccess ? (
                <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
            ) : (
                <XCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
            )}

            <div className="flex flex-col">
                <span className={`text-sm font-semibold ${isSuccess ? "text-green-700 dark:text-green-300" : "text-red-700 dark:text-red-300"}`}>
                    {isSuccess ? "Success" : "Failure"}
                </span>
                <span className="text-[10px] text-muted-foreground">{isSuccess ? "End Flow" : "Stop Flow"}</span>
            </div>
        </Card>
    );
}
