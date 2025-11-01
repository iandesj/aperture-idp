import '@testing-library/jest-dom'

// Polyfill for Request/Response in Node environment
if (typeof Request === 'undefined') {
  global.Request = class MockRequest {
    private _url: string;
    constructor(url: string, public init?: any) {
      this._url = url;
    }
    get url() {
      return this._url;
    }
  } as any;
}

if (typeof Response === 'undefined') {
  global.Response = class MockResponse {
    constructor(public body?: any, public init?: any) {}
  } as any;
}

