import { FeedbackEntity } from '@/modules/feedback/entities/feedback.entity';
import { TrainingSample } from '../classifiers/base.classifier';

export function mapFeedback(
  feedback: FeedbackEntity,
  label: keyof ProcessingResult,
): TrainingSample {
  if (feedback.userCorrectedJson)
    return {
      text: feedback.originalText.toLowerCase(),
      label: feedback.userCorrectedJson[label]
        ?.toString()
        .toLowerCase() as string,
    };
  return {
    text: feedback.originalText.toLowerCase(),
    label: feedback.predictedJson[label]?.toString().toLowerCase() as string,
  };
}
