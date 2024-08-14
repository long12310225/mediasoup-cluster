import { createParamDecorator } from '@nestjs/common';

export const Params = createParamDecorator((data, req) => {
  const incomming = req.args[0]
  const param = { ...incomming.query, ...incomming.body, ...incomming.params };
  return data ? param[data] : param;
});
