
"use client";

import * as React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import {
    Building2, CalendarDays, FileText, Globe, Hash, Mail, Megaphone,
    Monitor, Package, Paperclip, Phone, User, CheckCircle2, Search,
    Loader2, UploadCloud, File, X, Info, AlertCircle, MapPinned
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Form, FormControl, FormField, FormItem, FormLabel, FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { fetchPIsByCNPJ, fetchPIData, type PIData, type PIInfo } from "@/app/actions";
import { meioOptions, uploadGroupsConfig } from "@/lib/form-config";
import { cn } from "@/lib/utils";
import { Separator } from "./ui/separator";
import { RadioGroup, RadioGroupItem } from "./ui/radio-group";

const MAX_TOTAL_SIZE = 500 * 1024 * 1024; // 500MB
const WEBHOOK_URL = process.env.NEXT_PUBLIC_N8N_WEBHOOK_URL || 'https://n8n.grupoom.com.br/webhook/CheckingCentral';


const formSchema = z.object({
    nome: z.string().min(3, "Nome deve ter no mínimo 3 caracteres.").max(200),
    email: z.string().email("E-mail inválido.").max(254),
    telefone: z.string().min(10, "Telefone inválido.").max(20),
    cnpj: z.string().min(14, "CNPJ deve ter 14 números.").max(18),
    n_pi: z.string().min(1, "Selecione uma PI."),
    enderecos_manuais: z.string().max(5000).optional(), // Novo campo para endereços
    observacoes: z.string().max(2000).optional(),
});

type FormValues = z.infer<typeof formSchema>;

const StepTitle = ({ number, title, disabled = false }: { number: number; title: string, disabled?: boolean }) => (
    <div className={cn("flex items-center gap-4 mb-6", disabled && "opacity-50")}>
        <div className={cn("flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground font-bold text-lg", disabled && "bg-muted-foreground")}>{number}</div>
        <h2 className="text-xl font-bold text-foreground">{title}</h2>
    </div>
);

export function CheckingForm() {
    const { toast } = useToast();
    const [piData, setPiData] = React.useState<PIData | null>(null);
    const [piList, setPiList] = React.useState<PIInfo[]>([]);
    const [submittedPIs, setSubmittedPIs] = React.useState<string[]>([]);

    const [isFetchingPIS, setIsFetchingPIs] = React.useState(false);
    const [isFetchingPIData, setIsFetchingPIData] = React.useState(false);
    
    const [cnpjError, setCnpjError] = React.useState<string | null>(null);

    const [fileInputs, setFileInputs] = React.useState<Record<string, FileList | null>>({});
    const [fileStats, setFileStats] = React.useState({ count: 0, totalSize: 0 });
    
    const [submissionState, setSubmissionState] = React.useState<{
        isSubmitting: boolean;
        progress: number;
        info: string;
        successMessage: string | null;
        errorMessage: string | null;
    }>({ isSubmitting: false, progress: 0, info: "", successMessage: null, errorMessage: null });

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            nome: "", email: "", telefone: "", cnpj: "", n_pi: "", observacoes: "", enderecos_manuais: ""
        },
    });

    const cnpjValue = form.watch("cnpj");

    React.useEffect(() => {
        const handler = setTimeout(() => {
            if (cnpjValue && cnpjValue.replace(/[^\d]/g, '').length === 14) {
                handleCNPJFetch(cnpjValue);
            } else {
                resetCnpjFields();
            }
        }, 800);

        return () => clearTimeout(handler);
    }, [cnpjValue]);
    
    React.useEffect(() => {
        let count = 0;
        let totalSize = 0;
        Object.values(fileInputs).forEach(fileList => {
            if (fileList) {
                for (let i = 0; i < fileList.length; i++) {
                    count++;
                    totalSize += fileList[i].size;
                }
            }
        });
        setFileStats({ count, totalSize });
    }, [fileInputs]);

    const handleCNPJFetch = async (cnpj: string) => {
        setIsFetchingPIs(true);
        setCnpjError(null);
        const result = await fetchPIsByCNPJ(cnpj);
        if (result.success && result.pis && result.pis.length > 0) {
            setPiList(result.pis);
        } else {
            setPiList([]);
            setCnpjError(result.error || "Nenhuma PI encontrada para este CNPJ.");
        }
        resetPiFields();
        form.setValue('n_pi', '');
        setIsFetchingPIs(false);
    };

    const handlePISelect = async (pi: string) => {
        if (!pi) return;
        form.setValue('n_pi', pi);
        setIsFetchingPIData(true);
        const result = await fetchPIData(pi);
        setPiData(result);
        if (!result.success) {
            toast({ variant: "destructive", title: "Erro ao buscar PI", description: result.error || "Não foi possível carregar os dados da PI." });
            resetPiFields();
        }
        setIsFetchingPIData(false);
    };
    
    const resetCnpjFields = () => {
        setPiList([]);
        setCnpjError(null);
        setSubmittedPIs([]);
        resetPiFields();
        form.setValue('n_pi', '');
    };

    const resetPiFields = () => {
        setPiData(null);
        setFileInputs({});
    };
    
    const resetFormForNewSubmission = (submittedPi: string) => {
        setSubmittedPIs(prev => [...prev, submittedPi]);
        form.reset({
            ...form.getValues(),
            n_pi: '', 
            observacoes: '',
            enderecos_manuais: ''
        });
        setPiData(null);
        setFileInputs({});
        setFileStats({ count: 0, totalSize: 0 });
        setSubmissionState({ isSubmitting: false, progress: 0, info: "", successMessage: null, errorMessage: null });

        if(piList.length === submittedPIs.length + 1) {
             setPiList([]);
             setCnpjError("Todas as PIs para este CNPJ já foram enviadas.");
        }
    };
    
    const fullReset = () => {
        form.reset();
        setPiData(null);
        setPiList([]);
        setSubmittedPIs([]);
        setCnpjError(null);
        setFileInputs({});
        setFileStats({ count: 0, totalSize: 0 });
        setSubmissionState({ isSubmitting: false, progress: 0, info: "", successMessage: null, errorMessage: null });
    }

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, files } = e.target;
        setFileInputs(prev => ({ ...prev, [name]: files }));
    };
    
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
    };

    const handleFormSubmit = (data: FormValues) => {
        setSubmissionState({ isSubmitting: true, progress: 0, info: "Preparando envio...", successMessage: null, errorMessage: null });
        
        const visibleUploadGroups = uploadGroupsConfig.filter(g => g.meios.includes(piData?.meio ?? ''));
        const requiredInputs = visibleUploadGroups.filter(g => g.label.includes('*'));
        const missingFile = requiredInputs.some(g => !fileInputs[g.name] || fileInputs[g.name]?.length === 0);
        
        // Validação específica para Mídia Exterior
        if (['ME', 'OD', 'FL'].includes(piData?.meio ?? '') && !data.enderecos_manuais && (!fileInputs['relatorio_enderecos_me'] || fileInputs['relatorio_enderecos_me']?.length === 0)) {
            toast({
                variant: "destructive",
                title: "Endereços Faltando",
                description: "Para este tipo de mídia, anexe um 'Relatório de Endereços' ou preencha a lista de endereços manualmente.",
            });
            setSubmissionState(prev => ({ ...prev, isSubmitting: false }));
            return;
        }

        if (missingFile) {
            toast({ variant: "destructive", title: "Erro de Validação", description: "Anexe todos os comprovantes obrigatórios (*)." });
            setSubmissionState(prev => ({ ...prev, isSubmitting: false }));
            return;
        }

        const formData = new FormData();
        formData.append('action', 'submissao_form');
        formData.append('nome', data.nome);
        formData.append('email', data.email);
        formData.append('telefone', data.telefone);
        formData.append('n_pi', data.n_pi);
        formData.append('observacoes', data.observacoes || '');
        formData.append('enderecos_manuais', data.enderecos_manuais || '');

        formData.append('cliente', piData?.cliente || '');
        formData.append('campanha', piData?.campanha || '');
        formData.append('produto', piData?.produto || '');
        formData.append('periodo', piData?.periodo || '');
        formData.append('veiculo', piData?.veiculo || '');
        formData.append('meio', piData?.meio || '');
        
        formData.append('upload_method', 'binary');
        
        Object.entries(fileInputs).forEach(([name, fileList]) => {
            if (fileList) {
                for (let i = 0; i < fileList.length; i++) {
                    formData.append(name, fileList[i]);
                }
            }
        });

        const xhr = new XMLHttpRequest();
        xhr.open('POST', WEBHOOK_URL, true);

        xhr.upload.onprogress = (event) => {
            if (event.lengthComputable) {
                const percentComplete = Math.round((event.loaded / event.total) * 100);
                setSubmissionState(prev => ({ 
                    ...prev, 
                    progress: percentComplete, 
                    info: `Enviando: ${formatFileSize(event.loaded)} de ${formatFileSize(event.total)}`
                }));
            }
        };

        xhr.onload = () => {
            setSubmissionState(prev => ({ ...prev, isSubmitting: false }));
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const result = JSON.parse(xhr.responseText);
                    if(result.success) {
                        setSubmissionState(prev => ({ ...prev, successMessage: `Checking para a PI ${data.n_pi} enviado com sucesso! Você pode selecionar outra PI.` }));
                        setTimeout(() => resetFormForNewSubmission(data.n_pi), 5000);
                    } else {
                        throw new Error(result.message || 'Ocorreu um erro no servidor.');
                    }
                } catch (e) {
                     setSubmissionState(prev => ({...prev, errorMessage: (e as Error).message}));
                }
            } else {
                setSubmissionState(prev => ({...prev, errorMessage: `O servidor respondeu com o erro ${xhr.status}. Tente novamente.`}));
            }
        };

        xhr.onerror = () => {
            setSubmissionState(prev => ({...prev, isSubmitting: false, errorMessage: "Não foi possível conectar ao servidor. Verifique sua rede e tente novamente."}));
        };
        
        xhr.send(formData);
    }

    if (submissionState.successMessage && !submissionState.isSubmitting) {
        return (
            <div className="text-center">
                 <CheckCircle2 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                <AlertTitle className="font-bold text-2xl mb-2">Sucesso!</AlertTitle>
                <AlertDescription className="text-lg">
                    {submissionState.successMessage}
                </AlertDescription>
                 <Button onClick={fullReset} className="mt-8">Buscar outro CNPJ</Button>
            </div>
        )
    }

    if(submissionState.errorMessage) {
        return (
            <div className="text-center">
                 <AlertCircle className="h-16 w-16 text-destructive mx-auto mb-4" />
                <AlertTitle className="font-bold text-2xl mb-2">Ocorreu um Erro</AlertTitle>
                <AlertDescription className="text-lg mb-8">
                    {submissionState.errorMessage}
                </AlertDescription>
                <Button onClick={() => setSubmissionState(s => ({...s, errorMessage: null, isSubmitting: false}))} variant="outline">Tentar Novamente</Button>
            </div>
        )
    }

    return (
        <>
            <Form {...form}>
                <form onSubmit={e => e.preventDefault()} className="space-y-12">
                    
                    <section>
                        <StepTitle number={1} title="Suas Informações" />
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4">
                            <FormField control={form.control} name="nome" render={({ field }) => (
                                <FormItem className="sm:col-span-2">
                                    <FormLabel>Seu Nome *</FormLabel>
                                    <FormControl><Input placeholder="Digite seu nome completo" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="email" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seu E-mail *</FormLabel>
                                    <FormControl><Input type="email" placeholder="seu@email.com" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <FormField control={form.control} name="telefone" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Seu Telefone *</FormLabel>
                                    <FormControl><Input type="tel" placeholder="(00) 00000-0000" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                    </section>
                    
                    <Separator />

                    <section>
                        <StepTitle number={2} title="Busca de PI" />
                        <FormField control={form.control} name="cnpj" render={({ field }) => (
                            <FormItem>
                                <FormLabel>CNPJ do Veículo *</FormLabel>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                    <FormControl>
                                        <Input placeholder="Digite os 14 números do CNPJ" {...field} className="pl-9" />
                                    </FormControl>
                                    {isFetchingPIS && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin" />}
                                </div>
                                {cnpjError && <p className="text-sm font-medium text-destructive">{cnpjError}</p>}
                                <FormMessage />
                            </FormItem>
                        )} />
                        
                        {piList.length > 0 && (
                            <FormField
                                control={form.control}
                                name="n_pi"
                                render={({ field }) => (
                                    <FormItem className="mt-4">
                                        <FormLabel>Selecione a PI *</FormLabel>
                                        <RadioGroup onValueChange={handlePISelect} value={field.value} className="space-y-1">
                                            {piList.map((pi) => (
                                                <FormItem key={pi.n_pi} className="flex items-start space-x-3 space-y-0 rounded-md border p-4 transition-all hover:bg-accent/50 has-[:checked]:bg-accent has-[:disabled]:opacity-50 has-[:disabled]:hover:bg-transparent">
                                                    <FormControl>
                                                        <RadioGroupItem value={pi.n_pi} disabled={submittedPIs.includes(pi.n_pi)}/>
                                                    </FormControl>
                                                    <FormLabel className={cn("font-normal w-full cursor-pointer", submittedPIs.includes(pi.n_pi) && "text-muted-foreground line-through")}>
                                                        <div className="flex justify-between items-start">
                                                            <div className="font-bold text-base">{pi.n_pi || 'PI sem número'}</div>
                                                            {submittedPIs.includes(pi.n_pi) && <div className="text-xs font-bold text-white bg-green-600 px-2 py-1 rounded">ENVIADO</div>}
                                                        </div>
                                                        <div className="text-sm text-muted-foreground mt-1">
                                                          {pi.cliente} <br/> {pi.veiculo} - {pi.periodo}
                                                        </div>
                                                    </FormLabel>
                                                </FormItem>
                                            ))}
                                        </RadioGroup>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        )}
                    </section>

                    <Separator />

                    <section className={cn(!piData && "opacity-50")}>
                        <StepTitle number={3} title="Detalhes da PI e Comprovantes" disabled={!piData} />
                        {isFetchingPIData && <div className="flex items-center justify-center p-8"><Loader2 className="h-8 w-8 animate-spin text-primary"/></div>}
                        {!piData && !isFetchingPIData && <div className="text-center text-muted-foreground p-8 border-2 border-dashed rounded-lg"><p>Aguardando seleção de PI para exibir os campos de anexo.</p></div>}
                        {piData && (
                        <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-4 mb-8">
                                <FormItem><FormLabel><Building2 className="inline-block mr-2 h-4 w-4" />Cliente</FormLabel><Input readOnly value={piData?.cliente || ''} className="bg-muted/70" /></FormItem>
                                <FormItem><FormLabel><Megaphone className="inline-block mr-2 h-4 w-4" />Campanha</FormLabel><Input readOnly value={piData?.campanha || ''} className="bg-muted/70" /></FormItem>
                                <FormItem><FormLabel><Package className="inline-block mr-2 h-4 w-4" />Produto</FormLabel><Input readOnly value={piData?.produto || ''} className="bg-muted/70" /></FormItem>
                                <FormItem><FormLabel><CalendarDays className="inline-block mr-2 h-4 w-4" />Período</FormLabel><Input readOnly value={piData?.periodo || ''} className="bg-muted/70" /></FormItem>
                                <FormItem><FormLabel><Monitor className="inline-block mr-2 h-4 w-4" />Veículo</FormLabel><Input readOnly value={piData?.veiculo || ''} className="bg-muted/70" /></FormItem>
                                <FormItem><FormLabel><Globe className="inline-block mr-2 h-4 w-4" />Meio</FormLabel><Input readOnly value={meioOptions.find(m => m.value === piData?.meio)?.label || piData?.meio || ''} className="bg-muted/70" /></FormItem>
                            </div>

                            <div className="space-y-6">
                                 <FormField control={form.control} name="observacoes" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Observações</FormLabel>
                                        <FormControl><Textarea placeholder="Adicione observações sobre os comprovantes, se necessário." {...field} className="min-h-[100px]" /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />

                                {['ME', 'OD', 'FL'].includes(piData.meio ?? '') && (
                                    <FormField control={form.control} name="enderecos_manuais" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="flex items-center"><MapPinned className="inline-block mr-2 h-4 w-4"/>Endereços dos Pontos</FormLabel>
                                            <FormControl><Textarea placeholder="Opcional. Digite um endereço por linha se não for enviar o arquivo de relatório." {...field} className="min-h-[120px]" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                )}

                                <div>
                                    <FormLabel className="text-base font-bold">Comprovantes de Veiculação</FormLabel>
                                    <Alert className="my-4 border-blue-200 bg-blue-50 text-blue-800 [&>svg]:text-blue-700"><Info className="h-4 w-4" /><AlertDescription>Anexe todos os comprovantes obrigatórios (*). Para múltiplos arquivos, envie um <strong>.zip</strong>. O limite total é de <strong>500MB</strong>.</AlertDescription></Alert>
                                    <div className="space-y-4 mt-4">
                                        {visibleUploadGroups.length === 0 && <p className="text-center text-muted-foreground font-medium p-8">Este meio não requer comprovantes.</p>}
                                        {visibleUploadGroups.map(group => (
                                            <FormItem key={group.name}>
                                                <FormLabel>{group.label}</FormLabel>
                                                <FormControl>
                                                    <Input type="file" name={group.name} multiple accept={group.accept} onChange={handleFileChange} className="file:bg-primary file:text-primary-foreground file:font-semibold file:mr-4 file:px-3 file:py-2 file:rounded-l-md file:border-0 hover:file:bg-primary/90" required={!form.getValues('enderecos_manuais') && group.name === 'relatorio_enderecos_me'} />
                                                </FormControl>
                                            </FormItem>
                                        ))}
                                    </div>
                                    {fileStats.count > 0 && <div className="mt-4 text-sm font-semibold text-primary">{fileStats.count} arquivo(s) selecionado(s) - Total: {formatFileSize(fileStats.totalSize)}</div>}
                                </div>
                            </div>
                        </>
                        )}
                    </section>
                        
                    <div className="pt-6 border-t">
                        {submissionState.isSubmitting && <div className="mb-4"><Progress value={submissionState.progress} className="h-3"/><p className="text-center font-bold text-sm mt-2" dangerouslySetInnerHTML={{ __html: submissionState.info }}></p></div>}
                        <Button type="submit" size="lg" className="w-full h-12 text-base font-extrabold" disabled={!piData || submissionState.isSubmitting} onClick={form.handleSubmit(handleFormSubmit)}>
                            {submissionState.isSubmitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Enviando...</> : "Enviar Checking"}
                        </Button>
                    </div>
                </form>
            </Form>
        </>
    );
}
