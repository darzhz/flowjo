import { Handle, Position } from "reactflow";
import { Card } from "../ui/card";
import { Badge } from "../ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Image as ImageIcon } from "lucide-react";
import { Button } from "../ui/button";

export interface CarouselNodeData {
    items?: any[];
    executionResult?: {
        status: string;
        output: any;
    };
}

export default function CarouselNode({ data }: { data: CarouselNodeData }) {
    const [index, setIndex] = useState(0);

    // Robust data extraction
    let items: any[] = [];
    const executionOutput = data.executionResult?.output;

    if (executionOutput) {
        if (Array.isArray(executionOutput)) {
            items = executionOutput;
        } else if (executionOutput.items && Array.isArray(executionOutput.items)) {
            items = executionOutput.items;
        } else if (executionOutput.data && Array.isArray(executionOutput.data)) {
            items = executionOutput.data;
        } else if (executionOutput.data) {
            items = [executionOutput.data];
        }
    } else if (data.items && Array.isArray(data.items)) {
        items = data.items;
    }

    // Flatten in case of nested arrays (e.g. from Loop accumulation)
    items = items.flat();

    console.log("Carousel Items:", items);

    const images = items.map((item: any) => {
        if (typeof item === 'string') return item;
        // Check various common image keys
        return item.url || item.image_url || item.src || item.link || item.thumbnail || "";
    }).filter(url => url !== "" && (url.startsWith("http") || url.startsWith("data:")));

    console.log(images);
    const next = () => setIndex((i) => (i + 1) % images.length);
    const prev = () => setIndex((i) => (i - 1 + images.length) % images.length);

    useEffect(() => {
        if (index >= images.length && images.length > 0) {
            setIndex(0);
        }
    }, [images.length]);

    return (
        <Card className="min-w-[320px] w-[350px] bg-white shadow-xl dark:bg-gray-950 overflow-hidden border-2 border-indigo-500/30 ring-1 ring-primary/10">
            <Handle type="target" position={Position.Top} className="w-3 h-3 bg-indigo-500" />

            <div className="p-3 border-b dark:border-gray-800 bg-muted/20 flex items-center justify-between">
                <Badge variant="outline" className="text-indigo-400 border-indigo-500/50 flex gap-1 items-center px-1.5 py-0.5">
                    <ImageIcon className="h-3 w-3" /> CAROUSEL
                </Badge>
                <span className="text-[10px] font-medium text-muted-foreground">
                    {images.length > 0 ? `${index + 1} / ${images.length}` : "No images"}
                </span>
            </div>

            <div className="relative aspect-video bg-black/5 dark:bg-black/40 flex items-center justify-center group">
                <AnimatePresence mode="wait">
                    {images.length > 0 ? (
                        <motion.img
                            key={images[index]}
                            src={images[index]}
                            initial={{ opacity: 0, scale: 0.95, x: 20 }}
                            animate={{ opacity: 1, scale: 1, x: 0 }}
                            exit={{ opacity: 0, scale: 1.05, x: -20 }}
                            transition={{ duration: 0.3 }}
                            className="w-full h-full object-contain"
                            referrerPolicy="no-referrer"
                        />
                    ) : (
                        <div className="flex flex-col items-center gap-2 text-muted-foreground group">
                            <ImageIcon className="h-8 w-8 opacity-20 group-hover:opacity-40 transition-opacity" />
                            <span className="text-xs italic">Waiting for data...</span>
                        </div>
                    )}
                </AnimatePresence>

                {images.length > 1 && (
                    <>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute left-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full bg-black/10 hover:bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={prev}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8 p-0 rounded-full bg-black/10 hover:bg-black/30 text-white opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={next}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </>
                )}
            </div>

            {images.length > 0 && typeof items[index] === 'object' && (
                <div className="p-3 text-[10px] space-y-1 border-t dark:border-gray-800">
                    {Object.entries(items[index]).slice(0, 3).map(([k, v]) => (
                        k !== 'url' && k !== 'src' && (
                            <div key={k} className="flex gap-2 truncate">
                                <span className="font-bold uppercase text-[9px] text-muted-foreground w-12">{k}:</span>
                                <span className="truncate">{String(v)}</span>
                            </div>
                        )
                    ))}
                </div>
            )}

            <Handle type="source" position={Position.Bottom} className="w-3 h-3 bg-indigo-500 opacity-20" />
        </Card>
    );
}
