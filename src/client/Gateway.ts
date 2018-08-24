import nodeFetch from 'node-fetch';
import * as querystring from 'querystring';
import { EventHandler } from './EventHandler';
import { Error as MastodonError } from '../entities/Error';

export class Gateway {

  /** Rest API URL of the instance */
  public url: string = '';

  /** Streaming API URL of the instance */
  public streamingUrl: string = '';

  /** API token of the user */
  public token?: string;

  /**
   * @param options Optional params
   * @param options.url Rest API URL of the instance
   * @param options.streamingUrl Streaming API URL of the instance
   * @param options.token API token of the user
   */
  constructor (options: { url: string, streamingUrl: string, token?: string }) {
    if (options) {
      this.url = options.url;
      this.streamingUrl = options.streamingUrl;
      this.token = options.token;
    }
  }

  /**
   * Fetch API wrapper function
   * @param url URL to request
   * @param options Fetch API options
   * @param parse Whether parse response before return
   * @return Parsed response object
   */
  protected async request (url: string, options: { [key: string]: any } = {}, parse = true): Promise<any> {
    if ( !options.headers ) {
      options.headers = {};
    }

    options.headers['Content-Type']  = 'application/json';

    if ( this.token ) {
      options.headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = typeof window === 'undefined'
        ? await nodeFetch(url, options)
        : await fetch(url, options);

      if ( !parse ) {
        return response;
      }

      const data = await response.json();

      if ( response.ok ) {
        return data
      };

      throw data as MastodonError;
    } catch (error) {
      throw { error: error || 'Unexpected error occured' } as MastodonError;
    }
  }

  /**
   * HTTP GET
   * @param url URL to request
   * @param params Query strings
   * @param options Fetch API options
   * @param parse Whether parse response before return
   */
  protected get <T>(url: string, params = {}, options = {}, parse = true): Promise<T> {
    return this.request(url + (Object.keys(params).length ? '?' + querystring.stringify(params) : ''), { method: 'GET', ...options }, parse);
  }

  /**
   * HTTP POST
   * @param url URL to request
   * @param body Payload
   * @param options Fetch API options
   * @param parse Whether parse response before return
   */
  protected post <T>(url: string, body = {}, options = {}, parse = true): Promise<T> {
    return this.request(url, { method: 'POST', body: JSON.stringify(body), ...options }, parse);
  }

  /**
   * HTTP PUT
   * @param url URL to request
   * @param body Payload
   * @param options Fetch API options
   * @param parse Whether parse response before return
   */
  protected put <T>(url: string, body = {}, options = {}, parse = true): Promise<T> {
    return this.request(url, { method: 'PUT', body: JSON.stringify(body), ...options }, parse);
  }

  /**
   * HTTP DELETE
   * @param url URL to request
   * @param body Payload
   * @param options Fetch API options
   * @param parse Whether parse response before return
   */
  protected delete <T>(url: string, body = {}, options = {}, parse = true): Promise<T> {
    return this.request(url, { method: 'DELETE', body: JSON.stringify(body), ...options }, parse);
  }

  /**
   * HTTP PATCH
   * @param url URL to request
   * @param body Payload
   * @param options Fetch API options
   * @param parse Whether parse response before return
   */
  protected patch <T>(url: string, body = {}, options = {}, parse = true): Promise<T> {
    return this.request(url, { method: 'PATCH', body: JSON.stringify(body), ...options }, parse);
  }

  /**
   * Start streaming
   * @param id ID of the channel, e.g. `public`, `user`, `public/local` etc
   * @return Instance of EventEmitter
   */
  protected stream (url: string, params: { [key: string]: string }): EventHandler {
    if ( this.token ) {
      params.access_token = this.token;
    }

    return new EventHandler(url, params);
  }
}