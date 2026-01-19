import { memo } from "react";
import { Handle, Position } from "reactflow";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import { TabulizeNodeData } from "../../types";

export default memo(({ data }: { data: TabulizeNodeData }) => {
    const inputData = Array.isArray(data.input) ? data.input : [];
    const isEmpty = inputData.length === 0;
    // Get keys from first object if available
    const headers = isEmpty ? [] : Object.keys(inputData[0] || {});

    return (
        <Card className="min-w-[300px] max-w-[600px] bg-white border text-foreground dark:bg-gray-900 dark:text-gray-300 border-pink-500 shadow-md">
            <CardHeader className="p-3 pb-2 bg-pink-50 dark:bg-pink-900/20">
                <CardTitle className="text-sm font-medium flex items-center gap-2 text-pink-700 dark:text-pink-400">
                    Tabulize
                </CardTitle>
            </CardHeader>
            <CardContent className="p-0 overflow-hidden">
                <div className="max-h-[300px] overflow-auto">
                    <table className="w-full text-xs text-left">
                        <thead className="bg-muted text-muted-foreground sticky top-0">
                            <tr>
                                {headers.map(h => (
                                    <th key={h} className="px-3 py-2 font-medium border-b">{h}</th>
                                ))}
                                {isEmpty && <th className="px-3 py-2 border-b">Data</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {inputData.map((row, i) => (
                                <tr key={i} className="hover:bg-muted/50">
                                    {headers.map(h => (
                                        <td key={h} className="px-3 py-2 truncate max-w-[150px]">
                                            {typeof row[h] === 'object' ? JSON.stringify(row[h]) : String(row[h])}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                            {isEmpty && (
                                <tr>
                                    <td className="px-3 py-4 text-center text-gray-500 italic">
                                        {data.input ? "Data is not an array" : "No data received"}
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </CardContent>
            <Handle type="target" position={Position.Left} className="w-3 h-3 bg-pink-500" />
        </Card>
    );
});
