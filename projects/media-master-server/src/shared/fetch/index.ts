import axios from 'axios';
import * as https from 'https';

// 创建一个配置了TLS选项的Agent
const httpsAgent = new https.Agent({
  rejectUnauthorized: false,
});

function generatePath(urlPattern: string, params: Record<string, any>) {
  const retParams = { ...params };
  const parts = urlPattern.split('/');
  const result = [] as string[];
  for (let i = 0; i < parts.length; i += 1) {
    if (parts[i].startsWith(':')) {
      const key = parts[i].slice(1);
      result.push(encodeURIComponent(params[key]));
      delete retParams[key];
    } else {
      result.push(parts[i]);
    }
  }
  return {
    path: result.join('/'),
    params: retParams,
  };
}

export function fetchApi({
  host,
  port,
  path,
  method,
  data,
}: {
  host: string;
  port?: string | number;
  path: string;
  method: 'POST' | 'GET' | 'PUT' | 'DELETE';
  data?: Record<string, any>;
}): any {
  const parsed = generatePath(path, data || {});
  let body;
  if (method === 'GET') {
    parsed.path += '?' + new URLSearchParams(parsed.params);
  } else {
    // body = parsed.params;
    body = data;
  }
  // console.log("%c Line:41 🍅 featchApi data", "color:#465975", body);
  const url = 'https://' + host + (port ? ':' + port : '') + parsed.path
  // console.log("%c Line:45 🍺 url", "color:#93c0a4", url);
  return axios({
    url: url,
    headers: { 'Content-Type': 'application/json' },
    method,
    data: body,
    httpsAgent
  }).then(async (resp) => {
    if (resp.status > 400) {
      throw Error(JSON.stringify(resp))
    } else {
      return resp.data;
    }
  });
}
