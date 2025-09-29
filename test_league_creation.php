<?php

// Test script to debug league creation

echo "Testing League Creation via API Gateway...\n";

$apiGatewayUrl = 'http://localhost:8000';
$internalSecret = 'devsecret123';

// Simulate a user and organization data
$testData = [
    'name' => 'Test Liga',
    'season' => 'Prolece',
    'year' => 2025,
    'total_rounds' => 10,
    'description' => 'Test liga',
    'organization_id' => 1,
    'user_id' => 6
];

// Mock headers as if from authenticated user
$headers = [
    'X-Internal-Auth: ' . $internalSecret,
    'X-User-Id: 6',
    'X-User-Role: ADMIN', 
    'X-User-Org-Id: 1',
    'Content-Type: application/json',
    'Accept: application/json'
];

// Test health endpoint first
echo "\n1. Testing health endpoint...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiGatewayUrl . '/api/leagues/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Health Response ({$httpCode}): " . $response . "\n";

// Test direct quiz-svc endpoint
echo "\n2. Testing direct quiz-svc health...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8002/api/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Quiz-svc Health Response ({$httpCode}): " . $response . "\n";

// Test org-svc health
echo "\n3. Testing org-svc health...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8001/api/health');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Org-svc Health Response ({$httpCode}): " . $response . "\n";

// Now test league creation
echo "\n4. Testing league creation...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $apiGatewayUrl . '/api/leagues');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "League Creation Response ({$httpCode}): " . $response . "\n";

// Test direct to quiz-svc
echo "\n5. Testing direct league creation to quiz-svc...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, 'http://localhost:8002/api/internal/leagues');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($testData));
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

echo "Direct Quiz-svc League Creation Response ({$httpCode}): " . $response . "\n";

echo "\nTest completed.\n";
?>