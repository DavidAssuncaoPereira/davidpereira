<?php
$to = "3hs.david.pereira@gmail.com";
$subject = $_POST['subject'];
$message = "Nome: " . $_POST['nome'] . "\nEmail: " . $_POST['message'];
$headers = "From: ". $_POST['email'];

mail($to, $subject, $message, $headers);
?>
