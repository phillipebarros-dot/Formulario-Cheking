
"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface VideoPlayerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  videoUrl: string;
  title: string;
  description?: string;
}

export function VideoPlayerDialog({
  open,
  onOpenChange,
  videoUrl,
  title,
  description,
}: VideoPlayerDialogProps) {
  // Garante que a URL do vídeo seja recarregada quando a caixa de diálogo for aberta
  // Isso é importante para que o autoplay funcione de forma consistente
  const [internalVideoUrl, setInternalVideoUrl] = React.useState('');

  React.useEffect(() => {
    if (open) {
      setInternalVideoUrl(videoUrl);
    } else {
      // Pausa o vídeo limpando a URL quando o dialog fecha
      setInternalVideoUrl('');
    }
  }, [open, videoUrl]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[625px] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle>{title}</DialogTitle>
          {description && (
            <DialogDescription>{description}</DialogDescription>
          )}
        </DialogHeader>
        <div className="aspect-video">
          {open && ( // Renderiza o iframe apenas quando o dialog está aberto
            <iframe
              className="w-full h-full"
              src={internalVideoUrl}
              title="YouTube video player"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            ></iframe>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    