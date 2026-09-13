package com.iusjc.timora.user.exception;

/**
 * Exception levée pour les requêtes invalides
 */
public class BadRequestException extends RuntimeException {

    public BadRequestException(String message) {
        super(message);
    }
}

