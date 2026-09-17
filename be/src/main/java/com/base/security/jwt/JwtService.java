package com.base.security.jwt;

import io.jsonwebtoken.*;
import io.jsonwebtoken.io.Decoders;
import io.jsonwebtoken.io.Encoders;
import io.jsonwebtoken.security.Keys;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.env.Environment;
import org.springframework.core.env.Profiles;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Service;

import java.security.Key;
import java.security.SecureRandom;
import java.util.Date;
import java.util.HashMap;
import java.util.Map;
import java.util.function.Function;

@Slf4j
@Service
public class JwtService {

    private static final int MINIMUM_SECRET_BYTES = 32;

    private final Environment environment;

    @Value("${app.jwt.secret:}")
    private String secretKey;

    @Value("${app.jwt.expiration}")
    private long jwtExpiration;

    public JwtService(Environment environment) {
        this.environment = environment;
    }

    @PostConstruct
    void initializeSecretKey() {
        if (secretKey != null && !secretKey.isBlank()) {
            validateSecretKey(secretKey);
            return;
        }

        if (environment.acceptsProfiles(Profiles.of("prod", "production"))) {
            throw new IllegalStateException(
                    "JWT_SECRET is required when running with the prod/production profile"
            );
        }

        byte[] generatedKey = new byte[MINIMUM_SECRET_BYTES];
        new SecureRandom().nextBytes(generatedKey);
        secretKey = Encoders.BASE64.encode(generatedKey);
        log.warn(
                "JWT_SECRET is not configured. Generated a temporary key for local development; "
                        + "all JWTs will become invalid after restart."
        );
    }

    private void validateSecretKey(String configuredSecret) {
        try {
            byte[] decodedKey = Decoders.BASE64.decode(configuredSecret);
            if (decodedKey.length < MINIMUM_SECRET_BYTES) {
                throw new IllegalStateException(
                        "JWT_SECRET must be a Base64 value representing at least 32 bytes"
                );
            }
        } catch (IllegalArgumentException exception) {
            throw new IllegalStateException(
                    "JWT_SECRET must be valid Base64 representing at least 32 bytes",
                    exception
            );
        }
    }

    public String extractUsername(String token) {
        return extractClaim(token, Claims::getSubject);
    }

    public <T> T extractClaim(String token, Function<Claims, T> claimsResolver) {
        final Claims claims = extractAllClaims(token);
        return claimsResolver.apply(claims);
    }

    public String generateToken(UserDetails userDetails) {
        return generateToken(new HashMap<>(), userDetails);
    }

    public String generateToken(Map<String, Object> extraClaims, UserDetails userDetails) {
        return buildToken(extraClaims, userDetails, jwtExpiration);
    }

    private String buildToken(Map<String, Object> extraClaims, UserDetails userDetails, long expiration) {
        return Jwts.builder()
                .setClaims(extraClaims)
                .setSubject(userDetails.getUsername())
                .setIssuedAt(new Date(System.currentTimeMillis()))
                .setExpiration(new Date(System.currentTimeMillis() + expiration))
                .signWith(getSignInKey(), SignatureAlgorithm.HS256)
                .compact();
    }

    public boolean isTokenValid(String token, UserDetails userDetails) {
        final String username = extractUsername(token);
        return username.equals(userDetails.getUsername()) && !isTokenExpired(token);
    }

    public boolean isTokenExpired(String token) {
        return extractExpiration(token).before(new Date());
    }

    private Date extractExpiration(String token) {
        return extractClaim(token, Claims::getExpiration);
    }

    private Claims extractAllClaims(String token) {
        return Jwts.parserBuilder()
                .setSigningKey(getSignInKey())
                .build()
                .parseClaimsJws(token)
                .getBody();
    }

    private Key getSignInKey() {
        byte[] keyBytes = Decoders.BASE64.decode(secretKey);
        return Keys.hmacShaKeyFor(keyBytes);
    }
}
