
"use client";

import * as React from "react";
import Image from "next/image";
import { CheckingForm } from "@/components/checking-form";
import { PlaceHolderImages } from "@/lib/placeholder-images";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ListChecks, Tv, Radio, Clapperboard, Newspaper, HeartHandshake, Globe, Sparkles, Monitor, Bus, Building, MapPin, Store, FileText, AlertTriangle } from "lucide-react";
import { VideoPlayerDialog } from "@/components/video-player-dialog";

export default function Home() {
  const opusLogo = PlaceHolderImages.find(p => p.id === 'opus-logo');
  const [hoverCount, setHoverCount] = React.useState(0);
  const [showVideo, setShowVideo] = React.useState(false);
  const [videoUrl, setVideoUrl] = React.useState('');

  const handleTitleHover = () => {
    setHoverCount(prevCount => prevCount + 1);
  };

  React.useEffect(() => {
    if (hoverCount === 10) {
      setVideoUrl('https://www.youtube.com/embed/40deWGkGk-4?autoplay=1');
      setShowVideo(true);
      setHoverCount(0); // Reseta para não abrir novamente
    }
  }, [hoverCount]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <main className="flex-1">
        <div className="w-full py-12 sm:py-16 px-4 sm:px-6">
          <div className="mx-auto max-w-3xl">
            <header className="text-center mb-10">
              {opusLogo && (
                <Image
                  src={opusLogo.imageUrl}
                  alt={opusLogo.description}
                  width={360}
                  height={90}
                  className="mx-auto mb-6"
                  priority
                  style={{ aspectRatio: "360 / 90", objectFit: "contain" }}
                />
              )}
              <h1 
                className="font-black text-3xl sm:text-4xl text-foreground cursor-pointer"
                onMouseEnter={handleTitleHover}
              >
                Checking OpusMúltipla
              </h1>
            </header>

            <div className="mb-10 space-y-8">
               <Alert variant="destructive" className="border-red-500/50 text-destructive bg-red-50 [&>svg]:text-red-700">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="font-bold text-destructive/90">Atenção às Regras de Envio!</AlertTitle>
                <AlertDescription>
                    <strong>ATENÇÃO!!:</strong> Múltiplas fotos, vídeos e PDFs devem ser <strong>ZIPADOS</strong>.
                    <br/>
                    <strong>IMPORTANTE:</strong> Arquivos até <strong>500MB</strong> serão enviados diretamente. Para arquivos maiores, o sistema criará uma pasta no Google Drive e você receberá o link por e-mail.
                    <br/><br/>
                    O não envio dos relatórios de acordo com as especificações acarretará no não pagamento das veiculações.
                </AlertDescription>
              </Alert>
              
              <div>
                <div className="flex items-center mb-4">
                  <ListChecks className="mr-3 h-6 w-6 text-primary"/>
                  <h2 className="text-xl font-bold">Lista de Comprovantes por Mídia</h2>
                </div>
                <div className="space-y-4 p-4 bg-muted/50 rounded-md border">
                    <h3 className="font-bold text-lg">DOOH / OOH</h3>
                    <ul className="space-y-3 text-sm list-disc pl-5">
                        <li><strong className="font-semibold flex items-center"><Monitor className="mr-2 h-4 w-4"/>DOOH - Painel de LED (03 anexos):</strong> Relatório fotográfico de todos os pontos, relatório de inserções automatizado, vídeo diurno.</li>
                        <li><strong className="font-semibold flex items-center"><Monitor className="mr-2 h-4 w-4"/>DOOH - Monitores/Mub ou Totem Digital (03 anexos):</strong> Relatório fotográfico amostral, relatório de exibições automatizado, vídeo diurno.</li>
                        <li><strong className="font-semibold flex items-center"><Building className="mr-2 h-4 w-4"/>Mídia Exterior - MUB estático (02 anexos):</strong> Relatório com endereço dos pontos, fotos diurnas (amostrais).</li>
                        <li><strong className="font-semibold flex items-center"><MapPin className="mr-2 h-4 w-4"/>Mídia Exterior - Metrô estático (02 anexos):</strong> Relatório com listagem das estações/linhas/carros, fotos ou vídeos (amostrais).</li>
                        <li><strong className="font-semibold flex items-center"><Bus className="mr-2 h-4 w-4"/>Mídia Exterior - Busdoor/estático (01 anexo):</strong> Relatório com listagem das estações/pontos + fotos de todas as linhas.</li>
                        <li><strong className="font-semibold flex items-center"><Building className="mr-2 h-4 w-4"/>Mídia Exterior - Outdoor, Fronts e outros (01 anexo):</strong> Relatório fotográfico com endereço de todos os pontos. <span className="font-bold ml-1">Para pontos ILUMINADOS, foto noturna é obrigatória.</span></li>
                        <li><strong className="font-semibold flex items-center"><Store className="mr-2 h-4 w-4"/>Mídia Interna estática (01 anexo):</strong> Relatório fotográfico de todos os pontos e relação de locais.</li>
                    </ul>
                    <h3 className="font-bold text-lg mt-4">Outros Meios</h3>
                      <ul className="space-y-3 text-sm list-disc pl-5">
                        <li><strong className="font-semibold flex items-center"><Radio className="mr-2 h-4 w-4"/>Rádio (01 anexo):</strong> Relatório de veiculação automatizado. <span className="font-bold ml-1">Para ações ao vivo, enviar gravação ou relatório especificando ações e horários.</span></li>
                        <li><strong className="font-semibold flex items-center"><Clapperboard className="mr-2 h-4 w-4"/>Cinema (01 anexo):</strong> Relatório de exibição (complexo, nº de salas, praça).</li>
                        <li><strong className="font-semibold flex items-center"><Newspaper className="mr-2 h-4 w-4"/>Mídia Impressa (01 anexo):</strong> Material físico (preferencialmente) + PDF/foto do título com material.</li>
                        <li><strong className="font-semibold flex items-center"><HeartHandshake className="mr-2 h-4 w-4"/>Projetos Especiais (01 anexo):</strong> Relatório fotográfico/vídeos + detalhamento das ações.</li>
                        <li><strong className="font-semibold flex items-center"><Tv className="mr-2 h-4 w-4"/>TV (01 anexo):</strong> Relatório de veiculação automatizado.</li>
                        <li><strong className="font-semibold flex items-center"><Globe className="mr-2 h-4 w-4"/>Internet (01 anexo):</strong> Relatório de veiculação + prints das peças e acompanhamento periódico.</li>
                        <li><strong className="font-semibold flex items-center"><Sparkles className="mr-2 h-4 w-4"/>Ativações (01 anexo):</strong> Relatório fotográfico ou vídeos + detalhamento das ações.</li>
                    </ul>
                </div>
              </div>
            </div>
            
            <Card className="rounded-xl shadow-lg border-border/20">
              <CardContent className="p-6 sm:p-10">
                <CheckingForm />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>

      <footer className="w-full bg-[#333] text-center mt-auto relative">
        <div 
          className="h-2 w-full"
          style={{
            background: 'linear-gradient(90deg, #ef4444 0%, #f59e0b 14.28%, #eab308 28.56%, #10b981 42.84%, #06b6d4 57.12%, #3b82f6 71.4%, #8b5cf6 85.68%, #ec4899 100%)'
          }}
        ></div>
        <div className="py-12 px-6">
            <div className="font-black text-3xl md:text-4xl text-white tracking-[6px] mb-3">
            GRUPO OM
            </div>
            <div className="text-xs font-bold tracking-[5px] uppercase text-white/80 mb-8">
            COMUNICAÇÃO INTEGRADA
            </div>
            <p className="text-xs text-white/60 font-medium">
            &copy; 2025 OpusMúltipla - Todos os direitos reservados
            </p>
        </div>
      </footer>
      
      <VideoPlayerDialog
        open={showVideo}
        onOpenChange={setShowVideo}
        videoUrl={videoUrl}
        title="Um recado do Criador..."
      />
    </div>
  );
}
