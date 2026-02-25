import {Pipe, PipeTransform} from '@angular/core';

@Pipe({
  name: 'filterAnswers'
})
export class FilterAnswersPipe implements PipeTransform {

  transform(
    answers: Record<string, string>,
    question: string
  ): Record<string, string> {
    if (!answers || !question) return answers ?? {};

    return Object.fromEntries(
      Object.entries(answers).filter(([key, value]) => value !== question)
    );
  }

}
