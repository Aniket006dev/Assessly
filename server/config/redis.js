// Redis & BullMQ completely disabled — no-op stubs
const noOp = {
  get:    async () => null,
  set:    async () => null,
  setex:  async () => null,
  del:    async () => null,
  keys:   async () => [],
  on:     () => {},
};

const getRedis = () => noOp;
const getBullMQConnection = () => null;

module.exports = { getRedis, getBullMQConnection };