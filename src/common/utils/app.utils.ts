import { INestApplication } from '@nestjs/common';

export const AppUtils = {
  killAppWithGrace: (app: INestApplication) => {
    process.on('SIGINT', () => {
      setTimeout(() => process.exit(1), 5000);
      void app.close().then(() => process.exit(0));
    });

    process.on('SIGTERM', () => {
      setTimeout(() => process.exit(1), 5000);
      void app.close().then(() => process.exit(0));
    });
  },
};
