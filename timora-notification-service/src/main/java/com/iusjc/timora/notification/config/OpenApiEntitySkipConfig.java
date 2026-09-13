package com.iusjc.timora.notification.config;

import io.swagger.v3.core.converter.AnnotatedType;
import io.swagger.v3.core.converter.ModelConverter;
import io.swagger.v3.core.converter.ModelConverterContext;
import io.swagger.v3.oas.models.media.Schema;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import java.util.Iterator;

/**
 * Empêche Springdoc de résoudre les entités JPA (Notification, etc.)
 * lors de la génération du schéma OpenAPI, ce qui évite l'erreur 500 sur /v3/api-docs.
 */
@Configuration
public class OpenApiEntitySkipConfig {

    private static final String ENTITY_PACKAGE = "com.iusjc.timora.notification.entity";

    @Bean
    public ModelConverter entitySkipModelConverter() {
        return new ModelConverter() {
            @Override
            public Schema resolve(AnnotatedType type, ModelConverterContext context, Iterator<ModelConverter> chain) {
                if (type == null || type.getType() == null) {
                    return chain.hasNext() ? chain.next().resolve(type, context, chain) : null;
                }
                Class<?> clazz = getClassFromType(type.getType());
                if (clazz != null && isInEntityPackage(clazz)) {
                    Schema schema = new Schema<>();
                    schema.setType("string");
                    schema.setDescription("(Référence entité - non exposée)");
                    return schema;
                }
                return chain.hasNext() ? chain.next().resolve(type, context, chain) : null;
            }

            private Class<?> getClassFromType(java.lang.reflect.Type type) {
                if (type instanceof Class) {
                    return (Class<?>) type;
                }
                if (type instanceof java.lang.reflect.ParameterizedType) {
                    java.lang.reflect.ParameterizedType pt = (java.lang.reflect.ParameterizedType) type;
                    return getClassFromType(pt.getRawType());
                }
                return null;
            }

            private boolean isInEntityPackage(Class<?> clazz) {
                if (clazz == null) return false;
                Package pkg = clazz.getPackage();
                return pkg != null && ENTITY_PACKAGE.equals(pkg.getName());
            }
        };
    }
}
