<?php

// Test org-svc directly

echo "Testing org-svc endpoints directly...\n";

$orgSvcUrl = 'http://localhost:8001';
$internalSecret = 'devsecret123';

$headers = [
    'X-Internal-Auth: ' . $internalSecret,
    'Accept: application/json'
];

// Test organizations endpoint
echo "\n1. Testing organizations endpoint...\n";
$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $orgSvcUrl . '/api/internal/organizations');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
curl_setopt($ch, CURLOPT_VERBOSE, true);
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$contentType = curl_getinfo($ch, CURLINFO_CONTENT_TYPE);
curl_close($ch);

echo "Response Code: {$httpCode}\n";
echo "Content-Type: {$contentType}\n";
echo "Response: " . $response . "\n";
echo "Response Length: " . strlen($response) . "\n";
echo "Response Type: " . gettype($response) . "\n";

if ($response) {
    $decoded = json_decode($response, true);
    echo "JSON Decode Result: " . json_last_error_msg() . "\n";
    echo "Decoded Type: " . gettype($decoded) . "\n";
    if (is_array($decoded)) {
        echo "Array Count: " . count($decoded) . "\n";
    }
}

echo "\nTest completed.\n";
?>