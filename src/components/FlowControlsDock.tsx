import { IconBox, IconLock, IconLockOpen, IconRefresh, IconZoomIn, IconZoomOut } from "@tabler/icons-react";
import { useReactFlow } from "reactflow";
import { FloatingDock } from "./ui/floating-dock";
import { useState } from "react";
import { Moon, Play, Sun } from "lucide-react";
import useThemes from "../hooks/useThemes";

export const FlowControlsDock = ({ className }: { className?: string }) => {
    // const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { setNodes, zoomIn, zoomOut, fitView } = useReactFlow();
    const [locked, setLocked] = useState(false);
    const { theme, toggleTheme } = useThemes()

    
      const runFlow = () => {
        console.log("Run flow");
      };

    const toggleLock = () => {
      setLocked((prev) => !prev);
  
      if (!locked) {
        // Lock: Disable node dragging
        setNodes((nodes) => nodes.map((node) => ({ ...node, draggable: false })));
      } else {
        // Unlock: Enable node dragging
        setNodes((nodes) => nodes.map((node) => ({ ...node, draggable: true })));
      }
    };
  
    const items = [
      { title: "Zoom In", icon: <IconZoomIn />, action: () => zoomIn() },
      { title: "Zoom Out", icon: <IconZoomOut />, action: () => zoomOut() },
      { title: "Reset", icon: <IconRefresh />, action: () => fitView({ duration: 1000 }) },
      { title: "Run flow", icon:<Play className="h-4 w-4 mr-1" />, action: () => runFlow() },
      {
        title: locked ? "Unlock Flow" : "Lock Flow",
        icon: locked ? <IconLock /> : <IconLockOpen />,
        action: toggleLock,
      },
      { title: "Fit View", icon: <IconBox />, action: () => fitView() },
      { title: "Toggle Night Mode", icon: theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />, action: toggleTheme },

    ];
  
    return <FloatingDock items={items} desktopClassName={className} mobileClassName="translate-y-20" />;
  };