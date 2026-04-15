package com.atify.backend.config;

import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.cache.CacheManager;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.cache.concurrent.ConcurrentMapCacheManager;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.data.redis.cache.RedisCacheConfiguration;
import org.springframework.data.redis.cache.RedisCacheManager;
import org.springframework.data.redis.connection.RedisConnectionFactory;
import org.springframework.data.redis.serializer.GenericJackson2JsonRedisSerializer;
import org.springframework.data.redis.serializer.RedisSerializationContext;

import java.time.Duration;
import java.util.HashMap;
import java.util.Map;

/**
 * Cache yapılandırması.
 *
 * Varsayılan: basit in-memory cache (Redis gerektirmez).
 * Redis etkinleştirmek için application.properties içinde:
 *   spring.cache.type=redis
 *   spring.data.redis.host=localhost
 *   spring.data.redis.port=6379
 */
@Configuration
@EnableCaching
public class CacheConfig {

    // --- In-Memory (varsayılan) ---
    @Bean
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "simple", matchIfMissing = true)
    public CacheManager simpleCacheManager() {
        return new ConcurrentMapCacheManager("songs", "artists", "albums", "search");
    }

    // --- Redis ---
    @Bean
    @ConditionalOnProperty(name = "spring.cache.type", havingValue = "redis")
    public CacheManager redisCacheManager(RedisConnectionFactory connectionFactory) {
        RedisCacheConfiguration defaults = RedisCacheConfiguration.defaultCacheConfig()
                .disableCachingNullValues()
                .serializeValuesWith(
                        RedisSerializationContext.SerializationPair.fromSerializer(
                                new GenericJackson2JsonRedisSerializer()
                        )
                );

        Map<String, RedisCacheConfiguration> cacheConfigs = new HashMap<>();
        cacheConfigs.put("songs",   defaults.entryTtl(Duration.ofMinutes(5)));
        cacheConfigs.put("artists", defaults.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("albums",  defaults.entryTtl(Duration.ofMinutes(10)));
        cacheConfigs.put("search",  defaults.entryTtl(Duration.ofMinutes(2)));

        return RedisCacheManager.builder(connectionFactory)
                .cacheDefaults(defaults.entryTtl(Duration.ofMinutes(5)))
                .withInitialCacheConfigurations(cacheConfigs)
                .build();
    }
}
