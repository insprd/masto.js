import { gt, lt } from 'semver';
import { MastoNotFoundError } from '../errors/masto-not-found-error';
import { MastoUnauthorizedError } from '../errors/masto-unauthorized-error';
import { Masto } from './masto';

export type Decorator = (
  masto: Masto,
  name: string,
  descriptor: TypedPropertyDescriptor<(...args: any[]) => any>,
) => void;

export interface AvailabeParams {
  since?: string;
  until?: string;
}

/**
 * Decorator that indicates the function requires user
 * (placeholder for the future implementation)
 */
export const requiresUser: Decorator = (_target, _name, descriptor) => {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error('requiresUser only can be used to a method of a class');
  }

  const original = descriptor.value;

  descriptor.value = function(this: Masto, ...args: any[]) {
    return original.apply(this, args);
  };
};

/**
 * Decorator that indicates the function requires authentication
 */
export const requiresAuthentication: Decorator = (
  _target,
  name,
  descriptor,
) => {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error(
      'requireAuthentication only can be used to a method of a class',
    );
  }

  const original = descriptor.value;

  descriptor.value = function(this: Masto, ...args: any[]) {
    if (!this.accessToken) {
      throw new MastoUnauthorizedError(
        `Endpoint ${name} requires authentication. ` +
          'Check Setting > Development of your Mastodon instance ' +
          'to register application.',
      );
    }

    return original.apply(this, args);
  };
};

/**
 * Decorator that verifies the version of the Mastodon instance
 * @param parameters Optional params
 */
export const available = (parameters: AvailabeParams): Decorator => (
  _target,
  name,
  descriptor,
) => {
  if (!descriptor || typeof descriptor.value !== 'function') {
    throw new Error('available only can be used to a method of a class');
  }

  const original = descriptor.value;
  const { since, until } = parameters;

  descriptor.value = function(this: Masto, ...args: any[]) {
    if (since && this.version && lt(this.version, since)) {
      throw new MastoNotFoundError(
        `${name} is not available with the current ` +
          `Mastodon version ${this.version}. ` +
          `It requires greater than or equal to version ${since}.`,
      );
    }

    if (until && this.version && gt(this.version, until)) {
      throw new MastoNotFoundError(
        `${name} is not available with the current ` +
          `Mastodon version ${this.version}. ` +
          `It was removed on version ${until}.`,
      );
    }

    return original.apply(this, args);
  };
};