# Script de Test d'Envoi d'Email pour Timora

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Test d'Envoi d'Email - Timora" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que les variables sont configurées
if ([string]::IsNullOrWhiteSpace($env:MAIL_USERNAME)) {
    Write-Host "❌ ERREUR : Variable MAIL_USERNAME non configurée !" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Configure d'abord les variables avec :" -ForegroundColor Yellow
    Write-Host "   .\scripts\configure-email.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host "✅ Variables d'environnement configurées :" -ForegroundColor Green
Write-Host "   MAIL_USERNAME : $env:MAIL_USERNAME" -ForegroundColor Gray
Write-Host "   MAIL_PASSWORD : ****************" -ForegroundColor Gray
Write-Host "   MAIL_FROM     : $env:MAIL_FROM" -ForegroundColor Gray
Write-Host ""

# Demander l'email de destination
Write-Host "📧 Entre l'email de destination (ou appuie sur Entrée pour utiliser $env:MAIL_USERNAME) :" -ForegroundColor Yellow
$toEmail = Read-Host "Email"
if ([string]::IsNullOrWhiteSpace($toEmail)) {
    $toEmail = $env:MAIL_USERNAME
}

Write-Host ""
Write-Host "📤 Envoi d'un email de test à : $toEmail" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le Notification Service est démarré
Write-Host "🔍 Vérification du Notification Service..." -ForegroundColor Cyan
try {
    $response = Invoke-WebRequest -Uri "http://localhost:8086/api/notifications/health" -Method GET -ErrorAction Stop
    Write-Host "✅ Notification Service est démarré !" -ForegroundColor Green
} catch {
    Write-Host "❌ ERREUR : Notification Service n'est pas démarré !" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Démarre d'abord les services avec :" -ForegroundColor Yellow
    Write-Host "   .\start-all.ps1" -ForegroundColor White
    Write-Host ""
    exit 1
}

Write-Host ""
Write-Host "📧 Envoi de l'email de test..." -ForegroundColor Cyan

try {
    $response = Invoke-WebRequest -Uri "http://localhost:8086/api/notifications/email/test?to=$toEmail" -Method POST -ErrorAction Stop
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "   ✅ EMAIL ENVOYÉ AVEC SUCCÈS !" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📬 Vérifie ta boîte email : $toEmail" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "📝 Si tu ne reçois pas l'email :" -ForegroundColor Yellow
    Write-Host "   1. Vérifie le dossier SPAM/Courrier indésirable" -ForegroundColor White
    Write-Host "   2. Vérifie que l'App Password est correct" -ForegroundColor White
    Write-Host "   3. Vérifie les logs du Notification Service" -ForegroundColor White
    Write-Host ""
    
} catch {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "   ❌ ERREUR LORS DE L'ENVOI" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Erreur : $_" -ForegroundColor Red
    Write-Host ""
    Write-Host "📝 Vérifications :" -ForegroundColor Yellow
    Write-Host "   1. Les variables d'environnement sont-elles correctes ?" -ForegroundColor White
    Write-Host "   2. L'App Password Gmail est-il valide ?" -ForegroundColor White
    Write-Host "   3. La vérification en 2 étapes est-elle activée ?" -ForegroundColor White
    Write-Host "   4. Le Notification Service est-il démarré ?" -ForegroundColor White
    Write-Host ""
    Write-Host "📋 Consulte les logs du Notification Service pour plus de détails." -ForegroundColor Cyan
    Write-Host ""
}
