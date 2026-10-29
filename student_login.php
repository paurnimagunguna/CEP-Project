<?php
$conn = new mysqli("localhost","root","","entry_management_system");

if(isset($_POST['login'])){
    $name = $_POST['name'];
    $id = $_POST['college_id'];
    $pass = $_POST['password'];

    // Password validation
    if(strlen($pass) < 7 || !preg_match("/[!@#$%^&*]/", $pass)){
        echo "<script>alert('Password must be 7+ characters & contain special symbol'); window.history.back();</script>";
        exit();
    }

    $sql = "INSERT INTO student (name, college_id, password) 
            VALUES ('$name','$id','$pass')";

    if($conn->query($sql)){
        echo "<script>alert('Login Successful'); window.location.href='index.html';</script>";
    } else {
        echo "Error";
    }
}
?>