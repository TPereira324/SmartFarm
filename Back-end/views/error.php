<?php
header('Content-Type: application/json');

http_response_code(400);
echo json_encode($data);
?>