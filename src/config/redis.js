const redis = require('redis');

const redisClient = redis.createClient({
    socket : {
        host : process.env.REDIS_HOST,
        port : process.env.REDIS_PORT,
    },
});

redisClient.on('connect', () =>{
    console.log('Redis Connected');
});

rediesClient.on('error',(err)=>{
    console.log('Redies Connection Error : ', err);
})

(async()=>{
    await redisClient.connect();
});

module.exports = redisClient;