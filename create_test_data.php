<?php

// Create test data for org-svc

echo "Creating test organization and user...\n";

$orgSvcUrl = 'http://localhost:8001';
$internalSecret = 'devsecret123';

$headers = [
    'X-Internal-Auth: ' . $internalSecret,
    'Content-Type: application/json',
    'Accept: application/json'
];

// 1. Create test organization
echo "\n1. Creating test organization...\n";
$orgData = [
    'name' => 'Test Organizacija',
    'type' => 'COMPANY',
    'description' => 'Test organizacija za testiranje'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $orgSvcUrl . '/api/internal/organizations');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($orgData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Organization Creation Response ({$httpCode}): " . $response . "\n";

$orgResponse = json_decode($response, true);
$orgId = $orgResponse['id'] ?? 1; // fallback to 1 if creation failed

// 2. Add member to organization
echo "\n2. Adding member to organization...\n";
$memberData = [
    'user_id' => 1,
    'role' => 'ADMIN'
];

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $orgSvcUrl . '/api/internal/organizations/' . $orgId . '/members');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($memberData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Member Creation Response ({$httpCode}): " . $response . "\n";

// 3. List organizations to verify
echo "\n3. Listing organizations...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $orgSvcUrl . '/api/internal/organizations');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Organizations List Response ({$httpCode}): " . $response . "\n";

// 4. List members of the organization
echo "\n4. Listing organization members...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $orgSvcUrl . '/api/internal/organizations/' . $orgId . '/members');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Organization Members Response ({$httpCode}): " . $response . "\n";

echo "\nTest data creation completed.\n";
?>