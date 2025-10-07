import { FeedbackEntity } from '@/modules/feedback/entities/feedback.entity';
import { TrainingSample } from '../classifiers/base.classifier';

export function mapFeedback(
  feedback: FeedbackEntity,
  label: keyof ProcessingResult,
): TrainingSample {
  if (feedback.userCorrectedJson)
    return {
      text: feedback.originalText,
      label: feedback.userCorrectedJson[label] as string,
    };
  return {
    text: feedback.originalText,
    label: feedback.predictedJson[label] as string,
  };
}
