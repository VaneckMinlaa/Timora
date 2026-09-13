package com.iusjc.timora.user.exception;

/**
 * Exception levée lorsqu'une ressource n'est pas trouvée
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resource, String id) {
        super(String.format("%s avec l'ID %s n'a pas été trouvé", resource, id));
    }
}

