import client from '../redis';
import { promisify } from'util';
import logger from '../lib/logger';

const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);
const delAsync: (key: string) => Promise<number> = promisify(client.del).bind(client);

export async function getDataRedis(key:string): Promise<any> {
  return await getAsync(key).then((data) => {
    if (!data) {
      return false;
    }
    return JSON.parse(data);
  }).catch(error => {
    logger.error({
      message: error,
      service: 'getDataRedis'
    })
    return false;
  });
};

export async function setDataRedis(key:string, data: Array<any>): Promise<any> {
  const dataString = JSON.stringify(data);
  client.expire(key, 1800)
  return await setAsync(key, dataString).then((response) => {
    logger.info({
      message: `Dato -${key}- guardado en Redis correctamente.`,
      service: 'saveDataRedis'
    });
  }).catch((error) => {
    logger.error({
      message: error,
      service: 'saveDataRedis'
    })
  })
};

export async function delDataRedis(key:string) {
  return await delAsync(key).then((data) => {
    if (!data) {
      return false;
    }
    return true;
  }).catch(error => {
    logger.error({
      message: error,
      service: 'delDataRedis'
    })
    return false;
  });
}