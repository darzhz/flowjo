import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import { ChevronLeft, ChevronRight, FileJson, RefreshCw, Variable } from "lucide-react";
import { ScrollArea } from "./ui/scroll-area";
import { cn } from "../lib/utils";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

interface FilesSidebarProps {
    onLoadFlow: (path: string) => void;
    variables: Record<string, any>;
}

export function FilesSidebar({ onLoadFlow, variables }: FilesSidebarProps) {
    const [isOpen, setIsOpen] = useState(false); // Default closed
    const [files, setFiles] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);

    const refreshFiles = async () => {
        setLoading(true);
        try {
            const res = await invoke<string[]>("list_flows");
            setFiles(res.sort());
        } catch (e) {
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen) {
            refreshFiles();
        }
    }, [isOpen]);

    const varEntries = Object.entries(variables);

    return (
        <div
            className={cn(
                "relative flex flex-col h-full bg-white dark:bg-gray-900 border-r dark:border-gray-800 transition-all duration-300 z-10 shadow-xl",
                isOpen ? "w-64" : "w-0 border-none"
            )}
        >
            <Button
                variant="secondary"
                size="icon"
                className="absolute -right-8 top-4 z-50 h-8 w-8 rounded-l-none shadow-md"
                onClick={() => setIsOpen(!isOpen)}
            >
                {isOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
            </Button>

            {isOpen && (
                <Tabs defaultValue="files" className="flex flex-col h-full">
                    <div className="p-2 border-b dark:border-gray-800">
                        <TabsList className="grid w-full grid-cols-2 h-8">
                            <TabsTrigger value="files" className="text-[10px]">Files</TabsTrigger>
                            <TabsTrigger value="vars" className="text-[10px]">Variables</TabsTrigger>
                        </TabsList>
                    </div>

                    <TabsContent value="files" className="flex-1 flex flex-col m-0 overflow-hidden">
                        <div className="p-3 border-b dark:border-gray-800 flex items-center justify-between">
                            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Flows</h2>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={refreshFiles} disabled={loading}>
                                <RefreshCw className={cn("h-3 w-3", loading && "animate-spin")} />
                            </Button>
                        </div>

                        <ScrollArea className="flex-1 p-2">
                            <div className="space-y-1">
                                {files.map((file) => (
                                    <Button
                                        key={file}
                                        variant="ghost"
                                        className="w-full justify-start text-xs h-8 px-2 truncate"
                                        title={file}
                                        onClick={() => onLoadFlow(file)}
                                    >
                                        <FileJson className="h-3 w-3 mr-2 text-blue-500 shrink-0" />
                                        <span className="truncate">{file}</span>
                                    </Button>
                                ))}
                                {files.length === 0 && !loading && (
                                    <div className="text-xs text-muted-foreground p-4 text-center">
                                        No .json files found
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>

                    <TabsContent value="vars" className="flex-1 flex flex-col m-0 overflow-hidden">
                        <div className="p-3 border-b dark:border-gray-800">
                            <h2 className="font-semibold text-xs text-muted-foreground uppercase tracking-wider">Runtime State</h2>
                        </div>
                        <ScrollArea className="flex-1 p-2">
                            <div className="space-y-2">
                                {varEntries.length > 0 ? (
                                    varEntries.map(([k, v]) => (
                                        <div key={k} className="p-2 rounded bg-muted/50 border dark:border-gray-800">
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Variable className="h-3 w-3 text-purple-500" />
                                                <span className="text-[11px] font-mono font-bold text-foreground">{k}</span>
                                            </div>
                                            <div className="text-[10px] font-mono break-all text-muted-foreground bg-white/50 dark:bg-black/20 p-1 rounded border dark:border-gray-900">
                                                {typeof v === 'object' ? JSON.stringify(v) : String(v)}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-[11px] text-muted-foreground p-4 text-center italic">
                                        No variables captured yet. Run the flow to populate.
                                    </div>
                                )}
                            </div>
                        </ScrollArea>
                    </TabsContent>
                </Tabs>
            )}
        </div>
    );
}
