# Script de Configuration Email pour Timora
# Ce script configure les variables d'environnement pour l'envoi d'emails

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Configuration Email - Timora" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Demander l'email Gmail
Write-Host "📧 Entre ton adresse Gmail :" -ForegroundColor Yellow
$email = Read-Host "Email"

# Demander le App Password
Write-Host ""
Write-Host "🔑 Entre ton App Password Gmail (16 caractères sans espaces) :" -ForegroundColor Yellow
Write-Host "   Pour créer un App Password :" -ForegroundColor Gray
Write-Host "   1. Va sur https://myaccount.google.com/security" -ForegroundColor Gray
Write-Host "   2. Active la vérification en 2 étapes" -ForegroundColor Gray
Write-Host "   3. Crée un App Password pour 'Timora'" -ForegroundColor Gray
Write-Host ""
$password = Read-Host "App Password" -AsSecureString
$passwordPlain = [Runtime.InteropServices.Marshal]::PtrToStringAuto([Runtime.InteropServices.Marshal]::SecureStringToBSTR($password))

# Demander l'email expéditeur
Write-Host ""
Write-Host "📤 Entre l'email expéditeur (ou appuie sur Entrée pour utiliser 'noreply@timora.com') :" -ForegroundColor Yellow
$fromEmail = Read-Host "Email expéditeur"
if ([string]::IsNullOrWhiteSpace($fromEmail)) {
    $fromEmail = "noreply@timora.com"
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   Configuration" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "MAIL_USERNAME : $email" -ForegroundColor Green
Write-Host "MAIL_PASSWORD : ****************" -ForegroundColor Green
Write-Host "MAIL_FROM     : $fromEmail" -ForegroundColor Green
Write-Host ""

# Demander confirmation
Write-Host "Veux-tu configurer ces variables ? (O/N)" -ForegroundColor Yellow
$confirm = Read-Host "Confirmation"

if ($confirm -eq "O" -or $confirm -eq "o" -or $confirm -eq "Y" -or $confirm -eq "y") {
    Write-Host ""
    Write-Host "⚙️  Configuration en cours..." -ForegroundColor Cyan
    
    # Configurer les variables d'environnement pour la session actuelle
    $env:MAIL_USERNAME = $email
    $env:MAIL_PASSWORD = $passwordPlain
    $env:MAIL_FROM = $fromEmail
    
    Write-Host "✅ Variables configurées pour cette session PowerShell !" -ForegroundColor Green
    Write-Host ""
    Write-Host "⚠️  IMPORTANT :" -ForegroundColor Yellow
    Write-Host "   Ces variables sont valides uniquement pour cette session PowerShell." -ForegroundColor Yellow
    Write-Host "   Si tu fermes PowerShell, tu devras reconfigurer les variables." -ForegroundColor Yellow
    Write-Host ""
    
    # Demander si l'utilisateur veut configurer de manière permanente
    Write-Host "Veux-tu configurer ces variables de manière PERMANENTE ? (O/N)" -ForegroundColor Yellow
    Write-Host "   (Les variables seront disponibles même après redémarrage)" -ForegroundColor Gray
    $confirmPermanent = Read-Host "Confirmation"
    
    if ($confirmPermanent -eq "O" -or $confirmPermanent -eq "o" -or $confirmPermanent -eq "Y" -or $confirmPermanent -eq "y") {
        Write-Host ""
        Write-Host "⚙️  Configuration permanente en cours..." -ForegroundColor Cyan
        
        try {
            [System.Environment]::SetEnvironmentVariable("MAIL_USERNAME", $email, "User")
            [System.Environment]::SetEnvironmentVariable("MAIL_PASSWORD", $passwordPlain, "User")
            [System.Environment]::SetEnvironmentVariable("MAIL_FROM", $fromEmail, "User")
            
            Write-Host "✅ Variables configurées de manière permanente !" -ForegroundColor Green
            Write-Host "   Redémarre PowerShell pour que les changements prennent effet." -ForegroundColor Yellow
        } catch {
            Write-Host "❌ Erreur lors de la configuration permanente : $_" -ForegroundColor Red
            Write-Host "   Les variables sont quand même configurées pour cette session." -ForegroundColor Yellow
        }
    }
    
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "   Vérification" -ForegroundColor Cyan
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "MAIL_USERNAME : $env:MAIL_USERNAME" -ForegroundColor Green
    Write-Host "MAIL_PASSWORD : ****************" -ForegroundColor Green
    Write-Host "MAIL_FROM     : $env:MAIL_FROM" -ForegroundColor Green
    Write-Host ""
    
    Write-Host "🎉 Configuration terminée !" -ForegroundColor Green
    Write-Host ""
    Write-Host "📝 Prochaines étapes :" -ForegroundColor Cyan
    Write-Host "   1. Démarre les services : .\start-all.ps1" -ForegroundColor White
    Write-Host "   2. Teste l'envoi d'email : curl -X POST http://localhost:8086/api/notifications/email/test?to=$email" -ForegroundColor White
    Write-Host "   3. Vérifie ta boîte email !" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host ""
    Write-Host "❌ Configuration annulée." -ForegroundColor Red
    Write-Host ""
}
