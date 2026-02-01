# 0. Create Admin (if not exists) - ignoring error if exists
try {
    $createAdminBody = @{email="admin@local.host"; password="password123"; passwordConfirm="password123"} | ConvertTo-Json
    Invoke-RestMethod -Uri "http://127.0.0.1:8091/api/admins" -Method Post -ContentType "application/json" -Body $createAdminBody | Out-Null
    Write-Host "Admin initialized."
} catch {
    Write-Host "Admin might already exist."
}

# 1. Authenticate as Admin
$adminBody = @{identity="admin@local.host"; password="password123"} | ConvertTo-Json
$adminResp = Invoke-RestMethod -Uri "http://127.0.0.1:8091/api/admins/auth-with-password" -Method Post -ContentType "application/json" -Body $adminBody
$adminToken = $adminResp.token

# 2. Create a standardized User (if not exists)
$userEmail = "testuser@example.com"
$userPass = "password123"
try {
    $userBody = @{
        email = $userEmail
        password = $userPass
        passwordConfirm = $userPass
    } | ConvertTo-Json
    Invoke-RestMethod -Uri "http://127.0.0.1:8091/api/collections/users/records" -Method Post -ContentType "application/json" -Body $userBody -Headers @{Authorization=$adminToken}
} catch {
    Write-Host "User might already exist, continuing..."
}

# 3. Authenticate as User
$userAuthBody = @{identity=$userEmail; password=$userPass} | ConvertTo-Json
$userResp = Invoke-RestMethod -Uri "http://127.0.0.1:8091/api/collections/users/auth-with-password" -Method Post -ContentType "application/json" -Body $userAuthBody
$userToken = $userResp.token
$userId = $userResp.record.id

Write-Host "Authenticated as User: $userId"

# 4. Attempt to Create Character Record (The Payload)
$payload = @{
    user = $userId
    character_name = "Unnamed Hero"
    class_name = "Commoner"
    species = "Human"
    background = "None"
    hp = 10
    max_hp = 10
    strength = 10
    dexterity = 10
    constitution = 10
    intelligence = 10
    wisdom = 10
    charisma = 10
    xp = 0
    gold = 0
    # conditions = @()
    # factions = @{}
    piety_deity = ""
    piety_score = 0
    # levels = @{}
    # spells = @()
    # feats = @()
    # bastion = @()
    # inventory = @()
}

# Test Case 1: Clean Payload (NO ID)
Write-Host "`n--- TEST CASE 1: Clean Payload (No ID) ---"
$payloadClean = $payload.Clone()
if ($payloadClean.ContainsKey("id")) { $payloadClean.Remove("id") }
$payloadClean | ConvertTo-Json -Depth 10 | Out-File -Encoding ascii "payload_clean.json"

Write-Host "Payload Keys: $($payloadClean.Keys -join ', ')"
# curl -s (silent), -w (write out http code)
curl.exe -s -o response_clean.json -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: $userToken" -d "@payload_clean.json" "http://127.0.0.1:8091/api/collections/users_stats/records"
Write-Host "`nResponse Body:"
Get-Content response_clean.json

# Test Case 2: Payload with Empty ID
Write-Host "`n`n--- TEST CASE 2: Payload with Empty IDString ---"
$payloadDirty = $payload.Clone()
$payloadDirty["id"] = ""
$payloadDirty | ConvertTo-Json -Depth 10 | Out-File -Encoding ascii "payload_dirty.json"

curl.exe -s -o response_dirty.json -w "%{http_code}" -X POST -H "Content-Type: application/json" -H "Authorization: $userToken" -d "@payload_dirty.json" "http://127.0.0.1:8091/api/collections/users_stats/records"
Write-Host "`nResponse Body:"
Get-Content response_dirty.json
