import { useState, useEffect } from "react";
import { invoke } from "@tauri-apps/api/core";
import { Button } from "./ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "./ui/dialog";
import { KeyValueList } from "./ui/key-value-list";
import { Settings } from "lucide-react";

export function EnvironmentManager({ open: controlledOpen, onOpenChange }: { open?: boolean, onOpenChange?: (open: boolean) => void }) {
    const [internalOpen, setInternalOpen] = useState(false);
    const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
    const setOpen = onOpenChange || setInternalOpen;
    const [env, setEnv] = useState<Record<string, string>>({});

    useEffect(() => {
        if (open) {
            invoke("load_environment")
                .then((res: any) => setEnv(res || {}))
                .catch(console.error);
        }
    }, [open]);

    const handleSave = async () => {
        try {
            await invoke("save_environment", { env });
            setOpen(false);
        } catch (error) {
            console.error("Failed to save env", error);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="ghost" size="icon" className="hidden">
                    <Settings className="h-5 w-5 text-gray-400 hover:text-white" />
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] bg-white dark:bg-gray-900 border-gray-700 text-foreground">
                <DialogHeader>
                    <DialogTitle>Global Environment</DialogTitle>
                    <DialogDescription>
                        Manage global variables to use in your flow. Access them via{" "}
                        <code className="bg-muted px-1 rounded">{"{{variableName}}"}</code>.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4">
                    <KeyValueList
                        initialData={env}
                        onChange={setEnv}
                        placeholderKey="VARIABLE_NAME"
                        placeholderValue="Value"
                    />
                </div>
                <div className="flex justify-end">
                    <Button onClick={handleSave}>Save Changes</Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
