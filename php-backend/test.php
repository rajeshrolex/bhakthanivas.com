<?php
$body = ['customerName' => 'John'];
$customerName = $body['customerDetails']['name'] ?? ($body['customerName'] ?? '');
echo "Name: " . $customerName;
