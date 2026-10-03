"use client"
import React, { useState } from "react"
import { X, Upload, FileText, AlertTriangle, Loader2 } from "lucide-react"
import { empreendimentoIaService } from "@/service/empreendimentoIaService"
import { useToast } from "@/components/ui/ToastProvider"
import { parseApiError } from "@/lib/errorHandler"
import { textoDoErro } from "@/lib/feedback"
import { useRouter } from "next/navigation"

export default function EmpreendimentoUploadModal({ open, onClose, empreendimentoId }: { open: boolean; onClose: () => void; empreendimentoId?: number }) {
  const { toast } = useToast()
  const router = useRouter()
  const [files, setFiles] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  // arquivos recusados ficam listados no próprio modal, cada um com o motivo
  // (antes: um toast por arquivo, e os excedentes ao limite de 5 eram descartados sem aviso)
  const [recusados, setRecusados] = useState<string[]>([])
  const [erroEnvio, setErroEnvio] = useState<string | null>(null)

  if (!open) return null

  const onFiles = (fl: FileList | null) => {
    if (!fl) return
    const motivos: string[] = []
    const valid = Array.from(fl).filter(f => {
      const ext = f.name.split(".").pop()?.toLowerCase() || ""
      if (!["pdf","doc","docx","xls","xlsx","csv","jpg","jpeg","png"].includes(ext)) {
        motivos.push(`"${f.name}" não foi adicionado: o formato .${ext || "(sem extensão)"} não é aceito. Use PDF, DOC, DOCX, XLS, XLSX, CSV, JPG ou PNG.`)
        return false
      }
      if (f.size > 20*1024*1024) {
        motivos.push(`"${f.name}" não foi adicionado: tem ${(f.size/1024/1024).toFixed(1).replace(".", ",")} MB e o limite é 20 MB por arquivo.`)
        return false
      }
      return true
    })
    const vagas = Math.max(0, 5 - files.length)
    if (valid.length > vagas) {
      const fora = valid.slice(vagas).map(f => `"${f.name}"`).join(", ")
      motivos.push(`Limite de 5 arquivos por envio atingido. Não foram adicionados: ${fora}.`)
    }
    setRecusados(motivos)
    setErroEnvio(null)
    setFiles(prev => [...prev, ...valid.slice(0, vagas)])
  }

  const handleUpload = async () => {
    if (files.length === 0) { setErroEnvio("Selecione pelo menos um arquivo para enviar."); return }
    setErroEnvio(null)
    setUploading(true)
    try {
      const res = empreendimentoId ? await empreendimentoIaService.uploadParaExistente(empreendimentoId, files) : await empreendimentoIaService.upload(files)
      toast(`${files.length === 1 ? "1 arquivo enviado" : `${files.length} arquivos enviados`}. A leitura automática dos documentos começou; acompanhe na tela de revisão.`, "success")
      onClose()
      setFiles([])
      router.push(`/empreendimentos/revisao/${res.extracaoId}`)
    } catch (e:any) {
      // motivo real fica no modal, junto dos arquivos (ex.: arquivo grande demais, formato recusado pelo servidor)
      const p = parseApiError(e)
      if (p.tipo !== "sessao_expirada") setErroEnvio(textoDoErro(p))
    } finally { setUploading(false) }
  }

  return (
    <div className="fixed inset-0 bg-overlay/50 flex items-center justify-center z-50 p-4">
      <div className="bg-card w-full max-w-2xl rounded-card shadow-card-lg overflow-hidden">
        <div className="p-6 border-b border-line flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink">{empreendimentoId ? "Adicionar documentos" : "Novo empreendimento"}</h2>
          <button onClick={onClose} aria-label="Fechar" className="w-8 h-8 rounded-btn hover:bg-surface flex items-center justify-center"><X size={18} aria-hidden="true"/></button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-muted">Envie até 5 arquivos (PDF, DOC, DOCX, XLS, XLSX, CSV, JPG ou PNG) de até 20 MB cada. PDFs são lidos até a 40ª página.</p>
          <div
            onDragOver={e=>{e.preventDefault(); setDragOver(true)}}
            onDragLeave={()=>setDragOver(false)}
            onDrop={e=>{e.preventDefault(); setDragOver(false); onFiles(e.dataTransfer.files)}}
            className={`border-2 border-dashed rounded-card p-8 text-center ${dragOver?"border-brand bg-brand-soft":"border-line bg-surface/50"}`}
          >
            <Upload size={32} className="mx-auto text-brand-fg mb-2"/>
            <p className="text-sm text-muted">Arraste arquivos ou</p>
            <label className="inline-flex mt-2 px-4 py-2 bg-brand text-on-brand rounded-btn text-sm font-semibold cursor-pointer hover:bg-brand-hover">
              Selecionar arquivos
              <input type="file" multiple accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.jpg,.jpeg,.png" className="hidden" onChange={e=>onFiles(e.target.files)} />
            </label>
            <p className="text-xs text-muted mt-2">Texto, tabelas, plantas, memoriais, tabelas de preços</p>
          </div>

          {recusados.length>0 && (
            <div role="alert" className="bg-warning-bg border border-warning-border rounded-btn p-3 text-sm text-warning space-y-1">
              {recusados.map((m,i)=> <p key={i}>{m}</p>)}
            </div>
          )}

          {files.length>0 && (
            <div className="space-y-2">
              {files.map((f,i)=>(
                <div key={i} className="flex items-center gap-3 p-3 bg-surface border border-line rounded-btn">
                  <FileText size={18} className="text-brand-fg"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-ink truncate">{f.name}</p>
                    <p className="text-xs text-muted">{(f.size/1024).toFixed(0)} KB • {f.type || f.name.split(".").pop()}</p>
                  </div>
                  <button onClick={()=>setFiles(files.filter((_,idx)=>idx!==i))} aria-label={`Remover ${f.name}`} className="text-muted hover:text-ink"><X size={16} aria-hidden="true"/></button>
                </div>
              ))}
              <button onClick={()=>setFiles([])} className="text-xs text-muted hover:text-ink">Limpar todos</button>
            </div>
          )}

          <div className="bg-warning-bg border border-warning-border rounded-btn p-3 flex gap-2">
            <AlertTriangle size={16} className="text-warning mt-0.5"/>
            <p className="text-xs text-warning">A extração é automática e <b>não inventa dados</b>: usa apenas regras de leitura de texto, tabelas e planilhas. Campos ausentes ficarão como “não informado” para você preencher. Conflitos entre documentos serão sinalizados para escolha.</p>
          </div>
        </div>
        {erroEnvio && (
          <div role="alert" className="mx-6 mb-4 bg-danger-bg border border-danger-border rounded-btn p-3 text-sm text-danger">
            <p className="font-semibold">Não foi possível enviar os arquivos.</p>
            <p className="mt-0.5">{erroEnvio}</p>
          </div>
        )}
        <div className="p-6 border-t border-line flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2.5 border border-line rounded-btn text-muted hover:bg-surface">Cancelar</button>
          <button onClick={handleUpload} disabled={uploading || files.length===0} className="flex-1 px-4 py-2.5 bg-brand text-on-brand rounded-btn font-semibold shadow-btn hover:bg-brand-hover disabled:opacity-50 flex items-center justify-center gap-2">
            {uploading ? <><Loader2 size={16} className="animate-spin" aria-hidden="true"/> Enviando arquivos...</> : "Enviar para análise"}
          </button>
        </div>
      </div>
    </div>
  )
}
