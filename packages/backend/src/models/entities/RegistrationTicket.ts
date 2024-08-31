import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { User } from './User.js';

@Entity()
export class RegistrationTicket {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 64,
	})
	public code: string;

  @Index()
  @Column({
    ...id(),
    nullable: true,
    comment: 'The request user ID.',
  })
  public requestUserId: User['id'] | null;

  @ManyToOne(type => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public requestUser: User | null;

  @Index()
  @Column({
    ...id(),
    nullable: true,
    comment: 'The invited user ID.',
  })
  public invitedUserId: User['id'] | null;

  @ManyToOne(type => User, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public invitedUser: User | null;

  @Column('timestamp with time zone', {
    nullable: true,
    comment: 'The date and time the ticket was used.',
  })
  public usedAt: Date | null;
}
