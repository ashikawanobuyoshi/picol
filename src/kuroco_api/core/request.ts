/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
/* prettier-ignore */

// @ts-ignore-start
import { OpenAPI } from './OpenAPI';
// @ts-ignore-end

import { getFormData } from './getFormData';
import { getQueryString } from './getQueryString';
import { RequestOptions } from './RequestOptions';
import { requestUsingFetch } from './requestUsingFetch';
import { Result } from './Result';

/**
 * Create the request.
 * @param options Request method options.
 * @returns Result object (see above)
 */
export async function request<T>(options: Readonly<RequestOptions>): Promise<Result<T>> {
  // Escape path (RFC3986) and create the request URL
  let path = options.path.replace(/[:]/g, '_');
  let url = `${OpenAPI.getBase()}${path}`;

  // Create request headers
  const headers = new Headers({
    ...options.headers,
    Accept: 'application/json',
    'content-type': 'application/json',
  });

  // Create request settings
  const request: RequestInit = {
    headers,
    method: options.method,
    credentials: 'include',
  };

  // Add the query parameters (if defined).
  if (options.query) {
    url += getQueryString(options.query);
  }

  // Append formData as body
  if (options.formData) {
    request.body = getFormData(options.formData);
  } else if (options.body) {
    // If this is blob data, then pass it directly to the body and set content type.
    // Otherwise we just convert request data to JSON string (needed for fetch api)
    if (options.body instanceof Blob) {
      request.body = options.body;
      if (options.body.type) {
        headers.set('Content-Type', options.body.type);
      }
    } else {
      request.body = JSON.stringify(options.body);
      headers.set('Content-Type', 'application/json');
    }
  }

  try {
    return await requestUsingFetch(url, request, options.responseHeader);
  } catch (error) {
    return {
      url,
      ok: false,
      status: 0,
      statusText: '',
      body: error,
    };
  }
}
