import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';

/**
 * **Uncategorized**
 * List all transactions that received the inbound categories and are pending categorization
 */
@Injectable()
export class TrainingService {
  private readonly _logger = new Logger(TrainingService.name);

  constructor() {
    this._logger.log('TrainingService Initialized');
  }

  // @Cron('0/30 * * * * *')
  @Cron('0 0 0 * * *')
  retrain() {
    this._logger.verbose('Starting Uncategorized service');
    // const uncategorized = await this._transactions.uncategorized();
    // this._logger.verbose(
    //   `${uncategorized.length} transactions pending categorization.`,
    // );
    // this._rabbitService.sendMessage('uncategorized_notification', {
    //   type: 'notification',
    //   title: 'Uncategorized Transactions',
    //   description: `${uncategorized.length} transactions pending categorization.`,
    // });
  }
}
