import * as misskey from 'misskey-js';
import { acct as Acct } from 'misskey-js';

export const acct = (user: misskey.Acct) => {
	return Acct.toString(user);
};

export const userName = (user: misskey.entities.User) => {
	return user.name || user.username;
};

export const userPage = (user: misskey.Acct, path?, absolute = false) => {
	return `${absolute ? origin : ''}/@${acct(user)}${(path ? `/${path}` : '')}`;
};
