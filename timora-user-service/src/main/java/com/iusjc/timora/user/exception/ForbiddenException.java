package com.iusjc.timora.user.exception;

/**
 * Exception levée pour les accès refusés (compte bloqué, permissions insuffisantes)
 */
public class ForbiddenException extends RuntimeException {

    public ForbiddenException(String message) {
        super(message);
    }
}


