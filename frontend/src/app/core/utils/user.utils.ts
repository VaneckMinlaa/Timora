/**
 * User Utilities
 * Fonctions utilitaires pour la gestion des utilisateurs
 */

/**
 * Génère les initiales d'un utilisateur à partir de son prénom et nom
 * @param firstName Prénom de l'utilisateur
 * @param lastName Nom de l'utilisateur
 * @returns Les initiales (ex: "JD" pour "Jean Dupont")
 */
export function getUserInitials(firstName?: string | null, lastName?: string | null): string {
  const firstInitial = firstName?.charAt(0)?.toUpperCase() || '';
  const lastInitial = lastName?.charAt(0)?.toUpperCase() || '';
  
  if (firstInitial && lastInitial) {
    return `${firstInitial}${lastInitial}`;
  } else if (firstInitial) {
    return firstInitial;
  } else if (lastInitial) {
    return lastInitial;
  }
  
  return 'U'; // Default: "U" pour "User"
}

/**
 * Génère une couleur de fond basée sur le nom de l'utilisateur
 * @param firstName Prénom de l'utilisateur
 * @param lastName Nom de l'utilisateur
 * @returns Une couleur hexadécimale
 */
export function getUserAvatarColor(firstName?: string | null, lastName?: string | null): string {
  const name = `${firstName || ''}${lastName || ''}`;
  let hash = 0;
  
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  
  // Générer une couleur dans la palette bleue
  const hue = Math.abs(hash % 360);
  const saturation = 60 + (Math.abs(hash) % 20); // 60-80%
  const lightness = 45 + (Math.abs(hash) % 15); // 45-60%
  
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
}

