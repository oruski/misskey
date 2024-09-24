type E = { message: string, reason?: string, code: string, id: string, kind?: 'client' | 'server' | 'permission', httpStatusCode?: number };

export class ApiError extends Error {
	public message: string;
  public reason?: string;
	public code: string;
	public id: string;
	public kind: string;
	public httpStatusCode?: number;
	public info?: any;

	constructor(err?: E | null | undefined, info?: any | null | undefined) {
		if (err == null) err = {
			message: 'Internal error occurred. Please contact us if the error persists.',
      reason: 'Internal error',
			code: 'INTERNAL_ERROR',
			id: '5d37dbcb-891e-41ca-a3d6-e690c97775ac',
			kind: 'server',
			httpStatusCode: 500,
		};

		super(err.message);
		this.message = err.message;
		this.code = err.code;
    this.reason = err.reason;
		this.id = err.id;
		this.kind = err.kind ?? 'client';
		this.httpStatusCode = err.httpStatusCode;
		this.info = info;
	}
}
