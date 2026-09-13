# Script de Création des Bases de Données - Timora

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Création des Bases de Données" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "📋 Bases de données à créer :" -ForegroundColor Yellow
Write-Host "   1. timora_auth" -ForegroundColor White
Write-Host "   2. timora_user" -ForegroundColor White
Write-Host "   3. timora_notification" -ForegroundColor White
Write-Host ""

Write-Host "⚠️  Assure-toi que PostgreSQL est démarré !" -ForegroundColor Yellow
Write-Host ""

# Demander le mot de passe PostgreSQL
Write-Host "🔑 Entre le mot de passe PostgreSQL (par défaut: root) :" -ForegroundColor Yellow
$password = Read-Host "Mot de passe" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

if ([string]::IsNullOrWhiteSpace($passwordPlain)) {
    $passwordPlain = "root"
}

Write-Host ""
Write-Host "🔨 Création des bases de données..." -ForegroundColor Cyan
Write-Host ""

# Définir la variable d'environnement pour le mot de passe
$env:PGPASSWORD = $passwordPlain

try {
    # Créer timora_auth
    Write-Host "📦 Création de timora_auth..." -ForegroundColor Cyan
    psql -U postgres -c "CREATE DATABASE timora_auth;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ timora_auth créée avec succès" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  timora_auth existe déjà ou erreur" -ForegroundColor Yellow
    }

    # Créer timora_user
    Write-Host "📦 Création de timora_user..." -ForegroundColor Cyan
    psql -U postgres -c "CREATE DATABASE timora_user;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ timora_user créée avec succès" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  timora_user existe déjà ou erreur" -ForegroundColor Yellow
    }

    # Créer timora_notification
    Write-Host "📦 Création de timora_notification..." -ForegroundColor Cyan
    psql -U postgres -c "CREATE DATABASE timora_notification;" 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "   ✅ timora_notification créée avec succès" -ForegroundColor Green
    } else {
        Write-Host "   ⚠️  timora_notification existe déjà ou erreur" -ForegroundColor Yellow
    }

    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   ✅ Bases de Données Créées !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""

    # Vérifier les bases créées
    Write-Host "📋 Vérification des bases de données..." -ForegroundColor Cyan
    Write-Host ""
    
    $databases = psql -U postgres -t -c "SELECT datname FROM pg_database WHERE datname LIKE 'timora_%';"
    
    if ($databases -match "timora_auth") {
        Write-Host "   ✅ timora_auth : Existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ timora_auth : N'existe pas" -ForegroundColor Red
    }
    
    if ($databases -match "timora_user") {
        Write-Host "   ✅ timora_user : Existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ timora_user : N'existe pas" -ForegroundColor Red
    }
    
    if ($databases -match "timora_notification") {
        Write-Host "   ✅ timora_notification : Existe" -ForegroundColor Green
    } else {
        Write-Host "   ❌ timora_notification : N'existe pas" -ForegroundColor Red
    }

    Write-Host ""
    Write-Host "📝 Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "   1. Démarre les services : .\start-all.ps1" -ForegroundColor White
    Write-Host "   2. Les tables seront créées automatiquement par Hibernate" -ForegroundColor White
    Write-Host "   3. Vérifie Eureka : http://localhost:8761" -ForegroundColor White
    Write-Host ""

} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   ❌ ERREUR" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreur : $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Vérifications :" -ForegroundColor Yellow
    Write-Host "   1. PostgreSQL est-il démarré ?" -ForegroundColor White
    Write-Host "   2. Le mot de passe est-il correct ?" -ForegroundColor White
    Write-Host "   3. psql est-il dans le PATH ?" -ForegroundColor White
    Write-Host ""
} finally {
    # Nettoyer la variable d'environnement
    Remove-Item Env:\PGPASSWORD -ErrorAction SilentlyContinue
}
