/** Anamnese (E6.6): o nutricionista monta questionários, envia ao paciente e o paciente responde antes da consulta. */

export type QuestionType = 'Text' | 'YesNo' | 'SingleChoice' | 'MultipleChoice';
export type AnamnesisStatus = 'Pending' | 'Submitted';

export const QUESTION_TYPE_LABELS: Record<QuestionType, string> = {
  Text: 'Texto livre',
  YesNo: 'Sim ou não',
  SingleChoice: 'Uma opção',
  MultipleChoice: 'Várias opções',
};

export const ANAMNESIS_STATUS_LABELS: Record<AnamnesisStatus, string> = {
  Pending: 'Aguardando resposta',
  Submitted: 'Respondida',
};

/** Limites da API (ela devolve a mensagem quando passam). */
export const ANSWER_TEXT_MAX = 2000;

export interface Question {
  id: string;
  text: string;
  type: QuestionType;
  required: boolean;
  /** Só nas perguntas de escolha; nas outras a API pode mandar null. */
  options: string[] | null;
}

export interface QuestionRequest {
  text: string;
  type: QuestionType;
  required: boolean;
  options: string[] | null;
}

export interface QuestionnaireRequest {
  title: string;
  questions: QuestionRequest[];
}

export interface QuestionnaireSummary {
  id: string;
  title: string;
  questionCount: number;
  updatedAt: string;
}

/** Editar troca todas as perguntas por ids novos: não guarde ids de pergunta entre edições. */
export interface Questionnaire {
  id: string;
  title: string;
  questions: Question[];
  createdAt: string;
  updatedAt: string | null;
}

export interface AnamnesisSummary {
  id: string;
  title: string;
  status: AnamnesisStatus;
  patientId: string;
  patientName: string;
  nutritionistId: string;
  nutritionistName: string;
  sentAt: string;
  submittedAt: string | null;
}

/** Envie só o campo do tipo da pergunta; as opções vão pelo texto exato. */
export interface Answer {
  questionId: string;
  text: string | null;
  yesNo: boolean | null;
  options: string[] | null;
}

export interface Anamnesis extends AnamnesisSummary {
  questions: Question[];
  /** null enquanto pendente. */
  answers: Answer[] | null;
}

export const hasOptions = (type: QuestionType): boolean =>
  type === 'SingleChoice' || type === 'MultipleChoice';

/** Pergunta como o editor guarda: as opções num texto, uma por linha. */
export interface QuestionDraft {
  text: string;
  type: QuestionType;
  required: boolean;
  optionsText: string;
}

export function toQuestionDraft(question: QuestionRequest): QuestionDraft {
  return {
    text: question.text,
    type: question.type,
    required: question.required,
    optionsText: (question.options ?? []).join('\n'),
  };
}

export function toQuestionnaireRequest(
  title: string,
  drafts: QuestionDraft[],
): QuestionnaireRequest {
  return {
    title: title.trim(),
    questions: drafts.map((draft) => ({
      text: draft.text.trim(),
      type: draft.type,
      required: draft.required,
      options: hasOptions(draft.type)
        ? draft.optionsText
            .split('\n')
            .map((option) => option.trim())
            .filter(Boolean)
        : [],
    })),
  };
}

/** O que o paciente marcou ou escreveu, por pergunta. */
export interface AnswerDraft {
  text: string;
  yesNo: boolean | null;
  options: string[];
}

export const EMPTY_ANSWER: AnswerDraft = { text: '', yesNo: null, options: [] };

export function toAnswers(questions: Question[], drafts: Record<string, AnswerDraft>): Answer[] {
  return questions.map((question) => {
    const draft = drafts[question.id] ?? EMPTY_ANSWER;
    const answer: Answer = { questionId: question.id, text: null, yesNo: null, options: null };
    if (question.type === 'Text') answer.text = draft.text.trim() || null;
    else if (question.type === 'YesNo') answer.yesNo = draft.yesNo;
    else answer.options = draft.options;
    return answer;
  });
}

/** A resposta em texto para leitura; null quando não foi respondida. */
export function answerText(question: Question, answer: Answer | undefined): string | null {
  if (!answer) return null;
  if (question.type === 'Text') return answer.text?.trim() || null;
  if (question.type === 'YesNo') return answer.yesNo === null ? null : answer.yesNo ? 'Sim' : 'Não';
  return answer.options?.length ? answer.options.join(', ') : null;
}
