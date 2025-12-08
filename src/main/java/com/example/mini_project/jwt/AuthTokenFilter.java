package com.example.mini_project.jwt;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.web.authentication.WebAuthenticationDetailsSource;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/*
 * Class này sẽ được chạy 1 lần trên mỗi request
 */
@Component
public class AuthTokenFilter extends OncePerRequestFilter {
    @Autowired
    private JwtUtils jwtUtils;
    @Autowired
    private CustomUserDetailsService userDetailsService;
    // Optional: Cho debugging
    private static final Logger logger = LoggerFactory.getLogger(AuthTokenFilter.class);


    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain filterChain)
            throws ServletException, IOException {
        logger.debug("AuthTokenFilter called for URI: {}", request.getRequestURI());
        try {
            // Extract jwt từ request
            String jwt = parseJwt(request);
            // Khi jwt là một valid jwt, thì có thể load user data
            if (jwt != null && jwtUtils.validateJwtToken(jwt)) {
                String username = jwtUtils.getUserNameFromJwtToken(jwt);

                UserDetails userDetails = userDetailsService.loadUserByUsername(username);
                UsernamePasswordAuthenticationToken authentication =
                        new UsernamePasswordAuthenticationToken(userDetails,
                                null,
                                userDetails.getAuthorities());
                // Authorities là những role mà user này sở hữu. .getAuthorities được định nghĩa ở trong SecurityConfig.java
                logger.debug("Roles from JWT: {}", userDetails.getAuthorities());

                // add một object WebAuth vào trong auth object, để sau này có thể thông báo với Spring để dùng session fixation protection, security event logging, audit trails, và nhận diện authentication đáng ngờ.
                // Trong object WebAuth này sẽ bao gồm: IP address, sessionID, HTTP request meta data.
                authentication.setDetails(new WebAuthenticationDetailsSource().buildDetails(request));


                // SecurityContextHolder như kiểu một Global container cho các active user, dòng này là đang set cái user hiện tại thành authenticated.
                SecurityContextHolder.getContext().setAuthentication(authentication);
            }
        } catch (Exception e) {
            logger.error("Cannot set user authentication: {}", e);
        }
        // Dòng này để tiếp tục filter những request tiếp theo. Được set up ở trong SecurityConfig.java
        filterChain.doFilter(request, response);
    }

    private String parseJwt(HttpServletRequest request) {
        String jwt = jwtUtils.getJwtFromHeader(request);
        logger.debug("AuthTokenFilter.java: {}", jwt);
        return jwt;
    }
}