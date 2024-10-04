import { Inject, Injectable } from '@nestjs/common';
import { Endpoint } from '@/server/api/endpoint-base.js';
import type { FollowingsRepository, User, UsersRepository } from '@/models/index.js';
import { UserFollowingService } from '@/core/UserFollowingService.js';
import { DI } from '@/di-symbols.js';
import { bindThis } from '@/decorators.js';

export const meta = {
	tags: ['admin'],

	requireCredential: true,
	requireModerator: true,
} as const;

export const paramDef = {
	type: 'object',
	properties: {
		userId: { type: 'string' },
	},
	required: ['userId'],
} as const;

// eslint-disable-next-line import/no-default-export
@Injectable()
export default class extends Endpoint<typeof meta, typeof paramDef> {
	constructor(
		@Inject(DI.usersRepository)
		private usersRepository: UsersRepository,

		@Inject(DI.followingsRepository)
		private followingsRepository: FollowingsRepository,

		private userFollowingService: UserFollowingService,
	) {
		super(meta, paramDef, async (ps, me) => {
      const follower = await this.usersRepository.findOne({ where: { id: ps.userId } });

      if (!follower) {
        throw new Error(`User not found: ${ps.userId}`);
      }

      await this.unFollowAll(follower);
		});
	}

  @bindThis
  private async unFollowAll(follower: User) {
    const followings = await this.followingsRepository.findBy({
      followerId: follower.id,
    });

    for (const following of followings) {
      const followee = await this.usersRepository.findOneBy({
        id: following.followeeId,
      });

      if (followee == null) {
        throw `Cant find followee ${following.followeeId}`;
      }

      await this.userFollowingService.unfollow(follower, followee, true);
    }
  }
}
