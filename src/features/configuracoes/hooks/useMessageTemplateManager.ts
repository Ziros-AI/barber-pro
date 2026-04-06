import { useMemo } from 'react';
import { createTemplateMensagem, ensureTemplatePadraoUnico, normalizeTemplatesMensagem, type TemplateMensagem, type TemplateMensagemTipo } from '../../../lib/messageTemplates';
import { TEMPLATE_TIPOS } from '../types';

interface UseMessageTemplateManagerParams {
  mensagemLegada: string;
  templates: TemplateMensagem[];
  onBlockAction: (title: string, message: string) => void;
  onChange: (nextTemplates: TemplateMensagem[]) => void;
}

export const useMessageTemplateManager = ({
  mensagemLegada,
  templates,
  onBlockAction,
  onChange
}: UseMessageTemplateManagerParams) => {
  const templatesPorTipo = useMemo(
    () =>
      TEMPLATE_TIPOS.reduce((acc, tipo) => {
        acc[tipo] = templates.filter((template) => template.tipo === tipo);
        return acc;
      }, {} as Record<TemplateMensagemTipo, TemplateMensagem[]>),
    [templates]
  );

  const atualizarTemplates = (nextTemplates: TemplateMensagem[]) => {
    onChange(normalizeTemplatesMensagem(nextTemplates, mensagemLegada));
  };

  const atualizarTemplate = (templateId: string, patch: Partial<TemplateMensagem>) => {
    atualizarTemplates(
      templates.map((template) =>
        template.id === templateId
          ? {
              ...template,
              ...patch
            }
          : template
      )
    );
  };

  const alternarTemplateAtivo = (tipo: TemplateMensagemTipo, templateId: string, ativo: boolean) => {
    const templatesTipo = templatesPorTipo[tipo] || [];
    const ativosRestantes = templatesTipo.filter((template) => template.id !== templateId && template.ativo);

    if (!ativo && ativosRestantes.length === 0) {
      onBlockAction('Ação bloqueada', 'Cada tipo precisa manter pelo menos um template ativo.');
      return;
    }

    atualizarTemplate(templateId, { ativo });
  };

  const adicionarTemplate = (tipo: TemplateMensagemTipo) => {
    const totalTipo = templatesPorTipo[tipo]?.length || 0;
    atualizarTemplates([...templates, createTemplateMensagem(tipo, totalTipo + 1)]);
  };

  const removerTemplate = (tipo: TemplateMensagemTipo, templateId: string) => {
    const templatesTipo = templatesPorTipo[tipo] || [];

    if (templatesTipo.length <= 1) {
      onBlockAction('Ação bloqueada', 'Cada tipo precisa manter pelo menos um template.');
      return;
    }

    atualizarTemplates(templates.filter((template) => template.id !== templateId));
  };

  const definirTemplatePadrao = (tipo: TemplateMensagemTipo, templateId: string) => {
    atualizarTemplates(ensureTemplatePadraoUnico(templates, tipo, templateId));
  };

  return {
    adicionarTemplate,
    alternarTemplateAtivo,
    atualizarTemplate,
    definirTemplatePadrao,
    removerTemplate,
    templatesPorTipo
  };
};
