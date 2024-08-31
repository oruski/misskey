import { PrimaryColumn, Entity, Index, Column, ManyToOne, JoinColumn } from 'typeorm';
import { id } from '../id.js';
import { RegistrationTicket } from './RegistrationTicket.js';

@Entity()
export class UserPending {
	@PrimaryColumn(id())
	public id: string;

	@Column('timestamp with time zone')
	public createdAt: Date;

	@Index({ unique: true })
	@Column('varchar', {
		length: 128,
	})
	public code: string;

	@Column('varchar', {
		length: 128,
	})
	public username: string;

	@Column('varchar', {
		length: 128,
	})
	public email: string;

	@Column('varchar', {
		length: 128,
	})
	public password: string;

  @Index()
  @Column({
    ...id(),
    nullable: true,
    comment: 'The registration ticket ID.',
  })
  public registrationTicketId: string | null;

  @ManyToOne(type => RegistrationTicket, {
    onDelete: 'CASCADE',
  })
  @JoinColumn()
  public registrationTicket: RegistrationTicket | null;
}
