import {
  Question,
  answerText,
  toAnswers,
  toQuestionDraft,
  toQuestionnaireRequest,
} from './anamnesis.models';

const question = (id: string, type: Question['type'], options: string[] = []): Question => ({
  id,
  text: `Pergunta ${id}`,
  type,
  required: false,
  options,
});

describe('anamnese', () => {
  it('o editor manda as opções só nas perguntas de escolha, uma por linha, aparadas', () => {
    const request = toQuestionnaireRequest('  Primeira consulta ', [
      { text: ' Alergias? ', type: 'Text', required: true, optionsText: 'ignorado' },
      {
        text: 'Refeições por dia',
        type: 'SingleChoice',
        required: false,
        optionsText: ' 3 \n\n4\n 5 ou mais ',
      },
    ]);

    expect(request).toEqual({
      title: 'Primeira consulta',
      questions: [
        { text: 'Alergias?', type: 'Text', required: true, options: [] },
        {
          text: 'Refeições por dia',
          type: 'SingleChoice',
          required: false,
          options: ['3', '4', '5 ou mais'],
        },
      ],
    });
  });

  it('as respostas levam só o campo do tipo de cada pergunta', () => {
    const questions = [
      question('t', 'Text'),
      question('y', 'YesNo'),
      question('s', 'SingleChoice', ['A', 'B']),
      question('m', 'MultipleChoice', ['A', 'B']),
    ];
    const answers = toAnswers(questions, {
      t: { text: '  ', yesNo: null, options: [] },
      y: { text: '', yesNo: false, options: [] },
      s: { text: '', yesNo: null, options: ['B'] },
    });

    expect(answers).toEqual([
      { questionId: 't', text: null, yesNo: null, options: null },
      { questionId: 'y', text: null, yesNo: false, options: null },
      { questionId: 's', text: null, yesNo: null, options: ['B'] },
      { questionId: 'm', text: null, yesNo: null, options: [] },
    ]);
  });

  it('mostra a resposta em texto, ou nada quando não foi respondida', () => {
    expect(
      answerText(question('y', 'YesNo'), {
        questionId: 'y',
        text: null,
        yesNo: true,
        options: null,
      }),
    ).toBe('Sim');
    expect(
      answerText(question('m', 'MultipleChoice'), {
        questionId: 'm',
        text: null,
        yesNo: null,
        options: ['A', 'B'],
      }),
    ).toBe('A, B');
    expect(
      answerText(question('m', 'MultipleChoice'), {
        questionId: 'm',
        text: null,
        yesNo: null,
        options: [],
      }),
    ).toBeNull();
    expect(answerText(question('t', 'Text'), undefined)).toBeNull();
  });

  it('pergunta sem opções vinda da API com options null vira rascunho sem quebrar', () => {
    const draft = toQuestionDraft({
      text: 'Alergias?',
      type: 'Text',
      required: true,
      options: null,
    });
    expect(draft.optionsText).toBe('');
  });
});
