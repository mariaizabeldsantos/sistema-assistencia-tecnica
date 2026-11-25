package com.assistencia.estoque.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

import com.assistencia.estoque.security.AutenticacaoInterceptor;

@Configuration
public class WebConfig implements WebMvcConfigurer {

    private final AutenticacaoInterceptor autenticacao;
    private final String[] origens;

    public WebConfig(AutenticacaoInterceptor autenticacao, @Value("${app.cors-origins}") String origens) {
        this.autenticacao = autenticacao;
        this.origens = origens.split("\\s*,\\s*");
    }

    /** Toda rota /parts exige token de admin; /health continua pública. */
    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        registry.addInterceptor(autenticacao).addPathPatterns("/parts", "/parts/**");
    }

    /** Autenticação por Bearer token (sem cookies), como no backend Python. */
    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/**")
                .allowedOrigins(origens)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "OPTIONS")
                .allowedHeaders("*");
    }
}
