import { Inject, Injectable } from '@nestjs/common';
import { DI } from '@/di-symbols.js';
import type { Config } from '@/config.js';
import type Logger from '@/logger.js';
import FederationChart from '@/core/chart/charts/federation.js';
import NotesChart from '@/core/chart/charts/notes.js';
import UsersChart from '@/core/chart/charts/users.js';
import ActiveUsersChart from '@/core/chart/charts/active-users.js';
import InstanceChart from '@/core/chart/charts/instance.js';
import PerUserNotesChart from '@/core/chart/charts/per-user-notes.js';
import DriveChart from '@/core/chart/charts/drive.js';
import PerUserReactionsChart from '@/core/chart/charts/per-user-reactions.js';
import PerUserFollowingChart from '@/core/chart/charts/per-user-following.js';
import PerUserDriveChart from '@/core/chart/charts/per-user-drive.js';
import ApRequestChart from '@/core/chart/charts/ap-request.js';
import { bindThis } from '@/decorators.js';
import { QueueLoggerService } from '../QueueLoggerService.js';
import type Bull from 'bull';

@Injectable()
export class ResyncChartsProcessorService {
  private logger: Logger;

  constructor(
    @Inject(DI.config)
    private config: Config,
    private federationChart: FederationChart,
    private notesChart: NotesChart,
    private usersChart: UsersChart,
    private activeUsersChart: ActiveUsersChart,
    private instanceChart: InstanceChart,
    private perUserNotesChart: PerUserNotesChart,
    private driveChart: DriveChart,
    private perUserReactionsChart: PerUserReactionsChart,
    private perUserFollowingChart: PerUserFollowingChart,
    private perUserDriveChart: PerUserDriveChart,
    private apRequestChart: ApRequestChart,
    private queueLoggerService: QueueLoggerService,
  ) {
    this.logger = this.queueLoggerService.logger.createSubLogger('resync-charts');
  }

  @bindThis
  public async process(job: Bull.Job<Record<string, unknown>>, done: () => void): Promise<void> {
    this.logger.info('Resync charts...');

    // TODO: ユーザーごとのチャートも更新する
    // TODO: インスタンスごとのチャートも更新する

    await this.driveChart.resync().catch((err) => {
      this.logger.error('Failed to resync drive chart.', err);
    });
    await this.notesChart.resync().catch((err) => {
      this.logger.error('Failed to resync notes chart.', err);
    });
    await this.usersChart.resync().catch((err) => {
      this.logger.error('Failed to resync users chart.', err);
    });

    this.logger.succ('All charts successfully resynced.');
    done();
  }
}
